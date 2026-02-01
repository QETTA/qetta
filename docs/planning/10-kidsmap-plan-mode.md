# KidsMap Plan Mode — 장소 + 숏폼 콘텐츠 피드 아키텍처

> **작성일**: 2026-02-01
> **팀**: 3인 개발 (예산 없음, 정부지원사업 유입)
> **핵심 전략**: MAP-FIRST(지도) + FEED-FIRST(콘텐츠) 듀얼 진입점

---

## 0. 핵심 아이디어

```
현재: 지도 → 장소 마커 → 상세 정보
제안: 지도 + 콘텐츠 피드(숏폼) → 장소 발견의 두 가지 경로

사용자 시나리오:
1. "근처 키즈카페 어디있지?" → 지도 (기존)
2. "아이랑 갈만한 곳 뭐있나 구경" → 피드 스크롤 (신규)
   → YouTube 리뷰, 네이버 클립, 블로그 후기
   → 관심 콘텐츠 탭 → 해당 장소 지도에서 보기
```

### 왜 이게 킬러 피처인가

| 기존 경쟁사 | 콘텐츠 연동 |
|------------|------------|
| 애기야가자 | 자체 리뷰만, 영상 없음 |
| 맘맘 | 숙소 위주, 콘텐츠 없음 |
| 엄마의지도 | 크리에이터 의존, 플랫폼 내 콘텐츠만 |
| 카카오/네이버 지도 | 키즈 전용 기능 0개 |
| **KidsMap** | **YouTube + 네이버클립 + 블로그 = 외부 콘텐츠 통합** |

---

## 1. 아키텍처: Compass 템플릿 활용

### 페이지 구조

```
app/(kidsmap)/
├── map/page.tsx          ← 기존 MAP-FIRST (유지)
├── feed/page.tsx         ← 신규: 콘텐츠 피드 (Compass 레이아웃)
├── feed/[contentId]/     ← 콘텐츠 상세 (영상 재생 + 장소 연결)
├── place/[placeId]/      ← 장소 상세 (콘텐츠 탭 포함)
└── layout.tsx            ← 하단 탭바: 🗺️지도 | 📱피드 | ❤️저장 | 👤마이
```

### Compass 활용 범위

```
Compass 템플릿에서 가져올 것:
├── video-card.tsx        → 숏폼 카드 컴포넌트
├── video-player.tsx      → 임베드 플레이어
├── sidebar layout        → 데스크톱 사이드바 (장소 목록)
├── navbar.tsx            → 피드 상단 탭 네비게이션
└── 타이포그래피/스타일    → 콘텐츠 피드 디자인 시스템

Catalyst에서 가져올 것:
├── Button               → CTA (길찾기, 저장, 공유)
├── Badge                → 카테고리 태그, 품질 등급
├── Input                → 검색바
└── Text/Heading         → 타이포그래피 통일
```

---

## 2. 피드 페이지 설계

### 2-1. 피드 레이아웃

```
┌─────────────────────────────────┐
│ 🔍 검색바                        │
│ [키즈카페] [놀이공원] [동물원] ...│  ← 카테고리 필터 (가로 스크롤)
├─────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐     │
│ │ 🎬       │  │ 🎬       │     │  ← 2열 그리드 (모바일)
│ │ YouTube  │  │ 네이버클립│     │
│ │ 썸네일    │  │ 썸네일    │     │
│ │ ─────── │  │ ─────── │     │
│ │ 제목     │  │ 제목     │     │
│ │ 🏷키즈카페│  │ 🏷동물원  │     │
│ │ 👁 12.3K │  │ 👁 5.6K  │     │
│ └──────────┘  └──────────┘     │
│ ┌──────────┐  ┌──────────┐     │
│ │ 📝       │  │ 🎬       │     │
│ │ 네이버블로│  │ YouTube  │     │
│ ...                              │
├─────────────────────────────────┤
│  🗺️지도  |  📱피드  |  ❤️저장  │  ← 하단 탭바
└─────────────────────────────────┘
```

### 2-2. 콘텐츠 카드 컴포넌트

```typescript
// components/kidsmap/content-card.tsx
interface ContentCardProps {
  type: 'video' | 'blog_post' | 'short_video'
  source: 'YOUTUBE' | 'NAVER_BLOG' | 'NAVER_CLIP'
  title: string
  thumbnailUrl: string
  author: string
  viewCount?: number
  duration?: number        // 초 → "2:30" 형식
  publishedAt: string
  placeName?: string       // 연결된 장소
  placeCategory?: string   // 카테고리 배지
  qualityGrade?: string    // A-F 등급
}
```

### 2-3. 콘텐츠 ↔ 장소 연결 UX

```
콘텐츠 카드 탭 → 콘텐츠 상세 페이지:
┌─────────────────────────────────┐
│ [← 뒤로]              [공유] [저장]│
│                                   │
│ ┌───────────────────────────────┐│
│ │                               ││
│ │    YouTube/클립 임베드 플레이어  ││
│ │                               ││
│ └───────────────────────────────┘│
│                                   │
│ 에버랜드 아이랑 3시간 꿀팁 🎢      │
│ @육아브이로그  ·  2.3만 조회       │
│                                   │
│ ── 연결된 장소 ──────────────── │
│ ┌───────────────────────────────┐│
│ │ 📍 에버랜드                    ││
│ │ ⭐ A등급  |  놀이공원           ││
│ │ 경기 용인시 처인구              ││
│ │ [🗺️ 지도에서 보기]  [📞 전화]  ││
│ └───────────────────────────────┘│
│                                   │
│ ── 관련 콘텐츠 ──────────────── │
│ [카드] [카드] [카드]              │
└─────────────────────────────────┘
```

---

## 3. API 설계

### 3-1. 콘텐츠 피드 API

```
GET /api/kidsmap/feed
  ?category=kids_cafe|amusement_park|zoo_aquarium|museum|nature_park
  &source=YOUTUBE|NAVER_BLOG|NAVER_CLIP
  &sortBy=date|relevance|viewCount
  &page=1
  &pageSize=20

Response:
{
  success: true,
  data: {
    contents: ContentCard[],
    total: number,
    page: number,
    hasMore: boolean
  }
}
```

### 3-2. 장소별 콘텐츠 API

```
GET /api/kidsmap/places/{placeId}/contents
  ?source=YOUTUBE|NAVER_BLOG|NAVER_CLIP
  &page=1

Response:
{
  success: true,
  data: {
    place: PlaceSummary,
    contents: ContentCard[],
    total: number
  }
}
```

---

## 4. 스프린트 계획

### Sprint 1: 피드 기반 구축 (Week 1-2)

| # | 태스크 | 파일 | 담당 | 의존성 |
|---|--------|------|------|--------|
| 1 | Compass 컴포넌트 추출 (video-card, video-player, navbar) | `components/kidsmap/feed/` | FE | - |
| 2 | Catalyst 컴포넌트 설치 (Button, Badge, Input, Text) | `components/ui/catalyst/` | FE | - |
| 3 | 콘텐츠 피드 API 라우트 | `api/kidsmap/feed/route.ts` | BE | - |
| 4 | 장소별 콘텐츠 API | `api/kidsmap/places/[id]/contents/route.ts` | BE | - |
| 5 | 피드 페이지 구현 | `app/(kidsmap)/feed/page.tsx` | FE | 1,2,3 |
| 6 | 콘텐츠 상세 페이지 | `app/(kidsmap)/feed/[id]/page.tsx` | FE | 1,2,4 |
| 7 | 하단 탭바 네비게이션 | `components/kidsmap/tab-bar.tsx` | FE | - |
| 8 | 콘텐츠 피드 스토어 | `stores/kidsmap/feed-store.ts` | FE | - |

### Sprint 2: 연결 + 품질 (Week 3-4)

| # | 태스크 | 파일 | 비고 |
|---|--------|------|------|
| 9 | 콘텐츠 ↔ 장소 자동 링킹 강화 | `blocks/pipeline.ts` | autoLinkedPlace confidence 개선 |
| 10 | AI 추천 Redis 캐싱 | `api/kidsmap/recommendations/` | 비용 절감 |
| 11 | 장소 상세 페이지 (콘텐츠 탭) | `app/(kidsmap)/place/[id]/page.tsx` | 장소→콘텐츠 방향 |
| 12 | 무한 스크롤 + 가상화 | `feed/page.tsx` | react-window |
| 13 | 테스트 (피드 API + 스토어) | `__tests__/` | 커버리지 확대 |

### Sprint 3: 프로덕션 + 런칭 (Week 5-8)

| # | 태스크 | 비고 |
|---|--------|------|
| 14 | 정부지원사업 랜딩 페이지 | 유입 채널 |
| 15 | PWA 오프라인 + 푸시 알림 | 재방문율 |
| 16 | 콘텐츠 크롤링 자동 스케줄링 | BullMQ 활용 |
| 17 | 마커 클러스터링 | 대량 장소 표시 |
| 18 | 수도권 데이터 확장 | 서울/경기 전체 |

---

## 5. 기술 결정

### 5-1. QETTA 모듈 유지 vs 독립 분리

```
결정: QETTA 내 독립 모듈 유지

이유:
1. 인프라 공유 (Supabase, Vercel, Redis) → 비용 0
2. 인증 시스템 공유 (NextAuth)
3. Rate Limiter 공유
4. 3인 팀으로 두 레포 관리 비효율
5. 라우트 그룹 (kidsmap)으로 이미 잘 분리됨

분리 시점: MAU 10만+ 도달 시 재검토
```

### 5-2. 콘텐츠 임베드 전략

```
YouTube: iframe 임베드 (무료, API 키 불필요)
네이버 클립: 외부 링크 + 썸네일 프리뷰
네이버 블로그: 외부 링크 + 텍스트 요약

→ 저작권 이슈 없음 (임베드는 YouTube 정책 허용)
→ 네이버는 링크 아웃으로 처리
```

### 5-3. 데이터 흐름

```
이미 구현됨:              신규 구현 필요:
─────────────             ─────────────
YouTubeClient     ───→    피드 API 라우트
NaverBlogClient   ───→    콘텐츠 카드 컴포넌트
NaverClipClient   ───→    피드 페이지
ContentClient     ───→    콘텐츠 ↔ 장소 UX
ContentBlock DB   ───→    (이미 있음, 활용만 하면 됨)
```

---

## 6. 리스크 & 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| YouTube API 할당량 초과 | 중 | 피드 비어보임 | 캐싱 강화 + 크롤 스케줄 최적화 |
| 네이버 API rate limit | 중 | 콘텐츠 누락 | 크레덴셜 풀 이미 구현됨 |
| 콘텐츠-장소 링킹 정확도 낮음 | 높 | 엉뚱한 콘텐츠 노출 | confidence 임계값 + 수동 큐레이션 |
| 3인 팀 리소스 부족 | 높 | 일정 지연 | Sprint 1 핵심만 집중, 나머지 후순위 |

---

## 7. 성공 지표

| 지표 | 목표 (3개월) | 측정 |
|------|-------------|------|
| DAU | 500+ | 정부지원사업 유입 |
| 피드 체류 시간 | 평균 3분+ | 콘텐츠 engagement |
| 피드→지도 전환율 | 15%+ | 콘텐츠→장소 발견 |
| 콘텐츠-장소 링킹 정확도 | 85%+ | 자동 링킹 confidence |
| 재방문율 (D7) | 20%+ | 콘텐츠 업데이트 효과 |

---

## 8. 즉시 실행 가능한 다음 액션

```
1. Compass에서 video-card, video-player 추출 → components/kidsmap/feed/
2. 피드 API 라우트 생성 (ContentClient 활용)
3. 피드 페이지 scaffold (2열 그리드 + 카테고리 필터)
4. 하단 탭바 추가 (지도 ↔ 피드 전환)

→ "다음 작업 시작" 하면 Sprint 1 바로 진행
```
