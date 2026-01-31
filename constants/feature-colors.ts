/**
 * Feature Card Color System
 *
 * Re-exports from centralized color-tokens for backward compatibility.
 * Used by FeaturesSection and domain engine cards.
 *
 * @see constants/color-tokens.ts for the Single Source of Truth
 *
 * @example
 * import { FEATURE_CARD_COLORS, type FeatureCardColor } from '@/constants/feature-colors'
 *
 * const colors = FEATURE_CARD_COLORS.emerald
 * <div className={`${colors.bg} ${colors.text} ${colors.ring}`}>
 *   Feature content
 * </div>
 */

import { CARD_COLORS } from './color-tokens'
import type { ColorVariant } from '@/types/common'

// Re-export CARD_COLORS as FEATURE_CARD_COLORS for backward compatibility
export const FEATURE_CARD_COLORS = CARD_COLORS

// Re-export type for backward compatibility
export type FeatureCardColor = ColorVariant
