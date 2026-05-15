// ==========================================================
// src/lib/supabase/server.ts
// ==========================================================
//
// This file creates a Supabase client for use on the SERVER
// (inside Server Components, Server Actions, Route Handlers).
//
// KEY DIFFERENCE FROM client.ts:
// On the server, we can't access browser cookies directly.
// "createServerClient" from @supabase/ssr handles reading
// cookies from the incoming request and writing them to
// the outgoing response — this is how auth sessions work
// in Next.js App Router.
//
// IMPORTANT: This file uses "cookies()" from Next.js,
// which is only available inside server-side code.
// Never import this file into a client component.
// ==========================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookie writes are expected to fail here
          }
        },
      },
    }
  )
}