'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { savePushSubscription, removePushSubscription } from '@/lib/actions/push'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

interface Props {
  /** Copy alternativo: en /pending el motivo para activarlas es otro. */
  title?: string
  description?: string
}

export function NotificationToggle({
  title = 'Notificaciones de mensajes',
  description = 'Enterate cuando te llega un mensaje, sin tener la web abierta.',
}: Props = {}) {
  const [supported, setSupported] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false)
      return
    }
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    }).catch(() => setSupported(false))
  }, [])

  async function handleEnable() {
    setLoading(true)
    setError('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('No diste permiso para las notificaciones.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setError('Las notificaciones no están configuradas.')
        return
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON()
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setError('No se pudo activar la notificación.')
        return
      }

      const result = await savePushSubscription({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      setSubscribed(true)
    } catch {
      setError('No se pudo activar la notificación. Probá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setLoading(true)
    setError('')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <Card className="mt-6">
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={subscribed ? 'outline' : 'default'}
            disabled={loading}
            onClick={subscribed ? handleDisable : handleEnable}
            className="gap-1.5 shrink-0"
          >
            {subscribed ? <BellOff className="size-3.5" /> : <Bell className="size-3.5" />}
            {loading ? '…' : subscribed ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
