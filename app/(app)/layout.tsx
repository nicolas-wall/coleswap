import Link from 'next/link'
import { Suspense } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchoolBadge } from '@/components/SchoolBadge'
import { HeaderSearch } from '@/components/HeaderSearch'
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
      <header className="sticky top-0 z-10">
        {/* Main bar: brand + search */}
        <div className="bg-primary text-primary-foreground">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/catalog" className="flex items-center gap-1.5 font-bold text-lg tracking-tight shrink-0">
              <span className="inline-flex items-center justify-center size-7 rounded-lg bg-primary-foreground/15">
                <GraduationCap className="size-4" />
              </span>
              <span className="hidden sm:inline">SchoolShop</span>
            </Link>
            <Suspense fallback={<div className="flex-1 max-w-xl h-10 rounded-full bg-primary-foreground/10" />}>
              <HeaderSearch />
            </Suspense>
          </div>
        </div>

        {/* Secondary bar: school + user + actions */}
        <div className="border-b bg-background/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
            <Suspense fallback={<div className="w-28 h-7 bg-muted animate-pulse rounded-lg" />}>
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
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
