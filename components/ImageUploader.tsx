'use client'

import { useState } from 'react'
import { Camera, ImagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/compress-image'
import { Alert, AlertDescription } from '@/components/ui/alert'

const MAX_IMAGES = 4

export function ImageUploader({ initialUrls = [] }: { initialUrls?: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialUrls)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')

    const remaining = MAX_IMAGES - urls.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No autenticado')
        return
      }

      const newUrls: string[] = []
      for (const file of toUpload) {
        const blob = await compressImage(file)
        const path = `${user.id}/${crypto.randomUUID()}.jpg`
        const { error: uploadErr } = await supabase.storage
          .from('listing-images')
          .upload(path, blob, { contentType: 'image/jpeg' })
        if (uploadErr) {
          setError('Error al subir una imagen. Intentá de nuevo.')
          continue
        }
        const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
      setUrls((prev) => [...prev, ...newUrls])
    } catch {
      setError('Error al procesar la imagen. Intentá con otra.')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url))
  }

  return (
    <div className="space-y-2">
      {urls.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {urls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <div key={url} className="relative aspect-square rounded-md overflow-hidden border">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-1 right-1 bg-background/90 rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center border"
            >
              ×
            </button>
          </div>
        ))}
        {urls.length < MAX_IMAGES && (
          <div className="aspect-square rounded-md border border-dashed flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
            {uploading ? (
              <span>Subiendo…</span>
            ) : (
              <>
                <label className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-foreground">
                  <Camera className="size-4" />
                  <span>Cámara</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>
                <label className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-foreground">
                  <ImagePlus className="size-4" />
                  <span>Galería</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Hasta {MAX_IMAGES} fotos — opcional</p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
