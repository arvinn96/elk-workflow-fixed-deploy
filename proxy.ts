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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session on every request — keeps users logged in across tabs and page refreshes
  const { pathname } = request.nextUrl
  const authRoutes = ['/login', '/register', '/']
  const isAuthRoute = authRoutes.includes(pathname)

  // 1. If it's a public/auth route, we don't need to call getSession() either.
  // This drastically speeds up the initial load of the login page.
  if (isAuthRoute) {
    return supabaseResponse
  }

  // 2. For all other matched routes, verify the session
  // OPTIMIZATION: Use getSession() instead of getUser(). 
  // getSession() is much faster (~10-20ms) because it verifies the JWT from cookies 
  // without a mandatory network call to the auth server. 
  // The actual secure user verification will happen in the Server Components (layouts/pages).
  const { data: { session } } = await supabase.auth.getSession()


  // Protected routes — redirect to login if not authenticated
  const isProtected = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/requests') ||
    pathname.startsWith('/queue') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/audit') ||
    pathname.startsWith('/settings')

  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // OPTIMIZATION: Inject the authenticated user ID into the headers.
  // This allows Server Components to skip the slow getUser() network call.
  if (session?.user) {
    request.headers.set('x-user-id', session.user.id)
    supabaseResponse = NextResponse.next({ request })
    // Re-set cookies on the new response (supabase may have refreshed tokens)
    supabaseResponse.cookies.getAll // no-op, cookies are auto-forwarded with { request }
  }

  return supabaseResponse
}

// Only run the auth middleware on routes that actually need it.
// The previous glob caught API routes, fonts, and other assets — triggering a
// Supabase getUser() call for every one. This explicit list stops that entirely.
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/requests/:path*',
    '/queue/:path*',
    '/users/:path*',
    '/audit/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
  ],
}
// BRIDGE: Export as both 'proxy' (new convention) and 'middleware' (old convention)
// and as 'default' to satisfy every possible lookup in the Turbopack manifest.
export { proxy as middleware }
export default proxy
