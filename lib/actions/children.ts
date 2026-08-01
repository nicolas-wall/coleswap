'use server'

import { createClient } from '@/lib/supabase/server'
import { childSchema } from '@/lib/schemas'

export async function addChild(formData: FormData) {
  const raw = {
    name: formData.get('name') || null,
    grade: formData.get('grade'),
  }

  const parsed = childSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('children').insert({
    family_id: user.id,
    name: parsed.data.name,
    grade: parsed.data.grade,
  })

  if (error) return { error: 'No se pudo agregar. Intentá de nuevo.' }

  return { success: true }
}

export async function removeChild(childId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', childId)
    .eq('family_id', user.id)

  if (error) return { error: 'No se pudo eliminar' }

  return { success: true }
}
