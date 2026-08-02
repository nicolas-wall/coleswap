import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Family, Listing, BookDetails, UniformDetails, Message } from '@/types/database'

interface ConversationRow {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  listings: (Pick<Listing, 'type' | 'status'> & {
    book_details: Pick<BookDetails, 'title'> | null
    uniform_details: Pick<UniformDetails, 'garment_type'> | null
  }) | null
  buyer: Pick<Family, 'id' | 'display_name'> | null
  seller: Pick<Family, 'id' | 'display_name'> | null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ conversation: null }, { status: 401 })

  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      id, listing_id, buyer_id, seller_id,
      listings(type, status, book_details(title), uniform_details(garment_type)),
      buyer:families!conversations_buyer_id_fkey(id, display_name),
      seller:families!conversations_seller_id_fkey(id, display_name)
    `)
    .eq('id', id)
    .single() as { data: ConversationRow | null; error: unknown }

  if (!conversation) return NextResponse.json({ conversation: null }, { status: 404 })

  const { data: messages } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true }) as { data: Message[] | null; error: unknown }

  const isBuyer = conversation.buyer_id === user.id
  const other = isBuyer ? conversation.seller : conversation.buyer

  const listingTitle = conversation.listings?.book_details?.title
    ?? conversation.listings?.uniform_details?.garment_type
    ?? 'Publicación'

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      listingId: conversation.listing_id,
      listingTitle,
      listingType: conversation.listings?.type ?? 'book',
      otherParticipant: { id: other?.id ?? '', displayName: other?.display_name ?? '' },
      messages: (messages ?? []).map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.created_at,
        isMine: m.sender_id === user.id,
      })),
    },
  })
}
