'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PackagePlus, BookOpen, Shirt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { CONDITION_LABELS, GARMENT_LABELS } from '@/lib/schemas'
import { markSold, removeListing } from '@/lib/actions/listings'
import type { ListingWithDetails } from '@/types/database'

export default function MyListingsPage() {
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function load() {
    const res = await fetch('/api/my-listings')
    const data = await res.json()
    setListings(data.listings ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleMarkSold(id: string) {
    startTransition(async () => {
      const result = await markSold(id)
      if (result?.error) toast.error(result.error)
      else toast.success('Marcada como vendida')
      load()
    })
  }

  async function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeListing(id)
      if (result?.error) toast.error(result.error)
      else toast.success('Publicación eliminada')
      load()
    })
  }

  const active = listings.filter(l => l.status === 'active')
  const sold = listings.filter(l => l.status === 'sold')
  const removed = listings.filter(l => l.status === 'removed')

  if (loading) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis publicaciones</h1>
        <div className="flex gap-2">
          <Link href="/sell/book"><Button size="sm" variant="outline">+ Libro</Button></Link>
          <Link href="/sell/uniform"><Button size="sm" variant="outline">+ Uniforme</Button></Link>
        </div>
      </div>

      {listings.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <PackagePlus className="size-12 mx-auto mb-4 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="mb-4">Todavía no publicaste nada.</p>
          <Link href="/sell/book"><Button variant="outline">Publicar primer artículo</Button></Link>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activas ({active.length})</h2>
          <div className="space-y-3">
            {active.map(l => <ListingRow key={l.id} listing={l} onMarkSold={handleMarkSold} onRemove={handleRemove} pending={isPending} />)}
          </div>
        </section>
      )}

      {sold.length > 0 && (
        <section>
          <Separator className="mb-6" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vendidas ({sold.length})</h2>
          <div className="space-y-3">
            {sold.map(l => <ListingRow key={l.id} listing={l} pending={isPending} />)}
          </div>
        </section>
      )}

      {removed.length > 0 && (
        <section>
          <Separator className="mb-6" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Eliminadas ({removed.length})</h2>
          <div className="space-y-3 opacity-50">
            {removed.map(l => <ListingRow key={l.id} listing={l} pending={isPending} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ListingRow({
  listing,
  onMarkSold,
  onRemove,
  pending,
}: {
  listing: ListingWithDetails
  onMarkSold?: (id: string) => void
  onRemove?: (id: string) => void
  pending: boolean
}) {
  const isBook = listing.type === 'book'
  const TypeIcon = isBook ? BookOpen : Shirt
  const title = isBook
    ? listing.book_details?.title ?? 'Libro'
    : GARMENT_LABELS[listing.uniform_details?.garment_type ?? '']

  const statusColors: Record<string, string> = {
    active: 'bg-primary/10 text-primary',
    sold: 'bg-accent text-accent-foreground',
    removed: 'bg-muted text-muted-foreground',
  }
  const statusLabels: Record<string, string> = { active: 'Activa', sold: 'Vendida', removed: 'Eliminada' }

  return (
    <Card>
      <CardContent className="pt-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isBook ? 'default' : 'secondary'} className="text-xs gap-1">
                <TypeIcon className="size-3" />
              </Badge>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[listing.status]}`}>
                {statusLabels[listing.status]}
              </span>
            </div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{CONDITION_LABELS[listing.condition]}{listing.price != null ? ` · $${listing.price.toLocaleString('es-AR')}` : ''}</p>
          </div>
          {listing.status === 'sold' && (
            <Link href={`/rate/${listing.id}`}>
              <Button size="sm" variant="outline" className="text-xs shrink-0">Calificar</Button>
            </Link>
          )}
        </div>
      </CardContent>
      {listing.status === 'active' && (
        <CardFooter className="pt-0 pb-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkSold?.(listing.id)}
            disabled={pending}
            className="text-xs"
          >
            Marcar como vendida
          </Button>
          <Link href={`/listings/${listing.id}/edit`}>
            <Button size="sm" variant="outline" disabled={pending} className="text-xs">
              Editar
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove?.(listing.id)}
            disabled={pending}
            className="text-xs text-muted-foreground"
          >
            Eliminar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
