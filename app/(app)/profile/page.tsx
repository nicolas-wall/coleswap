'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { updateProfile } from '@/lib/actions/auth'
import { ChildrenManager } from '@/components/ChildrenManager'
import { NotificationToggle } from '@/components/NotificationToggle'
import { InstallAppButton } from '@/components/InstallAppButton'
import { DeleteAccountSection } from '@/components/DeleteAccountSection'

interface ProfileData {
  display_name: string
  phone: string | null
  contact_email: string | null
  contact_note: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { setProfile(d.profile); setLoginEmail(d.loginEmail ?? ''); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await updateProfile(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      toast.success('Perfil actualizado')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-6">Mi perfil</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Nombre de familia *</Label>
              <Input
                id="displayName"
                name="displayName"
                required
                defaultValue={profile?.display_name ?? ''}
                placeholder="Ej: Familia García"
              />
            </div>

            {loginEmail && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Email</Label>
                <Input value={loginEmail} disabled readOnly />
                <p className="text-xs text-muted-foreground">Es el email con el que ingresás. No se cambia desde acá.</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground border-t pt-4">
              Lo de abajo es opcional — coordinás todo por el chat, y ahí podés compartir estos
              datos con quien estés hablando si querés.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono — opcional</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile?.phone ?? ''}
                placeholder="Ej: +54 911 2345-6789"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Email de contacto — opcional</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={profile?.contact_email ?? ''}
                placeholder="Ej: familia@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactNote">Nota — opcional (máx. 280 caracteres)</Label>
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

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardá los cambios'}
            </Button>
          </CardContent>
        </Card>
      </form>

      <NotificationToggle />
      <InstallAppButton />

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

      <DeleteAccountSection />
    </div>
  )
}
