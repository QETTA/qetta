'use client'

import { useMapContext } from './map-provider'

export function LocationButton() {
  const { map, currentLocation, isTracking, setIsTracking, requestLocation } = useMapContext()

  const handleClick = () => {
    if (isTracking) {
      // Stop tracking
      setIsTracking(false)
    } else if (currentLocation && map && window.kakao) {
      // If we have location, toggle tracking
      const position = new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng)
      map.setCenter(position)
      map.setLevel(3)
      setIsTracking(true)
    } else {
      // Request location
      requestLocation()
    }
  }

  return (
    <button
      className={`map-location-btn ${isTracking ? 'tracking' : ''}`}
      onClick={handleClick}
      aria-label={isTracking ? '위치 추적 중지' : '내 위치로 이동'}
    >
      {isTracking ? (
        // Tracking active icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L12 4M12 20L12 22M22 12L20 12M4 12L2 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
        </svg>
      ) : (
        // Location icon
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L12 4M12 20L12 22M22 12L20 12M4 12L2 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </button>
  )
}
