import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TalentLens — แพลตฟอร์มวิเคราะห์ไมโครอินฟลูเอนเซอร์',
  description: 'ค้นหาและวิเคราะห์ไมโครอินฟลูเอนเซอร์ที่เหมาะกับธุรกิจ SME ของคุณด้วย AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
