'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function MessagesBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    function refresh() {
      fetch('/api/messages/unread-count')
        .then((r) => r.json())
        .then((d) => { if (!cancelled) setCount(d.count ?? 0) })
        .catch(() => {})
    }

    refresh()

    const supabase = createClient()
    const channel = supabase
      .channel('messages-bell')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_reads' }, refresh)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Link
      href="/messages"
      aria-label="Mensajes"
      className="relative shrink-0 p-2 rounded-full hover:bg-primary-foreground/10 transition-colors"
    >
      <MessageCircle className="size-5" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-destructive text-[0.6rem] font-semibold text-white leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
