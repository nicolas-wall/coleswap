'use client'

import { useState } from 'react'
import { ScanBarcode } from 'lucide-react'
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
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [found, setFound] = useState<(BookMetadata & { isbn: string }) | null>(null)

  async function lookup(overrideIsbn?: string) {
    const clean = (overrideIsbn ?? isbn).replace(/[-\s]/g, '')
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

  async function handleScan(file: File | undefined) {
    if (!file) return
    setError('')
    setFound(null)
    setScanning(true)

    const url = URL.createObjectURL(file)
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      const result = await reader.decodeFromImageUrl(url)
      const text = result.getText().replace(/\D/g, '')
      const isValidIsbn = /^\d{10}$/.test(text) || /^97[89]\d{10}$/.test(text)

      if (!isValidIsbn) {
        setError('Ese código de barras es un EAN genérico, no el ISBN del libro. Buscá el código que empieza con 978 o 979, o escribilo a mano.')
        return
      }

      setIsbn(text)
      await lookup(text)
    } catch {
      setError('No pudimos leer el código de barras. Probá con mejor luz, más cerca, o escribilo a mano.')
    } finally {
      URL.revokeObjectURL(url)
      setScanning(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="ISBN (ej: 9789500728461)"
          aria-label="ISBN del libro"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value.replace(/\D/g, ''))}
          maxLength={13}
          className="font-mono"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), lookup())}
        />
        <Button type="button" onClick={() => lookup()} disabled={loading || isbn.length < 10} variant="outline">
          {loading ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>

      <label className="inline-flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted/50 w-fit transition-colors has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
        <ScanBarcode className="size-4" />
        {scanning ? 'Leyendo código…' : 'Escanear código de barras'}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={scanning}
          onChange={(e) => handleScan(e.target.files?.[0])}
        />
      </label>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {found && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
          <p className="font-medium">{found.title}</p>
          {found.author && <p className="text-muted-foreground">{found.author}</p>}
          {found.publisher && <p className="text-muted-foreground text-xs">{found.publisher}</p>}
          {found.publishYear && <p className="text-muted-foreground text-xs">Publicado: {found.publishYear}</p>}
        </div>
      )}
    </div>
  )
}
