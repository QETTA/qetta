/**
 * 3D Tilt Card Component
 * Interactive card with mouse-tracking 3D rotation effect
 * 
 * @see Plan: Part D1 - Premium Landing Page Components
 */

'use client'

import { useRef, useState, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  intensity?: number // Rotation intensity (default: 10)
}

export function TiltCard({ children, className = '', intensity = 10 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const x = (e.clientY - top) / height
    const y = (e.clientX - left) / width

    setRotation({
      x: (x - 0.5) * intensity,
      y: (y - 0.5) * intensity
    })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform: `perspective(1000px) rotateX(${-rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </div>
  )
}
