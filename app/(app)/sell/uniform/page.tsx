'use client'

import { useState } from 'react'
import { Shirt, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createUniformListing } from '@/lib/actions/listings'
import { GARMENT_LABELS, GARMENT_TYPES, SIZES } from '@/lib/schemas'
import { ImageUploader } from '@/components/ImageUploader'

const selectClass = 'w-full border border-input rounded-lg px-3 py-2 text-sm bg-background outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export default function SellUniformPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await createUniformListing(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-6 flex items-center gap-2">
        <Shirt className="size-6 text-primary" />
        Publicar uniforme
      </h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la prenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="garmentType">Prenda *</Label>
              <select id="garmentType" name="garmentType" required
                className={selectClass}>
                <option value="">Seleccioná la prenda</option>
                {GARMENT_TYPES.map(g => (
                  <option key={g} value={g}>{GARMENT_LABELS[g]}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="size">Talle *</Label>
                <select id="size" name="size" required
                  className={selectClass}>
                  <option value="">Talle</option>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender">Género *</Label>
                <select id="gender" name="gender" required
                  className={selectClass}>
                  <option value="">Género</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="color">Color — opcional</Label>
              <Input id="color" name="color" placeholder="Ej: azul marino" maxLength={30} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condition">Estado *</Label>
              <select id="condition" name="condition" required
                className={selectClass}>
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
              <Label htmlFor="notes">Notas — opcional (máx. 280 caracteres)</Label>
              <Textarea id="notes" name="notes" maxLength={280} rows={2} placeholder="Ej: Poco uso, lavado en frío" />
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

            <Button type="submit" className="w-full gap-1.5" disabled={loading}>
              <Upload className="size-4" />
              {loading ? 'Publicando…' : 'Publicar uniforme'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
