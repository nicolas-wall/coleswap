'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ratingSchema } from '@/lib/schemas'
import type { Listing } from '@/types/database'

interface ContactRow { buyer_family_id: string }
interface RatingRow { score: number }

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
    return { error: 'Error al guardar la calificación' }
  }

  const { data: avgData } = await supabase
    .from('ratings')
    .select('score')
    .eq('rated_family_id', ratedFamilyId) as { data: RatingRow[] | null; error: unknown }

  if (avgData && avgData.length > 0) {
    const avg = avgData.reduce((s, r) => s + r.score, 0) / avgData.length
    await supabase
      .from('families')
      .update({ rating_avg: Math.round(avg * 100) / 100, rating_count: avgData.length })
      .eq('id', ratedFamilyId)
  }

  redirect('/my-listings')
}
