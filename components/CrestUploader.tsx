'use client'

import { useState } from 'react'
import { Camera, ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  onUploaded: (url: string) => void
}

export function CrestUploader({ onUploaded }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const blob = await compressImage(file)
      const supabase = createClient()
      const path = `${crypto.randomUUID()}.jpg`
      const { error: uploadErr } = await supabase.storage
        .from('school-crests')
        .upload(path, blob, { contentType: 'image/jpeg' })
      if (uploadErr) {
        setError('No se pudo subir el escudo')
        return
      }
      const { data } = supabase.storage.from('school-crests').getPublicUrl(path)
      setPreview(data.publicUrl)
      onUploaded(data.publicUrl)
    } catch {
      setError('Error al procesar la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-12 h-12 rounded object-cover border" />
        )}
        {uploading ? (
          <span className="text-sm text-muted-foreground">Subiendo…</span>
        ) : (
          <>
            <label className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted/50">
              <Camera className="size-4" />
              Cámara
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted/50">
              <ImagePlus className="size-4" />
              {preview ? 'Cambiar' : 'Galería'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          </>
        )}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
