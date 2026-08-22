import type { Listing } from '@/types/database'

/** A los 45 días sin confirmar, le preguntamos al dueño si sigue disponible. */
export const NUDGE_AFTER_DAYS = 45
/** A los 60 sin respuesta, se pausa sola y sale del catálogo. */
export const AUTO_PAUSE_AFTER_DAYS = 60

const DAY_MS = 86_400_000

/** Cuándo se confirmó por última vez que la publicación sigue disponible. */
type LifecycleFields = Pick<Listing, 'status' | 'renewed_at'>

export function daysSinceRenewal(listing: LifecycleFields): number {
  return Math.floor((Date.now() - new Date(listing.renewed_at).getTime()) / DAY_MS)
}

/** Activa y vieja: hay que preguntarle al dueño antes de que se pause sola. */
export function needsRenewal(listing: LifecycleFields): boolean {
  return listing.status === 'active' && daysSinceRenewal(listing) >= NUDGE_AFTER_DAYS
}

/** Días que le quedan antes del auto-pausado (0 = se pausa en el próximo barrido). */
export function daysUntilAutoPause(listing: LifecycleFields): number {
  return Math.max(0, AUTO_PAUSE_AFTER_DAYS - daysSinceRenewal(listing))
}

/** "hace 3 días", "hace 2 meses" — para mostrar la antigüedad sin fechas exactas. */
export function relativeAge(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / DAY_MS)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  return months === 1 ? 'hace un mes' : `hace ${months} meses`
}
