'use client'

/**
 * OnboardingProvider
 *
 * 온보딩 상태 관리 Context Provider
 * - 투어 상태 관리
 * - localStorage 영속화
 * - 첫 방문 자동 투어 시작
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import {
  loadOnboardingState,
  saveOnboardingState,
  resetOnboardingState,
  type TourId,
  type HintId,
  type OnboardingStorage,
} from '@/lib/onboarding-storage'
import { TOURS, getTourStepCount, type TourConfig, type TourStep } from '@/constants/onboarding/tours'

interface OnboardingState {
  isFirstVisit: boolean
  currentTour: TourId | null
  currentStep: number
  completedTours: TourId[]
  dismissedHints: HintId[]
  preferences: {
    showHints: boolean
    autoStartTour: boolean
  }
}

interface OnboardingContextValue extends OnboardingState {
  // Tour actions
  startTour: (tourId: TourId) => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  goToStep: (step: number) => void

  // Hint actions
  dismissHint: (hintId: HintId) => void
  shouldShowHint: (hintId: HintId) => boolean

  // Tour info
  isTourActive: boolean
  currentTourConfig: TourConfig | null
  currentStepConfig: TourStep | null
  totalSteps: number
  progress: number

  // Settings
  setPreference: (key: keyof OnboardingState['preferences'], value: boolean) => void
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

interface OnboardingProviderProps {
  children: ReactNode
  autoStartWelcome?: boolean
}

export function OnboardingProvider({
  children,
  autoStartWelcome = true,
}: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = loadOnboardingState()
    return {
      isFirstVisit: stored.isFirstVisit,
      currentTour: null,
      currentStep: 0,
      completedTours: stored.completedTours,
      dismissedHints: stored.dismissedHints,
      preferences: stored.preferences,
    }
  })

  // Auto-start welcome tour for first-time visitors
  useEffect(() => {
    if (
      autoStartWelcome &&
      state.isFirstVisit &&
      !state.currentTour &&
      state.preferences.autoStartTour &&
      !state.completedTours.includes('welcome')
    ) {
      // Delay to allow page to render
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, currentTour: 'welcome', currentStep: 0 }))
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [state.isFirstVisit, state.currentTour, state.preferences.autoStartTour, state.completedTours, autoStartWelcome])

  // Persist state changes to localStorage
  useEffect(() => {
    const toSave: OnboardingStorage = {
      version: 1,
      isFirstVisit: state.isFirstVisit,
      completedTours: state.completedTours,
      dismissedHints: state.dismissedHints,
      preferences: state.preferences,
      firstVisitAt: null,
      lastUpdated: new Date().toISOString(),
    }
    saveOnboardingState(toSave)
  }, [state.isFirstVisit, state.completedTours, state.dismissedHints, state.preferences])

  // Tour actions
  const startTour = useCallback((tourId: TourId) => {
    if (!TOURS[tourId]) {
      console.warn(`[Onboarding] Tour "${tourId}" not found`)
      return
    }
    setState((prev) => ({ ...prev, currentTour: tourId, currentStep: 0 }))
  }, [])

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (!prev.currentTour) return prev
      const totalSteps = getTourStepCount(prev.currentTour)
      if (prev.currentStep >= totalSteps - 1) {
        // Tour complete
        return {
          ...prev,
          currentTour: null,
          currentStep: 0,
          completedTours: [...prev.completedTours, prev.currentTour],
          isFirstVisit: false,
        }
      }
      return { ...prev, currentStep: prev.currentStep + 1 }
    })
  }, [])

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }))
  }, [])

  const skipTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentTour: null,
      currentStep: 0,
      isFirstVisit: false,
    }))
  }, [])

  const completeTour = useCallback(() => {
    setState((prev) => {
      if (!prev.currentTour) return prev
      return {
        ...prev,
        currentTour: null,
        currentStep: 0,
        completedTours: prev.completedTours.includes(prev.currentTour)
          ? prev.completedTours
          : [...prev.completedTours, prev.currentTour],
        isFirstVisit: false,
      }
    })
  }, [])

  const goToStep = useCallback((step: number) => {
    setState((prev) => {
      if (!prev.currentTour) return prev
      const totalSteps = getTourStepCount(prev.currentTour)
      const clampedStep = Math.max(0, Math.min(step, totalSteps - 1))
      return { ...prev, currentStep: clampedStep }
    })
  }, [])

  // Hint actions
  const dismissHint = useCallback((hintId: HintId) => {
    setState((prev) => ({
      ...prev,
      dismissedHints: prev.dismissedHints.includes(hintId)
        ? prev.dismissedHints
        : [...prev.dismissedHints, hintId],
    }))
  }, [])

  const shouldShowHint = useCallback(
    (hintId: HintId) => {
      return state.preferences.showHints && !state.dismissedHints.includes(hintId)
    },
    [state.preferences.showHints, state.dismissedHints]
  )

  // Settings
  const setPreference = useCallback(
    (key: keyof OnboardingState['preferences'], value: boolean) => {
      setState((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: value },
      }))
    },
    []
  )

  const handleResetOnboarding = useCallback(() => {
    resetOnboardingState()
    setState({
      isFirstVisit: true,
      currentTour: null,
      currentStep: 0,
      completedTours: [],
      dismissedHints: [],
      preferences: {
        showHints: true,
        autoStartTour: true,
      },
    })
  }, [])

  // Derived values
  const currentTourConfig = state.currentTour ? TOURS[state.currentTour] : null
  const currentStepConfig = currentTourConfig?.steps[state.currentStep] ?? null
  const totalSteps = state.currentTour ? getTourStepCount(state.currentTour) : 0
  const progress = totalSteps > 0 ? ((state.currentStep + 1) / totalSteps) * 100 : 0

  const value = useMemo<OnboardingContextValue>(
    () => ({
      ...state,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      goToStep,
      dismissHint,
      shouldShowHint,
      isTourActive: state.currentTour !== null,
      currentTourConfig,
      currentStepConfig,
      totalSteps,
      progress,
      setPreference,
      resetOnboarding: handleResetOnboarding,
    }),
    [
      state,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      goToStep,
      dismissHint,
      shouldShowHint,
      currentTourConfig,
      currentStepConfig,
      totalSteps,
      progress,
      setPreference,
      handleResetOnboarding,
    ]
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

/**
 * useOnboarding hook
 */
export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
