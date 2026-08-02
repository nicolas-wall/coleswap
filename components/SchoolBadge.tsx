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
    <Link href="/catalog" className="flex items-center gap-2.5 min-w-0 shrink-0">
      {school?.crest_url ? (
        <Image
          src={school.crest_url}
          alt=""
          width={40}
          height={40}
          className="rounded-xl object-cover size-9 sm:size-10 shrink-0 ring-1 ring-border"
        />
      ) : (
        <span className="inline-flex items-center justify-center size-9 sm:size-10 rounded-xl bg-primary text-primary-foreground shrink-0">
          <GraduationCap className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="font-bold text-sm sm:text-base leading-tight truncate max-w-[130px] sm:max-w-[220px]">
          {school ? (school.short_name || school.name) : 'SchoolShop'}
        </p>
        {!school && <p className="text-[0.65rem] text-muted-foreground leading-tight hidden sm:block">Insumos escolares</p>}
      </div>
    </Link>
  )
}
