'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

/**
 * Industry Blocks v2.1 - QETTA 10 Industry Domains
 *
 * Each block represents a specific manufacturing sector and provides
 * specialized terminology mapping and document templates for that domain.
 */
const INDUSTRY_BLOCKS = [
  { id: 'FOOD', name: 'Food/Beverage', color: 'orange', icon: '🍜', description: 'Food processing, Beverage, HACCP' },
  { id: 'TEXTILE', name: 'Textile/Apparel', color: 'pink', icon: '👔', description: 'Textile, Fashion, Garment' },
  { id: 'METAL', name: 'Metal/Steel', color: 'slate', icon: '⚙️', description: 'Metal processing, Steel, Casting' },
  { id: 'CHEMICAL', name: 'Chemical/Materials', color: 'amber', icon: '⚗️', description: 'Chemical, Plastics, New materials' },
  { id: 'ELECTRONICS', name: 'Electronics/Semiconductor', color: 'cyan', icon: '💻', description: 'Electronic parts, Semiconductor, PCB' },
  { id: 'MACHINERY', name: 'Machinery/Equipment', color: 'blue', icon: '🏭', description: 'Industrial machinery, Precision equipment' },
  { id: 'AUTOMOTIVE', name: 'Automotive/Parts', color: 'indigo', icon: '🚗', description: 'Automotive, Mobility parts' },
  { id: 'BIO_PHARMA', name: 'Bio/Pharma', color: 'rose', icon: '💊', description: 'Bio, Pharma, Medical devices' },
  { id: 'ENVIRONMENT', name: 'Environment/Energy', color: 'emerald', icon: '🌱', description: 'Environment, Renewable energy' },
  { id: 'GENERAL', name: 'General Manufacturing', color: 'gray', icon: '📦', description: 'Other manufacturing sectors' },
] as const

// ============================================================================
// Color System
// ============================================================================

/**
 * Tailwind color class mapping
 */
const colorMap: Record<string, { bg: string; hover: string; ring: string; text: string; glow: string }> = {
  orange: { bg: 'bg-orange-500/10', hover: 'hover:bg-orange-500/20', ring: 'ring-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  pink: { bg: 'bg-pink-500/10', hover: 'hover:bg-pink-500/20', ring: 'ring-pink-500/30', text: 'text-pink-400', glow: 'shadow-pink-500/20' },
  slate: { bg: 'bg-slate-500/10', hover: 'hover:bg-slate-500/20', ring: 'ring-slate-500/30', text: 'text-slate-400', glow: 'shadow-slate-500/20' },
  amber: { bg: 'bg-amber-500/10', hover: 'hover:bg-amber-500/20', ring: 'ring-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  cyan: { bg: 'bg-cyan-500/10', hover: 'hover:bg-cyan-500/20', ring: 'ring-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  blue: { bg: 'bg-blue-500/10', hover: 'hover:bg-blue-500/20', ring: 'ring-blue-500/30', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  indigo: { bg: 'bg-indigo-500/10', hover: 'hover:bg-indigo-500/20', ring: 'ring-indigo-500/30', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
  rose: { bg: 'bg-rose-500/10', hover: 'hover:bg-rose-500/20', ring: 'ring-rose-500/30', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
  emerald: { bg: 'bg-emerald-500/10', hover: 'hover:bg-emerald-500/20', ring: 'ring-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  gray: { bg: 'bg-gray-500/10', hover: 'hover:bg-gray-500/20', ring: 'ring-gray-500/30', text: 'text-gray-400', glow: 'shadow-gray-500/20' },
}

// ============================================================================
// Type Definitions
// ============================================================================

/** Industry block data structure */
export type IndustryBlock = (typeof INDUSTRY_BLOCKS)[number]

/** Industry block ID type */
export type IndustryBlockId = IndustryBlock['id']

/** Props for IndustryBlockGrid component */
interface IndustryBlockGridProps {
  /** Callback when a block is selected */
  onSelect?: (id: string) => void
  /** Currently selected block ID */
  selectedId?: string | null
}

// ============================================================================
// Component
// ============================================================================

/**
 * IndustryBlockGrid
 *
 * CSS-based animation (framer-motion alternative)
 * Displays QETTA 10 industry domains in a visual grid
 */
export function IndustryBlockGrid({ onSelect, selectedId }: IndustryBlockGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
      {INDUSTRY_BLOCKS.map((block, index) => {
        const colors = colorMap[block.color]
        const isSelected = selectedId === block.id
        const isHovered = hoveredId === block.id

        return (
          <div
            key={block.id}
            onMouseEnter={() => setHoveredId(block.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelect?.(block.id)}
            className={cn(
              'relative p-4 rounded-xl cursor-pointer transition-all duration-300',
              colors.bg, colors.hover,
              'ring-1',
              isSelected ? `${colors.ring} ring-2` : 'ring-white/5',
              (isSelected || isHovered) && `shadow-lg ${colors.glow}`,
              // Staggered entry animation
              'opacity-0 translate-y-5',
              isMounted && 'opacity-100 translate-y-0'
            )}
            style={{
              transitionDelay: isMounted ? `${index * 50}ms` : '0ms',
            }}
          >
            {/* Icon */}
            <div className="text-2xl md:text-3xl mb-2">{block.icon}</div>

            {/* Name */}
            <h3 className={cn('text-sm font-medium', colors.text)}>{block.name}</h3>

            {/* Description (shown on hover) */}
            <p
              className={cn(
                'text-xs text-zinc-500 mt-1 overflow-hidden transition-all duration-200',
                isHovered ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              {block.description}
            </p>

            {/* Selection indicator */}
            {isSelected && (
              <div
                className={cn(
                  'absolute top-2 right-2 transition-transform duration-200',
                  'scale-100'
                )}
              >
                <svg className={cn('w-4 h-4', colors.text)} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Block data export (for use in other components)
export { INDUSTRY_BLOCKS }
