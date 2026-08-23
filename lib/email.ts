import { createServiceClient } from '@/lib/supabase/server'
import { emailLayout, parrafo } from '@/lib/emails/layout'

/**
 * Capa de mails. Todo lo específico de Resend vive acá adentro: el resto de la
 * app llama a las funciones de abajo sin saber quién manda. Cambiar de
 * proveedor —Brevo, SES, lo que sea— es reescribir sendEmail() y nada más.
 *
 * Se usa la API REST directo en vez del SDK: es un POST, y así no sumamos una
 * dependencia que después haya que sacar si migramos.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

// chipu.app es el único dominio verificado hoy en la cuenta de Resend, así que
// sirve para arrancar sin comprar ni configurar nada. Es provisorio: el destino
// es coleswap.com, y llegar ahí es cambiar esta env var, no tocar código.
const FROM = process.env.EMAIL_FROM ?? 'ColeSwap <coleswap@chipu.app>'

interface EmailInput {
  to: string
  subject: string
  html: string
}

/**
 * Nunca tira excepción: un mail que falla no puede romper la operación que lo
 * disparó. Si falta la API key no hace nada, así que en local y en preview
 * nunca se manda nada de verdad.
 */
export async function sendEmail({ to, subject, html }: EmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    })

    if (!res.ok) {
      // El cuerpo del error de Resend dice cuál es el problema real
      // (dominio sin verificar, destinatario inválido, cupo agotado).
      console.error('[ColeSwap] Resend respondió', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[ColeSwap] no se pudo enviar el mail:', err)
    return false
  }
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://coleswap.vercel.app'
}

/** Le avisa a la familia que ya la habilitaron. */
export async function sendApprovalEmail(familyId: string) {
  const service = createServiceClient()
  const { data: family } = await service
    .from('families')
    .select('email, display_name, schools(name)')
    .eq('id', familyId)
    .single() as { data: { email: string; display_name: string; schools: { name: string } | null } | null }

  if (!family?.email) return

  const colegio = family.schools?.name
  await sendEmail({
    to: family.email,
    subject: colegio ? `Ya podés entrar a ColeSwap — ${colegio}` : 'Ya podés entrar a ColeSwap',
    html: emailLayout({
      titulo: 'Aprobaron tu cuenta',
      vistaPrevia: 'Ya podés ver y publicar en el catálogo de tu colegio.',
      cuerpo:
        parrafo(`Hola ${family.display_name},`) +
        parrafo(`Un moderador${colegio ? ` de <strong>${colegio}</strong>` : ''} aprobó tu solicitud.
          Ya podés ver lo que publican las otras familias y publicar lo tuyo.`),
      cta: { texto: 'Entrar al catálogo', url: `${siteUrl()}/catalog` },
    }),
  })
}

/** Le avisa a los admins del colegio que hay una solicitud esperando. */
export async function sendPendingRequestEmail(schoolId: string, nombreSolicitante: string) {
  const service = createServiceClient()
  const { data: admins } = await service
    .from('families')
    .select('email')
    .eq('school_id', schoolId)
    .eq('role', 'school_admin')
    .eq('approved', true)
    .eq('suspended', false)

  if (!admins || admins.length === 0) return

  const html = emailLayout({
    titulo: 'Una familia quiere entrar',
    vistaPrevia: `${nombreSolicitante} está esperando que la apruebes.`,
    cuerpo: parrafo(`<strong>${nombreSolicitante}</strong> pidió sumarse al colegio.
      Hasta que la apruebes o la rechaces no puede ver ni publicar nada.`),
    cta: { texto: 'Ver la solicitud', url: `${siteUrl()}/admin` },
  })

  await Promise.all(
    admins
      .filter((a) => a.email)
      .map((a) => sendEmail({ to: a.email, subject: 'Hay una solicitud esperando tu aprobación', html }))
  )
}

/**
 * Aviso del ciclo de vida: publicaciones viejas por confirmar y/o ya pausadas.
 * Lo dispara el barrido diario, junto con el push. Un solo mail por familia
 * aunque le toquen las dos cosas.
 */
export async function sendLifecycleEmail(
  familyId: string,
  { porConfirmar, pausadas }: { porConfirmar: number; pausadas: number }
) {
  if (porConfirmar === 0 && pausadas === 0) return

  const service = createServiceClient()
  const { data: family } = await service
    .from('families')
    .select('email, display_name')
    .eq('id', familyId)
    .single() as { data: { email: string; display_name: string } | null }

  if (!family?.email) return

  const partes: string[] = [parrafo(`Hola ${family.display_name},`)]

  if (pausadas > 0) {
    partes.push(
      parrafo(
        pausadas === 1
          ? `Una publicación tuya llevaba más de dos meses sin confirmar, así que la sacamos
             del catálogo. <strong>No se borró nada</strong>: si todavía la tenés, la reactivás de un toque.`
          : `${pausadas} publicaciones tuyas llevaban más de dos meses sin confirmar, así que las
             sacamos del catálogo. <strong>No se borró nada</strong>: si todavía las tenés, las reactivás de un toque.`
      )
    )
  }

  if (porConfirmar > 0) {
    partes.push(
      parrafo(
        porConfirmar === 1
          ? `Tenés una publicación de más de 45 días. Confirmanos si seguís teniéndola;
             si no decís nada, en 15 días la bajamos sola del catálogo.`
          : `Tenés ${porConfirmar} publicaciones de más de 45 días. Confirmanos cuáles seguís
             teniendo; las que no confirmes se bajan solas del catálogo en 15 días.`
      )
    )
  }

  partes.push(
    parrafo(
      'Lo hacemos para que nadie escriba por algo que ya no está — es lo que mantiene el catálogo confiable.',
      { chico: true }
    )
  )

  await sendEmail({
    to: family.email,
    subject:
      pausadas > 0
        ? 'Pausamos publicaciones tuyas en ColeSwap'
        : '¿Seguís teniendo lo que publicaste?',
    html: emailLayout({
      titulo: pausadas > 0 ? 'Pausamos publicaciones tuyas' : '¿Seguís teniendo esto?',
      vistaPrevia:
        pausadas > 0
          ? 'Salieron del catálogo por antigüedad. Reactivalas si todavía las tenés.'
          : 'Confirmá cuáles siguen disponibles para que no se bajen solas.',
      cuerpo: partes.join(''),
      cta: { texto: 'Ver mis publicaciones', url: `${siteUrl()}/my-listings` },
    }),
  })
}
