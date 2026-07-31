'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RatingStars } from '@/components/RatingStars'
import { CONDITION_LABELS, GARMENT_LABELS } from '@/lib/schemas'
import { contactSeller } from '@/lib/actions/contacts'
import type { ListingWithDetails } from '@/types/database'

export default function ListingDetailPage() {
  const { id } = useParams()
  const [listing, setListing] = useState<ListingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [contactInfo, setContactInfo] = useState<{ display_name: string; phone: string; email: string } | null>(null)
  const [contacting, setContacting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(d => { setListing(d.listing); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function handleContact() {
    setContacting(true)
    setError('')
    const result = await contactSeller(id as string)
    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('contact' in result && result.contact) {
      setContactInfo(result.contact as { display_name: string; phone: string; email: string })
    }
    setContacting(false)
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground">Cargando…</div>
  if (!listing) return notFound()

  const isBook = listing.type === 'book'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/catalog" className="text-sm text-muted-foreground hover:text-foreground">← Volver al catálogo</Link>

      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <Badge variant={isBook ? 'default' : 'secondary'}>{isBook ? '📚 Libro' : '👕 Uniforme'}</Badge>
          <Badge variant="outline">{CONDITION_LABELS[listing.condition]}</Badge>
        </div>

        <h1 className="text-2xl font-bold">
          {isBook ? listing.book_details?.title : GARMENT_LABELS[listing.uniform_details?.garment_type ?? '']}
        </h1>

        {isBook && listing.book_details && (
          <div className="text-muted-foreground space-y-0.5">
            <p>{listing.book_details.author}</p>
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

      <div className="text-3xl font-bold">
        {listing.price != null
          ? `$${listing.price.toLocaleString('es-AR')}`
          : <span className="text-muted-foreground text-xl">Precio a consultar</span>}
      </div>

      {listing.notes && (
        <p className="text-sm text-muted-foreground border-l-2 pl-3 italic">{listing.notes}</p>
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

          {contactInfo ? (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              <p className="font-medium text-green-700 dark:text-green-400">¡Datos de contacto revelados!</p>
              <p>📱 <a href={`tel:${contactInfo.phone}`} className="underline">{contactInfo.phone}</a></p>
              <p>✉️ <a href={`mailto:${contactInfo.email}`} className="underline">{contactInfo.email}</a></p>
              <p className="text-xs text-muted-foreground mt-2">Coordiná la entrega en la puerta del colegio.</p>
            </div>
          ) : (
            <Button onClick={handleContact} disabled={contacting} className="w-full">
              {contacting ? 'Obteniendo datos…' : 'Ver datos de contacto del vendedor'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
