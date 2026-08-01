import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ children: [] }, { status: 401 })

  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', user.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ children: children ?? [] })
}
