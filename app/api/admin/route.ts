import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
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

  // El moderador ve teléfono/email de su colegio: esas columnas ya no salen por
  // el cliente del usuario (migración 021), así que van por service role,
  // scopeado explícitamente al colegio del moderador
  const service = createServiceClient()
  const { data: families } = await service
    .from('families')
    .select('id, display_name, phone, email, role, suspended, approved, joined_via_code, rating_avg, rating_count, created_at')
    .eq('school_id', me.school_id)
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

  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, code, multi_use, expires_at, used_by, created_at')
    .eq('school_id', me!.school_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    schoolId: me!.school_id,
    families: families ?? [],
    listings: listings ?? [],
    invitations: invitations ?? [],
  })
}
