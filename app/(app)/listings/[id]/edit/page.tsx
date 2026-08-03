'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BookOpen, Shirt, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageUploader } from '@/components/ImageUploader'
import { updateBookListing, updateUniformListing } from '@/lib/actions/listings'
import { GARMENT_LABELS, GARMENT_TYPES, SIZES } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/client'
import type { ListingWithDetails } from '@/types/database'

const selectClass = 'w-full border border-input rounded-lg px-3 py-2 text-sm bg-background outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const SUBJECTS = [
  'Matemática', 'Lengua y Literatura', 'Ciencias Naturales', 'Ciencias Sociales',
  'Historia', 'Geografía', 'Inglés', 'Educación Física', 'Música', 'Plástica',
  'Tecnología', 'Física', 'Química', 'Biología', 'Filosofía', 'Formación Ética', 'Otra',
]

const GRADES = [
  'Primaria 1°', 'Primaria 2°', 'Primaria 3°', 'Primaria 4°', 'Primaria 5°', 'Primaria 6°', 'Primaria 7°',
  'Secundaria 1°', 'Secundaria 2°', 'Secundaria 3°', 'Secundaria 4°', 'Secundaria 5°', 'Secundaria 6°',
]

export default function EditListingPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<ListingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notOwner, setNotOwner] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: { user } }, res] = await Promise.all([
        supabase.auth.getUser(),
        fetch(`/api/listings/${id}`).then((r) => r.json()),
      ])

      if (!res.listing) {
        setLoading(false)
        return
      }
      if (!user || res.listing.family.id !== user.id) {
        setNotOwner(true)
        setLoading(false)
        return
      }

      setListing(res.listing)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!listing) return
    setSubmitting(true)
    setError('')
    const action = listing.type === 'book' ? updateBookListing : updateUniformListing
    const result = await action(listing.id, new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (notOwner) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <Alert variant="destructive">
          <AlertDescription>No podés editar esta publicación.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <Alert variant="destructive">
          <AlertDescription>Publicación no encontrada.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (listing.status !== 'active') {
    return (
      <div className="max-w-lg mx-auto py-16">
        <Alert variant="destructive">
          <AlertDescription>Solo se pueden editar publicaciones activas.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isBook = listing.type === 'book'

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        {isBook ? <BookOpen className="size-6 text-primary" /> : <Shirt className="size-6 text-primary" />}
        Editar {isBook ? 'libro' : 'uniforme'}
      </h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isBook ? 'Datos del libro' : 'Datos de la prenda'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isBook && listing.book_details ? (
              <>
                <div className="space-y-1.5">
                  <Label>ISBN</Label>
                  <Input value={listing.book_details.isbn} disabled readOnly className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" name="title" required defaultValue={listing.book_details.title} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author">Autor *</Label>
                  <Input id="author" name="author" required defaultValue={listing.book_details.author} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="publisher">Editorial — opcional</Label>
                  <Input id="publisher" name="publisher" defaultValue={listing.book_details.publisher ?? ''} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Materia *</Label>
                    <select id="subject" name="subject" required defaultValue={listing.book_details.subject} className={selectClass}>
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="grade">Año/Grado *</Label>
                    <select id="grade" name="grade" required defaultValue={listing.book_details.grade} className={selectClass}>
                      {GRADES.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </>
            ) : listing.uniform_details && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="garmentType">Prenda *</Label>
                  <select id="garmentType" name="garmentType" required defaultValue={listing.uniform_details.garment_type} className={selectClass}>
                    {GARMENT_TYPES.map((g) => <option key={g} value={g}>{GARMENT_LABELS[g]}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="size">Talle *</Label>
                    <select id="size" name="size" required defaultValue={listing.uniform_details.size} className={selectClass}>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Género *</Label>
                    <select id="gender" name="gender" required defaultValue={listing.uniform_details.gender} className={selectClass}>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="color">Color — opcional</Label>
                  <Input id="color" name="color" maxLength={30} defaultValue={listing.uniform_details.color ?? ''} />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="condition">Estado *</Label>
              <select id="condition" name="condition" required defaultValue={listing.condition} className={selectClass}>
                <option value="como_nuevo">Como nuevo</option>
                <option value="buen_estado">Buen estado</option>
                <option value="regular">Regular</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (ARS) — opcional</Label>
              <Input id="price" name="price" type="number" min={0} step={100} defaultValue={listing.price ?? ''} placeholder="Sin precio = se consulta" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas (máx. 280 caracteres) — opcional</Label>
              <Textarea id="notes" name="notes" maxLength={280} rows={2} defaultValue={listing.notes ?? ''} />
            </div>

            <div className="space-y-1.5">
              <Label>Fotos</Label>
              <ImageUploader initialUrls={listing.images ?? []} />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 gap-1.5" disabled={submitting}>
                <Save className="size-4" />
                {submitting ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.push(`/listings/${listing.id}`)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
