'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ratingSchema } from '@/lib/schemas'
import type { Listing } from '@/types/database'

interface ContactRow { buyer_family_id: string }

export async function submitRating(listingId: string, formData: FormData) {
  const raw = {
    score: formData.get('score'),
    comment: formData.get('comment') || null,
  }

  const parsed = ratingSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: 'Calificación inválida' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: listing } = await supabase
    .from('listings')
    .select('family_id, status')
    .eq('id', listingId)
    .single() as { data: Pick<Listing, 'family_id' | 'status'> | null; error: unknown }

  if (!listing) return { error: 'Publicación no encontrada' }
  if (listing.status !== 'sold') return { error: 'Solo se puede calificar publicaciones vendidas' }

  let role: 'buyer' | 'seller'
  let ratedFamilyId: string

  if (listing.family_id === user.id) {
    role = 'seller'
    const { data: contact } = await supabase
      .from('contacts')
      .select('buyer_family_id')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single() as { data: ContactRow | null; error: unknown }

    if (!contact) return { error: 'No se encontró al comprador para calificar' }
    ratedFamilyId = contact.buyer_family_id
  } else {
    role = 'buyer'
    ratedFamilyId = listing.family_id

    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_family_id', user.id)
      .single() as { data: { id: string } | null; error: unknown }

    if (!contact) return { error: 'No sos el comprador de esta publicación' }
  }

  const { error: ratingErr } = await supabase.from('ratings').insert({
    listing_id: listingId,
    rater_family_id: user.id,
    rated_family_id: ratedFamilyId,
    role,
    score: parsed.data.score,
    comment: parsed.data.comment ?? null,
  })

  if (ratingErr) {
    if ((ratingErr as { code?: string }).code === '23505') return { error: 'Ya calificaste esta transacción' }
    return { error: 'No se pudo guardar la calificación' }
  }

  // rating_avg / rating_count los recalcula el trigger ratings_refresh_family
  // (migración 021): hacerlo acá fallaba en silencio, porque el RLS no deja
  // que una familia actualice la fila de otra.

  redirect('/my-listings')
}
