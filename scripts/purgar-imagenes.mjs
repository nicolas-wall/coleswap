#!/usr/bin/env node
/**
 * Borra las imágenes de listing-images que quedaron huérfanas: las que están
 * en storage pero ya no las referencia ninguna publicación.
 *
 *   node scripts/purgar-imagenes.mjs          → solo muestra qué borraría
 *   node scripts/purgar-imagenes.mjs --borrar → borra de verdad
 *
 * NUNCA toca school-crests: ahí vive el escudo de JHO.
 */
import { createClient } from '@supabase/supabase-js'
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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const BUCKET = 'listing-images'
const enSerio = process.argv.includes('--borrar')

// Las imágenes se guardan en carpetas por familia: <family_id>/<uuid>.jpg
const { data: carpetas, error: errCarpetas } = await db.storage.from(BUCKET).list('', { limit: 1000 })
if (errCarpetas) {
  console.error(`No se pudo listar ${BUCKET}: ${errCarpetas.message}`)
  process.exit(1)
}

const archivos = []
for (const carpeta of carpetas ?? []) {
  if (carpeta.id !== null) continue // es un archivo suelto en la raíz, no una carpeta
  const { data: adentro } = await db.storage.from(BUCKET).list(carpeta.name, { limit: 1000 })
  for (const f of adentro ?? []) archivos.push(`${carpeta.name}/${f.name}`)
}

// Qué imágenes sigue referenciando alguna publicación
const { data: listings, error: errListings } = await db.from('listings').select('images')
if (errListings) {
  console.error(`No se pudieron leer las publicaciones: ${errListings.message}`)
  process.exit(1)
}
const enUso = new Set(
  (listings ?? []).flatMap((l) => l.images ?? []).map((url) => {
    const i = url.indexOf(`/${BUCKET}/`)
    return i === -1 ? null : url.slice(i + BUCKET.length + 2)
  }).filter(Boolean)
)

const huerfanas = archivos.filter((a) => !enUso.has(a))

console.log(`En storage:   ${archivos.length}`)
console.log(`Referenciadas: ${enUso.size}`)
console.log(`Huérfanas:     ${huerfanas.length}\n`)
huerfanas.forEach((a) => console.log(`  ${a}`))

if (huerfanas.length === 0) {
  console.log('\nNada que borrar.')
  process.exit(0)
}

if (!enSerio) {
  console.log('\nSimulación. Volvé a correrlo con --borrar para borrarlas de verdad.')
  process.exit(0)
}

const { error } = await db.storage.from(BUCKET).remove(huerfanas)
if (error) {
  console.error(`\nError al borrar: ${error.message}`)
  process.exit(1)
}
console.log(`\n${huerfanas.length} imágenes borradas.`)
