'use client'

/**
 * Kakao Map Hook
 *
 * React hook for integrating Kakao Maps with map state management
 * Handles map initialization, marker management, and event listeners
 *
 * @example
 * const { mapRef, map, isReady, initMap, addMarker } = useKakaoMap({
 *   center: { lat: 37.4979, lng: 127.0276 },
 *   level: 3
 * })
 *
 * useEffect(() => {
 *   if (mapRef.current && !map) {
 *     initMap(mapRef.current)
 *   }
 * }, [mapRef, map, initMap])
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useKakaoMapContext } from '@/contexts/kakao-map-context'
import { useMapStore } from '@/stores/kidsmap/map-store'
import type { MapCenter, PlaceMarker } from '@/stores/kidsmap/map-store'

// ============================================
// Types
// ============================================

export interface UseKakaoMapOptions {
  /** Initial center position */
  center?: MapCenter
  /** Initial zoom level (1-14, default: 3) */
  level?: number
  /** Enable dragging (default: true) */
  draggable?: boolean
  /** Enable scroll wheel zoom (default: true) */
  scrollwheel?: boolean
  /** Enable double click zoom (default: true) */
  disableDoubleClickZoom?: boolean
  /** Map type (default: 'roadmap') */
  mapTypeId?: 'roadmap' | 'skyview' | 'hybrid'
}

export interface UseKakaoMapReturn {
  /** Map container ref - attach to div element */
  mapRef: React.RefObject<HTMLDivElement | null>
  /** Kakao Map instance */
  map: any | null
  /** Map is initialized and ready */
  isReady: boolean
  /** Initialize map with container element */
  initMap: (container: HTMLElement) => void
  /** Add marker to map */
  addMarker: (marker: PlaceMarker) => any
  /** Remove marker from map */
  removeMarker: (markerId: string) => void
  /** Clear all markers */
  clearMarkers: () => void
  /** Pan to location */
  panTo: (center: MapCenter, level?: number) => void
  /** Set map bounds */
  setBounds: (markers: PlaceMarker[]) => void
  /** Add click listener */
  onClick: (handler: (lat: number, lng: number) => void) => void
  /** Refresh/resize map */
  relayout: () => void
}

// ============================================
// Hook Implementation
// ============================================

export function useKakaoMap(options?: UseKakaoMapOptions): UseKakaoMapReturn {
  const { isLoaded, kakao } = useKakaoMapContext()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any | null>(null)
  const [isReady, setIsReady] = useState(false)
  const markersRef = useRef<Map<string, any>>(new Map())

  // Zustand store
  const { center, zoom, setCenter, setBounds: setStoreBounds } = useMapStore()

  // ============================================
  // Map Initialization
  // ============================================

  const initMap = useCallback(
    (container: HTMLElement) => {
      if (!isLoaded || !kakao) {
        console.warn('[useKakaoMap] SDK not loaded yet')
        return
      }

      if (map) {
        console.warn('[useKakaoMap] Map already initialized')
        return
      }

      try {
        const initialCenter = options?.center || center
        const initialLevel = options?.level || zoom

        const mapCenter = new kakao.maps.LatLng(initialCenter.lat, initialCenter.lng)

        const mapInstance = new kakao.maps.Map(container, {
          center: mapCenter,
          level: initialLevel,
          draggable: options?.draggable ?? true,
          scrollwheel: options?.scrollwheel ?? true,
          disableDoubleClickZoom: options?.disableDoubleClickZoom ?? false,
        })

        // Sync map events with Zustand store
        kakao.maps.event.addListener(mapInstance, 'center_changed', () => {
          const center = mapInstance.getCenter()
          setCenter({ lat: center.getLat(), lng: center.getLng() })
        })

        kakao.maps.event.addListener(mapInstance, 'zoom_changed', () => {
          const level = mapInstance.getLevel()
          useMapStore.setState({ zoom: level })
        })

        kakao.maps.event.addListener(mapInstance, 'bounds_changed', () => {
          const bounds = mapInstance.getBounds()
          setStoreBounds({
            sw: { lat: bounds.getSouthWest().getLat(), lng: bounds.getSouthWest().getLng() },
            ne: { lat: bounds.getNorthEast().getLat(), lng: bounds.getNorthEast().getLng() },
          })
        })

        setMap(mapInstance)
        setIsReady(true)

        console.log('[useKakaoMap] Map initialized', {
          center: initialCenter,
          level: initialLevel,
        })
      } catch (error) {
        console.error('[useKakaoMap] Failed to initialize map', error)
      }
    },
    [isLoaded, kakao, map, options, center, zoom, setCenter, setStoreBounds],
  )

  // Auto-initialize when ref and SDK are ready
  useEffect(() => {
    if (mapRef.current && !map && isLoaded && kakao) {
      initMap(mapRef.current)
    }
  }, [mapRef, map, isLoaded, kakao, initMap])

  // ============================================
  // Marker Management
  // ============================================

  const addMarker = useCallback(
    (markerData: PlaceMarker): any | null => {
      if (!map || !kakao) return null

      try {
        const position = new kakao.maps.LatLng(markerData.lat, markerData.lng)

        const marker = new kakao.maps.Marker({
          position,
          map,
          title: markerData.title,
          clickable: true,
        })

        // Store marker reference
        markersRef.current.set(markerData.id, marker)

        // Add click listener if provided
        if (markerData.onClick) {
          kakao.maps.event.addListener(marker, 'click', () => {
            markerData.onClick?.(markerData.id)
          })
        }

        return marker
      } catch (error) {
        console.error('[useKakaoMap] Failed to add marker', error)
        return null
      }
    },
    [map, kakao],
  )

  const removeMarker = useCallback(
    (markerId: string) => {
      const marker = markersRef.current.get(markerId)
      if (marker) {
        marker.setMap(null)
        markersRef.current.delete(markerId)
      }
    },
    [],
  )

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      marker.setMap(null)
    })
    markersRef.current.clear()
  }, [])

  // ============================================
  // Map Controls
  // ============================================

  const panTo = useCallback(
    (newCenter: MapCenter, level?: number) => {
      if (!map || !kakao) return

      const moveLatLon = new kakao.maps.LatLng(newCenter.lat, newCenter.lng)
      map.panTo(moveLatLon)

      if (level !== undefined) {
        map.setLevel(level)
      }
    },
    [map, kakao],
  )

  const setBounds = useCallback(
    (markers: PlaceMarker[]) => {
      if (!map || !kakao || markers.length === 0) return

      const bounds = new kakao.maps.LatLngBounds()

      markers.forEach((marker) => {
        bounds.extend(new kakao.maps.LatLng(marker.lat, marker.lng))
      })

      map.setBounds(bounds)
    },
    [map, kakao],
  )

  const onClick = useCallback(
    (handler: (lat: number, lng: number) => void) => {
      if (!map || !kakao) return

      kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
        const latlng = mouseEvent.latLng
        handler(latlng.getLat(), latlng.getLng())
      })
    },
    [map, kakao],
  )

  const relayout = useCallback(() => {
    if (!map) return
    map.relayout()
  }, [map])

  // ============================================
  // Cleanup on unmount
  // ============================================

  useEffect(() => {
    return () => {
      clearMarkers()
    }
  }, [clearMarkers])

  // ============================================
  // Return
  // ============================================

  return {
    mapRef,
    map,
    isReady,
    initMap,
    addMarker,
    removeMarker,
    clearMarkers,
    panTo,
    setBounds,
    onClick,
    relayout,
  }
}
