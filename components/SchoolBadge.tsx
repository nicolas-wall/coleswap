import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

interface FamilyWithSchool {
  display_name: string
  schools: { name: string; crest_url: string | null } | null
}

export async function SchoolBadge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: family } = await supabase
    .from('families')
    .select('display_name, schools(name, crest_url)')
    .eq('id', user.id)
    .single() as { data: FamilyWithSchool | null; error: unknown }

  const school = family?.schools

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground hidden sm:inline">{family?.display_name}</span>
      {school && (
        <span className="flex items-center gap-1.5 bg-primary/10 text-primary pl-1 pr-2 py-0.5 rounded-full text-xs font-medium">
          {school.crest_url && (
            <Image src={school.crest_url} alt="" width={18} height={18} className="rounded-full object-cover" />
          )}
          {school.name}
        </span>
      )}
    </div>
  )
}
