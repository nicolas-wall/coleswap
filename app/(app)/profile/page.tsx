'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateProfile } from '@/lib/actions/auth'
import { ChildrenManager } from '@/components/ChildrenManager'

interface ProfileData {
  phone: string
  email: string
  social_handle: string | null
  contact_note: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { setProfile(d.profile); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSaved(false)
    const result = await updateProfile(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
    } else if (result?.success) {
      setSaved(true)
      setSubmitting(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground">Cargando…</div>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                defaultValue={profile?.phone ?? ''}
                placeholder="Ej: +54 911 2345-6789"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={profile?.email ?? ''}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="socialHandle">Red social / usuario — opcional</Label>
              <Input
                id="socialHandle"
                name="socialHandle"
                maxLength={50}
                defaultValue={profile?.social_handle ?? ''}
                placeholder="Ej: @familia_apellido"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactNote">Nota de contacto — opcional (máx. 280 caracteres)</Label>
              <Textarea
                id="contactNote"
                name="contactNote"
                maxLength={280}
                rows={2}
                defaultValue={profile?.contact_note ?? ''}
                placeholder="Ej: Preferís que te contacten por WhatsApp"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {saved && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">Perfil actualizado</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardá los cambios'}
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Hijos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Agregá el grado de cada hijo para recibir recomendaciones de libros en el catálogo.
          </p>
          <ChildrenManager />
        </CardContent>
      </Card>
    </div>
  )
}
