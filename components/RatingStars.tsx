'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'xs' | 'sm' | 'md'
}

const sizes = { xs: 'text-xs', sm: 'text-sm', md: 'text-lg' }

export function RatingStars({ value, onChange, readonly = false, size = 'sm' }: Props) {
  const [hovered, setHovered] = useState(0)

  const display = hovered || value

  // En modo lectura no puede haber botones: las estrellas viven adentro del
  // <Link> de ListingCard, y meter contenido interactivo dentro de un <a> es
  // HTML inválido. Además el lector de pantalla leía cinco "botón no
  // disponible" por tarjeta encima del aria-label del grupo.
  if (readonly) {
    return (
      <div className={cn('flex', sizes[size])} role="img" aria-label={`Calificación: ${value} de 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            aria-hidden
            className={cn('leading-none', star <= value ? 'text-amber-400' : 'text-muted-foreground/30')}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex', sizes[size])} aria-label={`Calificación: ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={cn(
            'leading-none transition-colors cursor-pointer hover:scale-110',
            // Área táctil cómoda sin agrandar la estrella.
            'px-1 py-1.5',
            star <= display ? 'text-amber-400' : 'text-muted-foreground/30'
          )}
          aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
