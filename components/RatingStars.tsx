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

  return (
    <div className={cn('flex', sizes[size])} aria-label={`Calificación: ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            'leading-none transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
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
