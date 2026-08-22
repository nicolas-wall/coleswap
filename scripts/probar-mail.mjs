#!/usr/bin/env node
/**
 * Manda un mail de prueba con la misma plantilla que usa la app, para verificar
 * la cadena completa —API key, dominio verificado, entrega— sin tener que
 * registrar una familia y aprobarla.
 *
 *   node scripts/probar-mail.mjs tu@email.com
 *
 * Lee RESEND_API_KEY y EMAIL_FROM de .env.local.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = Object.fromEntries(
  readFileSync(join(root, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const destino = process.argv[2]
if (!destino) {
  console.error('Falta el destinatario.\n  node scripts/probar-mail.mjs tu@email.com')
  process.exit(1)
}

const apiKey = env.RESEND_API_KEY
if (!apiKey) {
  console.error('Falta RESEND_API_KEY en .env.local.')
  console.error('Sacala de https://resend.com/api-keys y agregala como:')
  console.error('  RESEND_API_KEY=re_xxxxxxxx')
  process.exit(1)
}

const from = env.EMAIL_FROM ?? 'ColeSwap <coleswap@doselementos.com>'
const MARCA = '#1f6b45'

const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f6f4ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${MARCA};padding:20px 28px;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">ColeSwap</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#1a1a1a;">Prueba de envío</h1>
          <div style="font-size:15px;line-height:1.6;color:#444;">
            <p style="margin:0 0 10px;">Si estás leyendo esto, la cadena de mails funciona: la API key es válida,
            el dominio está verificado y el mensaje llegó a la bandeja.</p>
            <p style="margin:0;">Remitente usado: <code>${from}</code></p>
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
            <tr><td style="background:${MARCA};border-radius:8px;">
              <a href="https://coleswap.vercel.app/catalog" style="display:inline-block;padding:12px 22px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">Botón de ejemplo</a>
            </td></tr></table>
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

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from, to: [destino], subject: 'ColeSwap — prueba de envío', html }),
})

const cuerpo = await res.text()
if (!res.ok) {
  console.error(`\n✗ Resend respondió ${res.status}`)
  console.error(cuerpo)
  console.error('\nCausas más comunes:')
  console.error('  · El dominio de EMAIL_FROM no está verificado en Resend')
  console.error('  · La API key no tiene permiso de envío')
  process.exit(1)
}

console.log(`\n✓ Enviado a ${destino}`)
console.log(`  desde: ${from}`)
console.log(`  ${cuerpo}`)
console.log('\nRevisá también spam: es el primer envío desde este dominio.')
