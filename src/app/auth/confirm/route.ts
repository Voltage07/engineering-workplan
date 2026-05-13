// ==========================================================
// src/app/auth/confirm/route.ts
// ==========================================================
//
// This is a Next.js ROUTE HANDLER (not a page).
// Route handlers respond to HTTP requests — like a mini API.
//
// WHY THIS EXISTS:
// When a user clicks the confirmation link in their email,
// Supabase redirects them to:
//   https://yourapp.com/auth/confirm?token_hash=xxx&type=email
//
// This route handler:
//   1. Reads the token from the URL
//   2. Calls Supabase to verify it
//   3. Redirects the user to the dashboard (success)
//      or to an error page (failure)
//
// Without this, email confirmation silently fails and the
// user can never log in after signing up.
// ==========================================================

import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  // "next" is where to redirect after confirmation (defaults to dashboard)

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Email confirmed successfully — send to dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — redirect to error page
  return NextResponse.redirect(`${origin}/auth/error`)
}
