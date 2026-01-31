/**
 * Onboarding System Exports
 */

export { OnboardingProvider, useOnboarding } from './onboarding-provider'
export { TourOverlay } from './tour-overlay'
export {
  FeatureReveal,
  CollapsibleAdvanced,
  FirstTimeTooltip,
  StepByStepGuide,
} from './progressive-disclosure'

// Re-export types
export type { TourId, HintId } from '@/lib/onboarding-storage'
export type { TourStep, TourConfig } from '@/constants/onboarding/tours'
