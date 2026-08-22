'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bookListingSchema, uniformListingSchema } from '@/lib/schemas'
import { checkRateLimit } from '@/lib/rate-limit'
import type { Family, Listing, ListingStatus } from '@/types/database'

const IMAGE_PATH_MARKER = '/listing-images/'

/** Pausada también se puede editar: bajás, corregís el precio y la reactivás. */
const EDITABLE_STATUSES: ListingStatus[] = ['active', 'paused']

function extractImagePath(url: string): string | null {
  const idx = url.indexOf(IMAGE_PATH_MARKER)
  return idx === -1 ? null : url.slice(idx + IMAGE_PATH_MARKER.length)
}

async function deleteOrphanedImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  removedUrls: string[]
) {
  const paths = removedUrls.map(extractImagePath).filter((p): p is string => !!p)
  if (paths.length > 0) {
    await supabase.storage.from('listing-images').remove(paths)
  }
}

export async function createBookListing(formData: FormData) {
  const raw = {
    isbn: formData.get('isbn'),
    title: formData.get('title'),
    author: formData.get('author'),
    publisher: formData.get('publisher') || null,
    subject: formData.get('subject'),
    grade: formData.get('grade'),
    condition: formData.get('condition'),
    price: formData.get('price') || null,
    notes: formData.get('notes') || null,
  }
  const images = formData.getAll('images').map(String).slice(0, 4)

  const parsed = bookListingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const allowed = await checkRateLimit(`create-listing:${user.id}`, 20, 86400)
  if (!allowed) return { error: 'Publicaste demasiadas cosas hoy. Probá de nuevo mañana.' }

  const { data: family } = await supabase
    .from('families')
    .select('school_id')
    .eq('id', user.id)
    .single() as { data: Pick<Family, 'school_id'> | null; error: unknown }

  if (!family) return { error: 'Perfil no encontrado' }

  const { data: listing, error: listErr } = await supabase
    .from('listings')
    .insert({
      school_id: family.school_id,
      family_id: user.id,
      type: 'book',
      condition: parsed.data.condition,
      price: parsed.data.price ?? null,
      notes: parsed.data.notes ?? null,
      images,
    })
    .select('id')
    .single() as { data: Pick<Listing, 'id'> | null; error: unknown }

  if (listErr || !listing) {
    return { error: 'Error al publicar. Intentá de nuevo.' }
  }

  const { error: bookErr } = await supabase.from('book_details').insert({
    listing_id: listing.id,
    isbn: parsed.data.isbn,
    title: parsed.data.title,
    author: parsed.data.author,
    publisher: parsed.data.publisher,
    subject: parsed.data.subject,
    grade: parsed.data.grade,
  })

  if (bookErr) {
    await supabase.from('listings').delete().eq('id', listing.id)
    await deleteOrphanedImages(supabase, images)
    return { error: 'Error al guardar los datos del libro.' }
  }

  redirect(`/listings/${listing.id}`)
}

export async function createUniformListing(formData: FormData) {
  const raw = {
    garmentType: formData.get('garmentType'),
    size: formData.get('size'),
    gender: formData.get('gender'),
    color: formData.get('color') || null,
    condition: formData.get('condition'),
    price: formData.get('price') || null,
    notes: formData.get('notes') || null,
  }
  const images = formData.getAll('images').map(String).slice(0, 4)

  const parsed = uniformListingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const allowed = await checkRateLimit(`create-listing:${user.id}`, 20, 86400)
  if (!allowed) return { error: 'Publicaste demasiadas cosas hoy. Probá de nuevo mañana.' }

  const { data: family } = await supabase
    .from('families')
    .select('school_id')
    .eq('id', user.id)
    .single() as { data: Pick<Family, 'school_id'> | null; error: unknown }

  if (!family) return { error: 'Perfil no encontrado' }

  const { data: listing, error: listErr } = await supabase
    .from('listings')
    .insert({
      school_id: family.school_id,
      family_id: user.id,
      type: 'uniform',
      condition: parsed.data.condition,
      price: parsed.data.price ?? null,
      notes: parsed.data.notes ?? null,
      images,
    })
    .select('id')
    .single() as { data: Pick<Listing, 'id'> | null; error: unknown }

  if (listErr || !listing) {
    return { error: 'Error al publicar. Intentá de nuevo.' }
  }

  const { error: uniErr } = await supabase.from('uniform_details').insert({
    listing_id: listing.id,
    garment_type: parsed.data.garmentType,
    size: parsed.data.size,
    gender: parsed.data.gender,
    color: parsed.data.color ?? null,
  })

  if (uniErr) {
    await supabase.from('listings').delete().eq('id', listing.id)
    await deleteOrphanedImages(supabase, images)
    return { error: 'Error al guardar los datos del uniforme.' }
  }

  redirect(`/listings/${listing.id}`)
}

const bookUpdateSchema = bookListingSchema.omit({ isbn: true })

export async function updateBookListing(listingId: string, formData: FormData) {
  const raw = {
    title: formData.get('title'),
    author: formData.get('author'),
    publisher: formData.get('publisher') || null,
    subject: formData.get('subject'),
    grade: formData.get('grade'),
    condition: formData.get('condition'),
    price: formData.get('price') || null,
    notes: formData.get('notes') || null,
  }
  const images = formData.getAll('images').map(String).slice(0, 4)

  const parsed = bookUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: existing } = await supabase
    .from('listings')
    .select('images, status')
    .eq('id', listingId)
    .eq('family_id', user.id)
    .single() as { data: Pick<Listing, 'images' | 'status'> | null; error: unknown }

  if (!existing) return { error: 'Publicación no encontrada' }
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    return { error: 'Solo se pueden editar publicaciones activas o pausadas' }
  }

  const { error: listErr } = await supabase
    .from('listings')
    .update({
      condition: parsed.data.condition,
      price: parsed.data.price ?? null,
      notes: parsed.data.notes ?? null,
      images,
      // Editarla es confirmar que seguís teniéndola: el reloj vuelve a cero.
      renewed_at: new Date().toISOString(),
      nudged_at: null,
    })
    .eq('id', listingId)

  if (listErr) return { error: 'No se pudo guardar los cambios' }

  const { error: bookErr } = await supabase
    .from('book_details')
    .update({
      title: parsed.data.title,
      author: parsed.data.author,
      publisher: parsed.data.publisher,
      subject: parsed.data.subject,
      grade: parsed.data.grade,
    })
    .eq('listing_id', listingId)

  if (bookErr) return { error: 'No se pudo guardar los datos del libro' }

  const removedImages = (existing.images ?? []).filter((url) => !images.includes(url))
  await deleteOrphanedImages(supabase, removedImages)

  redirect(`/listings/${listingId}`)
}

export async function updateUniformListing(listingId: string, formData: FormData) {
  const raw = {
    garmentType: formData.get('garmentType'),
    size: formData.get('size'),
    gender: formData.get('gender'),
    color: formData.get('color') || null,
    condition: formData.get('condition'),
    price: formData.get('price') || null,
    notes: formData.get('notes') || null,
  }
  const images = formData.getAll('images').map(String).slice(0, 4)

  const parsed = uniformListingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: existing } = await supabase
    .from('listings')
    .select('images, status')
    .eq('id', listingId)
    .eq('family_id', user.id)
    .single() as { data: Pick<Listing, 'images' | 'status'> | null; error: unknown }

  if (!existing) return { error: 'Publicación no encontrada' }
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    return { error: 'Solo se pueden editar publicaciones activas o pausadas' }
  }

  const { error: listErr } = await supabase
    .from('listings')
    .update({
      condition: parsed.data.condition,
      price: parsed.data.price ?? null,
      notes: parsed.data.notes ?? null,
      images,
      // Editarla es confirmar que seguís teniéndola: el reloj vuelve a cero.
      renewed_at: new Date().toISOString(),
      nudged_at: null,
    })
    .eq('id', listingId)

  if (listErr) return { error: 'No se pudo guardar los cambios' }

  const { error: uniErr } = await supabase
    .from('uniform_details')
    .update({
      garment_type: parsed.data.garmentType,
      size: parsed.data.size,
      gender: parsed.data.gender,
      color: parsed.data.color ?? null,
    })
    .eq('listing_id', listingId)

  if (uniErr) return { error: 'No se pudo guardar los datos del uniforme' }

  const removedImages = (existing.images ?? []).filter((url) => !images.includes(url))
  await deleteOrphanedImages(supabase, removedImages)

  redirect(`/listings/${listingId}`)
}

export async function markSold(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'sold' as const, sold_at: new Date().toISOString() })
    .eq('id', listingId)
    .eq('family_id', user.id)

  if (error) return { error: 'No se pudo marcar como vendido' }

  return { success: true }
}

/**
 * "Sí, sigue disponible": reinicia el reloj de los 45/60 días sin tocar nada más.
 */
export async function confirmListingActive(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('listings')
    .update({ renewed_at: new Date().toISOString(), nudged_at: null })
    .eq('id', listingId)
    .eq('family_id', user.id)
    .eq('status', 'active')

  if (error) return { error: 'No se pudo confirmar la publicación' }

  return { success: true }
}

/**
 * Bajarla del catálogo sin perderla: conserva fotos, datos y conversaciones.
 * Es lo opuesto a removeListing, que borra las imágenes y no tiene vuelta atrás.
 */
export async function pauseListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('listings')
    .update({
      status: 'paused' as const,
      paused_at: new Date().toISOString(),
      paused_reason: 'manual' as const,
    })
    .eq('id', listingId)
    .eq('family_id', user.id)
    .eq('status', 'active')

  if (error) return { error: 'No se pudo pausar la publicación' }

  return { success: true }
}

/** Vuelve al catálogo con el reloj en cero. */
export async function reactivateListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('listings')
    .update({
      status: 'active' as const,
      renewed_at: new Date().toISOString(),
      nudged_at: null,
      paused_at: null,
      paused_reason: null,
    })
    .eq('id', listingId)
    .eq('family_id', user.id)
    .eq('status', 'paused')

  if (error) return { error: 'No se pudo reactivar la publicación' }

  return { success: true }
}

export async function removeListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: existing } = await supabase
    .from('listings')
    .select('images')
    .eq('id', listingId)
    .eq('family_id', user.id)
    .single() as { data: Pick<Listing, 'images'> | null; error: unknown }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' as const })
    .eq('id', listingId)
    .eq('family_id', user.id)

  if (error) return { error: 'No se pudo eliminar la publicación' }

  await deleteOrphanedImages(supabase, existing?.images ?? [])

  return { success: true }
}
