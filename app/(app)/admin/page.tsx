'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BookOpen, Shirt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CONDITION_LABELS, GARMENT_LABELS } from '@/lib/schemas'
import { setFamilySuspended, adminRemoveListing, deleteFamily, approveFamily, rejectFamily } from '@/lib/actions/admin'
import { generateInvitation } from '@/lib/actions/invitations'
import type { Family, ListingWithDetails } from '@/types/database'

type AdminFamily = Pick<Family, 'id' | 'display_name' | 'phone' | 'email' | 'role' | 'suspended' | 'approved' | 'joined_via_code' | 'rating_avg' | 'rating_count' | 'created_at'>
type AdminInvitation = { id: string; code: string; multi_use: boolean; expires_at: string | null; used_by: string | null; created_at: string }
type Confirming = { id: string; type: 'suspend' | 'delete' } | null

export default function AdminPage() {
  const [schoolId, setSchoolId] = useState('')
  const [families, setFamilies] = useState<AdminFamily[]>([])
  const [listings, setListings] = useState<ListingWithDetails[]>([])
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState<Confirming>(null)

  const [multiUse, setMultiUse] = useState(false)
  const [expiryDays, setExpiryDays] = useState('7')
  const [generating, setGenerating] = useState(false)
  const [latestCode, setLatestCode] = useState('')

  async function load() {
    const res = await fetch('/api/admin')
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'No autorizado')
      setLoading(false)
      return
    }
    setSchoolId(data.schoolId ?? '')
    setFamilies(data.families ?? [])
    setListings(data.listings ?? [])
    setInvitations(data.invitations ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleToggleSuspend(familyId: string, suspended: boolean) {
    setConfirming(null)
    startTransition(async () => {
      const result = await setFamilySuspended(familyId, suspended)
      if (result?.error) toast.error(result.error)
      else toast.success(suspended ? 'Familia suspendida' : 'Familia reactivada')
      load()
    })
  }

  function handleDeleteFamily(familyId: string) {
    setConfirming(null)
    startTransition(async () => {
      const result = await deleteFamily(familyId)
      if (result?.error) toast.error(result.error)
      else toast.success('Familia eliminada')
      load()
    })
  }

  function handleApprove(familyId: string) {
    startTransition(async () => {
      const result = await approveFamily(familyId)
      if (result?.error) toast.error(result.error)
      else toast.success('Familia aprobada')
      load()
    })
  }

  function handleReject(familyId: string) {
    startTransition(async () => {
      const result = await rejectFamily(familyId)
      if (result?.error) toast.error(result.error)
      else toast.success('Solicitud rechazada')
      load()
    })
  }

  function handleRemoveListing(listingId: string) {
    startTransition(async () => {
      const result = await adminRemoveListing(listingId)
      if (result?.error) toast.error(result.error)
      else toast.success('Publicación removida')
      load()
    })
  }

  async function handleGenerate() {
    setGenerating(true)
    setLatestCode('')
    const result = await generateInvitation(schoolId, {
      multiUse,
      expiresInDays: multiUse ? Number(expiryDays) : undefined,
    })
    if (result?.error) {
      toast.error(result.error)
    } else if (result?.code) {
      setLatestCode(result.code)
      toast.success('Código generado')
      load()
    }
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-56" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

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
  const pendingFamilies = families.filter((f) => !f.approved)
  const activeFamilies = families.filter((f) => f.approved)

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Admin del colegio</h1>

      {pendingFamilies.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Solicitudes pendientes ({pendingFamilies.length})
          </h2>
          <div className="space-y-2">
            {pendingFamilies.map((f) => (
              <Card key={f.id} className="border-accent">
                <CardContent className="pt-4 pb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{f.display_name}</p>
                    <p className="text-xs text-muted-foreground">{f.email} · {f.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" disabled={isPending} className="text-xs" onClick={() => handleApprove(f.id)}>
                      Aprobar
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isPending} className="text-xs text-destructive" onClick={() => handleReject(f.id)}>
                      Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Códigos de invitación
        </h2>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={!multiUse} onChange={() => setMultiUse(false)} />
                Para una familia
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={multiUse} onChange={() => setMultiUse(true)} />
                Para varias, con vencimiento
              </label>
              {multiUse && (
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1"
                >
                  <option value="1">Vence en 1 día</option>
                  <option value="3">Vence en 3 días</option>
                  <option value="7">Vence en 7 días</option>
                  <option value="30">Vence en 30 días</option>
                </select>
              )}
              <Button size="sm" variant="outline" disabled={generating} onClick={handleGenerate}>
                {generating ? 'Generando…' : 'Generar código'}
              </Button>
              {latestCode && <code className="text-xs bg-muted px-2 py-1 rounded">{latestCode}</code>}
            </div>

            {invitations.length > 0 && (
              <div className="space-y-1 pt-2 border-t text-sm">
                {invitations.map((inv) => {
                  const expired = inv.expires_at && new Date(inv.expires_at) < new Date()
                  const status = inv.multi_use
                    ? (expired ? 'Vencido' : 'Multiuso, vigente')
                    : (inv.used_by ? 'Usado' : 'Sin usar')
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-1">
                      <code className="text-xs">{inv.code}</code>
                      <span className="text-xs text-muted-foreground">{status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Familias ({activeFamilies.length})
        </h2>
        <div className="space-y-2">
          {activeFamilies.map((f) => (
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
                  <div className="flex items-center gap-2 shrink-0">
                    {confirming?.id === f.id && confirming.type === 'suspend' ? (
                      <>
                        <span className="text-xs text-muted-foreground">
                          {f.suspended ? '¿Reactivar?' : '¿Suspender?'}
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          className="text-xs"
                          onClick={() => handleToggleSuspend(f.id, !f.suspended)}
                        >
                          Sí, confirmar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => setConfirming(null)}>
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant={f.suspended ? 'outline' : 'ghost'}
                        disabled={isPending}
                        className="text-xs"
                        onClick={() => setConfirming({ id: f.id, type: 'suspend' })}
                      >
                        {f.suspended ? 'Reactivar' : 'Suspender'}
                      </Button>
                    )}

                    {f.suspended && (
                      confirming?.id === f.id && confirming.type === 'delete' ? (
                        <>
                          <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isPending}
                            className="text-xs"
                            onClick={() => handleDeleteFamily(f.id)}
                          >
                            Sí, eliminar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setConfirming(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          className="text-xs text-destructive"
                          onClick={() => setConfirming({ id: f.id, type: 'delete' })}
                        >
                          Eliminar
                        </Button>
                      )
                    )}
                  </div>
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
            const TypeIcon = isBook ? BookOpen : Shirt
            const title = isBook
              ? l.book_details?.title ?? 'Libro'
              : GARMENT_LABELS[l.uniform_details?.garment_type ?? '']
            return (
              <Card key={l.id}>
                <CardContent className="pt-4 pb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={isBook ? 'default' : 'secondary'} className="text-xs">
                        <TypeIcon className="size-3" />
                      </Badge>
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
