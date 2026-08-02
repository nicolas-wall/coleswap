import { Suspense } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { createClient } from '@/lib/supabase/server'

interface FamilyWithSchool {
  role: string
  display_name: string | null
  schools: { name: string; short_name: string | null; crest_url: string | null } | null
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isSchoolAdmin = false
  let isPlatformAdmin = false
  let displayName = ''
  let schoolName: string | null = null
  let crestUrl: string | null = null

  if (user) {
    const { data: family } = await supabase
      .from('families')
      .select('role, display_name, schools(name, short_name, crest_url)')
      .eq('id', user.id)
      .maybeSingle() as { data: FamilyWithSchool | null; error: unknown }

    isSchoolAdmin = family?.role === 'school_admin'
    displayName = family?.display_name ?? ''
    schoolName = family?.schools?.short_name || family?.schools?.name || null
    crestUrl = family?.schools?.crest_url ?? null

    const { data: platformAdmin } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    isPlatformAdmin = Boolean(platformAdmin)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="h-14 bg-primary" />}>
        <AppHeader
          schoolName={schoolName}
          crestUrl={crestUrl}
          displayName={displayName}
          isSchoolAdmin={isSchoolAdmin}
          isPlatformAdmin={isPlatformAdmin}
        />
      </Suspense>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
