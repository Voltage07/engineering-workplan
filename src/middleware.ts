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
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const protectedPaths = ['/projects', '/workplan', '/tasks', '/reports', '/inbox', '/admin']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path)) || pathname === '/'

  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}