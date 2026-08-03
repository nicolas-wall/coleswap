'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Shirt, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { RatingStars } from '@/components/RatingStars'
import { CONDITION_LABELS, GARMENT_LABELS } from '@/lib/schemas'
import { startConversation } from '@/lib/actions/messages'
import type { ListingWithDetails } from '@/types/database'

export default function ListingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<ListingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(d => { setListing(d.listing); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function handleMessage() {
    setMessaging(true)
    setError('')
    const result = await startConversation(id as string)
    if ('error' in result && result.error) {
      setError(result.error)
      setMessaging(false)
    } else if ('conversationId' in result && result.conversationId) {
      router.push(`/messages/${result.conversationId}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="aspect-square w-full rounded-xl max-w-xs" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }
  if (!listing) return notFound()

  const isBook = listing.type === 'book'
  const TypeIcon = isBook ? BookOpen : Shirt

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/catalog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-3.5" />
        Volver al catálogo
      </Link>

      {listing.images && listing.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {listing.images.map((url) => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
              <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 150px" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <Badge variant={isBook ? 'default' : 'secondary'} className="gap-1">
            <TypeIcon className="size-3" />
            {isBook ? 'Libro' : 'Uniforme'}
          </Badge>
          <Badge variant="outline">{CONDITION_LABELS[listing.condition]}</Badge>
        </div>

        <h1 className="text-2xl font-bold">
          {isBook ? listing.book_details?.title : GARMENT_LABELS[listing.uniform_details?.garment_type ?? '']}
        </h1>

        {isBook && listing.book_details && (
          <div className="text-muted-foreground space-y-0.5">
            <p>{listing.book_details.author}</p>
            {listing.book_details.publisher && <p className="text-sm">{listing.book_details.publisher}</p>}
            <p className="text-sm">{listing.book_details.subject} · {listing.book_details.grade}</p>
            <p className="text-xs font-mono text-muted-foreground/60">ISBN: {listing.book_details.isbn}</p>
          </div>
        )}

        {!isBook && listing.uniform_details && (
          <div className="text-muted-foreground space-y-0.5">
            <p>Talle {listing.uniform_details.size} · {listing.uniform_details.gender}</p>
            {listing.uniform_details.color && <p className="text-sm">Color: {listing.uniform_details.color}</p>}
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-primary">
        {listing.price != null
          ? `$${listing.price.toLocaleString('es-AR')}`
          : <span className="text-muted-foreground text-xl font-semibold">Precio a consultar</span>}
      </div>

      {listing.notes && (
        <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 italic">{listing.notes}</p>
      )}

      <Separator />

      {/* Seller info */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{listing.family.display_name}</p>
              {listing.family.rating_avg != null ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RatingStars value={listing.family.rating_avg} size="sm" readonly />
                  <span className="text-xs text-muted-foreground">
                    {listing.family.rating_avg.toFixed(1)} ({listing.family.rating_count} calificación{listing.family.rating_count !== 1 ? 'es' : ''})
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sin calificaciones aún</p>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleMessage} disabled={messaging} variant="default" className="w-full gap-1.5">
            <MessageCircle className="size-4" />
            {messaging ? 'Abriendo chat…' : 'Enviar mensaje'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
