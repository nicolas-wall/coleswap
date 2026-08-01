import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Family } from '@/types/database'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: me } = await supabase
    .from('families')
    .select('role, school_id')
    .eq('id', user.id)
    .single() as { data: Pick<Family, 'role' | 'school_id'> | null }

  if (me?.role !== 'school_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: families } = await supabase
    .from('families')
    .select('id, display_name, phone, email, role, suspended, rating_avg, rating_count, created_at')
    .order('created_at', { ascending: false })

  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      book_details(*),
      uniform_details(*),
      family:families!listings_family_id_fkey(id, display_name, rating_avg, rating_count)
    `)
    .order('created_at', { ascending: false })

  return NextResponse.json({ families: families ?? [], listings: listings ?? [] })
}
