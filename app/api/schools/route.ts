import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, short_name, city')
    .order('name', { ascending: true })

  return NextResponse.json({ schools: schools ?? [] })
}
