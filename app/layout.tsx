import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getLocale } from '@/lib/locale'
import { LocaleProvider } from '@/components/i18n/locale-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TalentLens — แพลตฟอร์มวิเคราะห์ไมโครอินฟลูเอนเซอร์',
  description: 'ค้นหาและวิเคราะห์ไมโครอินฟลูเอนเซอร์ที่เหมาะกับธุรกิจ SME ของคุณด้วย AI',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  )
}
