import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NUDGE_AFTER_DAYS } from '@/lib/lifecycle'

const SELECT = `
  id, type, status, price, renewed_at, paused_at,
  book_details(title),
  uniform_details(garment_type)
`

/**
 * Alimenta el banner de ciclo de vida: lo que necesita una respuesta del dueño.
 * - stale: activas y viejas, a punto de pausarse solas.
 * - autoPaused: ya pausadas por antigüedad, por si nunca vio el aviso.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ stale: [], autoPaused: [] }, { status: 401 })

  const cutoff = new Date(Date.now() - NUDGE_AFTER_DAYS * 86_400_000).toISOString()

  const [{ data: stale }, { data: autoPaused }] = await Promise.all([
    supabase
      .from('listings')
      .select(SELECT)
      .eq('family_id', user.id)
      .eq('status', 'active')
      .lte('renewed_at', cutoff)
      .order('renewed_at', { ascending: true }),
    supabase
      .from('listings')
      .select(SELECT)
      .eq('family_id', user.id)
      .eq('status', 'paused')
      .eq('paused_reason', 'expired')
      .order('paused_at', { ascending: false }),
  ])

  return NextResponse.json({ stale: stale ?? [], autoPaused: autoPaused ?? [] })
}
