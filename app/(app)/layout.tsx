import Link from 'next/link'
import { Suspense } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchoolBadge } from '@/components/SchoolBadge'
import { NavMenu } from '@/components/NavMenu'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isSchoolAdmin = false
  let isPlatformAdmin = false
  if (user) {
    const { data: family } = await supabase.from('families').select('role').eq('id', user.id).maybeSingle()
    isSchoolAdmin = family?.role === 'school_admin'

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
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/catalog" className="flex items-center gap-1.5 font-bold text-lg tracking-tight shrink-0">
            <span className="inline-flex items-center justify-center size-7 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="hidden sm:inline">SchoolShop</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Suspense fallback={<div className="w-24 h-5 bg-muted animate-pulse rounded" />}>
              <SchoolBadge />
            </Suspense>
            <Link href="/sell/book">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Libro</span>
              </Button>
            </Link>
            <Link href="/sell/uniform">
              <Button variant="outline" size="sm" className="gap-1">
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Uniforme</span>
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
