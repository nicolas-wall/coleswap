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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            SchoolShop
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/faq" className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Preguntas frecuentes
            </Link>
            <Link href="/legal" className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Legales
            </Link>
            <Link href="/login">
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
        <section className="max-w-5xl mx-auto px-4 pt-16 pb-14 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Compra y venta de libros y uniformes<br className="hidden sm:block" /> con las familias de tu colegio
          </h1>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
            SchoolShop es un mercado de segunda mano cerrado por colegio: solo lo usan familias
            de tu propia comunidad escolar, para pasar de mano en mano lo que ya no usan.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Crear cuenta</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">Ya tengo cuenta</Button>
            </Link>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="border-t bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-14">
            <h2 className="text-xl font-semibold text-center mb-10">Cómo funciona</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center size-11 rounded-full bg-primary/10 text-primary">
                  <Search className="size-5" />
                </div>
                <h3 className="font-medium">Buscá o publicá</h3>
                <p className="text-sm text-muted-foreground">
                  Encontrá libros y uniformes de tu colegio, o publicá en minutos lo que te sobró.
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center size-11 rounded-full bg-primary/10 text-primary">
                  <MessageCircle className="size-5" />
                </div>
                <h3 className="font-medium">Mensajeate</h3>
                <p className="text-sm text-muted-foreground">
                  Escribile directo a la otra familia por el chat de la app para ponerse de acuerdo.
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center size-11 rounded-full bg-primary/10 text-primary">
                  <HandCoins className="size-5" />
                </div>
                <h3 className="font-medium">Coordiná en el cole</h3>
                <p className="text-sm text-muted-foreground">
                  Se encuentran en persona para el intercambio. Nosotros no procesamos pagos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Por qué */}
        <section className="max-w-5xl mx-auto px-4 py-14">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-5 flex gap-3">
                <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Cerrado por colegio</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Solo entran familias invitadas o aprobadas por un moderador de tu propio colegio.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex gap-3">
                <BookOpen className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Libros y uniformes</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Buscá por materia, grado o talle — lo que necesitás para este año lectivo.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex gap-3">
                <Star className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Calificaciones</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Después de cada intercambio, comprador y vendedor se califican mutuamente.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex gap-3">
                <Shirt className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Moderado por tu colegio</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Un moderador de la comunidad puede suspender cuentas que no cumplan las reglas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t bg-primary text-primary-foreground">
          <div className="max-w-5xl mx-auto px-4 py-14 text-center">
            <h2 className="text-2xl font-bold">¿Tu colegio ya usa SchoolShop?</h2>
            <p className="mt-2 text-primary-foreground/80">
              Pedí el código de invitación al moderador, o solicitá acceso directamente desde la app.
            </p>
            <Link href="/signup" className="inline-block mt-6">
              <Button size="lg" variant="secondary">Crear cuenta</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SchoolShop</p>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:text-foreground transition-colors">Preguntas frecuentes</Link>
            <Link href="/legal" className="hover:text-foreground transition-colors">Legales</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
