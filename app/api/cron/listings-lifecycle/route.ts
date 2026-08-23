import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushToFamily } from '@/lib/push'
import { sendLifecycleEmail } from '@/lib/email'
import { NUDGE_AFTER_DAYS, AUTO_PAUSE_AFTER_DAYS } from '@/lib/lifecycle'

const DAY_MS = 86_400_000

/**
 * Barrido diario del ciclo de vida (Vercel Cron, ver vercel.json).
 *
 *   día 45 → push: "¿siguen disponibles?"
 *   día 60 → se pausan solas y avisamos que se pausaron
 *
 * Usa la service role porque toca publicaciones de todas las familias.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  // Sin secreto configurado no corre: preferimos que falle visible antes que
  // dejar un endpoint que cualquiera puede disparar para pausar publicaciones.
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = new Date()
  const nowIso = now.toISOString()
  const nudgeCutoff = new Date(now.getTime() - NUDGE_AFTER_DAYS * DAY_MS).toISOString()
  const pauseCutoff = new Date(now.getTime() - AUTO_PAUSE_AFTER_DAYS * DAY_MS).toISOString()

  // ── 1) Pausar lo que pasó los 60 días sin respuesta ──────────
  const { data: expired, error: expiredErr } = await service
    .from('listings')
    .select('id, family_id')
    .eq('status', 'active')
    .lte('renewed_at', pauseCutoff)

  if (expiredErr) {
    return NextResponse.json({ error: 'No se pudieron leer las publicaciones vencidas' }, { status: 500 })
  }

  if (expired && expired.length > 0) {
    const { error } = await service
      .from('listings')
      .update({ status: 'paused', paused_at: nowIso, paused_reason: 'expired' })
      .in('id', expired.map((l) => l.id))

    if (error) {
      return NextResponse.json({ error: 'No se pudieron pausar las publicaciones' }, { status: 500 })
    }
  }

  // ── 2) Preguntar por lo que pasó los 45 y no se preguntó todavía ──
  // nudged_at se limpia en cada confirmación/reactivación, así que un NULL
  // significa "no le preguntamos desde la última vez que la confirmó".
  const { data: toNudge, error: nudgeErr } = await service
    .from('listings')
    .select('id, family_id')
    .eq('status', 'active')
    .lte('renewed_at', nudgeCutoff)
    .gt('renewed_at', pauseCutoff)
    .is('nudged_at', null)

  if (nudgeErr) {
    return NextResponse.json({ error: 'No se pudieron leer las publicaciones a confirmar' }, { status: 500 })
  }

  if (toNudge && toNudge.length > 0) {
    const { error } = await service
      .from('listings')
      .update({ nudged_at: nowIso })
      .in('id', toNudge.map((l) => l.id))

    if (error) {
      return NextResponse.json({ error: 'No se pudo registrar el aviso' }, { status: 500 })
    }
  }

  // ── 3) Un solo push por familia, aunque le toquen las dos cosas ──
  const byFamily = new Map<string, { nudged: number; paused: number }>()
  for (const l of toNudge ?? []) {
    const entry = byFamily.get(l.family_id) ?? { nudged: 0, paused: 0 }
    entry.nudged++
    byFamily.set(l.family_id, entry)
  }
  for (const l of expired ?? []) {
    const entry = byFamily.get(l.family_id) ?? { nudged: 0, paused: 0 }
    entry.paused++
    byFamily.set(l.family_id, entry)
  }

  // Los dos canales: push llega al instante pero solo a quien lo activó; el
  // mail llega siempre. Ninguno tira excepción, así que el barrido termina
  // aunque falle el envío.
  await Promise.all(
    [...byFamily].flatMap(([familyId, { nudged, paused }]) => [
      sendPushToFamily(familyId, {
        title: paused > 0 ? 'Pausamos publicaciones tuyas' : '¿Seguís teniendo esto?',
        body: buildBody(nudged, paused),
        url: '/my-listings',
      }),
      sendLifecycleEmail(familyId, { porConfirmar: nudged, pausadas: paused }),
    ])
  )

  return NextResponse.json({
    nudged: toNudge?.length ?? 0,
    paused: expired?.length ?? 0,
    families: byFamily.size,
  })
}

function buildBody(nudged: number, paused: number): string {
  const parts: string[] = []
  if (paused > 0) {
    parts.push(
      paused === 1
        ? 'Una publicación tuya llevaba más de dos meses sin confirmar y la sacamos del catálogo.'
        : `${paused} publicaciones tuyas llevaban más de dos meses sin confirmar y las sacamos del catálogo.`
    )
  }
  if (nudged > 0) {
    parts.push(
      nudged === 1
        ? 'Tenés una publicación de más de 45 días: confirmá si sigue disponible o bajala.'
        : `Tenés ${nudged} publicaciones de más de 45 días: confirmá cuáles siguen disponibles.`
    )
  }
  return parts.join(' ')
}
