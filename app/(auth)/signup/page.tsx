'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { signUp } from '@/lib/actions/auth'

export default function SignupPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signUp(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Crear cuenta</CardTitle>
        <CardDescription>Necesitás un código de invitación de tu colegio.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
            <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
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
