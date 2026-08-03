'use client'

import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from '@/components/ui/alert-dialog'

interface Props {
  /** El botón que abre el diálogo; su contenido son los children. */
  trigger: React.ReactElement
  children: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  trigger,
  children,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger}>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <div className="flex items-start gap-3">
          {destructive && <TriangleAlert className="size-5 text-destructive shrink-0 mt-0.5" />}
          <div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <AlertDialogClose render={<Button type="button" variant="ghost" disabled={busy} />}>
            {cancelLabel}
          </AlertDialogClose>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            disabled={busy}
            onClick={handleConfirm}
          >
            {busy ? 'Un momento…' : confirmLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
