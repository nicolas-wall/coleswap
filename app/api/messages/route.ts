import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Family, Message, ConversationRead } from '@/types/database'

interface ConversationRow {
  id: string
  family_a_id: string
  family_b_id: string
  last_message_at: string
  familyA: Pick<Family, 'id' | 'display_name'> | null
  familyB: Pick<Family, 'id' | 'display_name'> | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ conversations: [] }, { status: 401 })

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, family_a_id, family_b_id, last_message_at,
      familyA:families!conversations_family_a_id_fkey(id, display_name),
      familyB:families!conversations_family_b_id_fkey(id, display_name)
    `)
    .or(`family_a_id.eq.${user.id},family_b_id.eq.${user.id}`)
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
    const isFamilyA = c.family_a_id === user.id
    const other = isFamilyA ? c.familyB : c.familyA
    const msgs = byConversation.get(c.id) ?? []
    const lastMessage = msgs[msgs.length - 1] ?? null
    const lastRead = readMap.get(c.id)
    const unreadCount = msgs.filter((m) => m.sender_id !== user.id && (!lastRead || m.created_at > lastRead)).length

    return {
      id: c.id,
      otherParticipant: { id: other?.id ?? '', displayName: other?.display_name ?? '' },
      lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.created_at, isMine: lastMessage.sender_id === user.id } : null,
      lastMessageAt: c.last_message_at,
      unreadCount,
    }
  })

  return NextResponse.json({ conversations: result })
}
