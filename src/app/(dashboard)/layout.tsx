// ==========================================================
// src/app/(dashboard)/layout.tsx
// ==========================================================
// Fetches settings (app name, org name) server-side and
// passes them down to Sidebar and TopBar as props.
// ==========================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/actions/settings'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, settings] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(r => r.data),
    getSettings(),
  ])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        profile={profile}
        appName={settings.app_name}
        orgName={settings.org_name}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar profile={profile} appName={settings.app_name} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}