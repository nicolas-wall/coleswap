import Link from 'next/link'
import { SupportLink } from '@/components/SupportLink'

export function AppFooter() {
  return (
    <footer className="border-t mt-10">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} SchoolShop</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/faq" className="hover:text-foreground transition-colors">
            Preguntas frecuentes
          </Link>
          <Link href="/legal" className="hover:text-foreground transition-colors">
            Términos y privacidad
          </Link>
          <SupportLink />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 pb-6 -mt-1">
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground/70 text-center sm:text-left">
          SchoolShop solo pone en contacto a familias del mismo colegio: no vende los artículos
          publicados, no procesa pagos ni interviene en la entrega.
        </p>
      </div>
    </footer>
  )
}
