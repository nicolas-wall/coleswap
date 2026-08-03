'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { messageSchema } from '@/lib/schemas'
import type { Listing } from '@/types/database'

export async function startConversation(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: listing } = await supabase
    .from('listings')
    .select('family_id, status')
    .eq('id', listingId)
    .single() as { data: Pick<Listing, 'family_id' | 'status'> | null; error: unknown }

  if (!listing) return { error: 'Publicación no encontrada' }
  if (listing.status !== 'active') return { error: 'Esta publicación ya no está disponible' }
  if (listing.family_id === user.id) return { error: 'No podés enviarte un mensaje a vos mismo' }

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .maybeSingle()

  if (existing) return { success: true, conversationId: existing.id as string }

  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.family_id,
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

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  })

  if (error) return { error: 'No se pudo enviar el mensaje' }

  revalidatePath(`/messages/${conversationId}`)
  revalidatePath('/messages')
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
