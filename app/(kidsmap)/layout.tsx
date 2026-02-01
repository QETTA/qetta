import type { Metadata } from 'next'
import { KakaoMapProvider } from '@/contexts/kakao-map-context'
import { TabBar } from '@/components/kidsmap/tab-bar'

export const metadata: Metadata = {
  title: {
    template: '%s | KidsMap',
    default: 'KidsMap - AI Kids Place Finder',
  },
  description:
    'AI-powered kids place finder - Find the perfect play spots for your children',
}

export default function KidsMapLayout({ children }: { children: React.ReactNode }) {
  return (
    <KakaoMapProvider>
      <div className="pb-14">
        {children}
      </div>
      <TabBar />
    </KakaoMapProvider>
  )
}
