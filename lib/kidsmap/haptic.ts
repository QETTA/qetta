/**
 * Haptic Feedback Utility
 *
 * 2026 모바일 UX 표준 - 진동 피드백 유틸리티
 * iOS/Android 네이티브 앱 수준의 촉각 피드백 제공
 *
 * @module lib/kidsmap/haptic
 */

// ============================================
// Types
// ============================================

type HapticPattern = number | number[]

interface HapticFeedback {
  /** 가벼운 탭 피드백 (10ms) */
  light: () => void
  /** 중간 강도 피드백 (15ms) */
  medium: () => void
  /** 강한 피드백 (25ms) */
  heavy: () => void
  /** 성공 피드백 - 두 번 짧게 */
  success: () => void
  /** 에러 피드백 - 길게 두 번 */
  error: () => void
  /** 경고 피드백 - 중간 한 번 */
  warning: () => void
  /** 선택 변경 피드백 */
  selection: () => void
  /** 임팩트 피드백 (드래그 threshold 도달) */
  impact: () => void
  /** 커스텀 패턴 */
  pattern: (pattern: HapticPattern) => void
  /** 진동 지원 여부 확인 */
  isSupported: () => boolean
}

// ============================================
// Implementation
// ============================================

/**
 * 진동 실행 (브라우저 API)
 */
function vibrate(pattern: HapticPattern): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // 진동 실패 무시 (일부 브라우저 제한)
    }
  }
}

/**
 * 진동 API 지원 여부 확인
 */
function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

// ============================================
// Haptic Feedback Export
// ============================================

export const haptic: HapticFeedback = {
  // 기본 피드백
  light: () => vibrate(10),
  medium: () => vibrate(15),
  heavy: () => vibrate(25),

  // 상태 피드백
  success: () => vibrate([10, 50, 10]),
  error: () => vibrate([30, 50, 30]),
  warning: () => vibrate([15, 30, 15]),

  // 인터랙션 피드백
  selection: () => vibrate(8),
  impact: () => vibrate(20),

  // 커스텀
  pattern: (pattern) => vibrate(pattern),
  isSupported: isVibrationSupported,
}

// ============================================
// React Hook for Haptic
// ============================================

/**
 * Haptic 피드백 훅
 *
 * @example
 * ```tsx
 * const { triggerHaptic } = useHaptic()
 *
 * const handlePress = () => {
 *   triggerHaptic('success')
 *   // ... action
 * }
 * ```
 */
export function useHaptic() {
  return {
    triggerHaptic: (type: keyof Omit<HapticFeedback, 'pattern' | 'isSupported'>) => {
      haptic[type]()
    },
    triggerPattern: haptic.pattern,
    isSupported: haptic.isSupported(),
  }
}

export default haptic
