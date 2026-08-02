import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ConversationRead, Message } from '@/types/database'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 })

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`) as { data: { id: string }[] | null; error: unknown }

  const ids = (conversations ?? []).map((c) => c.id)
  if (ids.length === 0) return NextResponse.json({ count: 0 })

  const { data: reads } = await supabase
    .from('conversation_reads')
    .select('conversation_id, last_read_at')
    .eq('family_id', user.id)
    .in('conversation_id', ids) as { data: Pick<ConversationRead, 'conversation_id' | 'last_read_at'>[] | null; error: unknown }

  const readMap = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]))

  const { data: messages } = await supabase
    .from('messages')
    .select('conversation_id, sender_id, created_at')
    .in('conversation_id', ids)
    .neq('sender_id', user.id) as { data: Pick<Message, 'conversation_id' | 'sender_id' | 'created_at'>[] | null; error: unknown }

  const count = (messages ?? []).filter((m) => {
    const lastRead = readMap.get(m.conversation_id)
    return !lastRead || m.created_at > lastRead
  }).length

  return NextResponse.json({ count })
}
