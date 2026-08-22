'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Sin esto, cualquier excepción en producción le muestra a una familia la
// pantalla pelada de Next ("Application error"), sin marca y sin forma de volver.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ColeSwap] error no controlado:', error)
  }, [error])

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
      <TriangleAlert className="size-10 mx-auto text-muted-foreground" strokeWidth={1.25} />
      <h1 className="font-display text-2xl font-semibold">Algo se rompió de nuestro lado</h1>
      <p className="text-sm text-muted-foreground">
        No es culpa tuya y no perdiste nada de lo que publicaste. Probá de nuevo;
        si sigue pasando, escribinos y lo miramos.
      </p>
      <div className="flex gap-2 justify-center pt-2">
        <Button onClick={reset}>Probar de nuevo</Button>
        <Link href="/catalog">
          <Button variant="outline">Ir al catálogo</Button>
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 pt-4">
          Código de error: <span className="font-mono">{error.digest}</span>
        </p>
      )}
    </div>
  )
}
