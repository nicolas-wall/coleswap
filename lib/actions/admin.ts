'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
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

export async function deleteFamily(familyId: string) {
  const { supabase, error: authErr } = await requireSchoolAdmin()
  if (authErr) return { error: authErr }

  const { data: target } = await supabase
    .from('families')
    .select('suspended')
    .eq('id', familyId)
    .single() as { data: Pick<Family, 'suspended'> | null }

  if (!target?.suspended) {
    return { error: 'Solo se pueden eliminar familias suspendidas' }
  }

  const service = createServiceClient()

  await service.from('ratings').delete().or(`rater_family_id.eq.${familyId},rated_family_id.eq.${familyId}`)
  await service.from('conversations').delete().or(`buyer_id.eq.${familyId},seller_id.eq.${familyId}`)

  await service.from('listings').delete().eq('family_id', familyId)
  await service.from('invitations').update({ used_by: null, used_at: null }).eq('used_by', familyId)

  const { error } = await service.auth.admin.deleteUser(familyId)
  if (error) return { error: 'No se pudo eliminar la familia' }

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
