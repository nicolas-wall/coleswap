'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface ConversationSummary {
  id: string
  otherParticipant: { id: string; displayName: string }
  lastMessage: { body: string; createdAt: string; isMine: boolean } | null
  lastMessageAt: string
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function refresh() {
      fetch('/api/messages')
        .then((r) => r.json())
        .then((d) => setConversations(d.conversations ?? []))
        .finally(() => setLoading(false))
    }

    refresh()

    const supabase = createClient()
    const channel = supabase
      .channel('messages-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <h1 className="text-xl font-bold mb-4">Mensajes</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Mensajes</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageCircle className="size-10 mx-auto mb-3 opacity-40" />
          <p>Todavía no tenés conversaciones.</p>
          <p className="text-sm mt-1">Escribile a alguien desde cualquier publicación.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50',
                  c.unreadCount > 0 && 'bg-accent/30 border-accent'
                )}
              >
                <span className="inline-flex items-center justify-center size-10 rounded-full bg-muted text-muted-foreground shrink-0">
                  <MessageCircle className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{c.otherParticipant.displayName}</p>
                    <span className="text-[0.7rem] text-muted-foreground shrink-0">{formatRelativeTime(c.lastMessageAt)}</span>
                  </div>
                  {c.lastMessage && (
                    <p className={cn('text-sm truncate mt-0.5', c.unreadCount > 0 ? 'font-medium' : 'text-muted-foreground')}>
                      {c.lastMessage.isMine && 'Vos: '}{c.lastMessage.body}
                    </p>
                  )}
                </div>
                {c.unreadCount > 0 && (
                  <span className="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
