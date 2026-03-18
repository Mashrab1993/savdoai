import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from 'next-themes'
import { LocaleProvider } from '@/lib/locale-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'SavdoAI — Biznes boshqaruv tizimi',
  description: 'Mijozlar, mahsulotlar, qarzdorliklar, hisob-fakturalar va hisobotlarni boshqarish uchun zamonaviy admin paneli.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LocaleProvider>
            {children}
          </LocaleProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
