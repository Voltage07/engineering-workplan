// ==========================================================
// src/app/admin/layout.tsx
// ==========================================================
//
// This layout wraps the /admin page.
//
// It does TWO important things:
// 1. Checks the user is logged in
// 2. Checks their role is "admin"
//
// If either check fails → redirect away.
// This means even if someone types /admin in the URL bar,
// they cannot access it unless they're an admin in the DB.
//
// NOTE: The admin section is NOT inside (dashboard) route group
// but it still shows the same Sidebar and TopBar — we import
// them directly here.
// ==========================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Role check — non-admins get redirected to dashboard
  if (profile?.role !== 'admin') {
    redirect('/')
    // They'll land on the dashboard with a "no access" experience
    // rather than seeing an error page.
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
