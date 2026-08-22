import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password'
  // Los crons llegan sin sesión y se autentican solos con CRON_SECRET;
  // sin esto el middleware los redirigiría a /login y nunca correrían.
  const isPublicApiRoute = pathname === '/api/schools' || pathname.startsWith('/api/cron/')
  // /reset-password: el link de recuperación establece la sesión del lado del cliente
  // (fragment #access_token), así que el middleware todavía no ve al usuario logueado
  const isPublicContentRoute = pathname === '/' || pathname === '/legal' || pathname === '/faq' || pathname === '/reset-password'

  if (!user && !isAuthRoute && !isPublicApiRoute && !isPublicContentRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/catalog'
    return NextResponse.redirect(url)
  }

  // La landing (/) es para visitantes sin cuenta; si ya estás logueado vas directo a la app
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/catalog'
    return NextResponse.redirect(url)
  }

  const isGateRoute = pathname === '/suspended' || pathname === '/pending'

  if (user && request.method === 'GET' && !isGateRoute && !isAuthRoute && !isPublicContentRoute) {
    const { data: family } = await supabase
      .from('families')
      .select('suspended, approved')
      .eq('id', user.id)
      .single()

    if (family?.suspended) {
      const url = request.nextUrl.clone()
      url.pathname = '/suspended'
      return NextResponse.redirect(url)
    }

    if (family && !family.approved) {
      const url = request.nextUrl.clone()
      url.pathname = '/pending'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  // Los estáticos de public/ tienen que quedar fuera: si no, el proxy los trata
  // como rutas y los manda a /login para el visitante sin sesión — que es
  // justamente quien ve la landing.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm)$).*)',
  ],
}
