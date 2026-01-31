'use client'

import { useMapContext } from './map-provider'

export function MapControls() {
  const { map } = useMapContext()

  const handleZoomIn = () => {
    if (map) {
      const level = map.getLevel()
      if (level > 1) {
        map.setLevel(level - 1, { animate: true })
      }
    }
  }

  const handleZoomOut = () => {
    if (map) {
      const level = map.getLevel()
      if (level < 14) {
        map.setLevel(level + 1, { animate: true })
      }
    }
  }

  return (
    <div className="map-controls">
      <button
        className="map-control-btn"
        onClick={handleZoomIn}
        aria-label="확대"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 4.167v11.666M4.167 10h11.666"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        className="map-control-btn"
        onClick={handleZoomOut}
        aria-label="축소"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M4.167 10h11.666"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
