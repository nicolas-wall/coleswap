'use server'

import { createClient } from '@/lib/supabase/server'
import type { Listing, Family } from '@/types/database'

interface ListingWithSeller {
  family_id: string
  status: string
  families: Pick<Family, 'phone' | 'email' | 'display_name'> | null
}

export async function contactSeller(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: listing } = await supabase
    .from('listings')
    .select('family_id, status, families(phone, email, display_name)')
    .eq('id', listingId)
    .single() as { data: ListingWithSeller | null; error: unknown }

  if (!listing) return { error: 'Publicación no encontrada' }
  if (listing.status !== 'active') return { error: 'Esta publicación ya no está disponible' }
  if (listing.family_id === user.id) return { error: 'No podés contactar tu propia publicación' }

  await supabase.from('contacts').upsert({
    listing_id: listingId,
    buyer_family_id: user.id,
  }, { onConflict: 'listing_id,buyer_family_id', ignoreDuplicates: true })

  const seller = listing.families
  return {
    success: true,
    contact: {
      display_name: seller?.display_name ?? '',
      phone: seller?.phone ?? '',
      email: seller?.email ?? '',
    },
  }
}
