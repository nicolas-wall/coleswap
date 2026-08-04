'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    function refresh() {
      fetch('/api/messages')
        .then((r) => {
          if (!r.ok) throw new Error('fetch failed')
          return r.json()
        })
        .then((d) => { setConversations(d.conversations ?? []); setFailed(false) })
        // Sin esto, una caída del servidor se veía igual que "no tenés mensajes"
        .catch(() => setFailed(true))
        .finally(() => setLoading(false))
    }

    refresh()

    const supabase = createClient()
    const channel = supabase
      .channel('messages-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [reloadKey])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <h1 className="font-display text-2xl font-semibold mb-4">Mensajes</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-4">Mensajes</h1>

      {failed ? (
        <div className="text-center py-16 text-muted-foreground">
          <WifiOff className="size-10 mx-auto mb-3 opacity-40" />
          <p>No pudimos cargar tus mensajes.</p>
          <p className="text-sm mt-1">Puede ser un problema de conexión.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setLoading(true); setReloadKey((k) => k + 1) }}>
            Reintentar
          </Button>
        </div>
      ) : conversations.length === 0 ? (
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
