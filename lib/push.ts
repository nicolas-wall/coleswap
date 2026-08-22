import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'

let configured = false

function ensureConfigured() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  configured = true
}

/**
 * Avisa a los admins de un colegio. Sin esto las solicitudes de ingreso se
 * pudren: el admin no tiene ningún motivo para entrar a mirar si hay alguien
 * esperando, y la familia queda en /pending sin que nadie la apruebe nunca.
 */
export async function sendPushToSchoolAdmins(
  schoolId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!process.env.VAPID_PRIVATE_KEY) return

  const service = createServiceClient()
  const { data: admins } = await service
    .from('families')
    .select('id')
    .eq('school_id', schoolId)
    .eq('role', 'school_admin')
    .eq('approved', true)
    .eq('suspended', false)

  if (!admins || admins.length === 0) return

  await Promise.all(admins.map((a) => sendPushToFamily(a.id, payload)))
}

export async function sendPushToFamily(familyId: string, payload: { title: string; body: string; url?: string }) {
  if (!process.env.VAPID_PRIVATE_KEY) return
  ensureConfigured()

  const service = createServiceClient()
  const { data: subs } = await service
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('family_id', familyId)

  if (!subs || subs.length === 0) return

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        // La suscripción expiró o el navegador la invalidó: la limpiamos
        await service.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }))
}
