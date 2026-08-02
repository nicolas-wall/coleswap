'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ISBNLookup } from '@/components/ISBNLookup'
import { ImageUploader } from '@/components/ImageUploader'
import { createBookListing } from '@/lib/actions/listings'
import type { BookMetadata } from '@/lib/open-library'

export default function SellBookPage() {
  const [meta, setMeta] = useState<(BookMetadata & { isbn: string }) | null>(null)
  const [isbn, setIsbn] = useState('')
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
            <ISBNLookup onFound={(m) => setMeta(m)} onISBNChange={setIsbn} />

            {isbn && <input type="hidden" name="isbn" value={isbn} />}

            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" required defaultValue={meta?.title ?? ''} key={isbn + '-title'} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="author">Autor *</Label>
              <Input id="author" name="author" required defaultValue={meta ? (meta.author || 'No disponible') : ''} key={isbn + '-author'} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publisher">Editorial — opcional</Label>
              <Input id="publisher" name="publisher" defaultValue={meta?.publisher ?? ''} key={isbn + '-publisher'} placeholder="Ej: Santillana" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Materia *</Label>
                <select id="subject" name="subject" required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                  <option value="">Seleccioná la materia</option>
                  <option>Matemática</option>
                  <option>Lengua y Literatura</option>
                  <option>Ciencias Naturales</option>
                  <option>Ciencias Sociales</option>
                  <option>Historia</option>
                  <option>Geografía</option>
                  <option>Inglés</option>
                  <option>Educación Física</option>
                  <option>Música</option>
                  <option>Plástica</option>
                  <option>Tecnología</option>
                  <option>Física</option>
                  <option>Química</option>
                  <option>Biología</option>
                  <option>Filosofía</option>
                  <option>Formación Ética</option>
                  <option>Otra</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade">Año/Grado *</Label>
                <select id="grade" name="grade" required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                  <option value="">Seleccioná</option>
                  <optgroup label="Primaria">
                    <option>Primaria 1°</option>
                    <option>Primaria 2°</option>
                    <option>Primaria 3°</option>
                    <option>Primaria 4°</option>
                    <option>Primaria 5°</option>
                    <option>Primaria 6°</option>
                    <option>Primaria 7°</option>
                  </optgroup>
                  <optgroup label="Secundaria">
                    <option>Secundaria 1°</option>
                    <option>Secundaria 2°</option>
                    <option>Secundaria 3°</option>
                    <option>Secundaria 4°</option>
                    <option>Secundaria 5°</option>
                    <option>Secundaria 6°</option>
                  </optgroup>
                </select>
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

            <div className="space-y-1.5">
              <Label>Fotos</Label>
              <ImageUploader />
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
