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
  // "await cookies()" gets the cookie jar for this request.
  // We pass it to Supabase so it can read/write the auth session.

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
          // Supabase calls this to READ the auth session cookie
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
              // Supabase calls this to WRITE/UPDATE the auth session cookie
            )
          } catch {
            // If we're in a Server Component (not a Server Action),
            // we can't write cookies. That's fine — reads still work.
          }
        },
      },
    }
  )
}
