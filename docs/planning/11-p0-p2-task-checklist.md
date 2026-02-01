# P0-P2 작업 체크리스트

> **스프린트 플래닝용 태스크 목록**
> 상세 구현 가이드: `11-p0-p2-implementation-guide.md`

---

## P0 - Critical (즉시 착수)

### P0-1: 분산 Rate Limiter

| # | 태스크 | 담당 | 상태 | 예상 시간 |
|---|--------|------|------|----------|
| 1 | `lib/api/rate-limiter-redis.ts` 생성 | - | ⬜ | 4h |
| 2 | Lua 스크립트 Sliding Window 구현 | - | ⬜ | 2h |
| 3 | 기존 `rate-limiter.ts` 리팩토링 (export 분리) | - | ⬜ | 1h |
| 4 | `.env.example`에 `RATE_LIMITER_BACKEND` 추가 | - | ⬜ | 0.5h |
| 5 | 단위 테스트 작성 (`rate-limiter-redis.test.ts`) | - | ⬜ | 3h |
| 6 | 통합 테스트 (Redis 연결 상태별) | - | ⬜ | 2h |
| 7 | 스테이징 배포 및 검증 | - | ⬜ | 2h |
| 8 | 프로덕션 롤아웃 (점진적) | - | ⬜ | 1h |

**총 예상 시간**: ~15.5h (2일)

**완료 기준**:
- [ ] Redis 장애 시 인메모리로 graceful fallback
- [ ] 동일 IP에서 연속 요청 시 429 응답 일관성 확인
- [ ] Vercel 다중 인스턴스에서 Rate Limit 공유 확인

---

### P0-2: 입력 살균 (XSS/CSRF)

| # | 태스크 | 담당 | 상태 | 예상 시간 |
|---|--------|------|------|----------|
| 1 | `isomorphic-dompurify`, `@types/dompurify` 설치 | - | ⬜ | 0.5h |
| 2 | `lib/security/sanitize.ts` 생성 | - | ⬜ | 3h |
| 3 | `lib/security/csrf.ts` 생성 | - | ⬜ | 2h |
| 4 | `lib/api/schemas.ts`에 살균 스키마 적용 | - | ⬜ | 2h |
| 5 | `lib/api/middleware.ts`에 CSRF 검증 추가 | - | ⬜ | 2h |
| 6 | 클라이언트 CSRF 토큰 전송 훅 구현 | - | ⬜ | 1.5h |
| 7 | 단위 테스트 (`sanitize.test.ts`) | - | ⬜ | 2h |
| 8 | 보안 감사 (OWASP 체크리스트) | - | ⬜ | 2h |

**총 예상 시간**: ~15h (2일)

**완료 기준**:
- [ ] `<script>` 태그 포함 입력 → 제거됨
- [ ] `javascript:` URL → 빈 문자열 반환
- [ ] POST 요청에 CSRF 토큰 없으면 403

---

## P1 - High Priority (이번 분기)

### P1-1: Server Components 최적화

| # | 태스크 | 담당 | 상태 | 예상 시간 |
|---|--------|------|------|----------|
| 1 | 전체 `'use client'` 컴포넌트 목록 추출 | - | ⬜ | 1h |
| 2 | 각 컴포넌트 분석 (상태/이벤트 사용 여부) | - | ⬜ | 4h |
| 3 | **kidsmap** 컴포넌트 Server 전환 | - | ⬜ | 4h |
| 4 | **dashboard** 컴포넌트 Server 전환 | - | ⬜ | 6h |
| 5 | 하이브리드 패턴 적용 (필요한 곳) | - | ⬜ | 3h |
| 6 | 빌드 테스트 및 검증 | - | ⬜ | 2h |

**총 예상 시간**: ~20h (2.5일)

**전환 대상 (우선순위)**:
```
✅ 전환 가능 (16개)
├── components/kidsmap/feed/shorts-card.tsx
├── components/kidsmap/feed/feed-skeleton.tsx
├── components/kidsmap/feed/content-card.tsx
├── components/dashboard/skeleton.tsx
├── components/dashboard/shimmer-skeleton.tsx
├── components/dashboard/loading-skeleton.tsx
├── components/catalyst/badge.tsx
├── components/catalyst/heading.tsx
├── components/catalyst/text.tsx
├── components/catalyst/divider.tsx
└── ... (분석 후 추가)

❌ 유지 필요 (이벤트/상태 사용)
├── components/kidsmap/place-detail-sheet.tsx
├── components/kidsmap/quick-filter.tsx
├── components/kidsmap/feed/fullscreen-viewer.tsx
└── ...
```

**완료 기준**:
- [ ] `'use client'` 컴포넌트 수: 144개 → 100개 이하
- [ ] 빌드 성공, 런타임 에러 없음

---

### P1-2: Server Actions 도입

| # | 태스크 | 담당 | 상태 | 예상 시간 |
|---|--------|------|------|----------|
| 1 | `app/(kidsmap)/feed/actions.ts` 생성 | - | ⬜ | 3h |
| 2 | 피드 목록 조회 → Server Component 전환 | - | ⬜ | 4h |
| 3 | 북마크 토글 → `useActionState` 전환 | - | ⬜ | 3h |
| 4 | 필터 변경 → Server Actions 전환 | - | ⬜ | 2h |
| 5 | `revalidatePath` / `revalidateTag` 적용 | - | ⬜ | 2h |
| 6 | 에러 핸들링 (useFormStatus) | - | ⬜ | 2h |
| 7 | E2E 테스트 업데이트 | - | ⬜ | 3h |

**총 예상 시간**: ~19h (2.5일)

**완료 기준**:
- [ ] `/feed` 페이지 초기 데이터: Server에서 fetch
- [ ] 북마크 버튼: form action으로 동작
- [ ] Progressive enhancement: JS 없이도 기본 동작

---

### P1-3: 동적 import 코드 스플리팅

| # | 태스크 | 담당 | 상태 | 예상 시간 |
|---|--------|------|------|----------|
| 1 | 번들 분석 (현재 상태 측정) | - | ⬜ | 2h |
| 2 | `FullscreenViewer` 동적 로드 | - | ⬜ | 1.5h |
| 3 | `PlaceDetailSheet` 동적 로드 | - | ⬜ | 1.5h |
| 4 | `RealTimeChart` 동적 로드 | - | ⬜ | 1.5h |
| 5 | `TiptapEditor` 동적 로드 | - | ⬜ | 1.5h |
| 6 | Skeleton/Loading 컴포넌트 추가 | - | ⬜ | 2h |
| 7 | 번들 분석 (개선 후 측정) | - | ⬜ | 1h |

**총 예상 시간**: ~11h (1.5일)

**완료 기준**:
- [ ] First Load JS: 현재 대비 15% 이상 감소
- [ ] LCP 개선: 0.5초 이상 단축

---

## P2 - Medium Priority (이번 반기)

### P2-1: tRPC 부분 도입

| # | 태스크 | 담당 | 상태 | 예상 시간 |
|---|--------|------|------|----------|
| 1 | `@trpc/server`, `@trpc/client`, `@trpc/react-query` 설치 | - | ⬜ | 1h |
| 2 | `lib/trpc/` 디렉토리 구조 설정 | - | ⬜ | 2h |
| 3 | KidsMap 라우터 정의 | - | ⬜ | 4h |
| 4 | React Query Provider 설정 | - | ⬜ | 2h |
| 5 | 기존 fetch → tRPC 클라이언트 전환 (1개 기능) | - | ⬜ | 4h |
| 6 | 문서화 및 팀 교육 | - | ⬜ | 2h |

**총 예상 시간**: ~15h (2일)

---

### P2-2: Edge Runtime 적용

| # | 태스크 | 담당 | 상태 | 예상 시간 |
|---|--------|------|------|----------|
| 1 | Edge 전환 가능 라우트 식별 | - | ⬜ | 2h |
| 2 | `app/api/kidsmap/places/route.ts` Edge 전환 | - | ⬜ | 3h |
| 3 | `app/api/kidsmap/feed/route.ts` Edge 전환 | - | ⬜ | 3h |
| 4 | Supabase Edge Function 또는 Prisma Accelerate 검토 | - | ⬜ | 4h |
| 5 | 지연 시간 측정 (Before/After) | - | ⬜ | 2h |

**총 예상 시간**: ~14h (2일)

---

### P2-3: Bundle Analyzer 통합

| # | 태스크 | 담당 | 상태 | 예상 시간 |
|---|--------|------|------|----------|
| 1 | `@next/bundle-analyzer` 설치 | - | ⬜ | 0.5h |
| 2 | `next.config.ts` 설정 | - | ⬜ | 1h |
| 3 | npm script 추가 (`analyze`) | - | ⬜ | 0.5h |
| 4 | GitHub Actions 워크플로우 작성 | - | ⬜ | 3h |
| 5 | 번들 예산 설정 (200KB 제한) | - | ⬜ | 1h |
| 6 | PR 코멘트 자동화 (번들 크기 변화) | - | ⬜ | 2h |

**총 예상 시간**: ~8h (1일)

---

## 전체 일정 요약

```
┌─────────────────────────────────────────────────────────────┐
│ 2026 Q1                                                     │
├─────────────────────────────────────────────────────────────┤
│ Week 1-2   │ P0-1: 분산 Rate Limiter          │ 15.5h ████ │
│ Week 2-3   │ P0-2: 입력 살균                   │ 15h   ████ │
│ Week 4-5   │ P1-1: Server Components          │ 20h   █████│
│ Week 6-7   │ P1-2: Server Actions             │ 19h   █████│
│ Week 8     │ P1-3: 동적 import                │ 11h   ███  │
├─────────────────────────────────────────────────────────────┤
│ 2026 Q2                                                     │
├─────────────────────────────────────────────────────────────┤
│ Week 1-2   │ P2-1: tRPC 부분 도입              │ 15h   ████ │
│ Week 3-4   │ P2-2: Edge Runtime               │ 14h   ████ │
│ Week 5     │ P2-3: Bundle Analyzer            │ 8h    ██   │
└─────────────────────────────────────────────────────────────┘

총 예상 시간: ~117.5h (약 15일)
```

---

## 의존성 그래프

```
P0-1 (Rate Limiter)
  └── P0-2 (입력 살균) - CSRF는 Rate Limiter 후 미들웨어에 추가
        └── P1-2 (Server Actions) - 보안 적용 후 액션 구현

P1-1 (Server Components)
  └── P1-3 (동적 import) - SC 전환 후 나머지 최적화

P2-1 (tRPC) ──┐
P2-2 (Edge)  ├── 독립적, 병렬 진행 가능
P2-3 (Bundle)┘
```

---

## 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| Redis 연결 불안정 | 높음 | Graceful fallback to memory |
| Server Component 전환 시 hydration 에러 | 중간 | 점진적 전환, 충분한 테스트 |
| tRPC 러닝 커브 | 낮음 | 신규 기능에만 적용, 기존 유지 |
| Edge Runtime 제약 | 중간 | Prisma Accelerate 또는 Supabase 검토 |

---

## 승인

| 역할 | 이름 | 서명 | 날짜 |
|------|------|------|------|
| Tech Lead | | | |
| Backend Lead | | | |
| Frontend Lead | | | |
| Security | | | |
