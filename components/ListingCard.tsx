import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CONDITION_LABELS, GARMENT_LABELS } from '@/lib/schemas'
import type { ListingWithDetails } from '@/types/database'
import { RatingStars } from './RatingStars'

interface Props {
  listing: ListingWithDetails
}

export function ListingCard({ listing }: Props) {
  const isBook = listing.type === 'book'
  const title = isBook
    ? listing.book_details?.title ?? 'Sin título'
    : GARMENT_LABELS[listing.uniform_details?.garment_type ?? ''] ?? ''

  const subtitle = isBook
    ? listing.book_details?.author
    : `Talle ${listing.uniform_details?.size} · ${listing.uniform_details?.gender}`

  const meta = isBook
    ? `${listing.book_details?.subject} · ${listing.book_details?.grade}° año`
    : listing.uniform_details?.color ? `Color: ${listing.uniform_details.color}` : undefined

  return (
    <Link href={`/listings/${listing.id}`} className="block group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardContent className="pt-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant={isBook ? 'default' : 'secondary'} className="text-xs shrink-0">
              {isBook ? '📚 Libro' : '👕 Uniforme'}
            </Badge>
            <Badge variant="outline" className="text-xs shrink-0">
              {CONDITION_LABELS[listing.condition]}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>}
          {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
        </CardContent>
        <CardFooter className="pt-0 pb-3 flex items-center justify-between">
          <div className="text-sm font-medium">
            {listing.price != null ? `$${listing.price.toLocaleString('es-AR')}` : <span className="text-muted-foreground text-xs">Sin precio</span>}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate max-w-[80px]">{listing.family.display_name}</span>
            {listing.family.rating_avg != null && (
              <RatingStars value={listing.family.rating_avg} size="xs" readonly />
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
