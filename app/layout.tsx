import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'FinTrack — Loan Collection',
  description: 'Daily loan collection management for small finance businesses',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinTrack',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'Sora, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
            },
          }}
          richColors
        />
      </body>
    </html>
  )
}
