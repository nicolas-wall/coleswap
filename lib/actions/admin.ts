'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Family, Listing } from '@/types/database'

const IMAGE_PATH_MARKER = '/listing-images/'

function extractImagePath(url: string): string | null {
  const idx = url.indexOf(IMAGE_PATH_MARKER)
  return idx === -1 ? null : url.slice(idx + IMAGE_PATH_MARKER.length)
}

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

// suspended/approved/role ya no son actualizables por los clientes (grants por
// columna, migración 021), así que estas acciones escriben con el service role
// después de verificar que quien llama es moderador del mismo colegio.
async function requireSameSchoolAdmin(familyId: string) {
  const { supabase, error } = await requireSchoolAdmin()
  if (error) return { error }

  const { data: me } = await supabase
    .from('families')
    .select('school_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single() as { data: Pick<Family, 'school_id'> | null }

  const { data: target } = await supabase
    .from('families')
    .select('school_id')
    .eq('id', familyId)
    .single() as { data: Pick<Family, 'school_id'> | null }

  if (!me || !target || me.school_id !== target.school_id) {
    return { error: 'No autorizado' as const }
  }

  return { error: null }
}

export async function setFamilySuspended(familyId: string, suspended: boolean) {
  const { error: authErr } = await requireSameSchoolAdmin(familyId)
  if (authErr) return { error: authErr }

  const service = createServiceClient()
  const { error } = await service
    .from('families')
    .update({ suspended })
    .eq('id', familyId)

  if (error) return { error: 'No se pudo actualizar la familia' }

  return { success: true }
}

export async function approveFamily(familyId: string) {
  const { error: authErr } = await requireSameSchoolAdmin(familyId)
  if (authErr) return { error: authErr }

  const service = createServiceClient()
  const { error } = await service
    .from('families')
    .update({ approved: true })
    .eq('id', familyId)

  if (error) return { error: 'No se pudo aprobar la solicitud' }

  return { success: true }
}

export async function rejectFamily(familyId: string) {
  const { error: schoolErr } = await requireSameSchoolAdmin(familyId)
  if (schoolErr) return { error: schoolErr }

  const { supabase, error: authErr } = await requireSchoolAdmin()
  if (authErr) return { error: authErr }

  const { data: target } = await supabase
    .from('families')
    .select('approved')
    .eq('id', familyId)
    .single() as { data: Pick<Family, 'approved'> | null }

  if (!target || target.approved) {
    return { error: 'Esta familia ya fue aprobada' }
  }

  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(familyId)
  if (error) return { error: 'No se pudo rechazar la solicitud' }

  return { success: true }
}

export async function deleteFamily(familyId: string) {
  const { error: schoolErr } = await requireSameSchoolAdmin(familyId)
  if (schoolErr) return { error: schoolErr }

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
  await service.from('conversations').delete().or(`family_a_id.eq.${familyId},family_b_id.eq.${familyId}`)

  const { data: familyListings } = await service.from('listings').select('id').eq('family_id', familyId)
  const listingIds = (familyListings ?? []).map((l) => l.id)
  if (listingIds.length > 0) {
    await service.from('contacts').delete().in('listing_id', listingIds)
  }
  await service.from('contacts').delete().eq('buyer_family_id', familyId)

  // Limpiar todas las fotos que haya subido esta familia, no solo las de listings actuales
  const { data: files } = await service.storage.from('listing-images').list(familyId)
  if (files && files.length > 0) {
    await service.storage.from('listing-images').remove(files.map((f) => `${familyId}/${f.name}`))
  }

  await service.from('listings').delete().eq('family_id', familyId)
  await service.from('invitations').update({ used_by: null, used_at: null }).eq('used_by', familyId)
  await service.from('invitations').update({ created_by: null }).eq('created_by', familyId)

  const { error } = await service.auth.admin.deleteUser(familyId)
  if (error) return { error: 'No se pudo eliminar la familia' }

  return { success: true }
}

export async function adminRemoveListing(listingId: string) {
  const { supabase, error: authErr } = await requireSchoolAdmin()
  if (authErr) return { error: authErr }

  const { data: existing } = await supabase
    .from('listings')
    .select('images')
    .eq('id', listingId)
    .single() as { data: Pick<Listing, 'images'> | null; error: unknown }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' as const })
    .eq('id', listingId)

  if (error) return { error: 'No se pudo remover la publicación' }

  const paths = (existing?.images ?? []).map(extractImagePath).filter((p): p is string => !!p)
  if (paths.length > 0) {
    // El admin no es dueño de las fotos, así que necesita el service role para borrarlas
    const service = createServiceClient()
    await service.storage.from('listing-images').remove(paths)
  }

  return { success: true }
}
