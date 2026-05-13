'use client'
// ==========================================================
// src/app/(auth)/login/page.tsx
// ==========================================================
//
// 'use client' tells Next.js this is a CLIENT COMPONENT.
// It runs in the browser — so we can use useState, event
// handlers, and browser APIs.
//
// Pages WITHOUT 'use client' are SERVER COMPONENTS by default.
// They run on the server, can't use state or events,
// but can fetch data more efficiently.
//
// Login must be a client component because it has a form
// with state (email, password, loading, error).
// ==========================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
// "@/" is an alias for the "src/" folder. Configured by Next.js automatically.

export default function LoginPage() {
  // useState creates a reactive variable.
  // When you call setEmail('x'), React re-renders the component.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  // useRouter lets us redirect the user programmatically

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // e.preventDefault() stops the browser's default form submit
    // (which would reload the page). We handle it ourselves.

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // supabase.auth.signInWithPassword() sends the credentials
    // to Supabase, which verifies them and returns a session
    // (stored in a cookie automatically by @supabase/ssr).

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Login successful — redirect to dashboard
    router.push('/')
    router.refresh()
    // router.refresh() tells Next.js to re-fetch server data
    // so the new session is picked up immediately.
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Road WorkPlan</h1>
          <p className="text-slate-400 text-sm mt-1">Engineer Co-ordinating Unit</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          <h2 className="text-lg font-medium text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* "space-y-4" adds 16px vertical gap between each child */}

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // onChange fires every time the user types.
                // e.target.value is the current text in the input.
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg
                           text-white placeholder-slate-500 text-sm
                           focus:outline-none focus:border-blue-400 focus:bg-white/10
                           transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg
                           text-white placeholder-slate-500 text-sm
                           focus:outline-none focus:border-blue-400 focus:bg-white/10
                           transition-colors"
              />
            </div>

            {/* Error message — only renders if error is not null */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-medium text-sm rounded-lg
                         transition-colors mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {/* Conditional rendering: show different text based on state */}
            </button>
          </form>

          <div className="flex items-center justify-between mt-5">
            <Link href="/forgot-password" className="text-slate-400 hover:text-slate-300 text-sm transition-colors">
              Forgot password?
            </Link>
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Request access
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
