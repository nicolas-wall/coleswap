'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { GraduationCap, Search, X } from 'lucide-react'
import { NavMenu } from '@/components/NavMenu'
import { MessagesBell } from '@/components/MessagesBell'

interface Props {
  schoolName: string | null
  crestUrl: string | null
  displayName: string
  isSchoolAdmin: boolean
  isPlatformAdmin: boolean
}

export function AppHeader({ schoolName, crestUrl, displayName, isSchoolAdmin, isPlatformAdmin }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // El buscador es estado del usuario pero tiene que seguir a la URL (volver
  // atrás, limpiar filtros). Es el ajuste durante el render que documenta
  // React, no un efecto: así no hay un render extra con el valor viejo.
  const urlQuery = pathname === '/catalog' ? (searchParams.get('q') ?? '') : ''
  const [q, setQ] = useState(urlQuery)
  const [syncedQuery, setSyncedQuery] = useState(urlQuery)
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery)
    setQ(urlQuery)
  }

  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mobileOpen) mobileInputRef.current?.focus()
  }, [mobileOpen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMobileOpen(false)
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog')
  }

  return (
    <header className="sticky top-0 z-10 bg-primary text-primary-foreground">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/catalog" className="flex items-center gap-1.5 font-display font-semibold text-xl shrink-0">
          <span className="inline-flex items-center justify-center size-7 rounded-lg bg-primary-foreground/15">
            <GraduationCap className="size-4" />
          </span>
          <span className="hidden sm:inline">ColeSwap</span>
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleSubmit} className="relative flex-1 max-w-xl hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar título, autor…"
            aria-label="Buscar publicaciones por título, autor o materia"
            className="w-full h-10 pl-10 pr-4 rounded-full border-0 bg-background text-foreground text-sm outline-none ring-1 ring-transparent focus-visible:ring-3 focus-visible:ring-ring/50 transition-shadow"
          />
        </form>

        {/* Mobile search trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="sm:hidden ml-auto p-2 rounded-full hover:bg-primary-foreground/10 transition-colors"
          aria-label="Buscar"
        >
          <Search className="size-5" />
        </button>

        <Link href="/catalog" className="flex items-center gap-2 min-w-0 shrink-0">
          {crestUrl ? (
            <span className="inline-flex items-center justify-center size-8 rounded-full bg-primary-foreground p-px shrink-0 ring-1 ring-primary-foreground/30">
              <Image
                src={crestUrl}
                alt=""
                width={30}
                height={30}
                className="rounded-full object-cover size-full"
              />
            </span>
          ) : (
            <span className="inline-flex items-center justify-center size-8 rounded-full bg-primary-foreground/15 text-primary-foreground shrink-0">
              <GraduationCap className="size-4" />
            </span>
          )}
          {schoolName && (
            <p className="hidden sm:block font-semibold text-sm leading-tight truncate max-w-[160px]">{schoolName}</p>
          )}
        </Link>

        {displayName && (
          <span className="text-sm hidden md:inline truncate max-w-[140px] text-primary-foreground/90">{displayName}</span>
        )}

        <MessagesBell />
        <NavMenu isSchoolAdmin={isSchoolAdmin} isPlatformAdmin={isPlatformAdmin} />
      </div>

      {mobileOpen && (
        <div className="sm:hidden border-t border-primary-foreground/15 px-4 py-2.5">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              ref={mobileInputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar título, autor…"
              aria-label="Buscar publicaciones por título, autor o materia"
              className="w-full h-9 pl-10 pr-3 rounded-full border-0 bg-background text-foreground text-sm outline-none ring-1 ring-transparent focus-visible:ring-3 focus-visible:ring-ring/50 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="shrink-0 p-1.5 rounded-full text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              aria-label="Cerrar búsqueda"
            >
              <X className="size-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
