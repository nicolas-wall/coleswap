#!/usr/bin/env node
/**
 * Manda un mail de prueba usando el MISMO diseño que los mails de la app, para
 * verificar la cadena completa —API key, dominio verificado, entrega, aspecto—
 * sin tener que registrar una familia y aprobarla.
 *
 *   node scripts/probar-mail.mjs tu@email.com
 *
 * Lee RESEND_API_KEY y EMAIL_FROM de .env.local.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cargarLayout } from './_layout.mjs'

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

const from = env.EMAIL_FROM ?? 'ColeSwap <coleswap@chipu.app>'
const site = env.NEXT_PUBLIC_SITE_URL ?? 'https://coleswap.vercel.app'

const { emailLayout, parrafo } = await cargarLayout()

const html = emailLayout({
  titulo: 'Prueba de envío',
  vistaPrevia: 'Si ves esto, la cadena de mails funciona.',
  cuerpo:
    parrafo('Si estás leyendo esto, la cadena funciona de punta a punta: la API key es válida, el dominio está verificado y el mensaje llegó a la bandeja.') +
    parrafo('Este mail usa exactamente la misma plantilla que los avisos reales de la app, así que lo que ves acá es lo que van a ver las familias.') +
    parrafo(`Remitente usado: <strong>${from}</strong>`, { chico: true }),
  cta: { texto: 'Así se ve un botón', url: `${site}/catalog` },
  pie: 'Este bloque chico es donde van los enlaces en texto plano y los avisos de vencimiento.',
})

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
