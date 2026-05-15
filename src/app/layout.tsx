// ==========================================================
// src/app/layout.tsx
// ==========================================================
// Root layout — reads app name from settings table so the
// browser tab title updates when the admin changes it.
// ==========================================================

import type { Metadata } from 'next'
import './globals.css'
import { getSettings } from '@/lib/actions/settings'

// generateMetadata runs on the server before the page renders.
// It fetches the current app name and uses it as the page title.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    title: settings.app_name,
    description: `${settings.org_name} — Road Construction Management`,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}