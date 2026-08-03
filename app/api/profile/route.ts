import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ profile: null }, { status: 401 })

  // Los campos de contacto ya no son legibles con el cliente del usuario
  // (grants por columna, migración 021): la propia fila se lee con service role
  const service = createServiceClient()
  const { data: profile } = await service
    .from('families')
    .select('display_name, phone, email, contact_email, contact_note')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ profile: profile ?? null, loginEmail: user.email ?? null })
}
