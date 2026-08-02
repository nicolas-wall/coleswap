import Link from 'next/link'
import Image from 'next/image'
import { GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface FamilyWithSchool {
  schools: { name: string; short_name: string | null; crest_url: string | null } | null
}

export async function SchoolBadge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: family } = await supabase
    .from('families')
    .select('schools(name, short_name, crest_url)')
    .eq('id', user.id)
    .maybeSingle() as { data: FamilyWithSchool | null; error: unknown }

  const school = family?.schools

  return (
    <Link href="/catalog" className="flex items-center gap-2 min-w-0 shrink-0">
      {school?.crest_url ? (
        <Image
          src={school.crest_url}
          alt=""
          width={32}
          height={32}
          className="rounded-lg object-cover size-7 shrink-0 ring-1 ring-border"
        />
      ) : (
        <span className="inline-flex items-center justify-center size-7 rounded-lg bg-muted text-muted-foreground shrink-0">
          <GraduationCap className="size-4" />
        </span>
      )}
      {school && (
        <p className="font-semibold text-sm leading-tight truncate max-w-[130px] sm:max-w-[220px]">
          {school.short_name || school.name}
        </p>
      )}
    </Link>
  )
}
