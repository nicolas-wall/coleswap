#!/usr/bin/env node
/**
 * Backup completo de la base a un JSON local.
 *
 * El plan Free de Supabase no incluye backups automáticos (son de Pro en
 * adelante), así que esta es la red de contención antes de cualquier
 * operación destructiva.
 *
 *   node scripts/backup.mjs
 *
 * Deja el archivo en backups/coleswap-<fecha>.json. Solo lee: no modifica nada.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Leemos .env.local a mano para no depender de dotenv
const env = Object.fromEntries(
  readFileSync(join(root, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

const TABLAS = [
  'schools', 'families', 'platform_admins', 'invitations',
  'listings', 'book_details', 'uniform_details', 'children',
  'contacts', 'ratings', 'conversations', 'messages',
  'conversation_reads', 'push_subscriptions',
]

const backup = { exportado_el: new Date().toISOString(), origen: url }
let total = 0

for (const tabla of TABLAS) {
  const { data, error } = await db.from(tabla).select('*')
  if (error) {
    console.error(`  ✗ ${tabla}: ${error.message}`)
    backup[tabla] = { error: error.message }
    continue
  }
  backup[tabla] = data
  total += data.length
  console.log(`  ✓ ${tabla.padEnd(20)} ${data.length}`)
}

// auth.users no se expone por PostgREST; va por la Admin API.
// No incluye las contraseñas (son hashes que tampoco se pueden restaurar).
const { data: users, error: usersErr } = await db.auth.admin.listUsers({ perPage: 1000 })
if (usersErr) {
  console.error(`  ✗ auth.users: ${usersErr.message}`)
} else {
  backup.auth_users = users.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    email_confirmed_at: u.email_confirmed_at,
    user_metadata: u.user_metadata,
  }))
  total += backup.auth_users.length
  console.log(`  ✓ ${'auth.users'.padEnd(20)} ${backup.auth_users.length}`)
}

// Inventario de storage, para saber qué archivos existían aunque el binario
// no esté en el backup.
backup.storage = {}
for (const bucket of ['listing-images', 'school-crests']) {
  const { data } = await db.storage.from(bucket).list('', { limit: 1000 })
  backup.storage[bucket] = data ?? []
}

const dir = join(root, 'backups')
mkdirSync(dir, { recursive: true })
const archivo = join(dir, `coleswap-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`)
writeFileSync(archivo, JSON.stringify(backup, null, 2), 'utf8')

console.log(`\n${total} filas → ${archivo}`)
