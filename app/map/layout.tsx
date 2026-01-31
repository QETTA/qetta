import type { Metadata, Viewport } from 'next'
import './globals-map.css'
import { MapLayoutClient } from './layout-client'

export const metadata: Metadata = {
  title: 'QETTA Map - 주변 장소 탐색',
  description: 'Discover places around you with QETTA Map',
  applicationName: 'QETTA Map',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QETTA Map',
  },
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
  openGraph: {
    title: 'QETTA Map',
    description: 'Discover places around you',
    type: 'website',
  },
  manifest: '/map-manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
  colorScheme: 'light',
}

export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MapLayoutClient>{children}</MapLayoutClient>
}
