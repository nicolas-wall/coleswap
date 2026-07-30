import { redirect } from 'next/navigation'

// Redirige al catálogo. Middleware maneja auth antes de llegar acá.
export default function RootPage() {
  redirect('/catalog')
}
