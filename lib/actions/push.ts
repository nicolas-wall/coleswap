'use server'

import { createClient } from '@/lib/supabase/server'

interface SubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function savePushSubscription(sub: SubscriptionInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('push_subscriptions').upsert({
    family_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  }, { onConflict: 'endpoint' })

  if (error) return { error: 'No se pudo activar la notificación' }
  return { success: true }
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('family_id', user.id)
  return { success: true }
}
