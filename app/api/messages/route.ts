import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Family, Listing, BookDetails, UniformDetails, Message, ConversationRead } from '@/types/database'

interface ConversationRow {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  last_message_at: string
  listings: (Pick<Listing, 'type' | 'status'> & {
    book_details: Pick<BookDetails, 'title'> | null
    uniform_details: Pick<UniformDetails, 'garment_type'> | null
  }) | null
  buyer: Pick<Family, 'id' | 'display_name'> | null
  seller: Pick<Family, 'id' | 'display_name'> | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ conversations: [] }, { status: 401 })

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, listing_id, buyer_id, seller_id, last_message_at,
      listings(type, status, book_details(title), uniform_details(garment_type)),
      buyer:families!conversations_buyer_id_fkey(id, display_name),
      seller:families!conversations_seller_id_fkey(id, display_name)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false }) as { data: ConversationRow[] | null; error: unknown }

  if (!conversations || conversations.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  const ids = conversations.map((c) => c.id)

  const { data: reads } = await supabase
    .from('conversation_reads')
    .select('conversation_id, last_read_at')
    .eq('family_id', user.id)
    .in('conversation_id', ids) as { data: Pick<ConversationRead, 'conversation_id' | 'last_read_at'>[] | null; error: unknown }

  const readMap = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]))

  const { data: messages } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: true }) as { data: Message[] | null; error: unknown }

  const byConversation = new Map<string, Message[]>()
  for (const m of messages ?? []) {
    const list = byConversation.get(m.conversation_id) ?? []
    list.push(m)
    byConversation.set(m.conversation_id, list)
  }

  const result = conversations.map((c) => {
    const isBuyer = c.buyer_id === user.id
    const other = isBuyer ? c.seller : c.buyer
    const msgs = byConversation.get(c.id) ?? []
    const lastMessage = msgs[msgs.length - 1] ?? null
    const lastRead = readMap.get(c.id)
    const unreadCount = msgs.filter((m) => m.sender_id !== user.id && (!lastRead || m.created_at > lastRead)).length

    const listingTitle = c.listings?.book_details?.title
      ?? c.listings?.uniform_details?.garment_type
      ?? 'Publicación'

    return {
      id: c.id,
      listingId: c.listing_id,
      listingTitle,
      listingType: c.listings?.type ?? 'book',
      listingStatus: c.listings?.status ?? 'active',
      otherParticipant: { id: other?.id ?? '', displayName: other?.display_name ?? '' },
      lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.created_at, isMine: lastMessage.sender_id === user.id } : null,
      lastMessageAt: c.last_message_at,
      unreadCount,
    }
  })

  return NextResponse.json({ conversations: result })
}
