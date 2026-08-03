import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Family, Message } from '@/types/database'

interface ConversationRow {
  id: string
  family_a_id: string
  family_b_id: string
  familyA: Pick<Family, 'id' | 'display_name'> | null
  familyB: Pick<Family, 'id' | 'display_name'> | null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ conversation: null }, { status: 401 })

  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      id, family_a_id, family_b_id,
      familyA:families!conversations_family_a_id_fkey(id, display_name),
      familyB:families!conversations_family_b_id_fkey(id, display_name)
    `)
    .eq('id', id)
    .single() as { data: ConversationRow | null; error: unknown }

  if (!conversation) return NextResponse.json({ conversation: null }, { status: 404 })

  const { data: messages } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true }) as { data: Message[] | null; error: unknown }

  const isFamilyA = conversation.family_a_id === user.id
  const other = isFamilyA ? conversation.familyB : conversation.familyA

  return NextResponse.json({
    conversation: {
      id: conversation.id,
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
