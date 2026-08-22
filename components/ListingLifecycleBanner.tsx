'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { BookOpen, Shirt, Clock, PauseCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GARMENT_LABELS } from '@/lib/schemas'
import { daysUntilAutoPause, relativeAge } from '@/lib/lifecycle'
import { confirmListingActive, pauseListing, reactivateListing } from '@/lib/actions/listings'
import type { GarmentType, ListingType } from '@/types/database'

interface LifecycleListing {
  id: string
  type: ListingType
  status: 'active' | 'paused'
  renewed_at: string
  paused_at: string | null
  book_details: { title: string } | null
  uniform_details: { garment_type: GarmentType } | null
}

function titleOf(listing: LifecycleListing): string {
  return listing.type === 'book'
    ? listing.book_details?.title ?? 'Libro'
    : GARMENT_LABELS[listing.uniform_details?.garment_type ?? ''] ?? 'Uniforme'
}

/**
 * Le pregunta al dueño por las publicaciones que envejecieron y le deja
 * confirmarlas o bajarlas sin salir de donde está. Se muestra en Catálogo,
 * Mis publicaciones y Perfil; si no hay nada que responder, no ocupa lugar.
 */
export function ListingLifecycleBanner({ className }: { className?: string }) {
  const [stale, setStale] = useState<LifecycleListing[]>([])
  const [autoPaused, setAutoPaused] = useState<LifecycleListing[]>([])
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch('/api/my-listings/stale')
      .then((r) => r.json())
      .then((d) => {
        setStale(d.stale ?? [])
        setAutoPaused(d.autoPaused ?? [])
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  function run(
    id: string,
    action: (id: string) => Promise<{ error?: string; success?: boolean }>,
    okMessage: string
  ) {
    startTransition(async () => {
      const result = await action(id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(okMessage)
      setStale((prev) => prev.filter((l) => l.id !== id))
      setAutoPaused((prev) => prev.filter((l) => l.id !== id))
    })
  }

  if (!loaded || (stale.length === 0 && autoPaused.length === 0)) return null

  return (
    <div className={cn('space-y-3', className)}>
      {stale.length > 0 && (
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Clock className="size-4 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">
                {stale.length === 1
                  ? '¿Seguís teniendo esto?'
                  : `¿Seguís teniendo estas ${stale.length} cosas?`}
              </h2>
              <p className="text-xs text-muted-foreground">
                Llevan más de 45 días publicadas. Confirmá las que sigan disponibles;
                las que no confirmes se bajan solas del catálogo.
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {stale.map((listing) => {
              const left = daysUntilAutoPause(listing)
              return (
                <li
                  key={listing.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-background border px-3 py-2"
                >
                  {listing.type === 'book' ? (
                    <BookOpen className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                  ) : (
                    <Shirt className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{titleOf(listing)}</p>
                    <p className="text-xs text-muted-foreground">
                      Publicada {relativeAge(listing.renewed_at)} ·{' '}
                      {left === 0 ? 'se baja hoy' : `se baja en ${left} día${left !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      disabled={isPending}
                      className="text-xs"
                      onClick={() => run(listing.id, confirmListingActive, 'Confirmada por 45 días más')}
                    >
                      Sí, sigue
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      className="text-xs"
                      onClick={() => run(listing.id, pauseListing, 'Publicación pausada')}
                    >
                      Bajar
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {autoPaused.length > 0 && (
        <section className="rounded-xl border bg-muted/40 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <PauseCircle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold">
                {autoPaused.length === 1
                  ? 'Pausamos una publicación tuya'
                  : `Pausamos ${autoPaused.length} publicaciones tuyas`}
              </h2>
              <p className="text-xs text-muted-foreground">
                Pasaron 60 días sin confirmar, así que salieron del catálogo. No se
                borró nada: si todavía las tenés, reactivalas.
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {autoPaused.map((listing) => (
              <li
                key={listing.id}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-background border px-3 py-2"
              >
                {listing.type === 'book' ? (
                  <BookOpen className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                ) : (
                  <Shirt className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                )}
                <p className="text-sm font-medium truncate min-w-0 flex-1">{titleOf(listing)}</p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  className="text-xs shrink-0"
                  onClick={() => run(listing.id, reactivateListing, 'Volvió al catálogo')}
                >
                  Reactivar
                </Button>
              </li>
            ))}
          </ul>

          <Link
            href="/my-listings"
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Ver todas mis publicaciones
          </Link>
        </section>
      )}
    </div>
  )
}
