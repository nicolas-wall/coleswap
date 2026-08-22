/**
 * Graba el recorrido de la app que se muestra en la landing (public/demo.mp4).
 *
 * Necesita un servidor corriendo con datos de demo cargados. Ver scripts/README.md.
 *
 *   node scripts/record-demo.mjs
 *
 * Variables de entorno: DEMO_BASE_URL, DEMO_EMAIL, DEMO_PASSWORD, DEMO_OUT.
 */
import { chromium } from 'playwright'
import { mkdirSync, rmSync, readdirSync, renameSync } from 'node:fs'
import path from 'node:path'

const BASE = process.env.DEMO_BASE_URL ?? 'http://localhost:3100'
const EMAIL = process.env.DEMO_EMAIL ?? 'demo.gomez@coleswap.test'
const PASSWORD = process.env.DEMO_PASSWORD ?? 'ColeSwapDemo2026!'
const OUT = process.env.DEMO_OUT ?? path.resolve('demo-out')
const ISBN = process.env.DEMO_ISBN ?? '9788420471839'

// Se graba en viewport de teléfono: en la landing el video va dentro de un
// marco de celular, en una columna angosta al lado de "Cómo funciona".
const W = 390
const H = 844
// Rasterizamos a 2x para que el frame capturado venga supersampleado, pero el
// video sale sí o sí al tamaño del viewport en px CSS: `recordVideo.size` solo
// sabe achicar. Pedirle más que el viewport no escala, rellena con gris.
const SCALE = 2

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Capa de subtítulos + puntero sintético. Playwright no dibuja el cursor del
 * mouse en el video, así que lo simulamos en el DOM. Se reinyecta en cada
 * navegación dura vía addInitScript.
 */
function overlay() {
  const S = { caption: '', x: 640, y: 420 }
  window.__demoState = S

  function mount() {
    if (!document.body) return
    if (!document.getElementById('__demo_style')) {
      const st = document.createElement('style')
      st.id = '__demo_style'
      // El indicador de `next dev` (logo, "Compiling…", contador de issues) no
      // debe salir en cámara.
      st.textContent =
        'nextjs-portal,#__next-build-watcher,[data-nextjs-toast],[data-next-badge-root]{display:none!important}'
      document.head?.appendChild(st)
    }
    if (!document.getElementById('__demo_layer')) {
      const layer = document.createElement('div')
      layer.id = '__demo_layer'
      layer.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;pointer-events:none;' +
        'font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'
      layer.innerHTML =
        '<div id="__demo_cursor" style="position:absolute;left:0;top:0;width:22px;height:22px;' +
        'border-radius:50%;background:rgba(20,20,24,.5);border:2px solid #fff;' +
        'box-shadow:0 3px 14px rgba(0,0,0,.45);transform:translate(-50%,-50%);' +
        'transition:left .55s cubic-bezier(.22,.61,.36,1),top .55s cubic-bezier(.22,.61,.36,1),' +
        'width .16s ease,height .16s ease"></div>' +
        // Los subtítulos van bien por encima del borde inferior: ahí aparece la
        // barra de controles del <video> cuando se embebe en la landing.
        '<div style="position:absolute;left:0;right:0;bottom:74px;display:flex;justify-content:center;padding:0 12px">' +
        '<div id="__demo_caption" style="max-width:100%;text-align:center;background:rgba(14,14,17,.9);' +
        'color:#fff;padding:10px 18px;border-radius:20px;font-size:18px;font-weight:600;' +
        'line-height:1.3;letter-spacing:-.01em;box-shadow:0 10px 28px rgba(0,0,0,.4);' +
        'opacity:0;transform:translateY(10px);transition:opacity .38s ease,transform .38s ease"></div>' +
        '</div>'
      document.body.appendChild(layer)
    }
    const cur = document.getElementById('__demo_cursor')
    if (cur) {
      cur.style.left = S.x + 'px'
      cur.style.top = S.y + 'px'
    }
    const cap = document.getElementById('__demo_caption')
    if (cap) {
      if (cap.textContent !== S.caption) cap.textContent = S.caption
      cap.style.opacity = S.caption ? '1' : '0'
      cap.style.transform = S.caption ? 'translateY(0)' : 'translateY(12px)'
    }
  }

  window.__demo = {
    mount,
    caption(t) {
      S.caption = t
      mount()
    },
    move(x, y) {
      S.x = x
      S.y = y
      mount()
    },
    // Reposiciona sin animar — para reubicar el puntero después de navegar.
    jump(x, y) {
      const cur = document.getElementById('__demo_cursor')
      if (cur) {
        const t = cur.style.transition
        cur.style.transition = 'none'
        S.x = x
        S.y = y
        mount()
        void cur.offsetHeight
        cur.style.transition = t
      } else {
        S.x = x
        S.y = y
        mount()
      }
    },
    pulse() {
      const cur = document.getElementById('__demo_cursor')
      const layer = document.getElementById('__demo_layer')
      if (!cur || !layer) return
      cur.style.width = '17px'
      cur.style.height = '17px'
      setTimeout(() => {
        cur.style.width = '26px'
        cur.style.height = '26px'
      }, 170)
      const ring = document.createElement('div')
      ring.style.cssText =
        'position:absolute;left:' + S.x + 'px;top:' + S.y + 'px;width:16px;height:16px;' +
        'margin:-8px 0 0 -8px;border-radius:50%;border:2.5px solid rgba(255,255,255,.95);' +
        'box-shadow:0 0 0 1.5px rgba(0,0,0,.3);transition:transform .5s ease-out,opacity .5s ease-out'
      layer.appendChild(ring)
      requestAnimationFrame(() => {
        ring.style.transform = 'scale(3.6)'
        ring.style.opacity = '0'
      })
      setTimeout(() => ring.remove(), 620)
    },
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount)
  } else {
    mount()
  }
  // Las navegaciones de Next reemplazan el <body>; reponemos la capa.
  setInterval(mount, 200)
}

// ---------------------------------------------------------------- helpers

const state = { caption: '', x: W / 2, y: H / 2 }

// Título que devuelve la API para DEMO_ISBN; lo resolvemos en el calentamiento.
let probeTitle = ''

async function ensureOverlay(page) {
  await page
    .evaluate(
      (s) => {
        window.__demo?.mount()
        window.__demo?.caption(s.caption)
        window.__demo?.jump(s.x, s.y)
      },
      state
    )
    .catch(() => {})
}

async function say(page, text, hold = 0) {
  state.caption = text
  await page.evaluate((t) => window.__demo?.caption(t), text).catch(() => {})
  if (hold) await sleep(hold)
}

async function moveTo(page, x, y, settle = 620) {
  state.x = x
  state.y = y
  await page.evaluate(([x, y]) => window.__demo?.move(x, y), [x, y]).catch(() => {})
  await sleep(settle)
}

async function pointAt(page, locator) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('El elemento no tiene boundingBox')
  await moveTo(page, box.x + box.width / 2, box.y + box.height / 2)
  return box
}

async function click(page, locator, settle = 900) {
  await locator.scrollIntoViewIfNeeded()
  await sleep(280)
  await pointAt(page, locator)
  await page.evaluate(() => window.__demo?.pulse()).catch(() => {})
  await sleep(190)
  await locator.click()
  await sleep(settle)
}

async function typeInto(page, locator, text, delay = 80) {
  await locator.scrollIntoViewIfNeeded()
  await sleep(200)
  await pointAt(page, locator)
  await page.evaluate(() => window.__demo?.pulse()).catch(() => {})
  await sleep(160)
  await locator.click()
  await locator.pressSequentially(text, { delay })
  await sleep(350)
}

async function pick(page, locator, value) {
  // En viewport de teléfono los campos del formulario casi nunca entran en
  // pantalla, así que hay que traerlos antes de apuntar.
  await locator.scrollIntoViewIfNeeded()
  await sleep(220)
  await pointAt(page, locator)
  await page.evaluate(() => window.__demo?.pulse()).catch(() => {})
  await sleep(150)
  await locator.selectOption(value)
  await sleep(550)
}

async function smoothScroll(page, to, settle = 900) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), to)
  await sleep(settle)
}

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/\/(catalog|pending)/, { timeout: 60000 })
}

// ---------------------------------------------------------------- guion

async function walkthrough(page) {
  await ensureOverlay(page)

  // --- Catálogo -----------------------------------------------------
  await page.goto(BASE + '/catalog', { waitUntil: 'domcontentloaded' })
  await page.locator('a[href^="/listings/"]').first().waitFor({ timeout: 60000 })
  await ensureOverlay(page)
  await sleep(500)
  await say(page, 'El catálogo de tu colegio, solo para sus familias', 2000)

  await say(page, 'Con recomendaciones según el grado de tus hijos')
  await moveTo(page, 195, 300)
  await sleep(1700)

  // --- Búsqueda -----------------------------------------------------
  await say(page, 'Buscás por título, autor o materia')
  // En mobile el buscador está detrás del botón de lupa; el input fijo del
  // header solo existe de `sm` para arriba.
  await click(page, page.locator('button[aria-label="Buscar"]'), 600)
  const search = page.locator('input[placeholder="Buscar título, autor…"]:visible')
  await typeInto(page, search, 'matemática', 65)
  await search.press('Enter')
  await page.waitForURL(/q=/, { timeout: 30000 })
  await ensureOverlay(page)
  await sleep(1800)

  // --- Filtros ------------------------------------------------------
  await say(page, 'O filtrás por libros y uniformes')
  await click(page, page.getByRole('link', { name: 'Limpiar' }), 700)
  await ensureOverlay(page)
  await pick(page, page.locator('select[name=type]'), 'uniform')
  await click(page, page.getByRole('button', { name: 'Filtrar' }), 1000)
  await ensureOverlay(page)
  await sleep(1400)

  // --- Detalle ------------------------------------------------------
  await say(page, 'Entrás a la publicación y ves el detalle')
  await click(page, page.locator('a[href^="/listings/"]').first(), 300)
  await ensureOverlay(page)
  // El detalle se hidrata con fetch: esperamos el contenido real para no
  // filmar el skeleton.
  await page.getByRole('button', { name: /Enviar mensaje/ }).waitFor({ timeout: 30000 })
  await sleep(1400)
  await say(page, 'Y quién la vende, con la calificación de su familia', 2200)

  // --- Chat ---------------------------------------------------------
  await say(page, 'Le escribís directo por el chat de la app')
  await click(page, page.getByRole('button', { name: /Enviar mensaje/ }), 300)
  await page.waitForURL(/\/messages\//, { timeout: 30000 })
  await ensureOverlay(page)

  const box = page.locator('textarea[placeholder="Escribí un mensaje…"]')
  await box.waitFor({ timeout: 30000 })
  await sleep(700)
  await typeInto(page, box, '¡Hola! ¿Sigue disponible?', 45)
  await box.press('Enter')
  await sleep(1900)

  // --- Publicar -----------------------------------------------------
  await say(page, '¿Te sobra algo? Cargás el ISBN…')
  await page.goto(BASE + '/sell/book', { waitUntil: 'domcontentloaded' })
  await ensureOverlay(page)
  await sleep(600)

  await typeInto(page, page.locator('input[placeholder^="ISBN"]'), ISBN, 50)
  // Por rol/nombre chocaría con la lupa del header, que también se llama
  // "Buscar"; lo tomamos como hermano del input de ISBN.
  await click(page, page.locator('input[placeholder^="ISBN"] ~ button'), 1200)
  await ensureOverlay(page)
  // En pantalla angosta el título y el autor autocompletados quedan fuera de
  // cuadro: hay que bajar para que se vea de qué habla el subtítulo.
  await smoothScroll(page, 215, 750)
  await say(page, '…y los datos del libro se completan solos', 2200)

  await say(page, 'Completás el resto en menos de un minuto')
  await pick(page, page.locator('select#subject'), 'Lengua y Literatura')
  await pick(page, page.locator('select#grade'), 'Secundaria 5°')
  await pick(page, page.locator('select#condition'), 'buen_estado')
  await typeInto(page, page.locator('input#price'), '7500', 85)
  await sleep(400)

  await say(page, 'Y queda publicado para las familias de tu colegio')
  await click(page, page.getByRole('button', { name: /Publicar libro/ }), 400)
  await page.waitForURL(/\/listings\/[0-9a-f-]{36}$/, { timeout: 60000 })
  await ensureOverlay(page)
  // Es la toma de cierre del flujo de venta: tiene que verse la publicación,
  // no el skeleton.
  await page.getByRole('heading', { name: probeTitle }).waitFor({ timeout: 30000 })
  await sleep(2400)

  // --- Mis publicaciones -------------------------------------------
  await say(page, 'Después la marcás como vendida y se califican')
  await page.goto(BASE + '/my-listings', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Mis publicaciones' }).waitFor({ timeout: 30000 })
  await ensureOverlay(page)
  await sleep(600)
  await moveTo(page, 195, 330)
  await sleep(1800)

  await say(page, 'ColeSwap · el marketplace de tu colegio', 2600)
  await say(page, '', 700)
}

// ---------------------------------------------------------------- run

const browser = await chromium.launch()

// Pasada de calentamiento: next dev compila cada ruta la primera vez que se
// visita, y esas esperas quedarían grabadas.
console.log('→ Precalentando rutas…')
const warm = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: SCALE,
  isMobile: true,
  hasTouch: true,
})
const wp = await warm.newPage()
await login(wp)
for (const route of ['/catalog', '/catalog?q=matematica', '/sell/book', '/sell/uniform', '/messages', '/my-listings', '/profile']) {
  await wp.goto(BASE + route, { waitUntil: 'networkidle' }).catch(() => {})
}
const firstCard = await wp.locator('a[href^="/listings/"]').first().getAttribute('href').catch(() => null)
if (firstCard) await wp.goto(BASE + firstCard, { waitUntil: 'networkidle' }).catch(() => {})

// El guion asume que este ISBN resuelve; si la API externa no lo encuentra, la
// escena mostraría un error en pantalla.
const probe = await wp.evaluate(
  (isbn) => fetch('/api/isbn?isbn=' + isbn).then((r) => r.json()).catch(() => null),
  ISBN
)
if (!probe?.book?.title) {
  throw new Error(`El ISBN ${ISBN} no resuelve en /api/isbn — elegí otro con DEMO_ISBN`)
}
probeTitle = probe.book.title
console.log(`   ISBN ${ISBN} → ${probeTitle}`)
console.log('   listo')

// Reutilizamos la sesión para que el video no empiece con la pantalla de login.
const session = await warm.storageState()
await warm.close()

console.log('→ Grabando…')
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: SCALE,
  isMobile: true,
  hasTouch: true,
  locale: 'es-AR',
  timezoneId: 'America/Argentina/Buenos_Aires',
  reducedMotion: 'no-preference',
  storageState: session,
  recordVideo: { dir: OUT, size: { width: W, height: H } },
})
await context.addInitScript(overlay)

const page = await context.newPage()
await walkthrough(page)

await context.close()
await browser.close()

const file = readdirSync(OUT).find((f) => f.endsWith('.webm'))
if (!file) throw new Error('Playwright no dejó ningún .webm en ' + OUT)
const dest = path.join(OUT, 'demo.webm')
renameSync(path.join(OUT, file), dest)
console.log('✓ ' + dest)
