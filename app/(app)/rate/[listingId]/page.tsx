'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RatingStars } from '@/components/RatingStars'
import { submitRating } from '@/lib/actions/ratings'

export default function RatePage() {
  const { listingId } = useParams()
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (score === 0) {
      setError('Seleccioná una calificación de 1 a 5 estrellas.')
      return
    }
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('score', String(score))
    const result = await submitRating(listingId as string, fd)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="max-w-sm mx-auto text-center py-16 space-y-4">
        <div className="text-4xl">⭐</div>
        <h1 className="text-xl font-bold">¡Calificación enviada!</h1>
        <p className="text-muted-foreground text-sm">Gracias por ayudar a construir la confianza de la comunidad.</p>
        <Link href="/my-listings"><Button variant="outline">Ver mis publicaciones</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto">
      <Link href="/my-listings" className="text-sm text-muted-foreground hover:text-foreground block mb-6">← Mis publicaciones</Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Calificar transacción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Calificación *</Label>
              <div className="flex justify-center py-2">
                <RatingStars value={score} onChange={setScore} size="md" />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {score === 0 && 'Tocá una estrella para calificar'}
                {score === 1 && 'Muy mala experiencia'}
                {score === 2 && 'Mala experiencia'}
                {score === 3 && 'Experiencia regular'}
                {score === 4 && 'Buena experiencia'}
                {score === 5 && 'Excelente experiencia'}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comment">Comentario — opcional (máx. 280 caracteres)</Label>
              <Textarea
                id="comment"
                name="comment"
                maxLength={280}
                rows={3}
                placeholder="Contá tu experiencia para ayudar a otros…"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || score === 0}>
              {loading ? 'Enviando…' : 'Enviar calificación'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
