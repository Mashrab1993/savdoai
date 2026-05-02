import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { LocaleProvider } from '@/lib/locale-context'
import { AuthProvider } from '@/lib/auth/auth-context'
import { RouteGuard } from '@/lib/auth/route-guard'
import { LangSync } from '@/components/lang-sync'
import { SWRegister } from '@/components/shared/sw-register'
import { OfflineBanner } from '@/components/shared/offline-banner'
import './globals.css'

export const metadata: Metadata = {
  title: 'SavdoAI — Biznes boshqaruv tizimi',
  description: 'Mijozlar, mahsulotlar, qarzdorliklar, hisob-fakturalar va hisobotlarni boshqarish uchun zamonaviy admin paneli.',
  manifest: '/manifest.json',
  themeColor: '#1a56db',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SavdoAI',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // lang="uz" is the SSR default; LangSync updates it client-side to match the active locale
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LocaleProvider>
            <LangSync />
            <SWRegister />
            <AuthProvider>
              <RouteGuard>
                {children}
              </RouteGuard>
            </AuthProvider>
            <OfflineBanner />
          </LocaleProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
