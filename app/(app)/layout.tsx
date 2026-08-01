import Link from 'next/link'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { SchoolBadge } from '@/components/SchoolBadge'
import { signOut } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isSchoolAdmin = false
  if (user) {
    const { data: family } = await supabase.from('families').select('role').eq('id', user.id).single()
    isSchoolAdmin = family?.role === 'school_admin'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/catalog" className="font-bold text-lg tracking-tight">SchoolShop</Link>
          <nav className="flex items-center gap-2">
            <Suspense fallback={<div className="w-24 h-5 bg-muted animate-pulse rounded" />}>
              <SchoolBadge />
            </Suspense>
            <Link href="/sell/book">
              <Button variant="outline" size="sm">+ Libro</Button>
            </Link>
            <Link href="/sell/uniform">
              <Button variant="outline" size="sm">+ Uniforme</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm">Mi perfil</Button>
            </Link>
            <Link href="/my-listings">
              <Button variant="ghost" size="sm">Mis publicaciones</Button>
            </Link>
            {isSchoolAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">Admin</Button>
              </Link>
            )}
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">Salir</Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
