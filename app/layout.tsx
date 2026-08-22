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

export const metadata: Metadata = {
  title: 'ColeSwap',
  description: 'Mercado de insumos escolares de tu colegio',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
}

export const viewport = {
  themeColor: '#1f6b45',
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
