'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { PackagePlus, BookOpen, Shirt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CONDITION_LABELS, GARMENT_LABELS } from '@/lib/schemas'
import {
  markSold,
  removeListing,
  pauseListing,
  reactivateListing,
  confirmListingActive,
} from '@/lib/actions/listings'
import { needsRenewal, daysUntilAutoPause, relativeAge } from '@/lib/lifecycle'
import type { ListingWithDetails } from '@/types/database'

export default function MyListingsPage() {
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // fetchListings no toca estado a propósito: así el efecto puede llamarla y
  // actualizar en el callback, que es el patrón que espera React (y lo que
  // pedía react-hooks/set-state-in-effect).
  const fetchListings = useCallback(async (signal?: AbortSignal) => {
    const res = await fetch('/api/my-listings', { signal })
    const data = await res.json()
    return (data.listings ?? []) as ListingWithDetails[]
  }, [])

  const load = useCallback(() => {
    fetchListings().then(setListings).catch(() => {})
  }, [fetchListings])

  useEffect(() => {
    const ac = new AbortController()
    fetchListings(ac.signal)
      .then((l) => {
        setListings(l)
        setLoading(false)
      })
      .catch(() => {})
    return () => ac.abort()
  }, [fetchListings])

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

  async function handlePause(id: string) {
    startTransition(async () => {
      const result = await pauseListing(id)
      if (result?.error) toast.error(result.error)
      else toast.success('Pausada. Se guarda todo y la reactivás cuando quieras.')
      load()
    })
  }

  async function handleReactivate(id: string) {
    startTransition(async () => {
      const result = await reactivateListing(id)
      if (result?.error) toast.error(result.error)
      else toast.success('Volvió al catálogo')
      load()
    })
  }

  async function handleConfirm(id: string) {
    startTransition(async () => {
      const result = await confirmListingActive(id)
      if (result?.error) toast.error(result.error)
      else toast.success('Confirmada por 45 días más')
      load()
    })
  }

  const active = listings.filter(l => l.status === 'active')
  const paused = listings.filter(l => l.status === 'paused')
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
        <h1 className="font-display text-3xl font-semibold">Mis publicaciones</h1>
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
            {active.map(l => (
              <ListingRow
                key={l.id}
                listing={l}
                onMarkSold={handleMarkSold}
                onRemove={handleRemove}
                onPause={handlePause}
                onConfirm={handleConfirm}
                pending={isPending}
              />
            ))}
          </div>
        </section>
      )}

      {paused.length > 0 && (
        <section>
          <Separator className="mb-6" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pausadas ({paused.length})</h2>
          <p className="text-xs text-muted-foreground mb-3">
            No aparecen en el catálogo, pero no se borró nada. Reactivalas cuando quieras.
          </p>
          <div className="space-y-3">
            {paused.map(l => (
              <ListingRow
                key={l.id}
                listing={l}
                onRemove={handleRemove}
                onReactivate={handleReactivate}
                pending={isPending}
              />
            ))}
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
  onPause,
  onReactivate,
  onConfirm,
  pending,
}: {
  listing: ListingWithDetails
  onMarkSold?: (id: string) => void
  onRemove?: (id: string) => void
  onPause?: (id: string) => void
  onReactivate?: (id: string) => void
  onConfirm?: (id: string) => void
  pending: boolean
}) {
  const isBook = listing.type === 'book'
  const TypeIcon = isBook ? BookOpen : Shirt
  const title = isBook
    ? listing.book_details?.title ?? 'Libro'
    : GARMENT_LABELS[listing.uniform_details?.garment_type ?? '']

  const statusColors: Record<string, string> = {
    active: 'bg-primary/10 text-primary',
    paused: 'bg-muted text-muted-foreground',
    sold: 'bg-accent text-accent-foreground',
    removed: 'bg-muted text-muted-foreground',
  }
  const statusLabels: Record<string, string> = {
    active: 'Activa',
    paused: 'Pausada',
    sold: 'Vendida',
    removed: 'Eliminada',
  }
  const stale = needsRenewal(listing)
  const daysLeft = daysUntilAutoPause(listing)

  return (
    <Card>
      <CardContent className="pt-4 pb-2">
        <div className="flex items-start gap-3">
          <div className="relative size-14 shrink-0 rounded-lg bg-muted overflow-hidden">
            {listing.images?.[0] ? (
              <Image src={listing.images[0]} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <TypeIcon className="size-6" strokeWidth={1.25} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isBook ? 'default' : 'secondary'} className="text-xs gap-1">
                <TypeIcon className="size-3" />
              </Badge>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[listing.status]}`}>
                {statusLabels[listing.status]}
              </span>
            </div>
            <p className="font-medium text-sm truncate">{title}</p>
            <p className="text-xs text-muted-foreground">{CONDITION_LABELS[listing.condition]}{listing.price != null ? ` · $${listing.price.toLocaleString('es-AR')}` : ''}</p>
            {(listing.status === 'active' || listing.status === 'paused') && (
              <p className="text-xs text-muted-foreground/70">Publicada {relativeAge(listing.renewed_at)}</p>
            )}
          </div>

          {listing.status === 'sold' && (
            <Link href={`/rate/${listing.id}`}>
              <Button size="sm" variant="outline" className="text-xs shrink-0">Calificar</Button>
            </Link>
          )}
        </div>

        {stale && (
          <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 flex flex-wrap items-center gap-2">
            <p className="text-xs flex-1 min-w-[10rem]">
              <span className="font-medium">¿La seguís teniendo?</span>{' '}
              <span className="text-muted-foreground">
                {daysLeft === 0
                  ? 'Se baja hoy si no confirmás.'
                  : `Se baja sola en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}.`}
              </span>
            </p>
            <Button
              size="sm"
              disabled={pending}
              className="text-xs shrink-0"
              onClick={() => onConfirm?.(listing.id)}
            >
              Sí, sigue disponible
            </Button>
          </div>
        )}
      </CardContent>
      {listing.status === 'active' && (
        <CardFooter className="pt-0 pb-3 gap-2 flex-wrap">
          <ConfirmDialog
            trigger={<Button size="sm" variant="outline" disabled={pending} className="text-xs" />}
            title="¿Marcar como vendida?"
            description="Se saca del catálogo y después vas a poder calificar a la familia que la compró."
            confirmLabel="Sí, marcar vendida"
            onConfirm={() => onMarkSold?.(listing.id)}
          >
            Marcar como vendida
          </ConfirmDialog>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            className="text-xs"
            onClick={() => onPause?.(listing.id)}
          >
            Pausar
          </Button>
          <Link href={`/listings/${listing.id}/edit`}>
            <Button size="sm" variant="outline" disabled={pending} className="text-xs">
              Editar
            </Button>
          </Link>
          <ConfirmDialog
            trigger={<Button size="sm" variant="ghost" disabled={pending} className="text-xs text-muted-foreground" />}
            title="¿Eliminar esta publicación?"
            description="Se borra junto con sus fotos y no se puede deshacer. Si solo querés sacarla del catálogo por un tiempo, usá Pausar."
            confirmLabel="Eliminar"
            destructive
            onConfirm={() => onRemove?.(listing.id)}
          >
            Eliminar
          </ConfirmDialog>
        </CardFooter>
      )}

      {listing.status === 'paused' && (
        <CardFooter className="pt-0 pb-3 gap-2 flex-wrap">
          <Button
            size="sm"
            disabled={pending}
            className="text-xs"
            onClick={() => onReactivate?.(listing.id)}
          >
            Reactivar
          </Button>
          <Link href={`/listings/${listing.id}/edit`}>
            <Button size="sm" variant="outline" disabled={pending} className="text-xs">
              Editar
            </Button>
          </Link>
          <ConfirmDialog
            trigger={<Button size="sm" variant="ghost" disabled={pending} className="text-xs text-muted-foreground" />}
            title="¿Eliminar esta publicación?"
            description="Se borra junto con sus fotos y no se puede deshacer."
            confirmLabel="Eliminar"
            destructive
            onConfirm={() => onRemove?.(listing.id)}
          >
            Eliminar
          </ConfirmDialog>
        </CardFooter>
      )}
    </Card>
  )
}
