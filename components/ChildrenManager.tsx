'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { addChild, removeChild } from '@/lib/actions/children'
import type { Child } from '@/types/database'

export function ChildrenManager() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    fetch('/api/children')
      .then((r) => r.json())
      .then((d) => { setChildren(d.children ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!grade) {
      setError('Seleccioná el grado')
      return
    }
    setSaving(true)
    setError('')
    const formData = new FormData()
    formData.set('name', name)
    formData.set('grade', grade)
    const result = await addChild(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      toast.success('Hijo agregado')
      setName('')
      setGrade('')
      load()
    }
    setSaving(false)
  }

  async function handleRemove(id: string) {
    const result = await removeChild(id)
    if (result?.error) toast.error(result.error)
    load()
  }

  return (
    <div className="space-y-3">
      {!loading && children.length > 0 && (
        <ul className="space-y-1.5">
          {children.map((child) => (
            <li key={child.id} className="flex items-center justify-between bg-secondary/60 rounded-lg px-3 py-2 text-sm">
              <span>{child.name ? `${child.name} — ${child.grade}` : child.grade}</span>
              <button
                type="button"
                onClick={() => handleRemove(child.id)}
                // -my-1 evita que el área táctil agrande la fila.
                className="-my-1 -mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Eliminar ${child.name ? `${child.name} — ${child.grade}` : child.grade}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
        <div className="space-y-1.5">
          <label htmlFor="child-name" className="text-xs text-muted-foreground">Nombre — opcional</label>
          <Input id="child-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Sofía" className="w-36" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="child-grade" className="text-xs text-muted-foreground">Grado</label>
          <select
            id="child-grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background h-9 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
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
        <Button type="submit" size="sm" variant="outline" disabled={saving} className="gap-1">
          <Plus className="size-3.5" />
          {saving ? 'Agregando…' : 'Agregar'}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
