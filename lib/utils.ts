import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for conflict resolution
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-red-500', 'px-6') // → 'py-2 px-6 bg-red-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export brand colors and theme tokens for convenience
export {
  QETTA_COLORS,
  DARK_THEME,
  DOMAIN_COLORS,
  COMPONENT_STYLES,
  getDomainColors,
  type DomainColorKey,
} from '@/lib/design/brand-colors'
