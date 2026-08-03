import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: isAdmin } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: families } = await supabase
    .from('families')
    .select('id, school_id, display_name, email, role, approved')
    .order('display_name', { ascending: true })

  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, school_id, code, multi_use, expires_at, used_by, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ schools: schools ?? [], families: families ?? [], invitations: invitations ?? [] })
}
