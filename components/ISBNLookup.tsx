'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { BookMetadata } from '@/lib/open-library'

interface Props {
  onFound: (meta: BookMetadata & { isbn: string }) => void
  onISBNChange: (isbn: string) => void
}

export function ISBNLookup({ onFound, onISBNChange }: Props) {
  const [isbn, setIsbn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [found, setFound] = useState<(BookMetadata & { isbn: string }) | null>(null)

  async function lookup() {
    const clean = isbn.replace(/[-\s]/g, '')
    if (!/^\d{10}(\d{3})?$/.test(clean)) {
      setError('Ingresá un ISBN de 10 o 13 dígitos')
      return
    }

    setLoading(true)
    setError('')
    setFound(null)
    onISBNChange(clean)

    try {
      const res = await fetch(`/api/isbn?isbn=${clean}`)
      const data = await res.json()

      if (!data.book) {
        setError('No se encontró en la base de datos. Completá el título y autor manualmente.')
        return
      }

      const result = { ...data.book, isbn: clean }
      setFound(result)
      onFound(result)
    } catch {
      setError('Error al buscar el ISBN. Verificá tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="ISBN (ej: 9789500728461)"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value.replace(/\D/g, ''))}
          maxLength={13}
          className="font-mono"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), lookup())}
        />
        <Button type="button" onClick={lookup} disabled={loading || isbn.length < 10} variant="outline">
          {loading ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {found && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
          <p className="font-medium">{found.title}</p>
          {found.author && <p className="text-muted-foreground">{found.author}</p>}
          {found.publishYear && <p className="text-muted-foreground text-xs">Publicado: {found.publishYear}</p>}
        </div>
      )}
    </div>
  )
}
