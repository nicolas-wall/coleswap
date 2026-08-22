'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ListingStatus } from '@/types/database'

/**
 * Acceso a las publicaciones propias desde el perfil, con el conteo por estado
 * para que bajar o reactivar algo esté a un toque y no escondido en el menú.
 */
export function MyListingsCard() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    fetch('/api/my-listings')
      .then((r) => r.json())
      .then((d) => {
        const tally: Record<string, number> = {}
        for (const l of (d.listings ?? []) as { status: ListingStatus }[]) {
          tally[l.status] = (tally[l.status] ?? 0) + 1
        }
        setCounts(tally)
      })
      .catch(() => setCounts({}))
  }, [])

  const summary = counts
    ? [
        counts.active ? `${counts.active} activa${counts.active !== 1 ? 's' : ''}` : null,
        counts.paused ? `${counts.paused} pausada${counts.paused !== 1 ? 's' : ''}` : null,
        counts.sold ? `${counts.sold} vendida${counts.sold !== 1 ? 's' : ''}` : null,
      ].filter(Boolean).join(' · ')
    : ''

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="size-4" strokeWidth={1.75} />
          Mis publicaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {counts === null ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <p className="text-sm text-muted-foreground">
            {summary || 'Todavía no publicaste nada.'}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Desde ahí pausás lo que ya no tenés a mano —sale del catálogo pero no se borra—
          o lo eliminás definitivamente.
        </p>
        <Link href="/my-listings" className="block">
          <Button variant="outline" className="w-full">Ver y administrar</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
