import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Road WorkPlan System',
  description: 'Engineer Co-ordinating Unit — Road Construction Management',
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