# P4: 하드코어 성능 최적화 플랜

> **버전**: v1.0 (2026-01-31)
> **상태**: 🔥 강력 실행 대기
> **목표**: Lighthouse 95+ / 번들 40% 감소 / FCP < 1.5s

---

## 📊 현재 상태 분석

### 🔴 Critical Issues

| 항목 | 현재 | 목표 | 영향도 |
|------|------|------|--------|
| **빌드 폴더** | 831MB | <500MB | 🔴 High |
| **최대 JS 청크** | 424KB | <200KB | 🔴 High |
| **framer-motion** | 37개 파일 사용 | CSS 전환 | 🔴 High |
| **아이콘 라이브러리 중복** | lucide + heroicons | 단일화 | 🟠 Medium |

### 🟠 Medium Issues

| 항목 | 현재 | 목표 |
|------|------|------|
| React.memo 미적용 | 0개 | 핵심 컴포넌트 |
| QettaLogo 위치 | Navbar 내부 | /components/icons/ |
| 동적 import 미활용 | 일부만 | 모든 heavy 컴포넌트 |
| 이미지 lazy loading | 미적용 | priority/lazy 분리 |

---

## 🎯 5-Phase 최적화 전략

### Phase 1: 번들 분석 + 트리쉐이킹 (15분)

#### 1-1. 번들 분석 도구 설치

```bash
npm install -D @next/bundle-analyzer
```

#### 1-2. next.config.ts 수정

```typescript
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // 기존 설정...

  // 번들 최적화
  webpack: (config, { isServer }) => {
    // 트리쉐이킹 강화
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: true,
    }

    // 청크 분할 최적화
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          // 프레임워크 분리
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'framework',
            priority: 40,
            enforce: true,
          },
          // 큰 라이브러리 분리
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)
              return match ? `npm.${match[1].replace('@', '')}` : 'vendors'
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
      }
    }

    return config
  },
}

export default withBundleAnalyzer(
  process.env.SENTRY_DSN
    ? withSentryConfig(nextConfig, sentryConfig)
    : nextConfig
)
```

#### 1-3. 번들 분석 실행

```bash
ANALYZE=true npm run build
```

---

### Phase 2: framer-motion → CSS 전환 (30분)

#### 2-1. 분석: framer-motion 사용처 (37개 파일)

**제거 우선순위:**

| 우선순위 | 파일 | 사용 패턴 | 대체 방안 |
|---------|------|----------|----------|
| 🔴 P0 | LinearNavbar.tsx | 이미 미사용 | 확인만 |
| 🔴 P0 | AnimatedSection.tsx | 스크롤 애니메이션 | Intersection Observer + CSS |
| 🔴 P0 | HeroAnimatedContent.tsx | fade-in 애니메이션 | CSS @keyframes |
| 🟠 P1 | shimmer-skeleton.tsx | shimmer 효과 | CSS animation |
| 🟠 P1 | generation-progress.tsx | 프로그레스 바 | CSS transitions |
| 🟡 P2 | editor 관련 | 복잡한 애니메이션 | 유지 (lazy load) |

#### 2-2. CSS 애니메이션 유틸리티 확장

```css
/* globals.css에 추가 */

/* Intersection Observer 기반 애니메이션 */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger 애니메이션 (자식 요소용) */
.stagger-children > * {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
}

.stagger-children.visible > *:nth-child(1) { transition-delay: 0.1s; }
.stagger-children.visible > *:nth-child(2) { transition-delay: 0.15s; }
.stagger-children.visible > *:nth-child(3) { transition-delay: 0.2s; }
.stagger-children.visible > *:nth-child(4) { transition-delay: 0.25s; }
.stagger-children.visible > *:nth-child(5) { transition-delay: 0.3s; }

.stagger-children.visible > * {
  opacity: 1;
  transform: translateY(0);
}
```

#### 2-3. useIntersectionObserver 훅 생성

```typescript
// hooks/use-intersection-observer.ts
'use client'

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}
```

#### 2-4. AnimatedSection 리팩토링

```tsx
// components/landing/blocks/shared/AnimatedSection.tsx
'use client'

import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { cn } from '@/lib/utils'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({
  children,
  className,
  delay = 0
}: AnimatedSectionProps) {
  const { ref, isVisible } = useIntersectionObserver({ threshold: 0.1 })

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(
        'animate-on-scroll',
        isVisible && 'visible',
        className
      )}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </section>
  )
}
```

---

### Phase 3: 동적 Import + 코드 스플리팅 (20분)

#### 3-1. Heavy 컴포넌트 식별

| 컴포넌트 | 예상 크기 | 로딩 전략 |
|---------|----------|----------|
| TipTap Editor | ~200KB | lazy (사용 시) |
| Chatbot | ~100KB | lazy (버튼 클릭 시) |
| WidgetSystem | ~80KB | lazy (대시보드 진입 시) |
| framer-motion 사용 컴포넌트 | ~60KB each | lazy or 제거 |

#### 3-2. 동적 Import 적용

```tsx
// app/page.tsx
import dynamic from 'next/dynamic'

// Heavy 섹션들 동적 로드
const ProductSection = dynamic(
  () => import('@/components/landing/blocks/ProductSection').then(m => m.ProductSection),
  {
    loading: () => <SectionSkeleton />,
    ssr: true
  }
)

const ApplySection = dynamic(
  () => import('@/components/landing/blocks/ApplySection').then(m => m.ApplySection),
  {
    loading: () => <SectionSkeleton />,
    ssr: false // 클라이언트 전용
  }
)

// Chatbot은 버튼 클릭 시에만 로드
const QettaChatbot = dynamic(
  () => import('@/components/chat/qetta-chatbot').then(m => m.QettaChatbot),
  { ssr: false }
)
```

#### 3-3. Editor 지연 로딩

```tsx
// components/dashboard/docs/editor.tsx
'use client'

import dynamic from 'next/dynamic'

// TipTap을 사용 시점에만 로드
const TipTapEditor = dynamic(
  () => import('./tiptap-editor').then(m => m.TipTapEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />
  }
)
```

---

### Phase 4: 아이콘 라이브러리 통합 (15분)

#### 4-1. 현재 상태

- `lucide-react`: 메인 사용
- `@heroicons/react`: 일부 사용 (중복)

#### 4-2. lucide-react로 통일

```typescript
// heroicons → lucide-react 매핑
const iconMapping = {
  'ChevronDownIcon': 'ChevronDown',
  'CheckIcon': 'Check',
  'XMarkIcon': 'X',
  'ArrowRightIcon': 'ArrowRight',
  // ...
}
```

#### 4-3. 트리쉐이킹 최적화

```tsx
// ❌ Bad - 전체 import
import { Menu, X, ChevronDown } from 'lucide-react'

// ✅ Good - 개별 import (자동 트리쉐이킹)
import Menu from 'lucide-react/dist/esm/icons/menu'
import X from 'lucide-react/dist/esm/icons/x'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'

// 또는 barrel file 생성
// components/icons/index.ts
export { Menu, X, ChevronDown } from 'lucide-react'
```

---

### Phase 5: React.memo + 성능 훅 (15분)

#### 5-1. memo 적용 대상

| 컴포넌트 | 이유 |
|---------|------|
| LinearCodeDiff | 정적 데이터, 리렌더링 불필요 |
| LinearNavbar | isScrolled만 변경 |
| 각 Landing Section | props 변경 거의 없음 |

#### 5-2. QettaLogo 분리

```tsx
// components/icons/QettaLogo.tsx
import { memo } from 'react'

interface QettaLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const QettaLogo = memo(function QettaLogo({
  className,
  size = 'md'
}: QettaLogoProps) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <svg
      className={cn(sizeMap[size], className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
    </svg>
  )
})
```

#### 5-3. useMemo/useCallback 적용

```tsx
// LinearNavbar.tsx
import { memo, useMemo } from 'react'

export const LinearNavbar = memo(function LinearNavbar() {
  const isScrolled = useScrollNavbar(50)

  // navItems는 상수이므로 컴포넌트 외부로
  // 또는 useMemo로 메모이제이션
  const headerClassName = useMemo(() => cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    isScrolled
      ? 'bg-[var(--background)]/95 backdrop-blur-xl border-b border-[var(--border)]'
      : 'bg-transparent'
  ), [isScrolled])

  // ...
})
```

---

## 📁 변경 파일 요약

| Phase | 파일 | 작업 |
|-------|------|------|
| 1 | `next.config.ts` | 번들 분석 + 청크 최적화 |
| 1 | `package.json` | @next/bundle-analyzer 추가 |
| 2 | `globals.css` | CSS 애니메이션 유틸리티 추가 |
| 2 | `hooks/use-intersection-observer.ts` | 생성 |
| 2 | `components/landing/blocks/shared/AnimatedSection.tsx` | framer-motion 제거 |
| 2 | 기타 37개 파일 | framer-motion 점진적 제거 |
| 3 | `app/page.tsx` | 동적 import 적용 |
| 3 | 에디터/챗봇 컴포넌트 | lazy loading |
| 4 | 아이콘 사용 파일들 | lucide-react 통일 |
| 5 | `components/icons/QettaLogo.tsx` | 분리 + memo |
| 5 | 핵심 컴포넌트들 | React.memo 적용 |

---

## ✅ 검증 방법

### 1. 번들 분석

```bash
ANALYZE=true npm run build
# .next/analyze 폴더에서 client.html 확인
```

### 2. Lighthouse CI

```bash
npm run build && npm run start
npx lighthouse http://localhost:3000 --view
```

### 3. 목표 메트릭

| 메트릭 | 현재 | 목표 |
|--------|------|------|
| FCP | ~2.5s | < 1.5s |
| LCP | ~3.5s | < 2.5s |
| TBT | ~300ms | < 150ms |
| CLS | ~0.1 | < 0.05 |
| Performance Score | ~70 | 95+ |

---

## ⏱️ 예상 소요 시간

| Phase | 작업 | 시간 |
|-------|------|------|
| 1 | 번들 분석 + 설정 | 15분 |
| 2 | framer-motion 제거 | 30분 |
| 3 | 동적 Import | 20분 |
| 4 | 아이콘 통합 | 15분 |
| 5 | memo + 성능 훅 | 15분 |
| - | 검증 + 커밋 | 15분 |
| **총합** | | **110분** |

---

## 🚀 실행 우선순위

```
Phase 2 (framer-motion) → Phase 3 (동적 import) → Phase 1 (번들 분석)
        ↓                        ↓                       ↓
   가장 큰 영향            두 번째 영향              측정/검증
```

**추천**: Phase 2부터 시작 - framer-motion 제거가 가장 큰 번들 감소 효과

---

*플랜 작성일: 2026-01-31*
*기반: 빌드 분석 (831MB), JS 청크 분석 (424KB max), 라이브러리 사용 분석 (37개 파일)*
