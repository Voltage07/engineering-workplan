// ==========================================================
// src/app/(dashboard)/layout.tsx
// ==========================================================
//
// This layout wraps ALL dashboard pages:
//   /, /projects, /workplan, /tasks, /reports, /inbox
//
// WHY IS THE FOLDER CALLED "(dashboard)"?
// Folders with parentheses like (dashboard) are "route groups".
// They let us group related pages and share a layout WITHOUT
// the folder name appearing in the URL.
//
// So:
//   (dashboard)/page.tsx      → URL is "/"
//   (dashboard)/projects/page.tsx → URL is "/projects"
//   NOT "/dashboard/projects"
//
// This layout fetches the current user from Supabase (server-side)
// and passes profile info down to the Sidebar.
// ==========================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This is a SERVER COMPONENT (no 'use client').
  // We can use async/await directly at the top level.

  const supabase = await createClient()

  // Get the logged-in user from the session cookie
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Middleware should catch this first, but this is a safety net
    redirect('/login')
  }

  // Fetch the user's profile (role, full_name) from our profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    // .eq() means "WHERE id = user.id"
    .single()
    // .single() returns one object instead of an array

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/*
        flex + h-screen = full viewport height
        overflow-hidden = prevents double scrollbars
        (only the main content area scrolls, not the whole page)
      */}

      {/* Sidebar — fixed on the left */}
      <Sidebar profile={profile} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar — fixed at the top of main area */}
        <TopBar profile={profile} />

        {/* Page content — this scrolls */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

    </div>
  )
}
