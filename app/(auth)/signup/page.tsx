'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signUp, requestJoin } from '@/lib/actions/auth'

interface SchoolOption {
  id: string
  name: string
  short_name: string | null
  city: string
}

export default function SignupPage() {
  const [mode, setMode] = useState<'code' | 'request'>('code')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<SchoolOption[]>([])

  useEffect(() => {
    if (mode === 'request' && schools.length === 0) {
      fetch('/api/schools').then((r) => r.json()).then((d) => setSchools(d.schools ?? []))
    }
  }, [mode, schools.length])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const action = mode === 'code' ? signUp : requestJoin
    const result = await action(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Crear cuenta</CardTitle>
        <CardDescription>
          {mode === 'code' ? 'Necesitás un código de invitación de tu colegio.' : 'Pedí acceso y un moderador de tu colegio te aprueba.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} key={mode}>
        <CardContent className="space-y-4">
          <div className="flex gap-1 text-sm bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('code')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${mode === 'code' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
            >
              Tengo un código
            </button>
            <button
              type="button"
              onClick={() => setMode('request')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${mode === 'request' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
            >
              No tengo código
            </button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'code' ? (
            <div className="space-y-1.5">
              <Label htmlFor="invitationCode">Código de invitación</Label>
              <Input
                id="invitationCode"
                name="invitationCode"
                placeholder="COLEGIO-XXX"
                className="uppercase font-mono"
                required
                onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="schoolId">Tu colegio</Label>
              <select
                id="schoolId"
                name="schoolId"
                required
                defaultValue=""
                className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" disabled>Seleccioná tu colegio</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.short_name || s.name} — {s.city}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="displayName">Nombre de familia</Label>
            <Input id="displayName" name="displayName" placeholder="Familia García" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono de contacto</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+54 11 1234-5678" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput id="password" name="password" minLength={8} required autoComplete="new-password" />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta…' : mode === 'code' ? 'Crear cuenta' : 'Solicitar acceso'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-primary underline underline-offset-2">
              Ingresar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
