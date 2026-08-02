'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { schoolSchema } from '@/lib/schemas'

async function requirePlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'No autenticado' as const }

  const { data } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return { supabase, error: 'No autorizado' as const }

  return { supabase, error: null }
}

export async function createSchool(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    shortName: formData.get('shortName') || null,
    city: formData.get('city'),
    slug: formData.get('slug'),
    crestUrl: formData.get('crestUrl') || null,
  }

  const parsed = schoolSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { supabase, error: authErr } = await requirePlatformAdmin()
  if (authErr) return { error: authErr }

  const { error } = await supabase.from('schools').insert({
    name: parsed.data.name,
    short_name: parsed.data.shortName,
    city: parsed.data.city,
    slug: parsed.data.slug,
    crest_url: parsed.data.crestUrl,
  })

  if (error) return { error: error.message.includes('duplicate') ? 'Ese slug ya existe' : 'No se pudo crear el colegio' }

  return { success: true }
}

export async function updateSchool(schoolId: string, formData: FormData) {
  const raw = {
    name: formData.get('name'),
    shortName: formData.get('shortName') || null,
    city: formData.get('city'),
    slug: formData.get('slug'),
    crestUrl: formData.get('crestUrl') || null,
  }

  const parsed = schoolSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { supabase, error: authErr } = await requirePlatformAdmin()
  if (authErr) return { error: authErr }

  const { error } = await supabase
    .from('schools')
    .update({
      name: parsed.data.name,
      short_name: parsed.data.shortName,
      city: parsed.data.city,
      slug: parsed.data.slug,
      crest_url: parsed.data.crestUrl,
    })
    .eq('id', schoolId)

  if (error) return { error: error.message.includes('duplicate') ? 'Ese slug ya existe' : 'No se pudo actualizar el colegio' }

  return { success: true }
}

export async function generateInvitation(schoolId: string) {
  const { error: authErr } = await requirePlatformAdmin()
  if (authErr) return { error: authErr }

  const service = await createServiceClient()

  const { data: school } = await service.from('schools').select('slug').eq('id', schoolId).single()
  if (!school) return { error: 'Colegio no encontrado' }

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  const code = `${school.slug.toUpperCase()}-${suffix}`

  const { error } = await service.from('invitations').insert({ school_id: schoolId, code })
  if (error) return { error: 'No se pudo generar el código' }

  return { success: true, code }
}

export async function setSchoolAdminRole(familyId: string, isAdmin: boolean) {
  const { supabase, error: authErr } = await requirePlatformAdmin()
  if (authErr) return { error: authErr }

  const { error } = await supabase
    .from('families')
    .update({ role: isAdmin ? 'school_admin' : 'user' })
    .eq('id', familyId)

  if (error) return { error: 'No se pudo actualizar el rol' }

  return { success: true }
}
