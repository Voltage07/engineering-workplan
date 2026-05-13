// ==========================================================
// src/lib/supabase/client.ts
// ==========================================================
//
// This file creates a Supabase client for use in the BROWSER
// (inside React components, event handlers, etc.)
//
// WHY TWO CLIENTS?
// Next.js runs code in two places:
//   1. The SERVER (Node.js) — when generating pages
//   2. The BROWSER (client) — when the user interacts
//
// Each needs its own Supabase client setup.
// This file is the BROWSER version.
//
// The "createBrowserClient" function from @supabase/ssr
// automatically handles storing the auth session in cookies,
// which is what Next.js App Router expects.
// ==========================================================

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    //
    // The "!" at the end tells TypeScript: "I promise this value exists"
    // These come from your .env.local file.
    //
  )
}
