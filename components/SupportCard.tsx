'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Si no hay link configurado la tarjeta no se muestra, así no queda un botón
// roto en producción antes de dar de alta la cuenta de donaciones.
const DONATION_URL = process.env.NEXT_PUBLIC_DONATION_URL

export function SupportCard() {
  if (!DONATION_URL) return null

  return (
    <Card className="mt-6">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Bancá ColeSwap</p>
            <p className="text-xs text-muted-foreground">
              La app es gratis y no cobra comisiones. Se mantiene con lo que aportan las
              familias que la usan — sirve para pagar el servidor y que siga andando.
            </p>
          </div>
          <Button
            render={
              <a href={DONATION_URL} target="_blank" rel="noopener noreferrer" />
            }
            // Renderiza un <a>, no un <button>: sin esto Base UI avisa que se
            // pierden las semánticas nativas de botón.
            nativeButton={false}
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
          >
            <Heart className="size-3.5" />
            Colaborar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
