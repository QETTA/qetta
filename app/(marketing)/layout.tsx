import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: {
    template: '%s | QETTA',
    default: 'QETTA - AI 문서 자동화 플랫폼',
  },
  openGraph: {
    siteName: 'QETTA',
    type: 'website',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  )
}
