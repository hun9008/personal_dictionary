import type { Metadata } from 'next'
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google'

import './globals.css'

const notoSansKR = Noto_Sans_KR({ subsets: ['latin'], variable: '--font-sans' })
const notoSerifKR = Noto_Serif_KR({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'Personal Dictionary',
  description: 'MySQL vocab.word 단어를 ㄱㄴㄷ 순으로 탐색하고 다의어를 강조해 보여주는 도구입니다.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} ${notoSerifKR.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
