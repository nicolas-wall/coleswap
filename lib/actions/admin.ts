'use server'

import { createClient } from '@/lib/supabase/server'
import type { Family } from '@/types/database'

async function requireSchoolAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'No autenticado' as const }

  const { data: family } = await supabase
    .from('families')
    .select('role')
    .eq('id', user.id)
    .single() as { data: Pick<Family, 'role'> | null }

  if (family?.role !== 'school_admin') {
    return { supabase, error: 'No autorizado' as const }
  }

  return { supabase, error: null }
}

export async function setFamilySuspended(familyId: string, suspended: boolean) {
  const { supabase, error: authErr } = await requireSchoolAdmin()
  if (authErr) return { error: authErr }

  const { error } = await supabase
    .from('families')
    .update({ suspended })
    .eq('id', familyId)

  if (error) return { error: 'No se pudo actualizar la familia' }

  return { success: true }
}

export async function adminRemoveListing(listingId: string) {
  const { supabase, error: authErr } = await requireSchoolAdmin()
  if (authErr) return { error: authErr }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' as const })
    .eq('id', listingId)

  if (error) return { error: 'No se pudo remover la publicación' }

  return { success: true }
}
