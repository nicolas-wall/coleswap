'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Family } from '@/types/database'

async function authorizeForSchool(schoolId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' as const, userId: null }

  const { data: platformAdmin } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (platformAdmin) return { error: null, userId: user.id }

  const { data: family } = await supabase
    .from('families')
    .select('role, school_id')
    .eq('id', user.id)
    .single() as { data: Pick<Family, 'role' | 'school_id'> | null }

  if (family?.role === 'school_admin' && family.school_id === schoolId) {
    return { error: null, userId: user.id }
  }

  return { error: 'No autorizado' as const, userId: null }
}

export async function generateInvitation(schoolId: string, options: { multiUse: boolean; expiresInDays?: number }) {
  const { error: authErr, userId } = await authorizeForSchool(schoolId)
  if (authErr) return { error: authErr }

  const service = createServiceClient()

  const { data: school } = await service.from('schools').select('slug').eq('id', schoolId).single()
  if (!school) return { error: 'Colegio no encontrado' }

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  const code = `${school.slug.toUpperCase()}-${suffix}`
  const expiresAt = options.multiUse && options.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 86400000).toISOString()
    : null

  const { error } = await service.from('invitations').insert({
    school_id: schoolId,
    code,
    multi_use: options.multiUse,
    expires_at: expiresAt,
    created_by: userId,
  })

  if (error) return { error: 'No se pudo generar el código' }

  return { success: true, code, multiUse: options.multiUse, expiresAt }
}
