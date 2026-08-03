import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'

let configured = false

function ensureConfigured() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  configured = true
}

export async function sendPushToFamily(familyId: string, payload: { title: string; body: string; url?: string }) {
  if (!process.env.VAPID_PRIVATE_KEY) return
  ensureConfigured()

  const service = createServiceClient()
  const { data: subs } = await service
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('family_id', familyId)

  if (!subs || subs.length === 0) return

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        // La suscripción expiró o el navegador la invalidó: la limpiamos
        await service.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }))
}
