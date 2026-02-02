# QETTA Improvement Checklist 📋

> **진행률 추적용 체크리스트**  
> 완료 시 `[ ]` → `[x]`로 변경

---

## 🚨 P0: 즉시 수정 (Critical)

### Tailwind 4 호환성
- [ ] `bg-gradient-to-br` → `bg-linear-to-br` 변경
  - 파일: `components/landing/blocks/CTASection.tsx:25`
- [ ] `flex-shrink-0` → `shrink-0` 변경
  - 파일: `components/auth/forgot-password-form.tsx:98`

### 테스트 안정화
- [ ] MQTT 테스트 타임아웃 수정 (`lib/monitor/sensors/__tests__/mqtt-client.test.ts`)
  - 타임아웃 15000ms → 30000ms 또는 mock 개선

---

## 🎯 P1: 배포 최적화 (High Priority)

### Vercel 설정 개선
- [ ] `vercel.json` 캐싱 헤더 추가
  - 정적 자산: `Cache-Control: public, max-age=31536000, immutable`
  - API: `Cache-Control: no-store`
- [ ] Edge Functions 적용 검토 (KidsMap API)
- [ ] ISR(Incremental Static Regeneration) 설정
  - 마케팅 페이지: revalidate 3600 (1시간)

### next.config.ts 최적화
- [ ] 이미지 도메인 추가 (필요시)
- [ ] SWC minify 확인
- [ ] Bundle analyzer로 크기 분석 (`npm run build:analyze`)

### GitHub Actions 개선
- [ ] CI 캐싱 최적화 (node_modules, .next/cache)
- [ ] Parallel jobs 설정 (lint, test, build 동시 실행)
- [ ] Lighthouse CI 추가

---

## 🎨 P2: 코드 품질 (Medium Priority)

### ESLint 경고 정리
- [ ] unused variables 정리 (127개)
- [ ] prefer-const 적용
- [ ] 미사용 import 제거

### TypeScript 강화
- [ ] `strict: true` 확인
- [ ] `any` 타입 제거 (전체 검색)
- [ ] 누락된 타입 정의 추가

### 컴포넌트 정리
- [ ] 미사용 컴포넌트 제거
- [ ] 중복 코드 리팩토링
- [ ] Props 인터페이스 표준화

---

## ⚡ P3: 성능 최적화 (Low Priority)

### 번들 크기 최적화
- [ ] Tree shaking 확인
- [ ] Dynamic import 적용 (큰 컴포넌트)
- [ ] 미사용 패키지 제거

### 런타임 성능
- [ ] React.memo 적용 (렌더링 최적화)
- [ ] useMemo/useCallback 적용
- [ ] 이미지 lazy loading 확인

### 모니터링
- [ ] Sentry 에러 트래킹 확인
- [ ] Web Vitals 모니터링
- [ ] API 응답 시간 로깅

---

## 🔒 P1: 보안 점검

### 환경 변수
- [ ] 프로덕션 시크릿 설정 확인 (Vercel)
- [ ] `.env.local` gitignore 확인
- [ ] API 키 노출 검사

### 헤더 보안
- [ ] CSP(Content-Security-Policy) 설정
- [ ] CORS 설정 확인
- [ ] Rate limiting 적용 (API)

---

## 📊 진행률

| 우선순위 | 총 항목 | 완료 | 진행률 |
|----------|---------|------|--------|
| P0 | 3 | 0 | 0% |
| P1 | 11 | 0 | 0% |
| P2 | 6 | 0 | 0% |
| P3 | 6 | 0 | 0% |
| **총계** | **26** | **0** | **0%** |

---

## 🔄 작업 순서

1. **P0 먼저** - Tailwind 경고, 테스트 수정
2. **P1 배포** - Vercel 최적화, GitHub Actions
3. **P1 보안** - 환경변수, 헤더
4. **P2 품질** - ESLint, TypeScript
5. **P3 성능** - 번들, 런타임

---

## 📝 완료 로그

| 날짜 | 작업 | 담당 |
|------|------|------|
| 2026-02-02 | 체크리스트 생성 | Claude |

