'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { messageSchema } from '@/lib/schemas'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendPushToFamily } from '@/lib/push'
import type { Listing, Conversation, Family } from '@/types/database'

export async function startConversation(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const allowed = await checkRateLimit(`start-conversation:${user.id}`, 20, 3600)
  if (!allowed) return { error: 'Iniciaste demasiadas conversaciones. Esperá un rato y probá de nuevo.' }

  const { data: listing } = await supabase
    .from('listings')
    .select('family_id, status')
    .eq('id', listingId)
    .single() as { data: Pick<Listing, 'family_id' | 'status'> | null; error: unknown }

  if (!listing) return { error: 'Publicación no encontrada' }
  if (listing.status !== 'active') return { error: 'Esta publicación ya no está disponible' }
  if (listing.family_id === user.id) return { error: 'No podés enviarte un mensaje a vos mismo' }

  // Registro liviano de "esta familia se interesó en esta publicación", usado
  // solo para saber a quién calificar cuando se marca como vendida — el hilo
  // de mensajes en sí es por par de familias, no por publicación.
  await supabase.from('contacts').insert({ listing_id: listingId, buyer_family_id: user.id })

  const [familyA, familyB] = [user.id, listing.family_id].sort()

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('family_a_id', familyA)
    .eq('family_b_id', familyB)
    .maybeSingle()

  if (existing) return { success: true, conversationId: existing.id as string }

  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      family_a_id: familyA,
      family_b_id: familyB,
    })
    .select('id')
    .single()

  if (convErr || !conversation) return { error: 'No se pudo iniciar la conversación' }

  revalidatePath('/messages')
  return { success: true, conversationId: conversation.id as string }
}

export async function sendMessage(conversationId: string, body: string) {
  const parsed = messageSchema.safeParse({ body })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const allowed = await checkRateLimit(`send-message:${user.id}`, 30, 300)
  if (!allowed) return { error: 'Estás enviando mensajes muy rápido. Esperá un momento.' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  })

  if (error) return { error: 'No se pudo enviar el mensaje' }

  revalidatePath(`/messages/${conversationId}`)
  revalidatePath('/messages')

  // Push al otro participante, sin bloquear la respuesta si falla
  const { data: conversation } = await supabase
    .from('conversations')
    .select('family_a_id, family_b_id')
    .eq('id', conversationId)
    .single() as { data: Pick<Conversation, 'family_a_id' | 'family_b_id'> | null; error: unknown }

  if (conversation) {
    const recipientId = conversation.family_a_id === user.id ? conversation.family_b_id : conversation.family_a_id

    const { data: sender } = await supabase
      .from('families')
      .select('display_name')
      .eq('id', user.id)
      .single() as { data: Pick<Family, 'display_name'> | null; error: unknown }

    sendPushToFamily(recipientId, {
      title: sender?.display_name ?? 'Nuevo mensaje',
      body: parsed.data.body.slice(0, 120),
      url: `/messages/${conversationId}`,
    }).catch(() => {})
  }

  return { success: true }
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('conversation_reads').upsert({
    conversation_id: conversationId,
    family_id: user.id,
    last_read_at: new Date().toISOString(),
  }, { onConflict: 'conversation_id,family_id' })

  return { success: true }
}
