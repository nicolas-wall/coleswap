'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bookListingSchema, uniformListingSchema } from '@/lib/schemas'
import type { Family, Listing } from '@/types/database'

export async function createBookListing(formData: FormData) {
  const raw = {
    isbn: formData.get('isbn'),
    title: formData.get('title'),
    author: formData.get('author'),
    subject: formData.get('subject'),
    grade: formData.get('grade'),
    condition: formData.get('condition'),
    price: formData.get('price') || null,
    notes: formData.get('notes') || null,
  }

  const parsed = bookListingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

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
    subject: parsed.data.subject,
    grade: parsed.data.grade,
  })

  if (bookErr) {
    await supabase.from('listings').delete().eq('id', listing.id)
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

  const parsed = uniformListingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

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
    return { error: 'Error al guardar los datos del uniforme.' }
  }

  redirect(`/listings/${listing.id}`)
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

export async function removeListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' as const })
    .eq('id', listingId)
    .eq('family_id', user.id)

  if (error) return { error: 'No se pudo eliminar la publicación' }

  return { success: true }
}
