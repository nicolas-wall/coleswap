import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://coleswap.vercel.app'

// Todo lo que está detrás de sesión ya devuelve 307 a /login, así que un crawler
// no puede ver nada igual. Declararlo explícito evita que gaste tiempo en rutas
// privadas y que el buscador indexe una fila de páginas de login idénticas.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/faq', '/legal'],
      disallow: [
        '/api/',
        '/catalog',
        '/listings/',
        '/messages',
        '/my-listings',
        '/profile',
        '/admin',
        '/sell/',
        '/rate/',
        '/login',
        '/signup',
        '/reset-password',
        '/forgot-password',
        '/pending',
        '/suspended',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
