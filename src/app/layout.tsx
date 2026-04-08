import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { OfflineBanner } from '@/components/OfflineBanner'

export const metadata: Metadata = {
  title: 'MakanJe — Family Meal Planner',
  description: 'Plan your family meals, build shopping lists, and share recipes — all in one place.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MakanJe',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('theme');
            if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
          })();
        `}} />
      </head>
      <body className="antialiased bg-canvas text-text-primary">
        <AuthProvider>
          <OfflineBanner />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
