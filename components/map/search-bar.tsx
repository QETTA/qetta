'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useMapContext, PlaceResult } from './map-provider'

// Search icon
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.167 15.833a6.667 6.667 0 1 0 0-13.333 6.667 6.667 0 0 0 0 13.333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m17.5 17.5-3.625-3.625"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Clear icon
const ClearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="8" fill="#C7C7CC" />
    <path
      d="m6 6 6 6M12 6l-6 6"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const {
    map,
    searchQuery,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    currentLocation,
  } = useMapContext()

  // Perform search using Kakao Places API
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !map || !window.kakao) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    try {
      const places = new window.kakao.maps.services.Places(map)

      // Build search options
      const searchOptions: Record<string, unknown> = {
        size: 15,
        sort: 'distance',
      }

      // Add location bias if available
      if (currentLocation) {
        searchOptions.location = new window.kakao.maps.LatLng(
          currentLocation.lat,
          currentLocation.lng
        )
        searchOptions.radius = 20000 // 20km
      }

      places.keywordSearch(query, (results, status) => {
        if (status === 'OK') {
          const mappedResults: PlaceResult[] = results.map((place) => ({
            id: place.id,
            name: place.place_name,
            category: place.category_name.split('>').pop()?.trim() || place.category_group_name,
            address: place.address_name,
            roadAddress: place.road_address_name || undefined,
            phone: place.phone || undefined,
            distance: place.distance ? `${Math.round(parseFloat(place.distance))}m` : undefined,
            position: {
              lat: parseFloat(place.y),
              lng: parseFloat(place.x),
            },
            placeUrl: place.place_url || undefined,
          }))
          setSearchResults(mappedResults)
        } else if (status === 'ZERO_RESULT') {
          setSearchResults([])
        }
        setIsSearching(false)
      }, searchOptions)
    } catch (error) {
      console.error('Search error:', error)
      setIsSearching(false)
    }
  }, [map, currentLocation, setSearchResults, setIsSearching])

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  // Clear search
  const handleClear = () => {
    setSearchQuery('')
    setSearchResults([])
    inputRef.current?.focus()
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    inputRef.current?.blur()
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    performSearch(searchQuery)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="map-search-bar">
      <span className="map-search-icon">
        <SearchIcon />
      </span>

      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="장소, 주소 검색"
        className="map-search-input"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        enterKeyHint="search"
      />

      {searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="flex-shrink-0 p-1 -mr-1"
          aria-label="검색어 지우기"
        >
          <ClearIcon />
        </button>
      )}
    </form>
  )
}
