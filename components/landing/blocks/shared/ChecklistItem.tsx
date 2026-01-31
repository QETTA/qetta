import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ColorVariant } from '@/types/common'
import { TEXT_COLORS } from '@/constants/color-tokens'

interface ChecklistItemProps {
  /** Main label text */
  label: string
  /** Optional detail/subtitle text */
  detail?: string
  /** Icon color - supports all 8 color variants */
  color?: ColorVariant
  /** Custom icon (defaults to checkmark) */
  icon?: ReactNode
  /** Additional className for the container */
  className?: string
}

const DefaultCheckIcon = () => (
  <svg
    className="h-5 w-5 flex-shrink-0"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
)

/**
 * ChecklistItem - Feature list item with icon
 *
 * Commonly used in product sections to highlight features.
 *
 * @example
 * ```tsx
 * <ul className="space-y-4">
 *   <ChecklistItem
 *     label="Auto-fill from sensor data"
 *     detail="Real-time equipment integration"
 *   />
 * </ul>
 * ```
 */
export const ChecklistItem = memo(function ChecklistItem({
  label,
  detail,
  color = 'emerald',
  icon,
  className,
}: ChecklistItemProps) {
  return (
    <li className={cn('flex items-start gap-3', className)}>
      <span className={cn('mt-1', TEXT_COLORS[color])}>
        {icon ?? <DefaultCheckIcon />}
      </span>
      <div>
        <p className="font-medium text-white">{label}</p>
        {detail && <p className="text-sm text-zinc-400">{detail}</p>}
      </div>
    </li>
  )
})
