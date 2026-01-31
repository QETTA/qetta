# QETTA 디자인 시스템 v2.1

> **버전**: v2.1 (2026-01-30)
> **기반**: Linear Design System
> **대상**: 디자이너, 프론트엔드 개발자

---

## 개요

QETTA는 **Linear 디자인 시스템**을 채택합니다. 미니멀하고 기능 중심적인 인터페이스를 통해 사용자가 핵심 작업에 집중할 수 있도록 합니다.

---

## 1. 디자인 원칙

### 1.1 Core Principles

| 원칙 | 설명 | 예시 |
|------|------|------|
| **미니멀** | 불필요한 장식 최소화 | 그림자 대신 미묘한 테두리 |
| **기능 중심** | UI는 기능을 명확하게 전달 | 버튼 레이블은 동작 명시 |
| **일관성** | 동일한 패턴 반복 사용 | 모든 카드 동일 radius |
| **접근성** | WCAG 2.1 AA 준수 | 명암비 4.5:1 이상 |

### 1.2 Linear 스타일 특징

```
┌─────────────────────────────────────────────────────────────┐
│  ✓ 다크 모드 우선 (Light 모드 지원)                          │
│  ✓ 미묘한 glassmorphism (배경 블러)                         │
│  ✓ 단색 아이콘 (Lucide Icons)                               │
│  ✓ 부드러운 트랜지션 (200ms ease-out)                       │
│  ✓ 적절한 여백 (8px 그리드)                                  │
│  ✓ 미묘한 호버 효과                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 컬러 시스템

### 2.1 Base Colors (Dark Mode)

```css
:root {
  /* Background */
  --bg-primary: #0A0A0B;      /* 메인 배경 */
  --bg-secondary: #111113;     /* 카드/패널 배경 */
  --bg-tertiary: #18181B;      /* 호버/액티브 배경 */
  --bg-elevated: #1F1F23;      /* 모달/드롭다운 */

  /* Foreground */
  --fg-primary: #FAFAFA;       /* 주요 텍스트 */
  --fg-secondary: #A1A1AA;     /* 보조 텍스트 */
  --fg-muted: #71717A;         /* 비활성 텍스트 */

  /* Border */
  --border-default: #27272A;   /* 기본 테두리 */
  --border-subtle: #1F1F23;    /* 미묘한 테두리 */
  --border-focus: #3B82F6;     /* 포커스 링 */

  /* Accent */
  --accent-primary: #3B82F6;   /* 브랜드 블루 */
  --accent-secondary: #60A5FA; /* 밝은 블루 */
}
```

### 2.2 Industry Block Colors

10개 Industry Block 전용 색상:

```typescript
// lib/super-model/loader.ts

export const INDUSTRY_BLOCK_COLORS = {
  FOOD: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
  TEXTILE: 'bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20',
  METAL: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20',
  CHEMICAL: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  ELECTRONICS: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20',
  MACHINERY: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  AUTOMOTIVE: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
  BIO_PHARMA: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20',
  ENVIRONMENT: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  GENERAL: 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20',
} as const
```

### 2.3 Semantic Colors

```typescript
const SEMANTIC_COLORS = {
  success: 'emerald',
  warning: 'amber',
  error: 'red',
  info: 'blue',
} as const
```

### 2.4 Color Usage Matrix

| 용도 | 색상 | Tailwind 클래스 |
|------|------|----------------|
| 성공 상태 | Emerald | `text-emerald-400 bg-emerald-500/10` |
| 경고 상태 | Amber | `text-amber-400 bg-amber-500/10` |
| 오류 상태 | Red | `text-red-400 bg-red-500/10` |
| 정보 | Blue | `text-blue-400 bg-blue-500/10` |
| 선정 | Emerald | `text-emerald-400` |
| 탈락 | Red | `text-red-400` |
| 대기 | Amber | `text-amber-400` |

---

## 3. 타이포그래피

### 3.1 Font Family

```css
:root {
  /* 기본 폰트 */
  --font-sans: 'Pretendard', system-ui, -apple-system, sans-serif;

  /* 코드/숫자 폰트 */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### 3.2 Type Scale

```css
:root {
  --text-xs: 0.75rem;     /* 12px - 캡션 */
  --text-sm: 0.875rem;    /* 14px - 보조 텍스트 */
  --text-base: 1rem;      /* 16px - 본문 */
  --text-lg: 1.125rem;    /* 18px - 강조 */
  --text-xl: 1.25rem;     /* 20px - 소제목 */
  --text-2xl: 1.5rem;     /* 24px - 제목 */
  --text-3xl: 1.875rem;   /* 30px - 대제목 */
}
```

### 3.3 Font Weight

| Weight | 용도 | Tailwind |
|--------|------|----------|
| 400 | 본문 | `font-normal` |
| 500 | 강조 | `font-medium` |
| 600 | 제목 | `font-semibold` |
| 700 | 대제목 | `font-bold` |

### 3.4 Line Height

| 용도 | 값 | Tailwind |
|------|---|----------|
| Tight | 1.25 | `leading-tight` |
| Normal | 1.5 | `leading-normal` |
| Relaxed | 1.625 | `leading-relaxed` |

---

## 4. 스페이싱

### 4.1 8px Grid System

```
4px  (0.25rem) - 매우 좁은 간격
8px  (0.5rem)  - 좁은 간격
12px (0.75rem) - 기본 내부 여백
16px (1rem)    - 기본 간격
24px (1.5rem)  - 섹션 간격
32px (2rem)    - 큰 간격
48px (3rem)    - 섹션 분리
64px (4rem)    - 페이지 여백
```

### 4.2 Component Spacing

| 컴포넌트 | 내부 패딩 | 외부 마진 |
|----------|----------|----------|
| Button | 8px 16px | 8px |
| Card | 16px | 16px |
| Input | 12px 16px | 8px |
| Modal | 24px | - |
| Section | 24px | 32px |

---

## 5. Border & Shadow

### 5.1 Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px - 작은 요소 */
  --radius-md: 0.5rem;    /* 8px - 기본 */
  --radius-lg: 0.75rem;   /* 12px - 카드 */
  --radius-xl: 1rem;      /* 16px - 모달 */
  --radius-full: 9999px;  /* 원형 (태그, 아바타) */
}
```

### 5.2 Border Style

```typescript
// 기본 테두리 (미묘한 구분)
const borderDefault = 'border border-border/50'

// 호버 테두리
const borderHover = 'hover:border-border'

// 포커스 링
const focusRing = 'focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-background'
```

### 5.3 Shadow (최소 사용)

Linear 스타일은 그림자 대신 테두리를 선호합니다.

```css
/* 사용 시 매우 미묘하게 */
.shadow-subtle {
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

/* 모달/드롭다운에만 */
.shadow-elevated {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
              0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

---

## 6. 아이콘

### 6.1 Icon Library

**Lucide React** 사용 (단색, 일관된 스타일)

```bash
npm install lucide-react
```

### 6.2 Icon Sizes

| 사이즈 | 픽셀 | 용도 |
|--------|------|------|
| xs | 14px | 인라인 |
| sm | 16px | 버튼 내부 |
| md | 20px | 기본 |
| lg | 24px | 강조 |
| xl | 32px | 큰 아이콘 |

### 6.3 Icon Usage

```tsx
import { FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

// 상태 아이콘
<CheckCircle className="h-5 w-5 text-emerald-400" />  // 성공
<XCircle className="h-5 w-5 text-red-400" />          // 실패
<AlertTriangle className="h-5 w-5 text-amber-400" /> // 경고
```

---

## 7. 컴포넌트 스타일

### 7.1 Button

```tsx
// components/ui/button.tsx

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

### 7.2 Card

```tsx
// components/ui/card.tsx

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props} />
  )
}
```

### 7.3 Industry Block Card

```tsx
// components/blocks/industry-block-card.tsx

import type { IndustryBlockType } from '@/lib/super-model'
import { INDUSTRY_BLOCK_COLORS } from '@/lib/super-model/loader'
import { cn } from '@/lib/utils'

interface IndustryBlockCardProps {
  blockId: IndustryBlockType
  name: string
  nameKo: string
  selected?: boolean
  onClick?: () => void
}

export function IndustryBlockCard({
  blockId,
  name,
  nameKo,
  selected = false,
  onClick,
}: IndustryBlockCardProps) {
  const colorClass = INDUSTRY_BLOCK_COLORS[blockId]

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base
        'flex flex-col items-start gap-1 rounded-lg p-4',
        'transition-all duration-200',
        // Border & Background
        'border bg-card',
        colorClass,
        // Hover
        'hover:bg-accent/5',
        // Selected
        selected && 'ring-2 ring-offset-2 ring-offset-background',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <span className="text-sm font-medium">{nameKo}</span>
      <span className="text-xs text-muted-foreground">{name}</span>
    </button>
  )
}
```

### 7.4 Input

```tsx
// components/ui/input.tsx

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### 7.5 Badge

```tsx
// components/ui/badge.tsx

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-emerald-500/10 text-emerald-400',
        warning: 'bg-amber-500/10 text-amber-400',
        error: 'bg-red-500/10 text-red-400',
        outline: 'border border-input',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)
```

---

## 8. 레이아웃

### 8.1 Page Layout

```tsx
// components/layout/page-layout.tsx

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
```

### 8.2 Sidebar

```tsx
// components/layout/sidebar.tsx

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-card lg:block">
      <nav className="flex flex-col gap-1 p-4">
        <NavItem icon={Home} label="홈" href="/" />
        <NavItem icon={FileText} label="제안서" href="/proposals" />
        <NavItem icon={Building2} label="기업정보" href="/company" />
        <NavItem icon={Search} label="사업검색" href="/programs" />
        <NavItem icon={Settings} label="설정" href="/settings" />
      </nav>
    </aside>
  )
}
```

### 8.3 Grid System

```tsx
// 2 Column (Settings)
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">

// 3 Column (Cards)
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

// 4 Column (Industry Blocks)
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
```

---

## 9. 애니메이션

### 9.1 Transition Defaults

```css
:root {
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}
```

### 9.2 Common Animations

```tsx
// Fade In
const fadeIn = 'animate-in fade-in duration-200'

// Slide Up
const slideUp = 'animate-in slide-in-from-bottom-2 duration-200'

// Scale
const scale = 'transition-transform hover:scale-[1.02]'

// Hover Glow (Industry Block)
const hoverGlow = 'transition-shadow hover:shadow-lg hover:shadow-current/5'
```

### 9.3 Loading States

```tsx
// Skeleton
<div className="animate-pulse rounded-md bg-muted h-4 w-full" />

// Spinner
<Loader2 className="h-4 w-4 animate-spin" />

// Progress
<div className="h-1 w-full bg-muted rounded-full overflow-hidden">
  <div className="h-full bg-primary transition-all duration-500" style={{ width: '60%' }} />
</div>
```

---

## 10. 다크/라이트 모드

### 10.1 Theme Provider

```tsx
// components/theme-provider.tsx

import { ThemeProvider as NextThemeProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  )
}
```

### 10.2 Theme Toggle

```tsx
// components/theme-toggle.tsx

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

### 10.3 Light Mode Colors

```css
.light {
  --bg-primary: #FFFFFF;
  --bg-secondary: #FAFAFA;
  --bg-tertiary: #F4F4F5;
  --fg-primary: #18181B;
  --fg-secondary: #52525B;
  --fg-muted: #A1A1AA;
  --border-default: #E4E4E7;
}
```

---

## 11. 접근성

### 11.1 WCAG 2.1 AA 준수

| 요구사항 | 구현 |
|----------|------|
| 명암비 4.5:1 | 모든 텍스트 |
| 포커스 표시 | `ring-2 ring-offset-2` |
| 키보드 내비게이션 | Tab, Enter, Space |
| 스크린 리더 | aria-label, sr-only |

### 11.2 Focus Management

```tsx
// 포커스 가시성
const focusVisible = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

// 스킵 링크
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground"
>
  본문으로 건너뛰기
</a>
```

### 11.3 Screen Reader

```tsx
// 시각적으로 숨기되 스크린 리더는 읽음
<span className="sr-only">선정됨</span>

// aria-label
<button aria-label="제안서 생성">
  <FileText className="h-5 w-5" />
</button>

// aria-describedby
<Input
  id="company-name"
  aria-describedby="company-name-help"
/>
<p id="company-name-help" className="text-xs text-muted-foreground">
  사업자등록증에 기재된 상호명
</p>
```

---

## 12. Tailwind Config

### 12.1 tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 13. 참고 문서

- [05-frontend-guide.md](./05-frontend-guide.md) - 프론트엔드 가이드
- [04-block-definitions.md](./04-block-definitions.md) - Industry Block 색상 정의
- [Linear Design](https://linear.app) - 디자인 참조
- [shadcn/ui](https://ui.shadcn.com) - 컴포넌트 라이브러리

---

*Last updated: 2026-01-30*
