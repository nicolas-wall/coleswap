import Link from 'next/link'
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
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Recomendado para tu familia</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recommended.map((listing: ListingWithDetails) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <form method="get" className="flex flex-wrap gap-2 items-center flex-1">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Buscar título, autor…"
            className="border rounded-md px-3 py-1.5 text-sm bg-background min-w-[180px]"
          />
          <select
            name="type"
            defaultValue={params.type ?? ''}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
          >
            <option value="">Todo</option>
            <option value="book">Libros</option>
            <option value="uniform">Uniformes</option>
          </select>
          <select
            name="condition"
            defaultValue={params.condition ?? ''}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
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
      </div>

      {/* Grid */}
      {rest.length === 0 && !(!hasActiveFilters && recommended && recommended.length > 0) ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">No hay publicaciones</p>
          <p className="text-sm mb-6">Sé el primero en publicar un artículo para tu colegio.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/sell/book"><Button variant="outline">Publicar libro</Button></Link>
            <Link href="/sell/uniform"><Button variant="outline">Publicar uniforme</Button></Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{rest.length} publicación{rest.length !== 1 ? 'es' : ''}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {rest.map((listing: ListingWithDetails) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
