import Link from 'next/link'
import { Sparkles, PackageSearch, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/ListingCard'
import { Button } from '@/components/ui/button'
import type { ListingWithDetails } from '@/types/database'

interface SearchParams {
  type?: string
  condition?: string
  q?: string
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let query = supabase
    .from('listings')
    .select(`
      *,
      book_details(*),
      uniform_details(*),
      family:families!listings_family_id_fkey(id, display_name, rating_avg, rating_count)
    `)
    .eq('status', 'active')
    .neq('family_id', user.id)
    .order('created_at', { ascending: false })
    .limit(40)

  if (params.type === 'book' || params.type === 'uniform') {
    query = query.eq('type', params.type)
  }
  if (params.condition) {
    query = query.eq('condition', params.condition as 'como_nuevo' | 'buen_estado' | 'regular')
  }

  const { data: listings } = await query

  const { data: children } = await supabase
    .from('children')
    .select('grade')
    .eq('family_id', user.id)

  const childGrades = [...new Set((children ?? []).map((c) => c.grade))]

  const { data: recommended } = childGrades.length
    ? await supabase
        .from('listings')
        .select(`
          *,
          book_details!inner(*),
          uniform_details(*),
          family:families!listings_family_id_fkey(id, display_name, rating_avg, rating_count)
        `)
        .eq('status', 'active')
        .neq('family_id', user.id)
        .in('book_details.grade', childGrades)
        .order('created_at', { ascending: false })
        .limit(8)
    : { data: null }

  // Filtro de búsqueda textual en memoria (para MVP — en producción usar FTS de Postgres)
  const filtered = params.q
    ? (listings ?? []).filter((l: ListingWithDetails) => {
        const q = params.q!.toLowerCase()
        if (l.book_details) {
          return (
            l.book_details.title.toLowerCase().includes(q) ||
            l.book_details.author.toLowerCase().includes(q) ||
            l.book_details.subject.toLowerCase().includes(q)
          )
        }
        return false
      })
    : (listings ?? [])

  const hasActiveFilters = Boolean(params.q || params.type || params.condition)
  const recommendedIds = new Set((recommended ?? []).map((l) => l.id))
  const rest = hasActiveFilters ? filtered : filtered.filter((l) => !recommendedIds.has(l.id))

  return (
    <div className="space-y-6">
      {!hasActiveFilters && recommended && recommended.length > 0 && (
        <div className="space-y-2 bg-accent/40 border border-accent rounded-xl p-4">
          <h2 className="text-sm font-semibold text-accent-foreground flex items-center gap-1.5">
            <Sparkles className="size-4" />
            Recomendado para tu familia
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recommended.map((listing: ListingWithDetails) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {params.q && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Buscando:</span>
          <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full pl-2.5 pr-1.5 py-0.5">
            {params.q}
            <Link
              href={{ pathname: '/catalog', query: { type: params.type, condition: params.condition } }}
              className="hover:text-destructive transition-colors"
              aria-label="Quitar búsqueda"
            >
              <X className="size-3.5" />
            </Link>
          </span>
        </div>
      )}
      <form method="get" className="flex flex-wrap gap-2 items-center">
        {params.q && <input type="hidden" name="q" value={params.q} />}
        <select
          name="type"
          defaultValue={params.type ?? ''}
          className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
        >
          <option value="">Todo</option>
          <option value="book">Libros</option>
          <option value="uniform">Uniformes</option>
        </select>
        <select
          name="condition"
          defaultValue={params.condition ?? ''}
          className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
        >
          <option value="">Cualquier estado</option>
          <option value="como_nuevo">Como nuevo</option>
          <option value="buen_estado">Buen estado</option>
          <option value="regular">Regular</option>
        </select>
        <Button type="submit" size="sm" variant="outline">Filtrar</Button>
        {(params.q || params.type || params.condition) && (
          <Link href="/catalog"><Button type="button" size="sm" variant="ghost">Limpiar</Button></Link>
        )}
      </form>

      {/* Grid */}
      {rest.length === 0 && !(!hasActiveFilters && recommended && recommended.length > 0) ? (
        <div className="text-center py-20 text-muted-foreground">
          <PackageSearch className="size-12 mx-auto mb-4 text-muted-foreground/40" strokeWidth={1.25} />
          <p className="text-lg font-medium text-foreground mb-1">No hay publicaciones</p>
          <p className="text-sm mb-6">Sé el primero en publicar un artículo para tu colegio.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/sell/book"><Button variant="outline">Publicar libro</Button></Link>
            <Link href="/sell/uniform"><Button variant="outline">Publicar uniforme</Button></Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{rest.length} publicación{rest.length !== 1 ? 'es' : ''}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {rest.map((listing: ListingWithDetails) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
