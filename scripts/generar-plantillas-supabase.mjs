#!/usr/bin/env node
/**
 * Genera las plantillas de mail de Supabase Auth con el MISMO diseño que usan
 * los mails de la app, compilando lib/emails/layout.ts en caliente.
 *
 *   node scripts/generar-plantillas-supabase.mjs
 *
 * Escribe supabase/email-templates/*.html. Esos archivos se pegan a mano en
 * Supabase → Authentication → Email Templates (no hay API para cargarlos).
 *
 * La gracia de generarlas en vez de escribirlas: si cambia el diseño de los
 * mails de la app, se vuelve a correr esto y las de auth quedan iguales. Escritas
 * a mano se irían separando en cada cambio.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cargarLayout } from './_layout.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const salida = join(root, 'supabase', 'email-templates')

const { emailLayout, parrafo } = await cargarLayout()

// Variables que interpola Supabase al enviar. Se dejan tal cual en el HTML.
const LINK = '{{ .ConfirmationURL }}'

const plantillas = {
  'recuperar-contrasena': {
    archivo: 'recuperar-contrasena.html',
    asunto: 'Cambiá tu contraseña de ColeSwap',
    html: emailLayout({
      titulo: 'Cambiá tu contraseña',
      vistaPrevia: 'El enlace vence en una hora.',
      cuerpo:
        parrafo('Pediste recuperar el acceso a tu cuenta de ColeSwap. Tocá el botón y elegí una contraseña nueva.') +
        parrafo('Si no fuiste vos, podés ignorar este mail: tu contraseña actual sigue funcionando y nadie entró a tu cuenta.', { chico: true }),
      cta: { texto: 'Elegir contraseña nueva', url: LINK },
      pie: `El enlace vence en una hora. Si el botón no funciona, copiá esta dirección en el navegador:<br>${LINK}`,
    }),
  },

  'confirmar-cuenta': {
    archivo: 'confirmar-cuenta.html',
    asunto: 'Confirmá tu cuenta de ColeSwap',
    html: emailLayout({
      titulo: 'Confirmá tu cuenta',
      vistaPrevia: 'Un toque y quedás adentro del cole.',
      cuerpo:
        parrafo('Ya casi. Confirmá que este es tu mail y entrás al mercado de libros y uniformes de tu colegio.') +
        parrafo('Si no creaste ninguna cuenta, ignorá este mail.', { chico: true }),
      cta: { texto: 'Confirmar mi cuenta', url: LINK },
      pie: `Si el botón no funciona, copiá esta dirección en el navegador:<br>${LINK}`,
    }),
  },

  'link-magico': {
    archivo: 'link-magico.html',
    asunto: 'Tu acceso a ColeSwap',
    html: emailLayout({
      titulo: 'Entrá a ColeSwap',
      vistaPrevia: 'Tu enlace de acceso, sin contraseña.',
      cuerpo:
        parrafo('Tocá el botón y entrás directo, sin escribir contraseña.') +
        parrafo('Si no lo pediste, ignorá este mail. Nadie puede entrar sin este enlace.', { chico: true }),
      cta: { texto: 'Entrar', url: LINK },
      pie: `El enlace vence en una hora. Si el botón no funciona, copiá esta dirección en el navegador:<br>${LINK}`,
    }),
  },

  'cambio-de-mail': {
    archivo: 'cambio-de-mail.html',
    asunto: 'Confirmá tu nuevo mail de ColeSwap',
    html: emailLayout({
      titulo: 'Confirmá tu nuevo mail',
      vistaPrevia: 'Confirmá el cambio para seguir recibiendo los avisos.',
      cuerpo:
        parrafo('Pediste cambiar el mail de tu cuenta de ColeSwap. Confirmá desde esta casilla para que el cambio se aplique.') +
        parrafo('Si no lo pediste, ignorá este mail y no se cambia nada.', { chico: true }),
      cta: { texto: 'Confirmar el cambio', url: LINK },
      pie: `Si el botón no funciona, copiá esta dirección en el navegador:<br>${LINK}`,
    }),
  },
}

mkdirSync(salida, { recursive: true })

const NOMBRES_SUPABASE = {
  'recuperar-contrasena': 'Reset Password',
  'confirmar-cuenta': 'Confirm signup',
  'link-magico': 'Magic Link',
  'cambio-de-mail': 'Change Email Address',
}

const indice = [
  '# Plantillas de Supabase Auth',
  '',
  'Generadas por `scripts/generar-plantillas-supabase.mjs` con el mismo diseño',
  'que los mails de la app (`lib/emails/layout.ts`). **No editar a mano**: si hace',
  'falta un cambio, se cambia el generador y se vuelve a correr — así el diseño',
  'no se va separando del de la app en cada retoque.',
  '',
  'Se cargan en **Supabase → Authentication → Emails → Templates**. Cada plantilla',
  'tiene **dos campos**: el asunto (`Subject heading`) y el cuerpo (`Message body`).',
  'El asunto NO va adentro del HTML, se carga aparte.',
  '',
  '`{{ .ConfirmationURL }}` lo reemplaza Supabase por el enlace real. No tocarlo.',
  '',
  '---',
  '',
]

for (const [clave, p] of Object.entries(plantillas)) {
  writeFileSync(join(salida, p.archivo), p.html, 'utf8')
  indice.push(
    `## ${NOMBRES_SUPABASE[clave]}`,
    '',
    '**Subject heading** — copiar tal cual:',
    '',
    '```',
    p.asunto,
    '```',
    '',
    `**Message body** — pegar el contenido de \`${p.archivo}\``,
    '',
  )
  console.log(`  ✓ ${p.archivo.padEnd(28)} ${p.asunto}`)
}

// También en texto plano, por si se necesita fuera del repo.
writeFileSync(
  join(salida, 'asuntos.txt'),
  Object.entries(plantillas)
    .map(([clave, p]) => `${NOMBRES_SUPABASE[clave]}\n${p.asunto}\n`)
    .join('\n'),
  'utf8'
)

writeFileSync(join(salida, 'README.md'), indice.join('\n'), 'utf8')


console.log(`\n${Object.keys(plantillas).length} plantillas → supabase/email-templates/`)
