'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallAppButton() {
  const { status } = useInstallPrompt()

  if (status !== 'ios') return null

  return (
    <Card className="mt-6">
      <CardContent className="pt-4 space-y-1">
        <p className="text-sm font-medium">Instalar la app</p>
        <p className="text-xs text-muted-foreground">
          Tocá el botón Compartir de Safari y elegí &quot;Agregar a pantalla de inicio&quot;.
        </p>
      </CardContent>
    </Card>
  )
}
