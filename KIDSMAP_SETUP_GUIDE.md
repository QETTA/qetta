# KidsMap 완전 셋업 가이드

> PC 재부팅 후 제로에서 배포까지 — 복사-붙여넣기로 진행

---

## 목차

1. [시스템 요구사항](#1-시스템-요구사항)
2. [기본 도구 설치](#2-기본-도구-설치)
3. [레포지토리 클론 & 브랜치 설정](#3-레포지토리-클론--브랜치-설정)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [외부 서비스 세팅](#5-외부-서비스-세팅)
6. [데이터베이스 세팅](#6-데이터베이스-세팅)
7. [의존성 설치 & 빌드 확인](#7-의존성-설치--빌드-확인)
8. [로컬 개발 서버 실행](#8-로컬-개발-서버-실행)
9. [데이터 크롤링 (초기 데이터)](#9-데이터-크롤링-초기-데이터)
10. [테스트](#10-테스트)
11. [배포](#11-배포)
12. [배포 후 체크리스트](#12-배포-후-체크리스트)
13. [트러블슈팅](#13-트러블슈팅)
14. [아키텍처 레퍼런스](#14-아키텍처-레퍼런스)
15. [알려진 이슈 & 수정 로드맵](#15-알려진-이슈--수정-로드맵)

---

## 1. 시스템 요구사항

| 항목 | 최소 | 권장 |
|------|------|------|
| OS | Windows 10 / macOS 12 / Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |
| Node.js | 20.x LTS | 24.x LTS |
| npm | 10.x | 11.x |
| Git | 2.40+ | 최신 |
| RAM | 8GB | 16GB |
| 디스크 | 2GB 여유 | 5GB 여유 |

---

## 2. 기본 도구 설치

### Windows (winget)

```powershell
# 1. Node.js LTS
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements

# 2. Git
winget install Git.Git --accept-source-agreements --accept-package-agreements

# 3. GitHub CLI (선택)
winget install GitHub.cli --accept-source-agreements --accept-package-agreements

# 4. VS Code (선택)
winget install Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements
```

> **중요**: 설치 후 **새 터미널을 열어야** PATH가 적용됩니다.

### macOS (Homebrew)

```bash
# Homebrew 없으면 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 도구 설치
brew install node@24 git gh
```

### Ubuntu/Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

### 설치 확인

```bash
node --version    # v24.x.x
npm --version     # 11.x.x
git --version     # 2.4x.x
```

---

## 3. 레포지토리 클론 & 브랜치 설정

```bash
# 1. 클론
git clone https://github.com/QETTA/qetta.git
cd qetta

# 2. KidsMap 브랜치 체크아웃
git checkout -b kidsmap origin/claude/kidsmap-architecture-design-dwh8L

# 3. 확인
git log --oneline -5
# 최신 커밋: "docs: add comprehensive kidsmap section to claude.md"
```

---

## 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```bash
# .env.local 생성
cp .env.local.example .env.local
```

아래 내용을 `.env.local`에 채워넣으세요:

```bash
# ============================================================
# 필수 — 이것 없으면 앱이 안 돌아감
# ============================================================

# Supabase (PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here-min-32-chars

# AI (Claude)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx

# 카카오맵 (프론트엔드)
NEXT_PUBLIC_KAKAO_MAP_KEY=your-kakao-javascript-key

# ============================================================
# KidsMap 데이터 소스 — 크롤링에 필요
# ============================================================

# 카카오 REST API (백엔드)
KAKAO_REST_API_KEY=your-kakao-rest-api-key

# 한국관광공사 TourAPI
TOUR_API_KEY=your-tour-api-key

# 행정안전부 어린이놀이시설 API
PLAYGROUND_API_KEY=your-playground-api-key

# YouTube Data API v3
YOUTUBE_API_KEY=your-youtube-api-key

# 네이버 검색 API
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret

# ============================================================
# 인프라 — 크롤링 잡 큐에 필요
# ============================================================

# Redis (Upstash)
REDIS_URL=rediss://default:xxxx@your-redis.upstash.io:6379

# ============================================================
# 선택 — 없어도 앱은 동작함
# ============================================================

# Sentry (에러 트래킹)
SENTRY_DSN=

# 네이버 백업 앱 (레이트리밋 분산)
NAVER_CLIENT_ID_2=
NAVER_CLIENT_SECRET_2=

# 네이버 클라우드 플랫폼
NCP_CLIENT_ID=
NCP_CLIENT_SECRET=
```

---

## 5. 외부 서비스 세팅

### 5.1 Supabase (데이터베이스)

1. https://supabase.com 접속 → 프로젝트 생성 (Region: `Northeast Asia (Seoul)`)
2. **Settings → API** 에서 키 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`
3. **Settings → Database** 에서 Connection String 복사 → `DATABASE_URL`
   - `?pgbouncer=true` 붙이기 (커넥션 풀링)

### 5.2 카카오 개발자

1. https://developers.kakao.com 접속 → 앱 생성
2. **앱 키** 탭:
   - `JavaScript 키` → `NEXT_PUBLIC_KAKAO_MAP_KEY`
   - `REST API 키` → `KAKAO_REST_API_KEY`
3. **플랫폼** 탭 → 웹 플랫폼 등록:
   - 로컬: `http://localhost:3000`
   - 프로덕션: `https://your-domain.com`

### 5.3 공공데이터포털 (TourAPI)

1. https://data.go.kr 접속 → 회원가입
2. "한국관광공사_국문 관광정보 서비스_GW" 활용신청
3. 마이페이지 → 인증키 복사 → `TOUR_API_KEY`

### 5.4 행정안전부 어린이놀이시설 API

1. https://data.go.kr → "어린이놀이시설 현황정보" 활용신청
2. 인증키 → `PLAYGROUND_API_KEY`

### 5.5 Anthropic (Claude API)

1. https://console.anthropic.com → API Keys → 생성
2. 키 복사 → `ANTHROPIC_API_KEY`

### 5.6 Upstash Redis

1. https://upstash.com → Redis 데이터베이스 생성 (Region: `ap-northeast-2`)
2. **REST URL** 복사 → `REDIS_URL`

### 5.7 YouTube Data API

1. https://console.cloud.google.com → 프로젝트 생성
2. API 라이브러리 → "YouTube Data API v3" 사용 설정
3. 사용자 인증 정보 → API 키 생성 → `YOUTUBE_API_KEY`

### 5.8 네이버 검색 API

1. https://developers.naver.com → 앱 등록 (검색 API)
2. Client ID/Secret → `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`

---

## 6. 데이터베이스 세팅

### 6.1 Prisma 스키마 적용

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 스키마를 Supabase에 푸시
npx prisma db push
```

### 6.2 KidsMap 마이그레이션 확인

Prisma push가 자동으로 다음 테이블을 생성합니다:

| 테이블 | 용도 |
|--------|------|
| `kidsmap_place_blocks` | 장소 데이터 (메인) |
| `kidsmap_content_blocks` | 유튜브/블로그 콘텐츠 |
| `kidsmap_crawl_jobs` | 크롤링 작업 큐 |
| `kidsmap_crawl_schedules` | 크롤링 스케줄 |
| `kidsmap_block_stats` | 통계 캐시 |

### 6.3 DB 트리거 & 함수 (수동)

Supabase SQL Editor에서 실행:

```sql
-- freshness 자동 계산 트리거
CREATE OR REPLACE FUNCTION update_kidsmap_freshness()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_crawled_at > NOW() - INTERVAL '7 days' THEN
    NEW.freshness = 'fresh';
  ELSIF NEW.last_crawled_at > NOW() - INTERVAL '30 days' THEN
    NEW.freshness = 'recent';
  ELSIF NEW.last_crawled_at > NOW() - INTERVAL '90 days' THEN
    NEW.freshness = 'stale';
  ELSE
    NEW.freshness = 'outdated';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_freshness
  BEFORE INSERT OR UPDATE OF last_crawled_at
  ON kidsmap_place_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_kidsmap_freshness();

-- 통계 새로고침 함수
CREATE OR REPLACE FUNCTION refresh_kidsmap_stats()
RETURNS VOID AS $$
BEGIN
  INSERT INTO kidsmap_block_stats (id, total_places, total_contents, updated_at)
  VALUES ('global',
    (SELECT COUNT(*) FROM kidsmap_place_blocks WHERE status = 'active'),
    (SELECT COUNT(*) FROM kidsmap_content_blocks WHERE status = 'active'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    total_places = EXCLUDED.total_places,
    total_contents = EXCLUDED.total_contents,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS 활성화
ALTER TABLE kidsmap_place_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kidsmap_content_blocks ENABLE ROW LEVEL SECURITY;

-- 읽기: 인증된 사용자 모두
CREATE POLICY "place_read" ON kidsmap_place_blocks
  FOR SELECT USING (status IN ('active', 'archived'));

-- 쓰기: service_role만
CREATE POLICY "place_write" ON kidsmap_place_blocks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "content_read" ON kidsmap_content_blocks
  FOR SELECT USING (status IN ('active', 'archived'));

CREATE POLICY "content_write" ON kidsmap_content_blocks
  FOR ALL USING (auth.role() = 'service_role');
```

### 6.4 확인

```bash
# Prisma Studio로 테이블 확인
npx prisma studio
# 브라우저에서 http://localhost:5555 열림
```

---

## 7. 의존성 설치 & 빌드 확인

```bash
# 1. 의존성 설치
npm install

# 2. 타입 체크
npm run typecheck

# 3. 린트
npm run lint

# 4. 프로덕션 빌드 테스트
npm run build
```

빌드 성공 시 `.next/` 디렉토리가 생성됩니다.

### 문제 발생 시

```bash
# Prisma 클라이언트 재생성
npx prisma generate

# node_modules 초기화
rm -rf node_modules .next
npm install
```

---

## 8. 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 확인:

| URL | 페이지 |
|-----|--------|
| http://localhost:3000 | 메인 랜딩 |
| http://localhost:3000/map | **KidsMap 지도** |
| http://localhost:3000/login | 로그인 |

### KidsMap 동작 확인 체크리스트

- [ ] `/map` 접속 시 카카오맵 로드됨
- [ ] GPS 위치 허용 → 현재 위치로 이동
- [ ] 퀵 필터 (야외/실내/공공/음식점) 클릭 가능
- [ ] 장소 마커 클릭 → 바텀시트 열림
- [ ] 바텀시트 드래그-다운으로 닫힘
- [ ] 즐겨찾기 ❤️ 토글 동작

---

## 9. 데이터 크롤링 (초기 데이터)

### 9.1 수동 크롤링 (개발용)

Supabase SQL Editor 또는 API를 통해 테스트 데이터 삽입:

```sql
-- 테스트 장소 1개 삽입
INSERT INTO kidsmap_place_blocks (
  id, data, status, quality_grade, freshness, completeness,
  name, category, source, source_id,
  latitude, longitude, address, region_code,
  dedupe_hash, created_at, updated_at, last_crawled_at
) VALUES (
  gen_random_uuid(),
  '{"name":"롯데월드 어드벤처","category":"amusement_park","address":"서울특별시 송파구 올림픽로 240","latitude":37.5111,"longitude":127.098,"tel":"02-411-2000","description":"국내 최대 실내외 테마파크","recommendedAges":["toddler","child","elementary"],"amenities":{"parking":true,"nursingRoom":true,"diaperStation":true,"strollerAccess":true,"indoor":true,"outdoor":true}}'::jsonb,
  'active', 'A', 'fresh', 95,
  '롯데월드 어드벤처', 'amusement_park', 'MANUAL', 'manual-001',
  37.5111, 127.098, '서울특별시 송파구 올림픽로 240', '11710',
  encode(sha256('롯데월드 어드벤처|서울특별시 송파구 올림픽로 240|37.511100|127.098000'::bytea), 'hex'),
  NOW(), NOW(), NOW()
);
```

### 9.2 BullMQ 크롤링 실행 (프로덕션용)

> **사전조건**: `REDIS_URL`, `TOUR_API_KEY`, `PLAYGROUND_API_KEY` 설정 필요

```typescript
// 크롤링 잡은 API 또는 스크립트로 트리거
// POST /api/kidsmap/crawl (구현 필요) 또는 직접 큐에 추가:

import { getCrawlQueue } from '@/lib/skill-engine/data-sources/kidsmap/blocks/crawler'

const queue = getCrawlQueue()

// 전체 크롤링
await queue.add('full-crawl', {
  type: 'FULL_CRAWL',
  config: {
    sources: ['TOUR_API', 'PLAYGROUND_API'],
    pageSize: 100,
    maxPages: 10,
    requestDelay: 500,
    concurrency: 2,
    retryOnFail: true,
    skipDuplicates: true,
    updateExisting: true,
  }
})
```

### 9.3 크롤링 모니터링

```bash
# Redis에서 큐 상태 확인 (Upstash CLI 또는 Redis CLI)
# 또는 BullMQ Dashboard 사용
npx bull-board
```

---

## 10. 테스트

### 단위 테스트

```bash
# 전체 테스트
npm run test

# KidsMap 관련만
npx vitest run --reporter verbose lib/skill-engine/data-sources/kidsmap/
npx vitest run --reporter verbose lib/document-generator/__tests__/cache.test.ts

# 워치 모드
npm run test:watch

# 커버리지
npm run test:coverage
```

### E2E 테스트

```bash
# Playwright 브라우저 설치 (최초 1회)
npx playwright install chromium

# E2E 실행
npm run e2e

# UI 모드 (브라우저에서 확인)
npm run e2e:ui

# 리포트
npm run e2e:report
```

### 전체 검증

```bash
npm run validate
# = typecheck + lint + test
```

---

## 11. 배포

### 11.1 Vercel 배포 (권장)

#### 최초 설정

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 연결
vercel link
```

#### 환경 변수 등록

```bash
# 필수 환경변수를 Vercel에 등록
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL           # https://your-domain.com
vercel env add ANTHROPIC_API_KEY
vercel env add NEXT_PUBLIC_KAKAO_MAP_KEY
vercel env add KAKAO_REST_API_KEY
vercel env add REDIS_URL
vercel env add TOUR_API_KEY
vercel env add PLAYGROUND_API_KEY
```

#### 배포 실행

```bash
# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### GitHub 자동 배포 (CI/CD)

1. GitHub에 push → Vercel이 자동 감지
2. PR → 프리뷰 URL 자동 생성
3. `main` 머지 → 프로덕션 자동 배포

```bash
# 브랜치 푸시
git push origin kidsmap

# PR 생성 (GitHub CLI)
gh pr create --title "feat: KidsMap MVP" --body "KidsMap 키즈 장소 탐색 앱 MVP"
```

### 11.2 배포 환경별 설정

| 환경 | NEXTAUTH_URL | 비고 |
|------|-------------|------|
| 로컬 | `http://localhost:3000` | `.env.local` |
| 프리뷰 | `https://qetta-xxx.vercel.app` | Vercel 자동 |
| 프로덕션 | `https://your-domain.com` | Vercel 환경변수 |

### 11.3 카카오맵 프로덕션 도메인 등록

배포 후 반드시:

1. https://developers.kakao.com → 내 앱 → 플랫폼
2. **웹 사이트 도메인** 추가: `https://your-domain.com`
3. 안 하면 프로덕션에서 카카오맵 로드 실패

---

## 12. 배포 후 체크리스트

### 기능 확인

- [ ] `https://your-domain.com/map` 접속 가능
- [ ] 카카오맵 정상 로드
- [ ] GPS 위치 추적 동작 (HTTPS 필수)
- [ ] 퀵 필터 → 마커 표시
- [ ] 바텀시트 열림/닫힘
- [ ] AI 추천 동작 (`/api/kidsmap/recommendations`)
- [ ] 즐겨찾기 localStorage 저장/복원

### 성능 확인

```bash
# Lighthouse 감사
npx lighthouse https://your-domain.com/map --output html --output-path ./report.html
```

| 지표 | 목표 |
|------|------|
| FCP (First Contentful Paint) | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |
| TTI (Time to Interactive) | < 3.5s |

### 모니터링

- [ ] Sentry DSN 설정 → 에러 트래킹 활성화
- [ ] Supabase Dashboard → DB 쿼리 모니터링
- [ ] Upstash Console → Redis 사용량 확인
- [ ] Vercel Analytics → 트래픽/성능 모니터링

---

## 13. 트러블슈팅

### 카카오맵이 안 보임

```
원인 1: API 키 미설정
→ .env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY 확인

원인 2: 도메인 미등록
→ developers.kakao.com → 플랫폼 → localhost:3000 등록

원인 3: SDK 로드 실패
→ 브라우저 콘솔에서 에러 확인
→ 네트워크 탭에서 dapi.kakao.com 요청 확인
```

### Prisma 에러

```bash
# "PrismaClientInitializationError"
→ DATABASE_URL 확인 (pgbouncer=true 포함?)

# "P1001: Can't reach database server"
→ Supabase 프로젝트 일시정지 확인
→ IP 허용 목록 확인

# 스키마 변경 후 에러
npx prisma generate
npx prisma db push
```

### Claude API 에러

```
# "401 Unauthorized"
→ ANTHROPIC_API_KEY 확인

# "429 Rate Limited"
→ API 사용량 확인 (console.anthropic.com)
→ 요청 간격 늘리기

# "500 Internal Server Error"
→ max_tokens 줄이기 (1024 → 512)
```

### BullMQ 크롤링 실패

```
# "ECONNREFUSED" (Redis)
→ REDIS_URL 확인
→ Upstash 대시보드에서 상태 확인

# "timeout" (외부 API)
→ requestDelay 늘리기 (500 → 1000ms)
→ concurrency 줄이기 (2 → 1)
```

### 빌드 실패

```bash
# 타입 에러
npm run typecheck  # 에러 위치 확인

# 메모리 부족
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 캐시 문제
rm -rf .next node_modules
npm install
npm run build
```

---

## 14. 아키텍처 레퍼런스

### 전체 데이터 흐름

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  외부 API    │     │   BullMQ     │     │  Supabase    │
│  TourAPI     │────▶│   크롤러     │────▶│  PostgreSQL  │
│  행안부      │     │   Worker     │     │  630K+ 장소  │
│  Kakao       │     │              │     │              │
│  YouTube     │     │  ETL 파이프  │     │  JSONB 저장  │
│  Naver       │     │  라인        │     │  품질 등급   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                          ┌─────────────────────┤
                          ▼                     ▼
                   ┌──────────────┐     ┌──────────────┐
                   │  API Routes  │     │  Claude AI   │
                   │  /places     │     │  추천 엔진   │
                   │  (검색+필터) │     │  Sonnet 4    │
                   └──────────────┘     └──────────────┘
                          │                     │
                          └──────────┬──────────┘
                                     ▼
                   ┌─────────────────────────────────┐
                   │         프론트엔드              │
                   │  ┌───────┐  ┌────────┐  ┌────┐ │
                   │  │카카오맵│  │Zustand │  │바텀│ │
                   │  │풀스크린│  │3 Store │  │시트│ │
                   │  └───────┘  └────────┘  └────┘ │
                   └─────────────────────────────────┘
```

### 상태 관리 구조

```
mapStore (세션 전용)
├── center: { lat, lng }         ← 카카오맵 양방향 동기화
├── zoom: number
├── userLocation: { lat, lng }   ← Geolocation API
└── markers: PlaceMarker[]

filterStore (부분 persist)
├── filterCategory: outdoor|indoor|public|restaurant|null
├── ageGroups: AgeGroup[]        ← persist
├── amenities: Amenities         ← persist
├── sortBy: string               ← persist
└── maxDistance: number|null

placeStore (부분 persist)
├── searchResult: SearchResult   ← API 응답
├── selectedPlace: Place|null    ← 바텀시트
├── favorites: string[]          ← persist
├── favoritePlaces: Place[]      ← persist
└── recentVisits: Visit[]        ← persist (max 20)
```

### DB 테이블 관계

```
kidsmap_place_blocks (메인)
├── id (PK, UUID)
├── data (JSONB: NormalizedPlace)
├── status, quality_grade, freshness
├── dedupe_hash (UNIQUE)
├── latitude, longitude (인덱스)
└── search_keywords (GIN 인덱스)
      │
      │ 1:N
      ▼
kidsmap_content_blocks
├── id (PK, UUID)
├── related_place_id (FK)
├── data (JSONB: NormalizedContent)
└── source, content_type

kidsmap_crawl_jobs
├── type, status, priority
├── config, progress, result (JSON)
└── retry_count, max_retries

kidsmap_block_stats (싱글턴)
└── total_places, total_contents, updated_at
```

### API 스펙

#### GET /api/kidsmap/places

```
Query:
  q          string   검색어
  lat        number   위도 (필수)
  lng        number   경도 (필수)
  radius     number   반경 미터 (기본: 5000)
  category   string   outdoor|indoor|public|restaurant
  ageGroups  string   콤마 구분: infant,toddler,child,elementary
  page       number   페이지 (기본: 1)
  pageSize   number   개수 (기본: 20)
  openNow    boolean  영업중만

Response 200:
  {
    success: true,
    data: {
      places: PlaceWithDistance[],
      total: number,
      page: number,
      hasMore: boolean
    }
  }
```

#### POST /api/kidsmap/recommendations

```
Body:
  {
    userLocation: { lat, lng },
    childAge: "infant"|"toddler"|"child"|"elementary",
    weather?: string,
    recentVisits?: string[]
  }

Response 200:
  {
    success: true,
    data: {
      recommendations: PlaceWithDistance[],
      reasoning: string
    }
  }
```

---

## 15. 알려진 이슈 & 수정 로드맵

### P0 — 즉시 수정

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| 1 | Kakao 소스 라벨링 버그 | `crawler.ts:296` | `'PLAYGROUND_API'` → `'KAKAO_LOCAL'` |
| 2 | bulkUpsert N+1 쿼리 | `repository.ts:444` | 1000건 = 2000 DB콜 → 배치 처리 필요 |
| 3 | 프롬프트 인젝션 | `recommendations/route.ts` | 장소명 이스케이프 필요 |
| 4 | searchPlaces 레이스컨디션 | `map/page.tsx` | AbortController + 디바운스 추가 |

### P1 — 다음 스프린트

| # | 이슈 | 설명 |
|---|------|------|
| 5 | AI 추천 캐싱 없음 | Redis 캐시 추가 (TTL 1시간, 비용 70% 절감) |
| 6 | 거리 필터 비효율 | DB 바운딩박스 사전 필터 적용 |
| 7 | 크롤러 페이지네이션 누락 | TourAPI pageNo 파라미터 추가 |
| 8 | PlaceMarker 타입 불일치 | 인터페이스 ↔ 실제 사용 정렬 |
| 9 | 에러 트래킹 없음 | Sentry 연동 |

### P2 — 개선

| # | 이슈 | 설명 |
|---|------|------|
| 10 | 마커 클러스터링 | 50개+ 마커 시 MarkerClusterer 적용 |
| 11 | 품질 등급 로직 | 이미지 의존성 완화, 리뷰 점수 반영 |
| 12 | 크롤러 메모리 | Generator 패턴으로 스트리밍 처리 |
| 13 | 필터 리셋 사이드이펙트 | setFilterCategory가 다른 필터 초기화하지 않도록 |
| 14 | 바텀시트 키보드 접근성 | 마우스/키보드 드래그 지원 |
| 15 | 테스트 커버리지 | E2E + 통합 테스트 추가 |

---

## 빠른 참조 명령어

```bash
# 개발
npm run dev                    # 개발 서버
npm run build                  # 프로덕션 빌드
npm run validate               # typecheck + lint + test

# DB
npx prisma generate            # 클라이언트 생성
npx prisma db push             # 스키마 적용
npx prisma studio              # DB GUI

# 테스트
npm run test                   # 단위 테스트
npm run e2e                    # E2E 테스트
npm run test:coverage          # 커버리지

# 배포
vercel                         # 프리뷰 배포
vercel --prod                  # 프로덕션 배포

# 디버깅
npx prisma studio              # DB 확인
npm run lint:fix               # 자동 수정
```

---

*마지막 업데이트: 2026-02-01*
*KidsMap 브랜치: `claude/kidsmap-architecture-design-dwh8L`*
