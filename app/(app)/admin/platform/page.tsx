'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CrestUploader } from '@/components/CrestUploader'
import { createSchool, updateSchool, setSchoolAdminRole } from '@/lib/actions/platform'
import { generateInvitation } from '@/lib/actions/invitations'
import type { School, Family } from '@/types/database'

type AdminFamily = Pick<Family, 'id' | 'school_id' | 'display_name' | 'email' | 'role' | 'approved'>

export default function PlatformAdminPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [families, setFamilies] = useState<AdminFamily[]>([])
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState('')
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [city, setCity] = useState('')
  const [slug, setSlug] = useState('')
  const [crestUrl, setCrestUrl] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const [codesBySchool, setCodesBySchool] = useState<Record<string, string>>({})

  async function load() {
    const res = await fetch('/api/platform')
    const data = await res.json()
    if (!res.ok) {
      setAccessError(data.error ?? 'No autorizado')
      setLoading(false)
      return
    }
    setSchools(data.schools ?? [])
    setFamilies(data.families ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setCreating(true)
    const formData = new FormData()
    formData.set('name', name)
    if (shortName) formData.set('shortName', shortName)
    formData.set('city', city)
    formData.set('slug', slug)
    if (crestUrl) formData.set('crestUrl', crestUrl)
    const result = await createSchool(formData)
    if (result?.error) {
      setFormError(result.error)
    } else {
      toast.success('Colegio creado')
      setName('')
      setShortName('')
      setCity('')
      setSlug('')
      setCrestUrl(null)
      load()
    }
    setCreating(false)
  }

  async function handleGenerateCode(schoolId: string, options: { multiUse: boolean; expiresInDays?: number }) {
    const result = await generateInvitation(schoolId, options)
    if (result?.success && result.code) {
      setCodesBySchool((prev) => ({ ...prev, [schoolId]: result.code }))
      toast.success('Código generado')
    } else if (result?.error) {
      toast.error(result.error)
    }
  }

  function handleToggleAdmin(familyId: string, isAdmin: boolean) {
    startTransition(async () => {
      const result = await setSchoolAdminRole(familyId, isAdmin)
      if (result?.error) toast.error(result.error)
      else toast.success(isAdmin ? 'Ahora es admin del colegio' : 'Rol de admin removido')
      load()
    })
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (accessError) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <Alert variant="destructive">
          <AlertDescription>{accessError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-semibold">Admin de plataforma</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear colegio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Colegio San Martín" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Buenos Aires" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shortName">Nombre corto — opcional (para el encabezado)</Label>
              <Input id="shortName" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="Ej: San Martín" maxLength={30} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="Ej: san-martin" required />
            </div>
            <div className="space-y-1.5">
              <Label>Escudo — opcional</Label>
              <CrestUploader onUploaded={setCrestUrl} />
            </div>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={creating}>{creating ? 'Creando…' : 'Crear colegio'}</Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Colegios ({schools.length})
        </h2>
        {schools.map((school) => (
          <SchoolCard
            key={school.id}
            school={school}
            families={families.filter((f) => f.school_id === school.id)}
            isPending={isPending}
            generatedCode={codesBySchool[school.id]}
            onGenerateCode={(options) => handleGenerateCode(school.id, options)}
            onToggleAdmin={handleToggleAdmin}
            onSaved={load}
          />
        ))}
      </section>
    </div>
  )
}

function SchoolCard({
  school,
  families,
  isPending,
  generatedCode,
  onGenerateCode,
  onToggleAdmin,
  onSaved,
}: {
  school: School
  families: AdminFamily[]
  isPending: boolean
  generatedCode?: string
  onGenerateCode: (options: { multiUse: boolean; expiresInDays?: number }) => void
  onToggleAdmin: (familyId: string, isAdmin: boolean) => void
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(school.name)
  const [shortName, setShortName] = useState(school.short_name ?? '')
  const [city, setCity] = useState(school.city)
  const [slug, setSlug] = useState(school.slug)
  const [crestUrl, setCrestUrl] = useState<string | null>(school.crest_url)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [multiUse, setMultiUse] = useState(false)
  const [expiryDays, setExpiryDays] = useState('7')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const formData = new FormData()
    formData.set('name', name)
    if (shortName) formData.set('shortName', shortName)
    formData.set('city', city)
    formData.set('slug', slug)
    if (crestUrl) formData.set('crestUrl', crestUrl)
    const result = await updateSchool(school.id, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      toast.success('Colegio actualizado')
      setEditing(false)
      onSaved()
    }
    setSaving(false)
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre corto — para el encabezado</Label>
              <Input value={shortName} onChange={(e) => setShortName(e.target.value)} maxLength={30} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} required />
            </div>
            <div className="space-y-1.5">
              <Label>Escudo</Label>
              <CrestUploader onUploaded={setCrestUrl} />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {school.crest_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.crest_url} alt="" className="w-10 h-10 rounded object-cover border" />
            )}
            <div>
              <p className="font-medium">
                {school.name}
                {school.short_name && <span className="text-xs text-muted-foreground ml-2">({school.short_name})</span>}
              </p>
              <p className="text-xs text-muted-foreground">{school.city} · {school.slug}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="text-xs shrink-0" onClick={() => setEditing(true)}>
            Editar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="radio" checked={!multiUse} onChange={() => setMultiUse(false)} />
            Una familia
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <input type="radio" checked={multiUse} onChange={() => setMultiUse(true)} />
            Varias, con vencimiento
          </label>
          {multiUse && (
            <select value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className="text-xs border rounded-md px-2 py-1">
              <option value="1">1 día</option>
              <option value="3">3 días</option>
              <option value="7">7 días</option>
              <option value="30">30 días</option>
            </select>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => onGenerateCode({ multiUse, expiresInDays: multiUse ? Number(expiryDays) : undefined })}
          >
            Generar código
          </Button>
          {generatedCode && (
            <code className="text-xs bg-muted px-2 py-1 rounded">{generatedCode}</code>
          )}
        </div>

        {families.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            {families.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm py-1">
                <span>
                  {f.display_name} <span className="text-xs text-muted-foreground">{f.email}</span>
                  {f.role === 'school_admin' && <Badge variant="secondary" className="text-xs ml-2">Admin</Badge>}
                  {!f.approved && <Badge variant="outline" className="text-xs ml-2">Pendiente</Badge>}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  className="text-xs"
                  onClick={() => onToggleAdmin(f.id, f.role !== 'school_admin')}
                >
                  {f.role === 'school_admin' ? 'Quitar admin' : 'Hacer admin'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
