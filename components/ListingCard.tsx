import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Shirt } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CONDITION_LABELS, GARMENT_LABELS } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import type { ListingWithDetails } from '@/types/database'
import { RatingStars } from './RatingStars'

interface Props {
  listing: ListingWithDetails
}

const CONDITION_STYLES: Record<string, string> = {
  como_nuevo: 'bg-primary text-primary-foreground',
  buen_estado: 'bg-accent text-accent-foreground',
  regular: 'bg-secondary text-secondary-foreground',
}

export function ListingCard({ listing }: Props) {
  const isBook = listing.type === 'book'
  const TypeIcon = isBook ? BookOpen : Shirt

  const title = isBook
    ? listing.book_details?.title ?? 'Sin título'
    : GARMENT_LABELS[listing.uniform_details?.garment_type ?? ''] ?? ''

  const subtitle = isBook
    ? listing.book_details?.author
    : `Talle ${listing.uniform_details?.size} · ${listing.uniform_details?.gender}`

  const meta = isBook
    ? `${listing.book_details?.subject} · ${listing.book_details?.grade}`
    : listing.uniform_details?.color ? `Color: ${listing.uniform_details.color}` : undefined

  return (
    <Link href={`/listings/${listing.id}`} className="block group">
      <Card className="h-full gap-0 overflow-hidden py-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-warm-lg hover:ring-primary/20">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {listing.images?.[0] ? (
            <Image
              src={listing.images[0]}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/25">
              <TypeIcon className="size-12" strokeWidth={1.25} />
            </div>
          )}
          <Badge className={cn('absolute top-2 left-2 text-[0.7rem]', CONDITION_STYLES[listing.condition])}>
            {CONDITION_LABELS[listing.condition]}
          </Badge>
        </div>
        <CardContent className="pt-3 pb-2 flex-1">
          <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground mb-1">
            <TypeIcon className="size-3" strokeWidth={2} />
            <span>{isBook ? 'Libro' : 'Uniforme'}</span>
          </div>
          <h3 className="font-display font-semibold text-[0.95rem] leading-snug line-clamp-2 mb-1">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>}
          {meta && <p className="text-xs text-muted-foreground/80 mt-0.5">{meta}</p>}
        </CardContent>
        {/* En el grid de dos columnas la tarjeta mide ~170px: precio, familia y
            cinco estrellas no entran en una sola línea, así que van apilados. */}
        <CardFooter className="pt-1 pb-3 flex flex-col items-start gap-0.5">
          <div className="text-base font-bold text-primary">
            {listing.price != null
              ? `$${listing.price.toLocaleString('es-AR')}`
              : <span className="text-muted-foreground text-xs font-medium">A consultar</span>}
          </div>
          <div className="flex w-full min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <span className="truncate">{listing.family.display_name}</span>
            {listing.family.rating_avg != null && (
              <span className="shrink-0">
                <RatingStars value={listing.family.rating_avg} size="xs" readonly />
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
