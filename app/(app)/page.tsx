import { redirect } from 'next/navigation'

// El catálogo principal vive en /catalog para evitar conflicto de rutas con app/page.tsx
export default function AppRootPage() {
  redirect('/catalog')
}
