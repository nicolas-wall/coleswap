'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export function HeaderSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setQ(pathname === '/catalog' ? (searchParams.get('q') ?? '') : '')
  }, [pathname, searchParams])

  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus()
  }, [mobileOpen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMobileOpen(false)
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog')
  }

  return (
    <>
      {/* Desktop: always-visible search bar */}
      <form onSubmit={handleSubmit} className="relative flex-1 max-w-xl hidden sm:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar título, autor…"
          className="w-full h-10 pl-10 pr-4 rounded-full border-0 bg-background text-foreground text-sm outline-none ring-1 ring-transparent focus-visible:ring-3 focus-visible:ring-ring/50 transition-shadow"
        />
      </form>

      {/* Mobile: magnifying-glass button that expands into the search bar */}
      <div className="sm:hidden flex-1 flex justify-end min-w-0">
        {mobileOpen ? (
          <form onSubmit={handleSubmit} className="relative w-full flex items-center gap-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="w-full h-9 pl-10 pr-3 rounded-full border-0 bg-background text-foreground text-sm outline-none ring-1 ring-transparent focus-visible:ring-3 focus-visible:ring-ring/50 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="shrink-0 p-1.5 rounded-full text-primary-foreground/80 hover:text-primary-foreground"
              aria-label="Cerrar búsqueda"
            >
              <X className="size-4" />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-full text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            aria-label="Buscar"
          >
            <Search className="size-5" />
          </button>
        )}
      </div>
    </>
  )
}
