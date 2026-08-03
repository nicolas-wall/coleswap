'use client'

import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from '@/components/ui/alert-dialog'
import { deleteMyAccount } from '@/lib/actions/auth'

const CONFIRM_WORD = 'ELIMINAR'

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setConfirmText('')
      setError('')
    }
  }

  async function handleDelete() {
    setSubmitting(true)
    setError('')
    const formData = new FormData()
    formData.set('confirmation', confirmText)
    const result = await deleteMyAccount(formData)
    if (result?.error) {
      setError(result.error)
      setSubmitting(false)
    }
    // Si no hay error, deleteMyAccount ya redirigió — no queda nada más por hacer acá.
  }

  return (
    <Card className="mt-6 border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Eliminar cuenta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Elimina tu cuenta, tus publicaciones, mensajes y calificaciones de forma permanente.
          Esta acción no se puede deshacer.
        </p>

        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
            Eliminar mi cuenta
          </AlertDialogTrigger>

          <AlertDialogContent>
            <div className="flex items-start gap-3">
              <TriangleAlert className="size-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <AlertDialogTitle>¿Eliminar tu cuenta para siempre?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se van a borrar tu perfil, tus publicaciones, tus mensajes y tus calificaciones.
                  No hay forma de recuperarlos después de esto.
                </AlertDialogDescription>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <label htmlFor="confirmDelete" className="text-sm">
                Para confirmar, escribí <span className="font-semibold">{CONFIRM_WORD}</span>
              </label>
              <Input
                id="confirmDelete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <AlertDialogClose render={<Button type="button" variant="ghost" disabled={submitting} />}>
                Cancelar
              </AlertDialogClose>
              <Button
                type="button"
                variant="destructive"
                disabled={confirmText !== CONFIRM_WORD || submitting}
                onClick={handleDelete}
              >
                {submitting ? 'Eliminando…' : 'Eliminar cuenta definitivamente'}
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
