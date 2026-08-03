import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
      <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary text-primary-foreground">
        <GraduationCap className="size-6" />
      </span>
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <p className="text-muted-foreground max-w-sm">
        No encontramos lo que buscabas. Puede que el link esté roto o la publicación ya no exista.
      </p>
      <Link href="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  )
}
