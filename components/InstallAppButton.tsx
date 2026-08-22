'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallAppButton() {
  const { status, promptInstall } = useInstallPrompt()

  if (status === 'checking' || status === 'installed') return null

  return (
    <Card className="mt-6">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Instalar la app</p>
            <p className="text-xs text-muted-foreground">Agregala a tu pantalla de inicio para entrar más rápido.</p>
          </div>
          {status === 'installable' && (
            <Button type="button" size="sm" onClick={() => promptInstall()} className="gap-1.5 shrink-0">
              <Download className="size-3.5" />
              Instalar
            </Button>
          )}
        </div>
        {status === 'ios' && (
          <p className="text-xs text-muted-foreground">
            Tocá el botón Compartir de Safari y elegí &quot;Agregar a pantalla de inicio&quot;.
          </p>
        )}
        {status === 'android-manual' && (
          <p className="text-xs text-muted-foreground">
            Abrí el menú ⋮ de Chrome (arriba a la derecha) y elegí &quot;Instalar aplicación&quot; o &quot;Agregar a pantalla de inicio&quot;.
          </p>
        )}
        {status === 'manual' && (
          <p className="text-xs text-muted-foreground">
            Buscá la opción &quot;Instalar ColeSwap&quot; en el menú de tu navegador, o el ícono de instalar en la barra de direcciones.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
