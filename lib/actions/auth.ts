'use server'

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { signupSchema, loginSchema, profileSchema } from '@/lib/schemas'
import type { Invitation, Family } from '@/types/database'

export async function signUp(formData: FormData) {
  const raw = {
    invitationCode: formData.get('invitationCode'),
    displayName: formData.get('displayName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { invitationCode, displayName, phone, email, password } = parsed.data

  const service = await createServiceClient()

  const { data: invitation, error: invErr } = await service
    .from('invitations')
    .select('id, school_id, used_by')
    .eq('code', invitationCode)
    .single() as { data: Invitation | null; error: unknown }

  if (invErr || !invitation) {
    return { error: 'Código de invitación inválido' }
  }
  if (invitation.used_by) {
    return { error: 'Este código de invitación ya fue utilizado' }
  }

  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })

  if (authErr || !authData.user) {
    return { error: (authErr as { message?: string })?.message ?? 'Error al crear la cuenta' }
  }

  const userId = authData.user.id

  const { error: familyErr } = await service.from('families').insert({
    id: userId,
    school_id: invitation.school_id,
    display_name: displayName,
    phone,
    email,
    social_handle: null,
    contact_note: null,
    role: 'user',
    suspended: false,
  } satisfies Omit<Family, 'rating_avg' | 'rating_count' | 'created_at'>)

  if (familyErr) {
    await service.auth.admin.deleteUser(userId)
    return { error: 'Error al crear el perfil. Intentá de nuevo.' }
  }

  await service.from('invitations').update({
    used_by: userId,
    used_at: new Date().toISOString(),
  }).eq('id', invitation.id)

  redirect('/catalog')
}

export async function signIn(formData: FormData) {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Email o contraseña incorrectos' }
  }

  redirect('/catalog')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updateProfile(formData: FormData) {
  const raw = {
    phone: formData.get('phone'),
    email: formData.get('email'),
    socialHandle: formData.get('socialHandle') || null,
    contactNote: formData.get('contactNote') || null,
  }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('families')
    .update({
      phone: parsed.data.phone,
      email: parsed.data.email,
      social_handle: parsed.data.socialHandle,
      contact_note: parsed.data.contactNote,
    })
    .eq('id', user.id)

  if (error) return { error: 'No se pudo actualizar el perfil' }

  return { success: true }
}
