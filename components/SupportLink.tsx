import { Heart } from 'lucide-react'

const DONATION_URL = process.env.NEXT_PUBLIC_DONATION_URL

export function SupportLink() {
  if (!DONATION_URL) return null

  return (
    <a
      href={DONATION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
    >
      <Heart className="size-3.5" />
      Bancá el proyecto
    </a>
  )
}
