# QETTA Copilot Handoff 🚀

> **생성일**: 2026-02-02  
> **프로젝트**: QETTA - AI 정부 지원사업 문서 자동화 플랫폼  
> **VS Code Copilot 인계 문서**

---

## 🎯 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **Tech Stack** | Next.js 16.1.6, React 19, TypeScript 5, Tailwind 4, Prisma 7 |
| **Architecture** | 3-Layer Block Engine (L1 System → L2 Domain → L3 Context) |
| **Design System** | Linear-style (zinc/white, 보라색 금지) |
| **Region** | Vercel ICN1 (서울) |
| **AI** | Claude API (@anthropic-ai/sdk) |

---

## 🚨 현재 상태 (2026-02-02)

### ✅ 완료된 작업
- [x] VS Code 설정 최적화 (keybindings, settings, launch.json)
- [x] ESLint 68개 에러 → 0개 해결
- [x] GitHub 설정 최적화 (7개 워크플로우, CODEOWNERS, SECURITY.md)
- [x] Git 레포지토리 정리 (6개 논리적 커밋, 브랜치 정리)
- [x] 빌드 성공 (74페이지 생성)
- [x] 테스트 1476/1481 통과

### ⚠️ 알려진 이슈
| 이슈 | 심각도 | 상태 |
|------|--------|------|
| MQTT 테스트 3개 타임아웃 | Low | 무시 가능 (실제 MQTT 서버 필요) |
| Tailwind 4 경고 2개 | Low | `bg-gradient-to-br` → `bg-linear-to-br` |
| ESLint 경고 127개 | Low | 대부분 unused vars |

---

## 🏗️ 프로젝트 구조

```
app/
├── (auth)/           # 인증 페이지 (로그인, 회원가입)
├── (dashboard)/      # 대시보드 (모니터, 문서 편집)
├── (kidsmap)/        # KidsMap 지도 서비스
├── (marketing)/      # 랜딩/마케팅 페이지
└── api/              # API 라우트
    ├── kidsmap/      # KidsMap API
    ├── monitor/      # IoT 모니터 SSE
    ├── proposals/    # 제안서 생성 스트림
    └── chat/         # AI 챗봇

components/
├── auth/             # 인증 폼
├── dashboard/        # 대시보드 컴포넌트
├── kidsmap/          # 지도, 필터, 바텀시트
├── landing/          # 마케팅 컴포넌트
└── ui/               # shadcn/ui 기반 UI

lib/
├── block-engine/     # 3-Layer Block Engine
├── skill-engine/     # 스킬 자동화 + KidsMap
├── document-generator/ # 문서 생성기
├── claude/           # Claude AI 통합
└── monitor/          # IoT 시뮬레이터

stores/               # Zustand 상태 관리
├── kidsmap/          # map-store, filter-store
└── *.ts              # monitor, ai-panel

prisma/               # DB 스키마 + 마이그레이션
```

---

## 🔑 핵심 규칙

### 🎨 디자인 시스템
```typescript
// ✅ 허용
bg-zinc-600, bg-zinc-950, text-white, text-zinc-300
border-zinc-800, ring-white/30

// ❌ 금지
bg-violet-*, bg-purple-*, text-violet-*
```

### 📝 코드 컨벤션
```bash
# Conventional Commits
feat: 새 기능
fix: 버그 수정
chore: 설정/도구
docs: 문서
refactor: 리팩토링
test: 테스트
```

### 🚫 금지된 용어 (마케팅/UI)
| ❌ 금지 | ✅ 대체 |
|---------|---------|
| blockchain | hash-chain verification |
| innovative | 구체적 지표 사용 |
| 100% guarantee | 99.9% SLA |

---

## 📊 핵심 지표 (이 수치 사용)

| 지표 | 값 |
|------|-----|
| 시간 단축 | 93.8% |
| 오류 감소 | 91% |
| API 가동률 | 99.9% |
| 정확도 | 99.2% |
| 입찰 DB | 630,000+ |

---

## 🔧 주요 명령어

```bash
# 개발
npm run dev              # 개발 서버 (3000)

# 검증
npm run validate         # typecheck + lint + test
npm run build           # 프로덕션 빌드
npm run e2e             # Playwright E2E

# 데이터베이스
npm run db:generate     # Prisma 클라이언트 생성
npm run db:push         # 스키마 푸시
npm run db:studio       # Prisma Studio (UI)

# Git
git push origin master   # master 푸시
```

---

## 🔌 환경 변수

```bash
# 필수
DATABASE_URL=           # PostgreSQL (Supabase)
NEXTAUTH_SECRET=        # NextAuth 시크릿
ANTHROPIC_API_KEY=      # Claude AI

# KidsMap
NEXT_PUBLIC_KAKAO_MAP_KEY=  # Kakao JS SDK
KAKAO_REST_API_KEY=         # Kakao REST API

# 선택
SENTRY_DSN=             # Sentry 에러 트래킹
VERCEL_TOKEN=           # Vercel 배포
```

---

## 📁 주요 파일 위치

| 기능 | 파일 |
|------|------|
| Next.js 설정 | [next.config.ts](next.config.ts) |
| Vercel 배포 | [vercel.json](vercel.json) |
| DB 스키마 | [prisma/schema.prisma](prisma/schema.prisma) |
| ESLint | [eslint.config.mjs](eslint.config.mjs) |
| Tailwind | [tailwind.config.ts](tailwind.config.ts) |
| 색상 토큰 | [constants/color-tokens.ts](constants/color-tokens.ts) |
| CI 워크플로우 | [.github/workflows/ci.yml](.github/workflows/ci.yml) |
| 배포 워크플로우 | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |

---

## 🤖 Copilot 프롬프트 템플릿

### 기능 추가
```
@workspace [파일경로]에 [기능]을 추가해줘.
CLAUDE.md의 규칙을 따르고, zinc/white 컬러만 사용해.
```

### 버그 수정
```
@workspace [에러메시지]가 발생해.
[파일경로]를 확인하고 수정해줘.
```

### 배포 전 검증
```
@workspace npm run validate 실행 후 에러가 있으면 모두 수정해줘.
```

---

## 📚 참고 문서

- **CLAUDE.md** - AI 코딩 가이드 (필독)
- **CONTRIBUTING.md** - 기여 가이드
- **docs/planning/** - 아키텍처 설계 문서
- **.github/copilot-instructions.md** - Copilot 전용 규칙
