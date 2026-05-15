'use client'
// ==========================================================
// src/components/layout/TopBar.tsx
// ==========================================================

import { format } from 'date-fns'
import type { Profile } from '@/types'

interface TopBarProps {
  profile: Profile | null
  appName?: string
}

export default function TopBar({ profile, appName = 'Road WorkPlan' }: TopBarProps) {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 lg:pl-6 pl-16">
      <div>
        <p className="text-sm text-gray-400">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        {profile?.role === 'admin' && (
          <span className="text-xs font-medium px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            Admin
          </span>
        )}
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
      </div>
    </header>
  )
}