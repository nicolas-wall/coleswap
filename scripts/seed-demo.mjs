// Seed de datos ficticios para grabar el video de la landing.
// Trabaja solo sobre el colegio demo "Colegio San Martín" (seed 003), nunca
// sobre colegios reales.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(process.argv[2], 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SCHOOL = '00000000-0000-0000-0000-000000000001' // Colegio San Martín (demo)
const PASSWORD = 'ColeSwapDemo2026!'

const FAMILIES = [
  { key: 'buyer',  email: 'demo.gomez@coleswap.test',     name: 'Familia Gómez',     rating: null,  count: 0 },
  { key: 's1',     email: 'demo.perez@coleswap.test',     name: 'Familia Pérez',     rating: 4.8,   count: 12 },
  { key: 's2',     email: 'demo.rodriguez@coleswap.test', name: 'Familia Rodríguez', rating: 5.0,   count: 7 },
  { key: 's3',     email: 'demo.fernandez@coleswap.test', name: 'Familia Fernández', rating: 4.5,   count: 21 },
  { key: 's4',     email: 'demo.lopez@coleswap.test',     name: 'Familia López',     rating: 4.9,   count: 9 },
]

const ids = {}

// `--clean` deshace todo lo que crea este script, incluido el colegio demo, y
// no toca ningún otro colegio.
if (process.argv.includes('--clean')) {
  const { data: fams } = await db.from('families').select('id').eq('school_id', SCHOOL)
  const famIds = (fams ?? []).map((f) => f.id)
  const { data: lst } = await db.from('listings').select('id').eq('school_id', SCHOOL)
  const lstIds = (lst ?? []).map((l) => l.id)

  if (lstIds.length) {
    await db.from('messages').delete().in(
      'conversation_id',
      ((await db.from('conversations').select('id').in('listing_id', lstIds)).data ?? []).map((c) => c.id)
    )
    await db.from('conversations').delete().in('listing_id', lstIds)
    await db.from('contacts').delete().in('listing_id', lstIds)
    await db.from('ratings').delete().in('listing_id', lstIds)
    await db.from('book_details').delete().in('listing_id', lstIds)
    await db.from('uniform_details').delete().in('listing_id', lstIds)
    await db.from('listings').delete().in('id', lstIds)
  }
  if (famIds.length) {
    await db.from('children').delete().in('family_id', famIds)
    await db.from('push_subscriptions').delete().in('family_id', famIds).then(() => {}, () => {})
    await db.from('invitations').update({ used_by: null, used_at: null }).in('used_by', famIds)
    await db.from('families').delete().in('id', famIds)
    for (const id of famIds) await db.auth.admin.deleteUser(id).catch(() => {})
  }
  await db.from('invitations').delete().eq('school_id', SCHOOL)
  await db.from('schools').delete().eq('id', SCHOOL)
  console.log(`✓ Limpiado: ${famIds.length} cuenta(s), ${lstIds.length} publicación(es) y el colegio demo`)
  process.exit(0)
}

// El colegio demo puede no existir (el seed 003 no corrió, o se limpió antes).
{
  const { error } = await db.from('schools').upsert({
    id: SCHOOL,
    name: 'Colegio San Martín',
    slug: 'san-martin',
    city: 'Buenos Aires',
    short_name: 'San Martín',
  })
  if (error) throw error
}

async function ensureUser(email) {
  // La admin API no expone getUserByEmail, así que paginamos el listado.
  let page = 1
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email === email)
    if (hit) {
      await db.auth.admin.updateUserById(hit.id, { password: PASSWORD, email_confirm: true })
      return hit.id
    }
    if (data.users.length < 200) break
    page++
  }
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  })
  if (error) throw error
  return data.user.id
}

console.log('→ Creando cuentas demo…')
for (const f of FAMILIES) {
  ids[f.key] = await ensureUser(f.email)
  const { error } = await db.from('families').upsert({
    id: ids[f.key],
    school_id: SCHOOL,
    display_name: f.name,
    email: f.email,
    phone: '11 4000-0000',
    rating_avg: f.rating,
    rating_count: f.count,
    approved: true,
    suspended: false,
    role: 'user',
  })
  if (error) throw error
  console.log(`   ${f.name.padEnd(20)} ${f.email}`)
}

// Hijos del comprador → alimenta el bloque "Recomendado para tu familia".
await db.from('children').delete().eq('family_id', ids.buyer)
await db.from('children').insert([
  { family_id: ids.buyer, name: 'Sofía', grade: 'Primaria 5°' },
  { family_id: ids.buyer, name: 'Tomás', grade: 'Secundaria 2°' },
])

// Limpieza: publicaciones previas del colegio demo (nombres feos de tests
// viejos) quedan fuera del catálogo, sin borrar los registros.
const { data: stale } = await db
  .from('listings')
  .select('id, family_id')
  .eq('school_id', SCHOOL)
const demoIds = new Set(Object.values(ids))
const staleIds = (stale ?? []).filter((l) => !demoIds.has(l.family_id)).map((l) => l.id)
if (staleIds.length) {
  await db.from('listings').update({ status: 'removed' }).in('id', staleIds)
  console.log(`→ ${staleIds.length} publicación(es) vieja(s) ocultada(s)`)
}

// Borramos y recreamos las publicaciones demo para que el seed sea idempotente.
const { data: mine } = await db
  .from('listings')
  .select('id')
  .in('family_id', [...demoIds])
const mineIds = (mine ?? []).map((l) => l.id)
if (mineIds.length) {
  await db.from('conversations').delete().in('listing_id', mineIds)
  await db.from('contacts').delete().in('listing_id', mineIds)
  await db.from('ratings').delete().in('listing_id', mineIds)
  await db.from('listings').delete().in('id', mineIds)
}

const BOOKS = [
  { s: 's1', isbn: '9789504661238', title: 'Matemática 5 en Movimiento', author: 'AA. VV.',            publisher: 'Santillana',      subject: 'Matemática',           grade: 'Primaria 5°',   price: 6500,  cond: 'buen_estado', notes: 'Sin escritos, tapa un poco gastada.' },
  { s: 's2', isbn: '9789500763417', title: 'Biología 2. La vida en la Tierra', author: 'M. Bocalandro', publisher: 'Santillana',      subject: 'Biología',             grade: 'Secundaria 2°', price: 8000,  cond: 'como_nuevo',  notes: 'Se usó medio año, impecable.' },
  { s: 's3', isbn: '9789871331482', title: 'Prácticas del Lenguaje 2',   author: 'S. Martínez',        publisher: 'Estrada',         subject: 'Lengua y Literatura',  grade: 'Secundaria 2°', price: 7200,  cond: 'como_nuevo',  notes: null },
  { s: 's1', isbn: '9789501340556', title: 'Ciencias Naturales 5',       author: 'L. Iglesias',        publisher: 'Kapelusz',        subject: 'Ciencias Naturales',   grade: 'Primaria 5°',   price: 5800,  cond: 'buen_estado', notes: null },
  { s: 's4', isbn: '9789870618294', title: 'Historia Argentina y Latinoamericana', author: 'R. Fradkin', publisher: 'Aique',        subject: 'Historia',             grade: 'Secundaria 2°', price: 6900,  cond: 'regular',     notes: 'Tiene subrayados en los primeros capítulos.' },
  { s: 's2', isbn: '9780194598910', title: 'English File Elementary',    author: 'C. Oxenden',         publisher: 'Oxford',          subject: 'Inglés',               grade: 'Secundaria 1°', price: 9500,  cond: 'buen_estado', notes: 'Incluye el workbook.' },
  { s: 's3', isbn: '9789876421157', title: 'Geografía 3. Argentina',     author: 'AA. VV.',            publisher: 'Puerto de Palos', subject: 'Geografía',            grade: 'Secundaria 3°', price: 6200,  cond: 'buen_estado', notes: null },
  { s: 's4', isbn: '9789871609338', title: 'Matemática 2. Secundaria',   author: 'C. Sessa',           publisher: 'Tinta Fresca',    subject: 'Matemática',           grade: 'Secundaria 2°', price: 7400,  cond: 'buen_estado', notes: null },
  { s: 's1', isbn: '9789504926610', title: 'Prácticas del Lenguaje 5',   author: 'AA. VV.',            publisher: 'Santillana',      subject: 'Lengua y Literatura',  grade: 'Primaria 5°',   price: 5500,  cond: 'como_nuevo',  notes: null },
]

const UNIFORMS = [
  { s: 's2', garment: 'remera',   size: '12', gender: 'unisex',    color: 'Blanco',   price: 4500,  cond: 'buen_estado', notes: 'Chomba del cole, sin manchas.' },
  { s: 's3', garment: 'buzo',     size: '14', gender: 'unisex',    color: 'Azul',     price: 12000, cond: 'como_nuevo',  notes: null },
  { s: 's1', garment: 'pantalon', size: '10', gender: 'masculino', color: 'Gris',     price: 8000,  cond: 'buen_estado', notes: null },
  { s: 's4', garment: 'pollera',  size: '12', gender: 'femenino',  color: 'Escocés',  price: 9000,  cond: 'buen_estado', notes: 'Le quedó chica en un año.' },
  { s: 's2', garment: 'campera',  size: '16', gender: 'unisex',    color: 'Azul',     price: 18000, cond: 'como_nuevo',  notes: null },
  { s: 's3', garment: 'zapatos',  size: '38', gender: 'unisex',    color: 'Negro',    price: 15000, cond: 'regular',     notes: null },
]

console.log('→ Publicando catálogo demo…')
// created_at escalonado para que el orden del grid quede prolijo.
let t = Date.now() - 1000 * 60 * 60 * 24 * 20
const step = 1000 * 60 * 60 * 26
const stamp = () => new Date((t += step)).toISOString()

for (const b of BOOKS) {
  const { data, error } = await db
    .from('listings')
    .insert({
      school_id: SCHOOL, family_id: ids[b.s], type: 'book', status: 'active',
      price: b.price, condition: b.cond, notes: b.notes, created_at: stamp(),
    })
    .select('id')
    .single()
  if (error) throw error
  const { error: e2 } = await db.from('book_details').insert({
    listing_id: data.id, isbn: b.isbn, title: b.title, author: b.author,
    publisher: b.publisher, subject: b.subject, grade: b.grade,
  })
  if (e2) throw e2
}

for (const u of UNIFORMS) {
  const { data, error } = await db
    .from('listings')
    .insert({
      school_id: SCHOOL, family_id: ids[u.s], type: 'uniform', status: 'active',
      price: u.price, condition: u.cond, notes: u.notes, created_at: stamp(),
    })
    .select('id')
    .single()
  if (error) throw error
  const { error: e2 } = await db.from('uniform_details').insert({
    listing_id: data.id, garment_type: u.garment, size: u.size,
    gender: u.gender, color: u.color,
  })
  if (e2) throw e2
}

// Una publicación propia del comprador, para que "Mis publicaciones" no esté vacío.
const { data: own } = await db
  .from('listings')
  .insert({
    school_id: SCHOOL, family_id: ids.buyer, type: 'uniform', status: 'active',
    price: 11000, condition: 'buen_estado', notes: 'A Sofía le quedó chico.',
    created_at: stamp(),
  })
  .select('id')
  .single()
await db.from('uniform_details').insert({
  listing_id: own.id, garment_type: 'buzo', size: '10', gender: 'unisex', color: 'Azul',
})

// Un hilo de chat ya existente, para que la bandeja no aparezca vacía.
const [a, b] = [ids.buyer, ids.s4].sort()
const { data: conv } = await db
  .from('conversations')
  .insert({ listing_id: own.id, family_a_id: a, family_b_id: b })
  .select('id')
  .single()
await db.from('messages').insert([
  { conversation_id: conv.id, sender_id: ids.s4,    body: 'Hola! Vi el buzo talle 10, ¿sigue disponible?', created_at: new Date(Date.now() - 7200e3).toISOString() },
  { conversation_id: conv.id, sender_id: ids.buyer, body: 'Hola! Sí, está disponible.',                    created_at: new Date(Date.now() - 7000e3).toISOString() },
  { conversation_id: conv.id, sender_id: ids.s4,    body: '¿Te sirve que lo pase a buscar el viernes a la salida?', created_at: new Date(Date.now() - 6800e3).toISOString() },
])

console.log(`\n✓ Listo. Cuenta para grabar: demo.gomez@coleswap.test / ${PASSWORD}`)
