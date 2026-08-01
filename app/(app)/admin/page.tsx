'use client'

import { useEffect, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CONDITION_LABELS, GARMENT_LABELS } from '@/lib/schemas'
import { setFamilySuspended, adminRemoveListing } from '@/lib/actions/admin'
import type { Family, ListingWithDetails } from '@/types/database'

type AdminFamily = Pick<Family, 'id' | 'display_name' | 'phone' | 'email' | 'role' | 'suspended' | 'rating_avg' | 'rating_count' | 'created_at'>

export default function AdminPage() {
  const [families, setFamilies] = useState<AdminFamily[]>([])
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  async function load() {
    const res = await fetch('/api/admin')
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'No autorizado')
      setLoading(false)
      return
    }
    setFamilies(data.families ?? [])
    setListings(data.listings ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleToggleSuspend(familyId: string, suspended: boolean) {
    startTransition(async () => {
      await setFamilySuspended(familyId, suspended)
      load()
    })
  }

  function handleRemoveListing(listingId: string) {
    startTransition(async () => {
      await adminRemoveListing(listingId)
      load()
    })
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground">Cargando…</div>

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const activeListings = listings.filter((l) => l.status === 'active')

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Admin del colegio</h1>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Familias ({families.length})
        </h2>
        <div className="space-y-2">
          {families.map((f) => (
            <Card key={f.id}>
              <CardContent className="pt-4 pb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{f.display_name}</p>
                    {f.role === 'school_admin' && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                    {f.suspended && <Badge variant="destructive" className="text-xs">Suspendida</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{f.email} · {f.phone}</p>
                </div>
                {f.role !== 'school_admin' && (
                  <Button
                    size="sm"
                    variant={f.suspended ? 'outline' : 'ghost'}
                    disabled={isPending}
                    className="text-xs shrink-0"
                    onClick={() => handleToggleSuspend(f.id, !f.suspended)}
                  >
                    {f.suspended ? 'Reactivar' : 'Suspender'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Publicaciones activas ({activeListings.length})
        </h2>
        <div className="space-y-2">
          {activeListings.map((l) => {
            const isBook = l.type === 'book'
            const title = isBook
              ? l.book_details?.title ?? 'Libro'
              : GARMENT_LABELS[l.uniform_details?.garment_type ?? '']
            return (
              <Card key={l.id}>
                <CardContent className="pt-4 pb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={isBook ? 'default' : 'secondary'} className="text-xs">{isBook ? '📚' : '👕'}</Badge>
                      <p className="font-medium text-sm">{title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {CONDITION_LABELS[l.condition]} · {l.family.display_name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    className="text-xs text-muted-foreground shrink-0"
                    onClick={() => handleRemoveListing(l.id)}
                  >
                    Remover
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
