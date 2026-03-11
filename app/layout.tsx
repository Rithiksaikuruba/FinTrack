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
    // Changed to 'default' so the iOS status bar shows dark text on our new light background
    statusBarStyle: 'default', 
    title: 'FinTrack',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Updated from slate-900 (#0f172a) to slate-50 (#f8fafc) to match our new light canvas
  themeColor: '#f8fafc', 
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
      {/* Added global selection and antialiasing classes for a premium feel */}
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        <Providers>{children}</Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'Sora, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '16px', // Matched to our new rounded-2xl look
              border: '1px solid #f1f5f9', // border-slate-100
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)', // shadow-sm
            },
          }}
          richColors
        />
      </body>
    </html>
  )
}