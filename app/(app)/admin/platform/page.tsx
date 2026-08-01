'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CrestUploader } from '@/components/CrestUploader'
import { createSchool, generateInvitation, setSchoolAdminRole } from '@/lib/actions/platform'
import type { School, Family } from '@/types/database'

type AdminFamily = Pick<Family, 'id' | 'school_id' | 'display_name' | 'email' | 'role'>

export default function PlatformAdminPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [families, setFamilies] = useState<AdminFamily[]>([])
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState('')
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
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
    formData.set('city', city)
    formData.set('slug', slug)
    if (crestUrl) formData.set('crestUrl', crestUrl)
    const result = await createSchool(formData)
    if (result?.error) {
      setFormError(result.error)
    } else {
      setName('')
      setCity('')
      setSlug('')
      setCrestUrl(null)
      load()
    }
    setCreating(false)
  }

  async function handleGenerateCode(schoolId: string) {
    const result = await generateInvitation(schoolId)
    if (result?.success && result.code) {
      setCodesBySchool((prev) => ({ ...prev, [schoolId]: result.code }))
    }
  }

  function handleToggleAdmin(familyId: string, isAdmin: boolean) {
    startTransition(async () => {
      await setSchoolAdminRole(familyId, isAdmin)
      load()
    })
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground">Cargando…</div>

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
      <h1 className="text-2xl font-bold">Admin de plataforma</h1>

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
        {schools.map((school) => {
          const schoolFamilies = families.filter((f) => f.school_id === school.id)
          return (
            <Card key={school.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  {school.crest_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={school.crest_url} alt="" className="w-10 h-10 rounded object-cover border" />
                  )}
                  <div>
                    <p className="font-medium">{school.name}</p>
                    <p className="text-xs text-muted-foreground">{school.city} · {school.slug}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleGenerateCode(school.id)}>
                    Generar código de invitación
                  </Button>
                  {codesBySchool[school.id] && (
                    <code className="text-xs bg-muted px-2 py-1 rounded">{codesBySchool[school.id]}</code>
                  )}
                </div>

                {schoolFamilies.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    {schoolFamilies.map((f) => (
                      <div key={f.id} className="flex items-center justify-between text-sm py-1">
                        <span>
                          {f.display_name} <span className="text-xs text-muted-foreground">{f.email}</span>
                          {f.role === 'school_admin' && <Badge variant="secondary" className="text-xs ml-2">Admin</Badge>}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          className="text-xs"
                          onClick={() => handleToggleAdmin(f.id, f.role !== 'school_admin')}
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
        })}
      </section>
    </div>
  )
}
