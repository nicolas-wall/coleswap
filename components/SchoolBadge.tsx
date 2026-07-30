import { createClient } from '@/lib/supabase/server'

interface FamilyWithSchool {
  display_name: string
  schools: { name: string } | null
}

export async function SchoolBadge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: family } = await supabase
    .from('families')
    .select('display_name, schools(name)')
    .eq('id', user.id)
    .single() as { data: FamilyWithSchool | null; error: unknown }

  const schoolName = family?.schools?.name

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground hidden sm:inline">{family?.display_name}</span>
      {schoolName && (
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
          {schoolName}
        </span>
      )}
    </div>
  )
}
