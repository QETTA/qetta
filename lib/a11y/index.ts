/**
 * Accessibility Utilities
 *
 * WCAG 2.1 AA 기준 접근성 유틸리티 모음.
 *
 * @module a11y
 */

// ============================================
// Constants
// ============================================

/**
 * WCAG 2.1 AA 기준 색상 대비율
 */
export const CONTRAST_RATIOS = {
  /** 일반 텍스트 최소 대비율 */
  NORMAL_TEXT: 4.5,
  /** 큰 텍스트 최소 대비율 (18px+ 또는 14px+ bold) */
  LARGE_TEXT: 3.0,
  /** UI 컴포넌트 및 그래픽 최소 대비율 */
  UI_COMPONENT: 3.0,
} as const

/**
 * 스크린 리더 전용 클래스
 */
export const SR_ONLY_CLASS = 'sr-only'

/**
 * 포커스 시 표시되는 스크린 리더 전용 클래스
 */
export const SR_ONLY_FOCUSABLE_CLASS = 'sr-only focus:not-sr-only'

// ============================================
// Focus Management
// ============================================

/**
 * 요소에 프로그래밍 방식으로 포커스 설정
 * 모달, 드로어 등 열릴 때 사용
 */
export function focusElement(
  element: HTMLElement | null,
  options: FocusOptions = { preventScroll: false }
): void {
  if (element) {
    // tabindex가 없으면 임시로 추가
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1')
    }
    element.focus(options)
  }
}

/**
 * 포커스 트랩 생성
 * 모달, 드로어 내에서 포커스가 벗어나지 않도록 함
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusables = container.querySelectorAll<HTMLElement>(focusableSelectors)
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

// ============================================
// Announcements (Live Regions)
// ============================================

let announcer: HTMLElement | null = null

/**
 * 스크린 리더에 메시지 알림
 * ARIA live region을 사용하여 동적 콘텐츠 변경 알림
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return

  if (!announcer) {
    announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
  }

  announcer.setAttribute('aria-live', priority)
  announcer.textContent = ''

  // 다음 프레임에서 텍스트 설정 (스크린 리더가 변경 감지하도록)
  requestAnimationFrame(() => {
    if (announcer) {
      announcer.textContent = message
    }
  })
}

/**
 * 로딩 상태 알림
 */
export function announceLoading(isLoading: boolean, context?: string): void {
  const message = isLoading
    ? context ? `${context} 로딩 중입니다...` : '로딩 중입니다...'
    : context ? `${context} 로딩이 완료되었습니다.` : '로딩이 완료되었습니다.'

  announce(message, isLoading ? 'polite' : 'assertive')
}

/**
 * 에러 알림
 */
export function announceError(errorMessage: string): void {
  announce(`오류: ${errorMessage}`, 'assertive')
}

// ============================================
// Keyboard Navigation
// ============================================

/**
 * 키보드 내비게이션 핸들러 생성
 * 리스트, 메뉴 등에서 화살표 키 내비게이션 지원
 */
export function createKeyboardNavigator(options: {
  items: HTMLElement[]
  orientation?: 'horizontal' | 'vertical' | 'both'
  loop?: boolean
  onSelect?: (item: HTMLElement, index: number) => void
}): (event: KeyboardEvent) => void {
  const { items, orientation = 'vertical', loop = true, onSelect } = options

  return (event: KeyboardEvent) => {
    const currentIndex = items.findIndex((item) => item === document.activeElement)
    if (currentIndex === -1) return

    let nextIndex = currentIndex

    const isVertical = orientation === 'vertical' || orientation === 'both'
    const isHorizontal = orientation === 'horizontal' || orientation === 'both'

    switch (event.key) {
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault()
          nextIndex = currentIndex - 1
        }
        break
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault()
          nextIndex = currentIndex + 1
        }
        break
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault()
          nextIndex = currentIndex - 1
        }
        break
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault()
          nextIndex = currentIndex + 1
        }
        break
      case 'Home':
        event.preventDefault()
        nextIndex = 0
        break
      case 'End':
        event.preventDefault()
        nextIndex = items.length - 1
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect?.(items[currentIndex], currentIndex)
        return
    }

    // Loop or clamp
    if (loop) {
      nextIndex = (nextIndex + items.length) % items.length
    } else {
      nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex))
    }

    items[nextIndex]?.focus()
  }
}

// ============================================
// Reduced Motion
// ============================================

/**
 * 사용자의 reduced motion 설정 확인
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * reduced motion 미디어 쿼리 변경 감지
 */
export function onReducedMotionChange(
  callback: (prefersReduced: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = (event: MediaQueryListEvent) => callback(event.matches)

  mediaQuery.addEventListener('change', handler)
  return () => mediaQuery.removeEventListener('change', handler)
}

// ============================================
// Color Contrast
// ============================================

/**
 * 상대 휘도 계산 (WCAG 기준)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * 두 색상 간 대비율 계산
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b)
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * WCAG AA 기준 충족 여부 확인
 */
export function meetsContrastRequirement(
  ratio: number,
  level: 'normal' | 'large' | 'ui' = 'normal'
): boolean {
  switch (level) {
    case 'normal':
      return ratio >= CONTRAST_RATIOS.NORMAL_TEXT
    case 'large':
      return ratio >= CONTRAST_RATIOS.LARGE_TEXT
    case 'ui':
      return ratio >= CONTRAST_RATIOS.UI_COMPONENT
  }
}

// ============================================
// Types
// ============================================

export interface A11yProps {
  /** 스크린 리더에만 표시되는 레이블 */
  srLabel?: string
  /** ARIA role 속성 */
  role?: string
  /** ARIA labelledby 속성 */
  labelledBy?: string
  /** ARIA describedby 속성 */
  describedBy?: string
}
