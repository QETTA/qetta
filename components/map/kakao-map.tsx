'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMapContext, MapLocation, PlaceResult } from './map-provider'

// ============================================
// Kakao Map Script Loader
// ============================================

let isScriptLoading = false
let isScriptLoaded = false
const loadCallbacks: (() => void)[] = []

function loadKakaoMapScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isScriptLoaded && window.kakao?.maps) {
      resolve()
      return
    }

    if (isScriptLoading) {
      loadCallbacks.push(resolve)
      return
    }

    isScriptLoading = true

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`
    script.async = true

    script.onload = () => {
      window.kakao.maps.load(() => {
        isScriptLoaded = true
        isScriptLoading = false
        resolve()
        loadCallbacks.forEach((cb) => cb())
        loadCallbacks.length = 0
      })
    }

    script.onerror = () => {
      isScriptLoading = false
      reject(new Error('Failed to load Kakao Maps SDK'))
    }

    document.head.appendChild(script)
  })
}

// ============================================
// Component
// ============================================

interface KakaoMapProps {
  apiKey: string
  initialCenter?: MapLocation
  initialLevel?: number
  className?: string
}

export function KakaoMap({
  apiKey,
  initialCenter = { lat: 37.5666805, lng: 126.9784147 }, // Seoul City Hall
  initialLevel = 3,
  className = '',
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const currentLocationMarkerRef = useRef<kakao.maps.CustomOverlay | null>(null)
  const markersRef = useRef<kakao.maps.Marker[]>([])

  const {
    setMap,
    setIsMapLoaded,
    currentLocation,
    setSelectedPlace,
    searchResults,
    requestLocation,
  } = useMapContext()

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !apiKey) return

    let isMounted = true

    async function initMap() {
      try {
        await loadKakaoMapScript(apiKey)

        if (!isMounted || !containerRef.current) return

        const options: kakao.maps.MapOptions = {
          center: new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
          level: initialLevel,
        }

        const map = new window.kakao.maps.Map(containerRef.current, options)
        mapRef.current = map
        setMap(map)

        // Add zoom control (positioned at bottom-right area, above tab bar)
        const zoomControl = new window.kakao.maps.ZoomControl()
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT)

        // Map is loaded
        setIsMapLoaded(true)

        // Request user location
        requestLocation()
      } catch (error) {
        console.error('Failed to initialize Kakao Map:', error)
      }
    }

    initMap()

    return () => {
      isMounted = false
    }
  }, [apiKey, initialCenter, initialLevel, setMap, setIsMapLoaded, requestLocation])

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !currentLocation || !window.kakao) return

    // Remove existing marker
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null)
    }

    // Create custom overlay for current location
    const content = document.createElement('div')
    content.className = 'map-current-location'
    content.innerHTML = `
      <div class="map-current-location-pulse"></div>
      <div class="map-current-location-dot"></div>
    `

    const overlay = new window.kakao.maps.CustomOverlay({
      position: new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng),
      content: content,
      yAnchor: 0.5,
      xAnchor: 0.5,
    })

    overlay.setMap(mapRef.current)
    currentLocationMarkerRef.current = overlay
  }, [currentLocation])

  // Handle search results markers
  const handleMarkerClick = useCallback((place: PlaceResult) => {
    setSelectedPlace(place)
  }, [setSelectedPlace])

  useEffect(() => {
    if (!mapRef.current || !window.kakao) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (searchResults.length === 0) return

    // Create markers for search results
    const bounds = new window.kakao.maps.LatLngBounds()

    searchResults.forEach((place, index) => {
      const position = new window.kakao.maps.LatLng(place.position.lat, place.position.lng)

      // Custom marker image
      const markerSize = new window.kakao.maps.Size(36, 36)
      const markerImage = new window.kakao.maps.MarkerImage(
        `data:image/svg+xml;base64,${btoa(`
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="16" fill="white" stroke="#007AFF" stroke-width="2"/>
            <text x="18" y="23" text-anchor="middle" fill="#007AFF" font-size="14" font-weight="600">${index + 1}</text>
          </svg>
        `)}`,
        markerSize
      )

      const marker = new window.kakao.maps.Marker({
        map: mapRef.current!,
        position,
        image: markerImage,
        clickable: true,
      })

      // Add click event
      window.kakao.maps.event.addListener(marker, 'click', () => {
        handleMarkerClick(place)
      })

      markersRef.current.push(marker)
      bounds.extend(position)
    })

    // Fit map to show all markers
    if (searchResults.length > 1) {
      mapRef.current.setBounds(bounds)
    } else if (searchResults.length === 1) {
      const firstPosition = new window.kakao.maps.LatLng(
        searchResults[0].position.lat,
        searchResults[0].position.lng
      )
      mapRef.current.setCenter(firstPosition)
      mapRef.current.setLevel(3)
    }
  }, [searchResults, handleMarkerClick])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ touchAction: 'pan-x pan-y' }}
    />
  )
}
