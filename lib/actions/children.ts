'use server'

import { createClient } from '@/lib/supabase/server'
import { childSchema } from '@/lib/schemas'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_CHILDREN_PER_FAMILY = 10

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

  const allowed = await checkRateLimit(`add-child:${user.id}`, 10, 3600)
  if (!allowed) return { error: 'Demasiados intentos. Esperá un rato y probá de nuevo.' }

  const { count } = await supabase
    .from('children')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', user.id)

  if ((count ?? 0) >= MAX_CHILDREN_PER_FAMILY) {
    return { error: `Máximo ${MAX_CHILDREN_PER_FAMILY} hijos por familia` }
  }

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
