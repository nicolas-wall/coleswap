import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000], ['month', 2592000], ['week', 604800],
  ['day', 86400], ['hour', 3600], ['minute', 60],
]

const relativeFormatter = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' })

export function formatRelativeTime(isoDate: string) {
  const diffSeconds = (Date.parse(isoDate) - Date.now()) / 1000
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relativeFormatter.format(Math.round(diffSeconds / seconds), unit)
    }
  }
  return relativeFormatter.format(Math.round(diffSeconds / 60) || 0, 'minute')
}
