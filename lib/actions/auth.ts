'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { signupSchema, requestJoinSchema, loginSchema, profileSchema, forgotPasswordSchema } from '@/lib/schemas'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { sendPushToSchoolAdmins } from '@/lib/push'
import { sendPendingRequestEmail } from '@/lib/email'
import type { Invitation, Family } from '@/types/database'

async function getOrigin() {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export async function signUp(formData: FormData) {
  const raw = {
    invitationCode: formData.get('invitationCode'),
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`signup:${ip}`, 10, 3600)
  if (!allowed) return { error: 'Demasiados intentos de registro. Probá de nuevo más tarde.' }

  const { invitationCode, displayName, email, password } = parsed.data

  const service = await createServiceClient()

  const { data: invitation, error: invErr } = await service
    .from('invitations')
    .select('id, school_id, used_by, multi_use, expires_at')
    .eq('code', invitationCode)
    .single() as { data: Invitation | null; error: unknown }

  if (invErr || !invitation) {
    return { error: 'Código de invitación inválido' }
  }
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { error: 'Este código de invitación venció' }
  }
  if (!invitation.multi_use && invitation.used_by) {
    return { error: 'Este código de invitación ya fue utilizado' }
  }

  const origin = await getOrigin()
  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      // Explícito, igual que en el reset de contraseña: si algún día se activa
      // "Confirm email", el link sigue el dominio real del request en vez de
      // depender del Site URL del dashboard, que quedó viejo la última vez que
      // se renombró el proyecto.
      emailRedirectTo: `${origin}/login`,
    },
  })

  if (authErr || !authData.user) {
    return { error: (authErr as { message?: string })?.message ?? 'Error al crear la cuenta' }
  }

  const userId = authData.user.id

  const { error: familyErr } = await service.from('families').insert({
    id: userId,
    school_id: invitation.school_id,
    display_name: displayName,
    phone: null,
    email,
    contact_email: null,
    contact_note: null,
    role: 'user',
    suspended: false,
    approved: true,
    joined_via_code: invitationCode,
  } satisfies Omit<Family, 'rating_avg' | 'rating_count' | 'created_at'>)

  if (familyErr) {
    await service.auth.admin.deleteUser(userId)
    return { error: 'Error al crear el perfil. Intentá de nuevo.' }
  }

  if (!invitation.multi_use) {
    await service.from('invitations').update({
      used_by: userId,
      used_at: new Date().toISOString(),
    }).eq('id', invitation.id)
  }

  redirect('/catalog')
}

export async function requestJoin(formData: FormData) {
  const raw = {
    schoolId: formData.get('schoolId'),
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = requestJoinSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`request-join:${ip}`, 5, 3600)
  if (!allowed) return { error: 'Demasiadas solicitudes. Probá de nuevo más tarde.' }

  const { schoolId, displayName, email, password } = parsed.data

  const service = await createServiceClient()

  const { data: school } = await service.from('schools').select('id').eq('id', schoolId).single()
  if (!school) return { error: 'Colegio no encontrado' }

  const origin = await getOrigin()
  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/login`,
    },
  })

  if (authErr || !authData.user) {
    return { error: (authErr as { message?: string })?.message ?? 'Error al crear la cuenta' }
  }

  const userId = authData.user.id

  const { error: familyErr } = await service.from('families').insert({
    id: userId,
    school_id: schoolId,
    display_name: displayName,
    phone: null,
    email,
    contact_email: null,
    contact_note: null,
    role: 'user',
    suspended: false,
    approved: false,
    joined_via_code: null,
  } satisfies Omit<Family, 'rating_avg' | 'rating_count' | 'created_at'>)

  if (familyErr) {
    await service.auth.admin.deleteUser(userId)
    return { error: 'Error al crear el perfil. Intentá de nuevo.' }
  }

  // El admin del colegio no tiene forma de enterarse solo de que hay alguien
  // esperando aprobación, así que sin este aviso la solicitud queda dando
  // vueltas indefinidamente. Si el admin no activó notificaciones no pasa nada:
  // sendPush falla en silencio y el registro ya está hecho.
  await Promise.all([
    sendPushToSchoolAdmins(schoolId, {
      title: 'Una familia quiere entrar',
      body: `${displayName} pidió sumarse al colegio. Entrá a aprobar o rechazar la solicitud.`,
      url: '/admin',
    }),
    sendPendingRequestEmail(schoolId, displayName),
  ])

  redirect('/pending')
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

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`login:${ip}`, 15, 900)
  if (!allowed) return { error: 'Demasiados intentos. Esperá unos minutos y probá de nuevo.' }

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

export async function requestPasswordReset(formData: FormData) {
  const raw = { email: formData.get('email') }
  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const ip = await getClientIp()
  const allowed = await checkRateLimit(`password-reset:${ip}`, 5, 3600)
  if (!allowed) return { error: 'Demasiados intentos. Probá de nuevo más tarde.' }

  const origin = await getOrigin()
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  })

  // Si Supabase no pudo enviar el mail por su propio límite de envíos, avisamos
  // (esto no revela si el email existe, solo que el envío en sí falló)
  if (error?.message?.toLowerCase().includes('rate limit')) {
    return { error: 'No pudimos enviar el email en este momento. Probá de nuevo en un rato.' }
  }

  // Para el resto de los casos, siempre "success" exista o no la cuenta,
  // para no revelar qué emails están registrados
  return { success: true }
}

export async function updateProfile(formData: FormData) {
  const raw = {
    displayName: formData.get('displayName'),
    phone: formData.get('phone') || undefined,
    contactEmail: formData.get('contactEmail') || undefined,
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
      display_name: parsed.data.displayName,
      phone: parsed.data.phone || null,
      contact_email: parsed.data.contactEmail || null,
      contact_note: parsed.data.contactNote,
    })
    .eq('id', user.id)

  if (error) return { error: 'No se pudo actualizar el perfil' }

  return { success: true }
}

export async function deleteMyAccount(formData: FormData) {
  const confirmation = formData.get('confirmation')
  if (confirmation !== 'ELIMINAR') {
    return { error: 'Escribí ELIMINAR para confirmar' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const service = createServiceClient()

  await service.from('ratings').delete().or(`rater_family_id.eq.${user.id},rated_family_id.eq.${user.id}`)
  await service.from('conversations').delete().or(`family_a_id.eq.${user.id},family_b_id.eq.${user.id}`)

  const { data: familyListings } = await service.from('listings').select('id').eq('family_id', user.id)
  const listingIds = (familyListings ?? []).map((l) => l.id)
  if (listingIds.length > 0) {
    await service.from('contacts').delete().in('listing_id', listingIds)
  }
  await service.from('contacts').delete().eq('buyer_family_id', user.id)

  // Todas las fotos que haya subido esta familia, no solo las de publicaciones activas
  const { data: files } = await service.storage.from('listing-images').list(user.id)
  if (files && files.length > 0) {
    await service.storage.from('listing-images').remove(files.map((f) => `${user.id}/${f.name}`))
  }

  await service.from('listings').delete().eq('family_id', user.id)
  await service.from('invitations').update({ used_by: null, used_at: null }).eq('used_by', user.id)
  await service.from('invitations').update({ created_by: null }).eq('created_by', user.id)

  const { error } = await service.auth.admin.deleteUser(user.id)
  if (error) return { error: 'No se pudo eliminar la cuenta. Probá de nuevo.' }

  await supabase.auth.signOut()
  redirect('/')
}
