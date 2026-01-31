import { memo, type ReactNode } from 'react'
import { Badge } from '@/components/catalyst/badge'
import { StatusPing } from './shared'

type BadgeColor =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'zinc'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'
  | 'zinc'

interface DetailPageHeroProps {
  /** Badge text */
  badge: string
  /** Badge color */
  badgeColor?: BadgeColor
  /** Show status ping indicator */
  showStatusPing?: boolean
  /** Status ping color */
  statusPingColor?: 'emerald' | 'amber' | 'zinc' | 'blue'
  /** Main heading (can include JSX for gradient text) */
  heading: ReactNode
  /** Subheading text */
  subheading: string
  /** Optional right column content (visual/stats) */
  rightContent?: ReactNode
  /** Grid column ratio (default: 7:5 like landing) */
  gridRatio?: '7:5' | '6:6' | '8:4'
}

/**
 * DetailPageHero - Consistent hero section for detail pages
 *
 * Matches landing page design language:
 * - Full viewport height with generous padding
 * - Two-column grid layout (content + visual)
 * - Large gradient typography
 * - StatusPing badges
 *
 * @example
 * ```tsx
 * <DetailPageHero
 *   badge="All Features"
 *   badgeColor="zinc"
 *   showStatusPing
 *   heading={
 *     <>
 *       Complete Platform for
 *       <br />
 *       <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
 *         Government Support
 *       </span>
 *     </>
 *   }
 *   subheading="AI-powered automation, compliance validation, and global tender matching - all in one platform"
 * />
 * ```
 */
export const DetailPageHero = memo(function DetailPageHero({
  badge,
  badgeColor = 'zinc',
  showStatusPing = false,
  statusPingColor = 'emerald',
  heading,
  subheading,
  rightContent,
  gridRatio = '7:5',
}: DetailPageHeroProps) {
  const gridClass = {
    '7:5': 'lg:grid-cols-12',
    '6:6': 'lg:grid-cols-2',
    '8:4': 'lg:grid-cols-12',
  }[gridRatio]

  const leftColClass = {
    '7:5': 'lg:col-span-7',
    '6:6': '',
    '8:4': 'lg:col-span-8',
  }[gridRatio]

  const rightColClass = {
    '7:5': 'lg:col-span-5',
    '6:6': '',
    '8:4': 'lg:col-span-4',
  }[gridRatio]

  return (
    <section
      role="banner"
      className="relative min-h-screen bg-zinc-950 px-6 pt-32 pb-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className={`grid grid-cols-1 gap-12 lg:gap-8 ${gridClass}`}>
          {/* Left Column - Content */}
          <div className={leftColClass}>
            {/* Status Badge */}
            <Badge color={badgeColor} className="mb-8">
              {showStatusPing ? (
                <span className="flex items-center gap-2">
                  <StatusPing color={statusPingColor} size="md" />
                  {badge}
                </span>
              ) : (
                badge
              )}
            </Badge>

            {/* Hero Headline - Large Gradient Typography */}
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {heading}
            </h1>

            {/* Subheadline */}
            <p className="mt-8 text-lg text-zinc-400 sm:text-xl max-w-2xl">
              {subheading}
            </p>
          </div>

          {/* Right Column - Visual Content (Optional) */}
          {rightContent && (
            <div className={`${rightColClass} flex items-center justify-center`}>
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </section>
  )
})
