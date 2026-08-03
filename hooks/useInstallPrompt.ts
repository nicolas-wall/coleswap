'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __installPrompt?: BeforeInstallPromptEvent
  }
}

export type InstallStatus = 'checking' | 'installable' | 'ios' | 'android-manual' | 'manual' | 'installed'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [status, setStatus] = useState<InstallStatus>('checking')

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) {
      setStatus('installed')
      return
    }

    const ua = window.navigator.userAgent
    if (/iphone|ipad|ipod/i.test(ua)) {
      setStatus('ios')
    } else if (/android/i.test(ua)) {
      // Puede no disparar el evento nativo (varía según versión/heurística de
      // Chrome) — mostramos instrucciones manuales salvo que sí lo dispare.
      setStatus('android-manual')
    } else {
      setStatus('manual')
    }

    // El layout raíz ya pudo haber capturado el evento antes de que este hook
    // montara (ver el script inline en app/layout.tsx).
    if (window.__installPrompt) {
      setDeferredPrompt(window.__installPrompt)
      setStatus('installable')
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      window.__installPrompt = e as BeforeInstallPromptEvent
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setStatus('installable')
    }
    function onInstalled() {
      setStatus('installed')
      setDeferredPrompt(null)
      delete window.__installPrompt
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setStatus('installed')
    setDeferredPrompt(null)
    delete window.__installPrompt
  }

  return { status, promptInstall }
}
