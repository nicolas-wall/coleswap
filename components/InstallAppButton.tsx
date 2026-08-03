'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [status, setStatus] = useState<'hidden' | 'installable' | 'ios' | 'installed'>('hidden')

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) {
      setStatus('installed')
      return
    }

    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
      setStatus('ios')
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setStatus('installable')
    }
    function onInstalled() {
      setStatus('installed')
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setStatus('installed')
    setDeferredPrompt(null)
  }

  if (status === 'hidden' || status === 'installed') return null

  return (
    <Card className="mt-6">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Instalar la app</p>
            <p className="text-xs text-muted-foreground">Agregala a tu pantalla de inicio para entrar más rápido.</p>
          </div>
          {status === 'installable' && (
            <Button type="button" size="sm" onClick={handleInstall} className="gap-1.5 shrink-0">
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
      </CardContent>
    </Card>
  )
}
