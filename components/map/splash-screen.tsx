'use client'

import { useEffect, useState } from 'react'
import { useMapContext } from './map-provider'

export function SplashScreen() {
  const { isSplashVisible, setIsSplashVisible, isMapLoaded } = useMapContext()
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Auto-hide splash when map is loaded (minimum 1.5s display)
    if (isMapLoaded) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => {
          setIsSplashVisible(false)
        }, 400) // Match exit animation duration
      }, 500) // Additional time after map loads

      return () => clearTimeout(timer)
    }
  }, [isMapLoaded, setIsSplashVisible])

  // Fallback: hide after 3 seconds regardless
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSplashVisible) {
        setIsExiting(true)
        setTimeout(() => {
          setIsSplashVisible(false)
        }, 400)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isSplashVisible, setIsSplashVisible])

  if (!isSplashVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white
        ${isExiting ? 'animate-splash-out' : 'animate-splash-fade-in'}`}
    >
      {/* Logo Container */}
      <div className="flex flex-col items-center gap-6">
        {/* App Logo */}
        <div className={`${isExiting ? '' : 'animate-splash-logo'}`}>
          <div className="relative">
            {/* Logo with Kakao-inspired yellow accent */}
            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#FEE500] to-[#F5D800] flex items-center justify-center shadow-lg animate-splash-pulse">
              <svg
                width="56"
                height="56"
                viewBox="0 0 56 56"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#3C1E1E]"
              >
                {/* Map pin icon */}
                <path
                  d="M28 6C19.716 6 13 12.716 13 21C13 32.25 28 50 28 50C28 50 43 32.25 43 21C43 12.716 36.284 6 28 6Z"
                  fill="currentColor"
                  fillOpacity="0.9"
                />
                <circle cx="28" cy="21" r="7" fill="white" />
              </svg>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute -inset-4 bg-[#FEE500] opacity-20 blur-2xl rounded-full -z-10" />
          </div>
        </div>

        {/* App Name */}
        <div
          className="text-center animate-slide-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
        >
          <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">
            QETTA Map
          </h1>
          <p className="text-sm text-[#6E6E73] mt-1">
            Discover places around you
          </p>
        </div>

        {/* Loading indicator */}
        <div
          className="flex items-center gap-2 mt-8 animate-slide-up"
          style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
        >
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[#FEE500] loading-dot" />
            <div className="w-2 h-2 rounded-full bg-[#FEE500] loading-dot" />
            <div className="w-2 h-2 rounded-full bg-[#FEE500] loading-dot" />
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div
        className="absolute bottom-12 text-center animate-slide-up"
        style={{ animationDelay: '0.7s', animationFillMode: 'backwards' }}
      >
        <p className="text-xs text-[#8E8E93]">
          Powered by Kakao Maps
        </p>
      </div>
    </div>
  )
}
