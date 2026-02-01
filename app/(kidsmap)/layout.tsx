import type { Metadata } from 'next'
import { KakaoMapProvider } from '@/contexts/kakao-map-context'

export const metadata: Metadata = {
  title: {
    template: '%s | KidsMap',
    default: 'KidsMap - AI Kids Place Finder',
  },
  description:
    'AI-powered kids place finder - Find the perfect play spots for your children',
}

export default function KidsMapLayout({ children }: { children: React.ReactNode }) {
  return <KakaoMapProvider>{children}</KakaoMapProvider>
}
