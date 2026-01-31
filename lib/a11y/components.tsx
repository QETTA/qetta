'use client'

/**
 * Accessibility Components
 *
 * 접근성을 위한 재사용 가능한 React 컴포넌트.
 */

import { useEffect, useState, useRef, type ReactNode } from 'react'
import { prefersReducedMotion } from './index'

// ============================================
// VisuallyHidden
// ============================================

interface VisuallyHiddenProps {
  children: ReactNode
  /** 포커스 시 표시 여부 */
  focusable?: boolean
}

/**
 * 시각적으로 숨기지만 스크린 리더에는 접근 가능한 컨텐츠
 *
 * @example
 * <button>
 *   <Icon name="menu" />
 *   <VisuallyHidden>메뉴 열기</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({ children, focusable = false }: VisuallyHiddenProps) {
  const className = focusable
    ? 'sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-zinc-600 focus:text-white focus:rounded-lg'
    : 'sr-only'

  return <span className={className}>{children}</span>
}

// ============================================
// LiveRegion
// ============================================

interface LiveRegionProps {
  children: ReactNode
  /** polite: 현재 작업 완료 후 알림, assertive: 즉시 알림 */
  priority?: 'polite' | 'assertive'
  /** 전체 영역 또는 변경 부분만 읽기 */
  atomic?: boolean
  /** 상태 역할 (로그, 타이머, 상태 등) */
  role?: 'status' | 'log' | 'alert' | 'timer' | 'marquee'
}

/**
 * ARIA 라이브 영역 컴포넌트
 * 동적으로 변경되는 콘텐츠를 스크린 리더에 알림
 *
 * @example
 * <LiveRegion>
 *   {isLoading ? '로딩 중...' : '완료'}
 * </LiveRegion>
 */
export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  role = 'status',
}: LiveRegionProps) {
  return (
    <div
      role={role}
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}

// ============================================
// SkipLink
// ============================================

interface SkipLinkProps {
  /** 이동할 대상 요소 ID */
  targetId: string
  /** 링크 텍스트 */
  children: ReactNode
}

/**
 * 스킵 링크 컴포넌트
 * 키보드 사용자가 반복적인 내비게이션을 건너뛸 수 있도록 함
 *
 * @example
 * <SkipLink targetId="main-content">본문으로 건너뛰기</SkipLink>
 */
export function SkipLink({ targetId, children }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-zinc-600 focus:text-white focus:rounded-lg focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
    >
      {children}
    </a>
  )
}

// ============================================
// FocusTrap
// ============================================

interface FocusTrapProps {
  children: ReactNode
  /** 활성화 여부 */
  active?: boolean
  /** 열릴 때 첫 포커스 가능 요소에 자동 포커스 */
  autoFocus?: boolean
  /** 닫힐 때 이전 포커스로 복원 */
  restoreFocus?: boolean
}

/**
 * 포커스 트랩 컴포넌트
 * 모달, 드로어 등에서 포커스가 벗어나지 않도록 함
 *
 * @example
 * <FocusTrap active={isModalOpen}>
 *   <Modal>...</Modal>
 * </FocusTrap>
 */
export function FocusTrap({
  children,
  active = true,
  autoFocus = true,
  restoreFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // 이전 포커스 저장
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }

    const container = containerRef.current
    if (!container) return

    // 첫 포커스 가능 요소에 포커스
    if (autoFocus) {
      const focusable = container.querySelector<HTMLElement>(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }

    // 포커스 트랩 설정
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusables = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

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

    return () => {
      container.removeEventListener('keydown', handleKeyDown)

      // 이전 포커스로 복원
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [active, autoFocus, restoreFocus])

  return <div ref={containerRef}>{children}</div>
}

// ============================================
// ReducedMotion
// ============================================

interface ReducedMotionProps {
  children: ReactNode
  /** reduced motion 선호 시 대체 콘텐츠 */
  fallback?: ReactNode
}

/**
 * Reduced Motion 감지 컴포넌트
 * 애니메이션 선호 설정에 따라 다른 콘텐츠 렌더링
 *
 * @example
 * <ReducedMotion fallback={<StaticImage />}>
 *   <AnimatedImage />
 * </ReducedMotion>
 */
export function ReducedMotion({ children, fallback }: ReducedMotionProps) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(prefersReducedMotion())

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches)

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  if (reducedMotion && fallback) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================
// Heading (Semantic)
// ============================================

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

interface HeadingProps {
  level: HeadingLevel
  children: ReactNode
  className?: string
  /** 시각적으로만 숨김 (문서 구조는 유지) */
  visuallyHidden?: boolean
}

/**
 * 시맨틱 헤딩 컴포넌트
 * 적절한 heading 레벨 사용을 강제
 *
 * @example
 * <Heading level={1}>페이지 제목</Heading>
 * <Heading level={2}>섹션 제목</Heading>
 */
export function Heading({
  level,
  children,
  className = '',
  visuallyHidden = false,
}: HeadingProps) {
  const Tag = `h${level}` as const
  const combinedClassName = visuallyHidden ? `sr-only ${className}` : className

  return <Tag className={combinedClassName}>{children}</Tag>
}

// ============================================
// Landmark Regions
// ============================================

interface LandmarkProps {
  children: ReactNode
  /** 접근 가능한 이름 (aria-label) */
  label?: string
  /** aria-labelledby로 참조할 ID */
  labelledBy?: string
  className?: string
}

/**
 * Main 랜드마크
 */
export function MainContent({ children, label, labelledBy, className }: LandmarkProps) {
  return (
    <main
      id="main-content"
      aria-label={label}
      aria-labelledby={labelledBy}
      className={className}
    >
      {children}
    </main>
  )
}

/**
 * Navigation 랜드마크
 */
export function NavRegion({ children, label = '주 메뉴', className }: LandmarkProps) {
  return (
    <nav id="main-nav" aria-label={label} className={className}>
      {children}
    </nav>
  )
}

/**
 * Aside 랜드마크 (보조 콘텐츠)
 */
export function AsideRegion({ children, label = '보조 정보', className }: LandmarkProps) {
  return (
    <aside aria-label={label} className={className}>
      {children}
    </aside>
  )
}

/**
 * Search 랜드마크
 */
export function SearchRegion({ children, label = '검색', className }: LandmarkProps) {
  return (
    <search aria-label={label} className={className}>
      {children}
    </search>
  )
}
