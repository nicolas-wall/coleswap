import Link from 'next/link'
import {
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  BookOpen,
  Shirt,
  Search,
  HandCoins,
  Star,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SupportLink } from '@/components/SupportLink'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-semibold text-xl">
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            ColeSwap
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/faq" className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Preguntas frecuentes
            </Link>
            <Link href="/legal" className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Legales
            </Link>
            {/* Abajo de 360px el logo + los dos botones no entran y "Crear
                cuenta" se salía del viewport. Ingresar sigue disponible en el
                hero como "Ya tengo cuenta". */}
            <Link href="/login" className="hidden min-[360px]:inline-block">
              <Button variant="ghost" size="sm">Ingresar</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Crear cuenta</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Halo cálido detrás del título, para que la página no arranque en blanco plano */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-32 h-[28rem] bg-[radial-gradient(60%_60%_at_50%_50%,var(--color-accent)_0%,transparent_70%)] opacity-70"
          />
          <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-16 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card ring-1 ring-primary/15 px-3 py-1 text-xs font-medium text-primary shadow-warm">
              <ShieldCheck className="size-3.5" />
              Solo para familias de tu colegio
            </span>

            <h1 className="font-display mt-5 text-4xl sm:text-6xl font-semibold leading-[1.05] text-balance">
              Compra y venta de libros y uniformes<br className="hidden sm:block" />{' '}
              <span className="text-primary">con las familias de tu colegio</span>
            </h1>

            <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto text-balance leading-relaxed">
              Un mercado de segunda mano cerrado por colegio: lo que a tus hijos ya no les sirve,
              le sirve a otra familia de la misma comunidad.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto shadow-warm">Crear cuenta</Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-card">Ya tengo cuenta</Button>
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Gratis · Sin comisiones · Coordinan entre ustedes
            </p>
          </div>
        </section>

        {/* Cómo funciona — los pasos a la izquierda, el recorrido real a la derecha */}
        <section className="border-t bg-muted/40">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="font-display text-3xl font-semibold">Cómo funciona</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed max-w-md">
                  Del otro lado está la app de verdad: así se ve buscar un libro, ponerse de
                  acuerdo con la otra familia y publicar lo que te sobró.
                </p>

                {/* max-w corta el renglón: entre 768 y 1024 la sección todavía
                    está apilada y el texto se estiraba a todo el ancho. */}
                <ol className="mt-9 space-y-6 max-w-md">
                  {[
                    {
                      icon: Search,
                      title: 'Buscá o publicá',
                      body: 'Encontrá libros y uniformes de tu colegio, o publicá en minutos lo que te sobró.',
                    },
                    {
                      icon: MessageCircle,
                      title: 'Mensajeate',
                      body: 'Escribile directo a la otra familia por el chat de la app para ponerse de acuerdo.',
                    },
                    {
                      icon: HandCoins,
                      title: 'Coordiná en el cole',
                      body: 'Se encuentran en persona para la entrega. Nosotros no procesamos pagos.',
                    },
                  ].map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="relative shrink-0">
                        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-card text-primary ring-1 ring-foreground/5 shadow-warm">
                          <step.icon className="size-5" strokeWidth={1.75} />
                        </span>
                        <span className="absolute -top-1.5 -left-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[0.65rem] font-semibold ring-2 ring-muted/40">
                          {i + 1}
                        </span>
                      </span>
                      <div className="pt-0.5">
                        <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Marco de celular: el recorrido está grabado en viewport de teléfono */}
              <div className="flex flex-col items-center lg:items-end">
                <div className="relative w-[264px] sm:w-[292px] rounded-[2.25rem] bg-foreground/90 p-2.5 shadow-warm-lg ring-1 ring-foreground/10">
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-[0.9rem] z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-background/25"
                  />
                  <video
                    className="block w-full aspect-[390/844] rounded-[1.7rem] bg-muted"
                    src="/demo.mp4"
                    poster="/demo-poster.jpg"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    preload="metadata"
                    aria-label="Recorrido en video por ColeSwap: catálogo del colegio, búsqueda, chat entre familias y publicación de un libro por ISBN"
                  />
                </div>
                <p className="mt-4 max-w-[292px] text-center text-xs text-muted-foreground">
                  Grabado con un colegio de prueba. Los nombres y las publicaciones son ficticios.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparación con el grupo del cole */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-display text-3xl font-semibold text-center">
            ¿Y si ya tenemos el grupo del cole?
          </h2>
          <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
            En un grupo de Facebook o WhatsApp todo se mezcla y se pierde entre mensajes.
            Acá cada cosa está donde tiene que estar.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-dashed p-6">
              <h3 className="font-display text-lg font-semibold text-muted-foreground">
                En el grupo del cole
              </h3>
              <ul className="mt-4 space-y-3">
                {[
                  'Scrolleás cientos de mensajes para encontrar un libro',
                  'Escribís título, autor y materia a mano cada vez',
                  'Ves todo, aunque no sea del grado de tus hijos',
                  'Publicás y a los dos días tu mensaje quedó enterrado',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm text-muted-foreground">
                    <X className="size-4 shrink-0 mt-0.5 opacity-50" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-card p-6 ring-1 ring-primary/20 shadow-warm">
              <h3 className="font-display text-lg font-semibold text-primary">En ColeSwap</h3>
              <ul className="mt-4 space-y-3">
                {[
                  'Buscador por título, autor, materia o talle',
                  'Cargás el ISBN y los datos del libro se completan solos',
                  'Recomendaciones según el grado de cada hijo',
                  'Tu publicación queda listada hasta que la vendas',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm">
                    <Check className="size-4 shrink-0 mt-0.5 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Por qué */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-display text-3xl font-semibold text-center mb-10">Por qué es distinto</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: 'Cerrado por colegio',
                body: 'Solo entran familias invitadas o aprobadas por un moderador de tu propio colegio.',
              },
              {
                icon: BookOpen,
                title: 'Libros y uniformes',
                body: 'Buscá por materia, grado o talle — lo que necesitás para este año lectivo.',
              },
              {
                icon: Star,
                title: 'Calificaciones',
                body: 'Después de cada venta, comprador y vendedor se califican mutuamente.',
              },
              {
                icon: Shirt,
                title: 'Moderado por tu colegio',
                body: 'Un moderador de la comunidad puede suspender cuentas que no cumplan las reglas.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/5 transition-shadow hover:shadow-warm"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 pb-16">
          <div className="relative max-w-5xl mx-auto overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-14 text-center shadow-warm-lg">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(255,255,255,0.16)_0%,transparent_60%)]"
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold">¿Tu colegio ya usa ColeSwap?</h2>
              <p className="mt-3 text-primary-foreground/80 max-w-md mx-auto leading-relaxed">
                Pedí el código de invitación al moderador, o solicitá acceso directamente desde la app.
              </p>
              <Link href="/signup" className="inline-block mt-7">
                <Button size="lg" variant="secondary" className="shadow-warm">Crear cuenta</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ColeSwap</p>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:text-foreground transition-colors">Preguntas frecuentes</Link>
            <Link href="/legal" className="hover:text-foreground transition-colors">Legales</Link>
            <SupportLink />
          </div>
        </div>
      </footer>
    </div>
  )
}
