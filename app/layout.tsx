import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

// Serif cálida para títulos: le da carácter de "libro/colegio" y contrasta con
// la sans neutra que sigue manejando toda la interfaz.
const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://coleswap.vercel.app'
const DESCRIPTION =
  'El marketplace de tu colegio: compra y venta de libros y uniformes entre familias.'

export const metadata: Metadata = {
  // La app se comparte por el grupo de WhatsApp del colegio: sin estas tags el
  // link aparece pelado, sin título ni imagen, y parece spam. metadataBase es
  // obligatorio para que las URLs relativas de la imagen se resuelvan.
  metadataBase: new URL(SITE_URL),
  title: 'ColeSwap',
  description: DESCRIPTION,
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
  openGraph: {
    type: 'website',
    siteName: 'ColeSwap',
    title: 'ColeSwap — el mercado de libros y uniformes de tu colegio',
    description: DESCRIPTION,
    locale: 'es_AR',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ColeSwap — el mercado de libros y uniformes de tu colegio',
    description: DESCRIPTION,
  },
}

export const viewport = {
  // Mismo verde que --primary en globals.css. Se ve en la barra del navegador
  // en Android y al instalar la PWA, así que tiene que coincidir con la app.
  themeColor: '#005e31',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <head>
        {/* Chrome puede disparar beforeinstallprompt antes de que React hidrate
            (sobre todo si el sitio ya era instalable de una visita anterior),
            así que lo capturamos apenas se parsea el documento, no en un
            useEffect que podría llegar tarde. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__installPrompt = e; });`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <ServiceWorkerRegistrar />
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
