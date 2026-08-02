import Link from 'next/link'
import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchoolBadge } from '@/components/SchoolBadge'
import { NavMenu } from '@/components/NavMenu'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isSchoolAdmin = false
  let isPlatformAdmin = false
  let displayName = ''
  if (user) {
    const { data: family } = await supabase.from('families').select('role, display_name').eq('id', user.id).maybeSingle()
    isSchoolAdmin = family?.role === 'school_admin'
    displayName = family?.display_name ?? ''

    const { data: platformAdmin } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    isPlatformAdmin = Boolean(platformAdmin)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Suspense fallback={<div className="w-32 h-9 bg-muted animate-pulse rounded-xl" />}>
            <SchoolBadge />
          </Suspense>
          <nav className="flex items-center gap-2 shrink-0">
            {displayName && (
              <span className="text-sm text-muted-foreground hidden md:inline truncate max-w-[140px]">{displayName}</span>
            )}
            <Link href="/sell/book">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="size-3.5" />
                Libro
              </Button>
            </Link>
            <Link href="/sell/uniform">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="size-3.5" />
                Uniforme
              </Button>
            </Link>
            <NavMenu isSchoolAdmin={isSchoolAdmin} isPlatformAdmin={isPlatformAdmin} />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
