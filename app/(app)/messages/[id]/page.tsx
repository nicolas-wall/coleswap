'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, Send, Contact } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, cn } from '@/lib/utils'
import { sendMessage, markConversationRead } from '@/lib/actions/messages'
import { createClient } from '@/lib/supabase/client'

interface MyProfile {
  loginEmail: string
  phone: string | null
  contact_email: string | null
}

interface ThreadMessage {
  id: string
  body: string
  createdAt: string
  isMine: boolean
}

interface ConversationDetail {
  id: string
  otherParticipant: { id: string; displayName: string }
  messages: ThreadMessage[]
}

export default function ConversationPage() {
  const { id } = useParams()
  const conversationId = id as string
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  function refresh() {
    return fetch(`/api/messages/${conversationId}`)
      .then((r) => r.json())
      .then((d) => setConversation(d.conversation ?? null))
  }

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => setMyProfile({
        loginEmail: d.loginEmail ?? '',
        phone: d.profile?.phone ?? null,
        contact_email: d.profile?.contact_email ?? null,
      }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    markConversationRead(conversationId)

    const supabase = createClient()
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => { refresh(); markConversationRead(conversationId) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages.length])

  async function handleShareContact() {
    if (!myProfile) return
    const lines = [`Email: ${myProfile.loginEmail}`]
    if (myProfile.phone) lines.push(`Teléfono: ${myProfile.phone}`)
    if (myProfile.contact_email) lines.push(`Email de contacto: ${myProfile.contact_email}`)

    setSharing(true)
    setError('')
    const result = await sendMessage(conversationId, `Mis datos de contacto:\n${lines.join('\n')}`)
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      await refresh()
    }
    setSharing(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setSending(true)
    setError('')
    const result = await sendMessage(conversationId, text)
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setBody('')
      await refresh()
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (!conversation) return notFound()

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="shrink-0 space-y-2 pb-3 border-b">
        <Link href="/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" />
          Mensajes
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center size-9 rounded-full bg-muted text-muted-foreground shrink-0">
              <MessageCircle className="size-4" />
            </span>
            <p className="font-medium text-sm truncate">{conversation.otherParticipant.displayName}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 text-xs"
            onClick={handleShareContact}
            disabled={sharing || !myProfile}
          >
            <Contact className="size-3.5" />
            {sharing ? 'Compartiendo…' : 'Compartir mis datos'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {conversation.messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Empezá la conversación.</p>
        ) : (
          conversation.messages.map((m) => (
            <div key={m.id} className={cn('flex', m.isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                  m.isMine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn('text-[0.65rem] mt-1', m.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  {formatRelativeTime(m.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      <form onSubmit={handleSend} className="shrink-0 flex items-end gap-2 border-t pt-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e)
            }
          }}
          placeholder="Escribí un mensaje…"
          rows={1}
          maxLength={1000}
          className="flex-1 resize-none rounded-full border bg-background px-4 py-2.5 text-sm outline-none ring-1 ring-transparent focus-visible:ring-3 focus-visible:ring-ring/50 transition-shadow max-h-32"
        />
        <Button type="submit" size="icon" disabled={sending || !body.trim()} className="rounded-full shrink-0">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
