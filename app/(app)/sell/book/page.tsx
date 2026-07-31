'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ISBNLookup } from '@/components/ISBNLookup'
import { createBookListing } from '@/lib/actions/listings'
import type { BookMetadata } from '@/lib/open-library'

export default function SellBookPage() {
  const [meta, setMeta] = useState<(BookMetadata & { isbn: string }) | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await createBookListing(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Publicar libro</h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buscar por ISBN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ISBNLookup onFound={(m) => setMeta(m)} />

            {meta && <input type="hidden" name="isbn" value={meta.isbn} />}

            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" required defaultValue={meta?.title ?? ''} key={meta?.isbn + '-title'} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="author">Autor *</Label>
              <Input id="author" name="author" required defaultValue={meta?.author ?? ''} key={meta?.isbn + '-author'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Materia *</Label>
                <Input id="subject" name="subject" placeholder="Matemática" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade">Año/Grado *</Label>
                <Input id="grade" name="grade" type="number" min={1} max={12} required placeholder="3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condition">Estado *</Label>
              <select id="condition" name="condition" required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="">Seleccioná el estado</option>
                <option value="como_nuevo">Como nuevo</option>
                <option value="buen_estado">Buen estado</option>
                <option value="regular">Regular</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (ARS) — opcional</Label>
              <Input id="price" name="price" type="number" min={0} step={100} placeholder="Sin precio = se consulta" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas (máx. 280 caracteres) — opcional</Label>
              <Textarea id="notes" name="notes" maxLength={280} rows={2} placeholder="Ej: Tiene subrayados en los primeros capítulos" />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Publicando…' : 'Publicar libro'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
