// ==========================================================
// src/app/auth/error/page.tsx
// ==========================================================

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400/30 mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Confirmation failed</h2>
        <p className="text-slate-400 text-sm mb-6">
          This confirmation link has expired or is invalid.
          Please try signing up again or contact your administrator.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Sign up again
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 border border-white/10 hover:bg-white/5 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
