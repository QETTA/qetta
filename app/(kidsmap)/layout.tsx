import type { Metadata, Viewport } from 'next'
import { KakaoMapProvider } from '@/contexts/kakao-map-context'
import { TabBar } from '@/components/kidsmap/tab-bar'
import { OfflineIndicator } from '@/components/kidsmap/offline-indicator'

export const metadata: Metadata = {
  title: {
    template: '%s | KidsMap',
    default: 'KidsMap - AI Kids Place Finder',
  },
  description:
    'AI-powered kids place finder - Find the perfect play spots for your children',
}

// 2026 모바일 표준: viewport-fit=cover for safe area
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function KidsMapLayout({ children }: { children: React.ReactNode }) {
  return (
    <KakaoMapProvider>
      {/* Offline Indicator - 최상단 */}
      <OfflineIndicator />

      {/* Main Content - Safe Area 하단 패딩 */}
      <div
        className="min-h-screen"
        style={{
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </div>

      {/* Bottom Tab Bar */}
      <TabBar />
    </KakaoMapProvider>
  )
}
