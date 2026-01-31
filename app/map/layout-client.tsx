'use client'

import { ReactNode } from 'react'
import { MapProvider } from '@/components/map/map-provider'

interface MapLayoutClientProps {
  children: ReactNode
}

export function MapLayoutClient({ children }: MapLayoutClientProps) {
  return (
    <MapProvider>
      <div className="map-app">
        {children}
      </div>
    </MapProvider>
  )
}
