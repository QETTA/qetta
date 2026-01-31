# QETTA Frontend Development Guide v2.1

> **버전**: v2.1 (2026-01-30)
> **대상**: Claude Code, Frontend Developers
> **기술 스택**: Next.js 15, React 19, TypeScript, Tailwind CSS

---

## 개요

이 문서는 QETTA 프론트엔드 개발 시 준수해야 할 가이드라인을 정의합니다.
Claude Code 작업 시 이 문서를 참조하여 일관된 코드 품질을 유지합니다.

---

## 1. 디자인 시스템

### 1.1 Linear 스타일 원칙

QETTA는 **Linear 디자인 시스템**을 채택합니다.

| 원칙 | 설명 |
|------|------|
| **미니멀** | 불필요한 장식 최소화 |
| **기능 중심** | UI는 기능을 명확하게 전달 |
| **일관성** | 동일한 패턴 반복 사용 |
| **접근성** | WCAG 2.1 AA 준수 |

### 1.2 컬러 시스템

#### Industry Block 색상

v2.1에서 정의된 10개 Industry Block 색상:

```typescript
const INDUSTRY_BLOCK_COLORS = {
  FOOD: 'orange',       // 식품/음료
  TEXTILE: 'pink',      // 섬유/의류
  METAL: 'slate',       // 금속/철강
  CHEMICAL: 'amber',    // 화학/소재
  ELECTRONICS: 'cyan',  // 전자/반도체
  MACHINERY: 'blue',    // 기계/장비
  AUTOMOTIVE: 'indigo', // 자동차/부품
  BIO_PHARMA: 'rose',   // 바이오/제약
  ENVIRONMENT: 'emerald', // 환경/에너지
  GENERAL: 'gray',      // 일반제조
} as const
```

#### 시맨틱 컬러

```typescript
const SEMANTIC_COLORS = {
  success: 'emerald',
  warning: 'amber',
  error: 'red',
  info: 'blue',
} as const
```

### 1.3 타이포그래피

```css
/* 기본 폰트 */
--font-sans: 'Pretendard', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* 크기 스케일 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
```

---

## 2. 컴포넌트 가이드

### 2.1 파일 구조

```
components/
├── ui/                 # 기본 UI 컴포넌트 (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── blocks/             # Block 관련 컴포넌트
│   ├── industry-block-card.tsx
│   ├── company-block-panel.tsx
│   └── program-block-list.tsx
├── forms/              # 폼 컴포넌트
│   ├── proposal-form.tsx
│   └── company-profile-form.tsx
└── layout/             # 레이아웃 컴포넌트
    ├── header.tsx
    ├── sidebar.tsx
    └── footer.tsx
```

### 2.2 Industry Block 컴포넌트 예시

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
  const color = INDUSTRY_BLOCK_COLORS[blockId]

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border p-4 transition-all',
        'hover:shadow-md',
        selected && 'ring-2 ring-offset-2',
        color
      )}
    >
      <span className="text-sm font-medium">{nameKo}</span>
      <span className="text-xs text-muted-foreground">{name}</span>
    </button>
  )
}
```

### 2.3 Company Block 패널

```tsx
// components/blocks/company-block-panel.tsx
import type { CompanyProfile, CompanyFact } from '@/lib/block-engine'

interface CompanyBlockPanelProps {
  profile: CompanyProfile
  facts: CompanyFact[]
  compression?: {
    originalTokens: number
    compressedTokens: number
    ratio: number
  }
}

export function CompanyBlockPanel({
  profile,
  facts,
  compression,
}: CompanyBlockPanelProps) {
  // Mem0 패턴 압축 시각화
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold">{profile.name}</h3>
        <p className="text-sm text-muted-foreground">
          {profile.basic.region} · 직원 {profile.basic.employeeCount}명
        </p>
      </section>

      {compression && (
        <div className="flex items-center gap-2 text-xs">
          <span>토큰 압축률: {compression.ratio}%</span>
          <span className="text-muted-foreground">
            ({compression.originalTokens} → {compression.compressedTokens})
          </span>
        </div>
      )}

      <section>
        <h4 className="text-sm font-medium mb-2">학습된 패턴</h4>
        <ul className="space-y-1">
          {facts
            .filter(f => f.type === 'rejection_pattern')
            .map(fact => (
              <li key={fact.id} className="text-sm">
                • {fact.content}
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}
```

---

## 3. 상태 관리

### 3.1 서버 상태 (TanStack Query)

```tsx
// hooks/use-industry-blocks.ts
import { useQuery } from '@tanstack/react-query'
import { fetchIndustryBlocks } from '@/lib/api'

export function useIndustryBlocks() {
  return useQuery({
    queryKey: ['industryBlocks'],
    queryFn: fetchIndustryBlocks,
    staleTime: 1000 * 60 * 60, // 1시간 캐시
  })
}
```

### 3.2 클라이언트 상태 (Zustand)

```tsx
// stores/session-store.ts
import { create } from 'zustand'
import type { IndustryBlockType } from '@/lib/super-model'

interface SessionState {
  selectedBlocks: IndustryBlockType[]
  presetId: string | null
  setSelectedBlocks: (blocks: IndustryBlockType[]) => void
  setPreset: (presetId: string, blocks: IndustryBlockType[]) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  selectedBlocks: [],
  presetId: null,
  setSelectedBlocks: (blocks) => set({ selectedBlocks: blocks }),
  setPreset: (presetId, blocks) => set({ presetId, selectedBlocks: blocks }),
  reset: () => set({ selectedBlocks: [], presetId: null }),
}))
```

---

## 4. API 연동

### 4.1 Type-safe API 클라이언트

```tsx
// lib/api/client.ts
import type { IndustryBlockType } from '@/lib/super-model'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export async function fetchIndustryBlocks() {
  const res = await fetch(`${API_BASE}/blocks/industry`)
  if (!res.ok) throw new Error('Failed to fetch industry blocks')
  return res.json() as Promise<{
    success: true
    data: Array<{
      id: IndustryBlockType
      nameKo: string
      nameEn: string
      color: string
    }>
  }>
}

export async function generateProposal(params: {
  programId: string
  presetId: string
  format: 'DOCX' | 'PDF'
}) {
  const res = await fetch(`${API_BASE}/proposals/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return res.json()
}
```

### 4.2 에러 처리

```tsx
// lib/api/errors.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export function handleAPIError(error: unknown): never {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.')
      case 'QUOTA_EXCEEDED':
        throw new Error('월간 문서 생성 한도를 초과했습니다.')
      default:
        throw error
    }
  }
  throw error
}
```

---

## 5. 테스트 가이드

### 5.1 컴포넌트 테스트

```tsx
// components/blocks/__tests__/industry-block-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { IndustryBlockCard } from '../industry-block-card'

describe('IndustryBlockCard', () => {
  it('renders block name correctly', () => {
    render(
      <IndustryBlockCard
        blockId="FOOD"
        name="Food & Beverage"
        nameKo="식품/음료"
      />
    )
    expect(screen.getByText('식품/음료')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(
      <IndustryBlockCard
        blockId="ELECTRONICS"
        name="Electronics"
        nameKo="전자/반도체"
        onClick={handleClick}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### 5.2 API 테스트

```tsx
// lib/api/__tests__/client.test.ts
import { fetchIndustryBlocks } from '../client'

describe('API Client', () => {
  it('fetches 10 industry blocks (v2.1)', async () => {
    const response = await fetchIndustryBlocks()
    expect(response.data).toHaveLength(10)
    expect(response.data.map(b => b.id)).toContain('FOOD')
    expect(response.data.map(b => b.id)).toContain('GENERAL')
  })
})
```

---

## 6. Claude Code 작업 지침

### 6.1 코드 스타일

| 규칙 | 설명 |
|------|------|
| 파일당 1개 컴포넌트 | 단일 책임 원칙 |
| Props 인터페이스 명시 | TypeScript 타입 안전성 |
| cn() 유틸 사용 | Tailwind 클래스 병합 |
| 한글 주석 허용 | 비즈니스 로직 설명 시 |

### 6.2 금지 사항

- ❌ `any` 타입 사용
- ❌ 인라인 스타일
- ❌ 컴포넌트 내 API 호출 (hooks 사용)
- ❌ `console.log` 프로덕션 코드에 남기기
- ❌ v2.0 Industry Block 타입 사용 (SEMICONDUCTOR, ENERGY, HEALTHCARE 등)

### 6.3 권장 사항

- ✅ Server Components 기본 사용
- ✅ `use client` 최소화
- ✅ 에러 바운더리 설정
- ✅ 로딩 스켈레톤 표시
- ✅ v2.1 10개 Industry Block만 사용

---

## 7. 참고 문서

- [00-version-control.md](./00-version-control.md) - 버전 관리
- [03-api-reference.md](./03-api-reference.md) - API 명세
- [04-block-definitions.md](./04-block-definitions.md) - Block 정의

---

*Last updated: 2026-01-30*
