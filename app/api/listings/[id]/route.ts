import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ListingWithDetails } from '@/types/database'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      book_details(*),
      uniform_details(*),
      family:families!listings_family_id_fkey(id, display_name, phone, email, rating_avg, rating_count)
    `)
    .eq('id', id)
    .single() as { data: ListingWithDetails | null; error: unknown }

  if (!listing) return NextResponse.json({ listing: null }, { status: 404 })

  // No exponer phone/email hasta que se solicite contacto explícitamente
  const { family, ...rest } = listing
  const safeListing = {
    ...rest,
    family: {
      id: family.id,
      display_name: family.display_name,
      rating_avg: family.rating_avg,
      rating_count: family.rating_count,
      // phone y email omitidos intencionalmente
    },
  }

  return NextResponse.json({ listing: safeListing })
}
