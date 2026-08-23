import { createServiceClient } from '@/lib/supabase/server'

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

const MARCA = '#1f6b45'

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

/**
 * Shell HTML de los mails. Tablas y estilos inline a propósito: Outlook y
 * Gmail ignoran flexbox, grid y buena parte de las hojas de estilo.
 */
function layout(opts: { titulo: string; cuerpo: string; cta?: { texto: string; url: string } }) {
  const { titulo, cuerpo, cta } = opts
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f6f4ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${MARCA};padding:20px 28px;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">ColeSwap</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#1a1a1a;">${titulo}</h1>
          <div style="font-size:15px;line-height:1.6;color:#444;">${cuerpo}</div>
          ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
            <tr><td style="background:${MARCA};border-radius:8px;">
              <a href="${cta.url}" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">${cta.texto}</a>
            </td></tr></table>` : ''}
        </td></tr>
        <tr><td style="padding:0 28px 26px;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#8a8a8a;border-top:1px solid #eceae4;padding-top:14px;">
            Te llega este mail porque tenés una cuenta en ColeSwap, el mercado de
            libros y uniformes de tu colegio.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
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
    html: layout({
      titulo: 'Aprobaron tu cuenta',
      cuerpo: `<p style="margin:0 0 10px;">Hola ${family.display_name},</p>
        <p style="margin:0;">Un moderador${colegio ? ` de <strong>${colegio}</strong>` : ''} aprobó tu solicitud.
        Ya podés ver lo que publican las otras familias y publicar lo tuyo.</p>`,
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

  const html = layout({
    titulo: 'Una familia quiere entrar',
    cuerpo: `<p style="margin:0;"><strong>${nombreSolicitante}</strong> pidió sumarse al colegio.
      Hasta que la apruebes o la rechaces no puede ver ni publicar nada.</p>`,
    cta: { texto: 'Ver la solicitud', url: `${siteUrl()}/admin` },
  })

  await Promise.all(
    admins
      .filter((a) => a.email)
      .map((a) => sendEmail({ to: a.email, subject: 'Hay una solicitud esperando tu aprobación', html }))
  )
}
