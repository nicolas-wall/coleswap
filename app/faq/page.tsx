import Link from 'next/link'
import { ArrowLeft, GraduationCap } from 'lucide-react'

const FAQS: { q: string; a: string }[] = [
  {
    q: '¿Qué es SchoolShop?',
    a: 'Es un mercado de segunda mano para libros y uniformes escolares, exclusivo para las familias de un mismo colegio. La idea es que lo que a un chico ya no le sirve, le sirva a otra familia de la misma comunidad.',
  },
  {
    q: '¿Cómo me registro?',
    a: 'De dos formas: con un código de invitación que te da el moderador de tu colegio (que puede ser para vos solo o compartido con vencimiento), o pidiendo acceso directamente desde "Crear cuenta" eligiendo tu colegio de una lista — en ese caso, un moderador tiene que aprobar tu cuenta antes de que puedas entrar.',
  },
  {
    q: '¿Tiene algún costo usar la plataforma?',
    a: 'No, SchoolShop no cobra nada por publicar, buscar o contactar a otra familia.',
  },
  {
    q: '¿Cómo pago lo que compro?',
    a: 'SchoolShop no procesa pagos. Te mensajeás con la otra familia dentro de la app, se ponen de acuerdo en precio y forma de pago, y coordinan el intercambio en persona (por ejemplo, en la puerta del colegio).',
  },
  {
    q: '¿Puedo ver el teléfono o el email de otras familias?',
    a: 'No se muestran automáticamente. Coordinás todo por el chat interno de la app; los datos de contacto quedan entre ustedes si deciden compartirlos por ese medio.',
  },
  {
    q: '¿Qué pasa si alguien no cumple lo acordado?',
    a: 'Después de marcar una publicación como vendida, comprador y vendedor pueden calificarse mutuamente. Si alguien tiene un comportamiento problemático, cualquier familia puede avisarle al moderador del colegio, que tiene la posibilidad de suspender o eliminar cuentas.',
  },
  {
    q: '¿Quién modera cada colegio?',
    a: 'Cada colegio tiene uno o más moderadores (otras familias de la comunidad) que pueden aprobar solicitudes de acceso, generar códigos de invitación, remover publicaciones y suspender cuentas que rompan las reglas.',
  },
  {
    q: '¿Puedo estar registrado en más de un colegio?',
    a: 'Cada cuenta pertenece a un solo colegio. Si tenés hijos en colegios distintos, necesitás una cuenta para cada uno.',
  },
  {
    q: '¿Qué puedo publicar?',
    a: 'Libros de texto y uniformes en buen estado que ya no uses. No es un espacio para vender productos nuevos ni artículos que no sean de uso escolar.',
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">Preguntas frecuentes</h1>
        <div className="space-y-6">
          {FAQS.map((item) => (
            <div key={item.q}>
              <h2 className="font-medium">{item.q}</h2>
              <p className="text-sm text-muted-foreground mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t">
        <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-muted-foreground flex items-center justify-between">
          <p>© {new Date().getFullYear()} SchoolShop</p>
          <Link href="/legal" className="hover:text-foreground transition-colors">Legales</Link>
        </div>
      </footer>
    </div>
  )
}
