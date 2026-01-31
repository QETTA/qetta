/**
 * Animation Timing Constants
 *
 * CSS 기반 애니메이션으로 마이그레이션 완료
 * 이 파일은 타이밍/오프셋 상수만 export
 *
 * @deprecated framer-motion 제거됨 - CSS transition 사용
 */

/**
 * Animation Timing Constants
 *
 * Standard durations for consistent animations across the app.
 */
export const ANIMATION_TIMING = {
  /** Quick transitions (0.2s) - hover effects, small changes */
  fast: 0.2,
  /** Normal transitions (0.3s) - default for most animations */
  normal: 0.3,
  /** Slow transitions (0.5s) - large elements, emphasis */
  slow: 0.5,
  /** Very slow transitions (0.8s) - dramatic effects */
  dramatic: 0.8,
} as const

/**
 * Animation Offset Constants
 *
 * Standard distances for translate animations.
 */
export const ANIMATION_OFFSETS = {
  /** Small offset (5px) - subtle movements */
  small: 5,
  /** Medium offset (10px) - standard movements */
  medium: 10,
  /** Large offset (20px) - noticeable movements */
  large: 20,
  /** Extra large offset (40px) - dramatic movements */
  xlarge: 40,
} as const

/**
 * CSS Transition Classes (Tailwind)
 *
 * Standard CSS transition class combinations
 */
export const CSS_TRANSITIONS = {
  fadeIn: 'transition-all duration-300 ease-out opacity-0 translate-y-3',
  fadeInVisible: 'opacity-100 translate-y-0',
  fadeInLeft: 'transition-all duration-500 ease-out opacity-0 -translate-x-5',
  fadeInLeftVisible: 'opacity-100 translate-x-0',
  fadeInRight: 'transition-all duration-500 ease-out opacity-0 translate-x-5',
  fadeInRightVisible: 'opacity-100 translate-x-0',
  scaleIn: 'transition-transform duration-500 ease-out scale-50',
  scaleInVisible: 'scale-100',
} as const

/**
 * @deprecated 이전 버전 호환용 - 더 이상 사용하지 않음
 */
export const fadeIn = CSS_TRANSITIONS
export const fadeInLeft = CSS_TRANSITIONS
export const fadeInRight = CSS_TRANSITIONS
export const stagger = {}
export const staggerFast = {}
export const scaleIn = CSS_TRANSITIONS
export const slideInUp = CSS_TRANSITIONS
export const getDirectionalFade = () => ({})
