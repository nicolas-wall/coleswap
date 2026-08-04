import Link from 'next/link'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SupportLink } from '@/components/SupportLink'

export default function LegalPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-semibold text-xl">
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            SchoolShop
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" />
            Volver
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 space-y-10 text-sm leading-relaxed text-muted-foreground [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:text-base [&_h2]:mb-2 [&_p+p]:mt-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground mb-1">Términos y privacidad</h1>
          <p>Última actualización: agosto de 2026.</p>
        </div>

        <section>
          <h2>Qué es SchoolShop</h2>
          <p>
            SchoolShop es un espacio para que las familias de un mismo colegio publiquen y encuentren
            libros y uniformes escolares de segunda mano. No somos dueños ni vendedores de ningún
            artículo publicado: solo ponemos en contacto a las familias entre sí.
          </p>
        </section>

        <section>
          <h2>Sin pagos ni entregas a través de la plataforma</h2>
          <p>
            SchoolShop no procesa pagos, no cobra comisiones y no interviene en la entrega de los
            artículos. El precio, la forma de pago y el lugar de encuentro los acuerdan directamente
            comprador y vendedor. No somos parte de esa transacción ni garantizamos el estado,
            autenticidad o cumplimiento de lo acordado entre las partes.
          </p>
        </section>

        <section>
          <h2>Tu cuenta</h2>
          <p>
            Para usar SchoolShop necesitás pertenecer a un colegio participante, mediante un código de
            invitación o la aprobación de un moderador de tu comunidad. Sos responsable de la
            información que publicás y de mantener tu contraseña segura.
          </p>
        </section>

        <section>
          <h2>Moderación</h2>
          <p>
            Cada colegio tiene moderadores —otras familias de la comunidad— que pueden remover
            publicaciones inapropiadas y suspender o eliminar cuentas que incumplan estas reglas o
            tengan un comportamiento abusivo hacia otros usuarios.
          </p>
        </section>

        <section>
          <h2>Qué datos guardamos</h2>
          <p>
            Guardamos el nombre de tu familia, teléfono y email de contacto, y las publicaciones y
            mensajes que crees. Esta información es visible solo para otras familias aprobadas de tu
            mismo colegio, y para los moderadores de esa comunidad. No vendemos ni compartimos tus
            datos con terceros ajenos a la plataforma.
          </p>
        </section>

        <section>
          <h2>Cambios</h2>
          <p>
            Podemos actualizar estos términos a medida que la plataforma evoluciona. Si hay cambios
            importantes, lo vamos a comunicar dentro de la app.
          </p>
        </section>

        <Separator />

        <p>
          ¿Preguntas sobre estos términos o sobre tus datos? Escribile al moderador de tu colegio, o
          consultá la sección de <Link href="/faq" className="text-primary underline underline-offset-2">preguntas frecuentes</Link>.
        </p>
      </main>

      <footer className="border-t">
        <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-muted-foreground flex items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} SchoolShop</p>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:text-foreground transition-colors">Preguntas frecuentes</Link>
            <SupportLink />
          </div>
        </div>
      </footer>
    </div>
  )
}
