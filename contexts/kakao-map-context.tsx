'use client'

/**
 * Kakao Map SDK Context Provider
 *
 * Loads Kakao Map JavaScript SDK and provides map instance to child components
 * Uses dynamic script loading with initialization state management
 *
 * Environment Variables:
 * - NEXT_PUBLIC_KAKAO_MAP_KEY: Kakao JavaScript API Key
 *
 * @example
 * <KakaoMapProvider>
 *   <MapPage />
 * </KakaoMapProvider>
 */

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'

// ============================================
// Types
// ============================================

export interface KakaoMapContextValue {
  /** Kakao Maps SDK loaded and ready */
  isLoaded: boolean
  /** SDK loading error */
  error: Error | null
  /** Loading state */
  isLoading: boolean
  /** Kakao Maps SDK instance (window.kakao.maps) */
  kakao: typeof window.kakao | null
}

// ============================================
// Global Types for Kakao SDK
// ============================================

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        LatLng: new (lat: number, lng: number) => any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        LatLngBounds: new () => { extend: (latlng: any) => void }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Map: new (container: HTMLElement, options: any) => any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Marker: new (options: any) => any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        InfoWindow: new (options: any) => any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        CustomOverlay: new (options: any) => any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        MarkerClusterer: new (options: any) => any
        services: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Geocoder: new () => any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Places: new () => any
        }
        event: {
          addListener: (
            target: unknown,
            type: string,
            handler: (...args: unknown[]) => void
          ) => void
          removeListener: (
            target: unknown,
            type: string,
            handler: (...args: unknown[]) => void
          ) => void
        }
        ControlPosition: {
          TOP: number
          TOPLEFT: number
          TOPRIGHT: number
          LEFT: number
          RIGHT: number
          BOTTOMLEFT: number
          BOTTOM: number
          BOTTOMRIGHT: number
        }
        MapTypeId: {
          ROADMAP: string
          SKYVIEW: string
          HYBRID: string
        }
      }
    }
  }
}

// ============================================
// Context
// ============================================

const KakaoMapContext = createContext<KakaoMapContextValue | undefined>(undefined)

// ============================================
// Provider Props
// ============================================

interface KakaoMapProviderProps {
  children: ReactNode
  /** Optional custom API key (defaults to env var) */
  apiKey?: string
  /** Load libraries (default: ['services', 'clusterer']) */
  libraries?: string[]
}

// ============================================
// Provider Component
// ============================================

export function KakaoMapProvider({
  children,
  apiKey,
  libraries = ['services', 'clusterer'],
}: KakaoMapProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [kakao, setKakao] = useState<typeof window.kakao | null>(null)
  const initRef = useRef(false)

  useEffect(() => {
    // Prevent re-initialization
    if (initRef.current) return
    initRef.current = true

    const key = apiKey || process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

    // Debug logging
    console.log('[KakaoMapProvider] API Key check:', {
      hasApiKeyProp: !!apiKey,
      hasEnvVar: !!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY,
      keyLength: key?.length || 0,
    })

    // Validate API key
    if (!key) {
      console.error('[KakaoMapProvider] No API key found!')
      setError(
        new Error(
          'Kakao Map API key is required. Set NEXT_PUBLIC_KAKAO_MAP_KEY environment variable.'
        )
      )
      return
    }

    // Check if already loaded
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        setKakao(window.kakao)
        setIsLoaded(true)
      })
      return
    }

    // Prevent duplicate script loading
    const existingScript = document.getElementById('kakao-map-sdk')
    if (existingScript) {
      return
    }

    // Load SDK
    setIsLoading(true)

    const script = document.createElement('script')
    script.id = 'kakao-map-sdk'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=${libraries.join(',')}`
    script.async = true
    script.defer = true

    script.onload = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          setKakao(window.kakao)
          setIsLoaded(true)
          setIsLoading(false)
        })
      } else {
        const err = new Error('Failed to load Kakao Maps SDK')
        setError(err)
        setIsLoading(false)
      }
    }

    script.onerror = () => {
      const err = new Error('Failed to load Kakao Maps SDK script')
      setError(err)
      setIsLoading(false)
    }

    document.head.appendChild(script)

    // Do NOT remove script on cleanup - SDK should persist
  }, [apiKey, libraries])

  const value: KakaoMapContextValue = {
    isLoaded,
    error,
    isLoading,
    kakao,
  }

  return <KakaoMapContext.Provider value={value}>{children}</KakaoMapContext.Provider>
}

// ============================================
// Hook to use context
// ============================================

export function useKakaoMapContext(): KakaoMapContextValue {
  const context = useContext(KakaoMapContext)

  if (context === undefined) {
    throw new Error('useKakaoMapContext must be used within KakaoMapProvider')
  }

  return context
}
