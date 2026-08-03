import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ profile: null }, { status: 401 })

  const { data: profile } = await supabase
    .from('families')
    .select('display_name, phone, email, social_handle, contact_note')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ profile: profile ?? null, loginEmail: user.email ?? null })
}
