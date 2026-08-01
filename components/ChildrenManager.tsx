'use client'

import { useEffect, useState } from 'react'
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
      setName('')
      setGrade('')
      load()
    }
    setSaving(false)
  }

  async function handleRemove(id: string) {
    await removeChild(id)
    load()
  }

  return (
    <div className="space-y-3">
      {!loading && children.length > 0 && (
        <ul className="space-y-1.5">
          {children.map((child) => (
            <li key={child.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-sm">
              <span>{child.name ? `${child.name} — ${child.grade}` : child.grade}</span>
              <button
                type="button"
                onClick={() => handleRemove(child.id)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Nombre — opcional</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Sofía" className="w-36" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Grado</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background h-9"
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
        <Button type="submit" size="sm" variant="outline" disabled={saving}>
          {saving ? 'Agregando…' : '+ Agregar'}
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
