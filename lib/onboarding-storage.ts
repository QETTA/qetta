/**
 * Onboarding State Persistence
 *
 * localStorage 기반 온보딩 상태 관리
 */

export type TourId = 'welcome' | 'docs' | 'verify' | 'apply' | 'monitor'
export type HintId = 'first-document' | 'ai-panel' | 'cross-tab' | 'keyboard' | 'export'

export interface OnboardingStorage {
  version: number
  isFirstVisit: boolean
  completedTours: TourId[]
  dismissedHints: HintId[]
  preferences: {
    showHints: boolean
    autoStartTour: boolean
  }
  firstVisitAt: string | null
  lastUpdated: string
}

const STORAGE_KEY = 'qetta_onboarding_v1'
const CURRENT_VERSION = 1

const DEFAULT_STATE: OnboardingStorage = {
  version: CURRENT_VERSION,
  isFirstVisit: true,
  completedTours: [],
  dismissedHints: [],
  preferences: {
    showHints: true,
    autoStartTour: true,
  },
  firstVisitAt: null,
  lastUpdated: new Date().toISOString(),
}

/**
 * localStorage에서 온보딩 상태 로드
 */
export function loadOnboardingState(): OnboardingStorage {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // 첫 방문 - 기본 상태 저장
      const initialState: OnboardingStorage = {
        ...DEFAULT_STATE,
        firstVisitAt: new Date().toISOString(),
      }
      saveOnboardingState(initialState)
      return initialState
    }

    const parsed = JSON.parse(stored) as OnboardingStorage

    // 버전 마이그레이션
    if (parsed.version < CURRENT_VERSION) {
      return migrateState(parsed)
    }

    return parsed
  } catch {
    console.warn('[Onboarding] Failed to load state, using defaults')
    return DEFAULT_STATE
  }
}

/**
 * 온보딩 상태 저장
 */
export function saveOnboardingState(state: OnboardingStorage): void {
  if (typeof window === 'undefined') return

  try {
    const toSave: OnboardingStorage = {
      ...state,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    console.warn('[Onboarding] Failed to save state')
  }
}

/**
 * 온보딩 상태 초기화
 */
export function resetOnboardingState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 상태 버전 마이그레이션
 */
function migrateState(oldState: OnboardingStorage): OnboardingStorage {
  // v1으로 마이그레이션 (현재는 v1이 최신)
  const migrated: OnboardingStorage = {
    ...DEFAULT_STATE,
    ...oldState,
    version: CURRENT_VERSION,
  }
  saveOnboardingState(migrated)
  return migrated
}
