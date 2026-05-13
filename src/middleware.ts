// ==========================================================
// src/middleware.ts
// ==========================================================
//
// Middleware runs BEFORE any page loads.
// This is where we protect routes that require login.
//
// HOW IT WORKS:
// 1. User tries to visit /dashboard (or any protected page)
// 2. Middleware runs first
// 3. It checks: "Is this user logged in?"
// 4. If YES → let them through
// 5. If NO → redirect them to /login
//
// It also refreshes the auth session on every request,
// which keeps users logged in across page loads.
//
// WHERE THIS FILE LIVES:
// This file must be at src/middleware.ts
// (NOT inside the app/ folder)
// ==========================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // We start with the default "pass through" response.
  // If everything checks out, we return this unchanged.
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create a Supabase client specifically for middleware.
  // Middleware has its own cookie API (different from server components).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // We need to set cookies on BOTH the request and response
          // so the session is available everywhere during this request cycle
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

  // getUser() both validates AND refreshes the auth session.
  // IMPORTANT: Always use getUser() here, never getSession().
  // getSession() only reads the cookie without validating it,
  // which is a security risk. getUser() actually checks with Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Define which paths require authentication
  const protectedPaths = ['/projects', '/workplan', '/tasks', '/reports', '/inbox', '/admin']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path)) || pathname === '/'

  // Define auth pages (login/signup)
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  if (!user && isProtectedPath) {
    // Not logged in and trying to visit a protected page
    // → redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath) {
    // Already logged in and trying to visit login/signup
    // → redirect to dashboard (no point showing login again)
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Everything is fine — let the request through
  return supabaseResponse
}

// "matcher" tells Next.js WHICH URLs this middleware should run on.
// We exclude static files, images, and Next.js internals for performance.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
