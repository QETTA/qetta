# KidsMap 앱 개선 — 플랜 모드 전 마스터 프롬프트 탐색

> **목적**: Plan Mode 진입 전, AI가 KidsMap의 현재 코드·아키텍처·갭을 완전히 이해하도록 하는 탐색 프롬프트
> **작성일**: 2026-02-01
> **버전**: 4.0 (실행 완료)
> **프로젝트**: KidsMap — AI 기반 어린이 놀이 공간 검색 플랫폼 (QETTA 내 독립 모듈)
> **전문가 분석 보고서**: [`docs/kidmap-expert-analysis-report.md`](./kidmap-expert-analysis-report.md)
> **팀 상황**: 3인 개발팀, 예산 없음, 정부지원사업으로 유입 확보 전략
>
> ### v4.0 실행 완료 사항
> - [x] 브랜치 통합: `fix-infinite-loading` → `kidmap-master-prompt` 병합 완료
> - [x] P0 크리티컬 버그 3건 수정 (Anthropic 키 크래시, DB enum 누락, 페이지네이션 깨짐)
> - [x] 보안 취약점 4건 수정 (Rate Limiting 3개 엔드포인트, 입력 검증, 에러 메시지 정리)
> - [x] 성능 최적화 (맵 검색 300ms debounce)
> - [x] 테스트 추가 (FilterStore 10개 테스트 케이스)
>
> ### 남은 Plan Mode 과제
> - [ ] Catalyst UI Kit 부분 채택 (Button, Badge, Dialog, Input)
> - [ ] AI 추천 Redis 캐싱
> - [ ] bulkUpsert 배치 최적화
> - [ ] 테스트 커버리지 확대 (목표: 핵심 API 80%+)
> - [ ] PostGIS 공간 인덱스 도입
> - [ ] 마커 클러스터링
> - [ ] 수도권 전체 확장

---

## 0. 프로젝트 정체성

```
KidsMap = AI 기반 키즈 장소 찾기 플랫폼

- 카카오맵 MAP-FIRST 인터페이스
- Claude AI 맥락 인식 추천 (날씨/시간/연령)
- 키즈 전용 메타데이터 (수유실, 놀이방, 기저귀 교환대)
- QETTA 플랫폼 내 독립 모듈로 존재 (별도 라우트 그룹)
```

### 레포지토리 & 브랜치 현황

```
QETTA/qetta 레포:

c8eccec  Initial commit (QETTA 775파일)
│
├── [현재] claude/kidmap-master-prompt-*
│   QETTA 코드 + catalyst.zip + compass.zip + 이 문서
│
├── origin/main = claude/kidsmap-architecture-design-*
│   QETTA 코드 + 개발 도구 (CLAUDE.md, husky, prettier)
│
└── claude/fix-infinite-loading-CeSxd  ← ★ KidsMap 코드가 여기에 있음
    QETTA 코드 + KidsMap 34파일 11,229줄 + 무한로딩 수정 + ENV 검증 + i18n

디자인 리소스 (현재 브랜치):
├── catalyst-ui-kit-1.zip   # Tailwind Catalyst UI Kit (73 컴포넌트)
└── compass.zip             # Tailwind Plus Compass (44 컴포넌트, sidebar/auth/dashboard)
```

---

## 1. 사용법

```
1. 아래 마스터 프롬프트를 Claude에게 전달
2. Claude가 질문 목록으로 응답 → 답변 제공
3. 충분한 컨텍스트 확보 후 "Plan Mode 진입" 요청
4. Claude가 구조화된 개선 계획 출력
```

---

## 2. 마스터 탐색 프롬프트 (Full Version)

```markdown
# ROLE

너는 KidsMap 앱 개선을 위한 **프로덕트 리서치 에이전트**다.
Plan Mode에 진입하기 전, 다음 6가지 축으로 현재 상태를 완전히 탐색하고 정리해야 한다.

---

# CONTEXT

## 프로젝트 정체성
- 프로젝트명: KidsMap
- 정의: AI 기반 어린이 놀이 공간 검색 플랫폼
- 핵심: 카카오맵 MAP-FIRST + Claude AI 맥락 추천
- 위치: QETTA 플랫폼 내 독립 모듈 (app/(kidsmap)/ 라우트 그룹)
- 타겟 지역: 서울 강남/서초/송파, 성남 분당/위례

## 대상 사용자
- 1차: 부모 (0~12세 아이를 둔, 주말/휴일 놀이 장소 탐색)
- 2차: 양육자/조부모 (아이 돌봄 중 장소 검색)
- 미래: B2B 확장 (키즈카페, 식당 등 업주 — 장소 등록/관리)

## 핵심 차별점
- 일반 지도: "키즈카페 어디 있지?" (키워드 검색, 성인 중심)
- KidsMap: "2살 아기, 비오는 날, 오전 10시" (맥락 인식, 키즈 전용)

---

# CURRENT STATE (AS-IS) — 이미 구현된 코드 기준

## 기술 스택
- Frontend: Next.js 16, React 19, TypeScript 5, TailwindCSS 4
- State: Zustand 5 (3개 스토어: mapStore, filterStore, placeStore)
- Map: Kakao Map SDK (useKakaoMap 훅)
- AI: Claude API (@anthropic-ai/sdk)
- DB: PostgreSQL (Supabase) + Prisma 7
- Cache: Redis (Upstash) + LRU Cache
- Infra: Vercel, BullMQ (크롤링 잡)

## 구현 완료된 파일 (34파일, 11,229줄)

### Pages (app/(kidsmap)/)
| 파일 | 줄 | 역할 |
|------|-----|------|
| map/page.tsx | 322 | 메인 맵 페이지 (전체 화면 카카오맵 + 필터 + 바텀시트) |
| layout.tsx | 15 | KidsMap 레이아웃 |
| loading.tsx | 10 | 로딩 스켈레톤 |
| error.tsx | 37 | 에러 바운더리 |

### API Routes (app/api/kidsmap/)
| 파일 | 줄 | 역할 |
|------|-----|------|
| places/route.ts | 148 | 장소 검색 API (위치 기반, 카테고리, 연령, 반경) |
| recommendations/route.ts | 226 | AI 추천 API (Claude, 날씨/시간/연령 맥락) |
| coupons/route.ts | 32 | 쿠폰 API |

### Components (components/kidsmap/)
| 파일 | 줄 | 역할 |
|------|-----|------|
| place-detail-sheet.tsx | 394 | 장소 상세 바텀시트 (Google Maps 스타일) |
| quick-filter.tsx | 189 | 퀵 필터 (야외/실내/공공/식당, 원탭) |
| index.ts | 8 | 배럴 export |

### Stores (stores/kidsmap/)
| 파일 | 줄 | 역할 |
|------|-----|------|
| map-store.ts | 198 | 지도 상태 (center, zoom, userLocation) |
| filter-store.ts | 244 | 필터 상태 (카테고리, 연령, 거리, 영업 중) |
| place-store.ts | 209 | 장소 상태 (검색결과, 선택장소, 즐겨찾기, 최근방문, AI추천) |

### Data Sources (lib/skill-engine/data-sources/kidsmap/)
| 파일 | 줄 | 역할 |
|------|-----|------|
| types.ts | 1,024 | 전체 타입 (8개 카테고리, 4개 연령대, Amenities, CrowdLevel, RestaurantMetadata) |
| kakao-client.ts | 685 | 카카오 로컬 API 클라이언트 |
| naver-client.ts | 873 | 네이버 검색 API 클라이언트 |
| tour-api-client.ts | 627 | 한국관광공사 TourAPI 클라이언트 |
| playground-client.ts | 454 | 전국 어린이놀이시설 공공 API |
| youtube-client.ts | 440 | YouTube Data API (장소 관련 영상) |
| content-client.ts | 434 | 콘텐츠 수집 통합 클라이언트 |
| client.ts | 514 | 통합 데이터 소스 클라이언트 |
| index.ts | 258 | 배럴 export + 팩토리 |

### Block System (lib/skill-engine/data-sources/kidsmap/blocks/)
| 파일 | 줄 | 역할 |
|------|-----|------|
| types.ts | 549 | PlaceBlock, ContentBlock, CrawlJob 타입 |
| repository.ts | 736 | DB CRUD (PlaceBlock, ContentBlock) |
| crawler.ts | 607 | 크롤러 (TourAPI, Playground, 카카오, 네이버) |
| pipeline.ts | 757 | ETL 파이프라인 (수집→정규화→중복제거→품질평가→저장) |
| index.ts | 150 | 배럴 export |

### Lib (lib/kidsmap/)
| 파일 | 줄 | 역할 |
|------|-----|------|
| ai-coupon.ts | 192 | AI 쿠폰 생성 (Claude 기반) |
| supabase-client.ts | 76 | Supabase 클라이언트 |

### DB (prisma/)
| 파일 | 줄 | 역할 |
|------|-----|------|
| migration.sql | 398 | kidsmap_place_blocks, kidsmap_content_blocks, kidsmap_crawl_jobs 테이블 |
| seed-kidsmap.sql | 65 | 시드 데이터 |

### Tests
| 파일 | 줄 | 역할 |
|------|-----|------|
| client.test.ts | 336 | 데이터 소스 클라이언트 테스트 |

## DB 스키마 (3 테이블)
```sql
kidsmap_place_blocks    — 장소 데이터 (JSONB, 카테고리, 좌표, 품질등급 A-F, 신선도)
kidsmap_content_blocks  — 콘텐츠 (YouTube, 네이버블로그, 클립)
kidsmap_crawl_jobs      — 크롤링 작업 관리 (BullMQ)
```

## 장소 카테고리 (8개)
amusement_park, zoo_aquarium, kids_cafe, museum,
nature_park, restaurant, public_facility, other

## 퀵 필터 (4개)
outdoor(야외), indoor(실내), public(공공), restaurant(식당)

## 연령대 (4개)
infant(0-2세), toddler(3-5세), child(6-9세), elementary(10-12세)

## 데이터 소스 (6개)
카카오 로컬, 네이버 검색, 한국관광공사 TourAPI,
전국어린이놀이시설 공공API, YouTube Data API, 네이버 블로그/클립

## 디자인 리소스 (미통합)
- catalyst-ui-kit-1.zip: Tailwind Catalyst UI Kit (73 .tsx 컴포넌트)
- compass.zip: Tailwind Plus Compass (44 .tsx, sidebar/dashboard/auth 레이아웃)
- 현재 KidsMap UI는 직접 구현됨 (Catalyst/Compass 미사용)

---

# EXPLORATION AXES (탐색 6축)

## 축 1: 현재 코드 품질 진단

다음을 파악하라:

### 1.1 기능 완성도
| 기능 | 완성도 | 비고 |
|------|--------|------|
| 맵 인터페이스 | ? | 카카오맵 렌더링, 마커, 클러스터링 |
| 장소 검색 API | ? | 위치/카테고리/연령/반경 필터 |
| AI 추천 | ? | Claude 맥락 인식 (날씨/시간/연령) |
| 바텀시트 상세 | ? | 장소 정보, 편의시설, 액션 버튼 |
| 퀵 필터 | ? | 야외/실내/공공/식당 원탭 |
| 크롤링 파이프라인 | ? | ETL (6개 소스 → 정규화 → 저장) |
| 쿠폰 시스템 | ? | AI 쿠폰 생성 |
| 즐겨찾기/최근방문 | ? | localStorage persist |
| 사용자 인증 | ? | QETTA 인증과 통합 여부 |
| 오프라인 모드 | ? | PWA/ServiceWorker |

### 1.2 기술 부채
- any 타입 사용 현황 (fix-infinite-loading에서 일부 수정됨)
- 에러 핸들링 패턴
- 테스트 커버리지 (현재 1개 테스트 파일만 존재)
- 성능 병목 (무한 로딩 이슈가 있었음)

### 1.3 미통합 리소스
- Catalyst UI Kit (zip 상태, 미사용)
- Compass 템플릿 (zip 상태, 미사용)
- 이 리소스들이 현재 KidsMap UI를 대체/개선할 수 있는가?

---

## 축 2: 목표 상태 정의 (TO-BE)

### 2.1 비전
- 6개월 후 KidsMap의 이상적 상태
- 핵심 KPI (MAU, 검색 횟수, 저장/공유율, AI 추천 사용률)
- 수익화 (키즈카페/식당 광고? 프리미엄? B2B 업주 대시보드?)

### 2.2 핵심 사용자 여정
```
현재 여정:
앱 진입 → 지도 표시 → 퀵 필터 → 장소 마커 탭 → 바텀시트 상세 → 길찾기

이상 여정:
앱 진입 → 위치 자동 감지 → AI가 맥락 추천 (날씨+시간+아이 연령)
→ 지도에 추천 장소 하이라이트 → 탭하여 상세 → 쿠폰 받기 → 길찾기/예약
→ 방문 후 간편 리뷰 → 다음 추천에 반영
```

### 2.3 확장 방향
- 더 많은 지역 (현재: 강남/서초/송파/분당)
- 커뮤니티 기능 (부모 리뷰, 사진, 꿀팁)
- 알림 (주말 추천, 새 장소 오픈, 날씨 기반)
- 업주 대시보드 (장소 정보 관리, 쿠폰 발행)

---

## 축 3: 갭 분석 (GAP)

AS-IS와 TO-BE 사이의 갭:

| 카테고리 | 갭 항목 | 심각도 | 복잡도 |
|----------|---------|--------|--------|
| UX | Catalyst/Compass 미적용 (현재 자체 UI) | 중간 | L |
| 데이터 | 크롤링 파이프라인 실제 가동 여부 불명 | 높음 | M |
| AI | 추천 품질·정확도 검증 미비 | 중간 | M |
| 테스트 | 1개 테스트만 존재 | 높음 | L |
| 성능 | 무한 로딩 이슈 (수정됨, 재발 가능성) | 높음 | S |
| 지역 | 서울/성남 외 지역 미지원 | 중간 | L |
| 인증 | QETTA 인증과 통합 방식 불명 | 중간 | M |
| 오프라인 | PWA/오프라인 미지원 | 낮음 | L |
| 커뮤니티 | 사용자 리뷰/사진 기능 없음 | 중간 | XL |
| 수익화 | 비즈니스 모델 미정 | 높음 | - |

---

## 축 4: 디자인 리소스 활용 전략

### 4.1 Catalyst UI Kit (73 컴포넌트)
| 컴포넌트 | KidsMap 활용 |
|----------|-------------|
| Button, Badge, Avatar | 바텀시트 액션, 카테고리 태그 |
| Dialog, Dropdown | 장소 상세 모달, 정렬 옵션 |
| Input, Select, Combobox | 검색바, 필터 옵션 |
| Table, Description List | 장소 정보 표시 |
| Navigation, Sidebar | 앱 내비게이션 |
| Pagination | 검색 결과 페이지네이션 |

### 4.2 Compass 템플릿 (44 파일)
| 페이지 | KidsMap 활용 |
|--------|-------------|
| Sidebar layout | 데스크톱 버전 사이드 패널 |
| Auth pages | 로그인/회원가입 |
| Dashboard | 업주용 대시보드 (향후) |
| Resources | 육아 정보/가이드 페이지 |

### 4.3 적용 판단
- 현재 KidsMap UI를 Catalyst 기반으로 리팩터링할 것인가?
- 아니면 현재 자체 UI를 유지하고 부분적으로만 적용할 것인가?

---

## 축 5: 경쟁 환경 분석

### 5.1 직접 경쟁
| 서비스 | 핵심 기능 | 강점 | 약점 |
|--------|-----------|------|------|
| 카카오맵 키즈 | 지도 + 키즈 필터 | 압도적 사용자 수 | 키즈 전용 메타 부족 |
| 네이버지도 | 지도 + 리뷰 | 블로그 리뷰 풍부 | AI 추천 없음 |
| 맘카페/맘앱 | 커뮤니티 추천 | 실제 부모 후기 | 지도 기반 아님 |
| 아이랑 | 키즈 장소 추천 | 키즈 특화 | 사용자 수 적음 |
| 키즈노트 | 어린이집 소통 | B2B 기관 연동 | 장소 검색 아님 |

### 5.2 KidsMap 차별화
- **맥락 인식 AI**: "2살, 비오는 날, 오전" → 자동 추천 (경쟁사 없음)
- **키즈 전용 메타**: 수유실, 놀이방 크기, 키즈메뉴, 유모차 접근성
- **품질 등급**: A-F 등급 + 신선도 (fresh→outdated)
- **6개 데이터 소스 통합**: 카카오+네이버+관광공사+공공API+YouTube+블로그
- **실시간 혼잡도**: 시간대별 혼잡 예측

---

## 축 6: 리스크 & 제약 조건

### 6.1 기술적 리스크
- 카카오맵 SDK 의존성 (API 키 할당량, 정책 변경)
- 크롤링 안정성 (공공 API 장애, rate limit)
- 데이터 신선도 유지 (stale 데이터 자동 갱신)
- 무한 로딩 이슈 재발 가능성

### 6.2 데이터 보호
- 사용자 위치 정보 수집 → 위치정보법 준수
- 아이 연령 정보 → 직접적 아동 데이터는 아니지만 민감 가능
- 검색/방문 이력 → 개인정보처리방침 필요

### 6.3 비즈니스 리스크
- 카카오맵/네이버의 키즈 기능 강화 시 차별화 약화
- 크롤링 데이터 의존 → 자체 데이터 확보 전략 필요
- 초기 데이터 부족 (강남/분당만) → Cold Start 문제

### 6.4 제약 조건
- 예산: [미정 — 확인 필요]
- 인력: [미정 — 확인 필요]
- 일정: [미정 — 확인 필요]
- 기술: QETTA 플랫폼 내 모듈로 유지 vs 독립 앱 분리

---

# OUTPUT FORMAT

탐색 결과를 다음 구조로 정리하라:

## 탐색 결과 요약

### 1. 현재 상태 스냅샷
[AS-IS: 34파일 11,229줄, 기능별 완성도, 기술 부채]

### 2. 목표 상태 요약
[TO-BE: 핵심 개선 방향 3-5줄]

### 3. 핵심 갭 Top 5
1. [가장 중요한 갭]
2. ...
3. ...
4. ...
5. ...

### 4. 디자인 리소스 적용 전략
[Catalyst/Compass 적용 방향 결정]

### 5. 우선순위 매트릭스

| 항목 | Impact | Effort | 우선순위 |
|------|--------|--------|----------|
| | High/Med/Low | S/M/L/XL | P0/P1/P2/P3 |

### 6. Plan Mode 진입 준비도
- [ ] 코드 품질 진단 완료
- [ ] TO-BE 정의 완료
- [ ] 갭 분석 완료
- [ ] 디자인 리소스 적용 방향 결정
- [ ] 제약 조건 확인 완료
- [ ] 우선순위 합의 완료

**준비도: [N/6] → Plan Mode 진입 [가능/불가능]**

---

# RULES

1. **코드 기반 분석** — 추측하지 말고 실제 코드(fix-infinite-loading 브랜치)를 확인하라
2. **KidsMap = 키즈 장소 검색 플랫폼** — 유아 발달 추적 앱이 아님
3. **QETTA 모듈** — 독립 앱이 아닌 QETTA 내 (kidsmap) 라우트 그룹
4. 구체적 수치를 요구하라 — "빠르게" 대신 "FCP 1.2초"
5. 금지 용어: "혁신적", "획기적" → 구체적 수치와 개선 폭으로 표현
6. Plan Mode 진입 전까지는 실행 제안 금지 — 탐색과 정리에만 집중
7. 디자인 리소스(Catalyst, Compass) 적용 여부를 반드시 판단하라
```

---

## 3. 단축 프롬프트

```markdown
# KidsMap 탐색 에이전트

KidsMap은 AI 기반 어린이 놀이 공간 검색 플랫폼이다. (카카오맵 MAP-FIRST + Claude AI 추천)
QETTA 플랫폼 내 독립 모듈. 현재 34파일 11,229줄 구현 완료.
기술: Next.js 16, Kakao Map SDK, Zustand, Claude API, Supabase, BullMQ.
디자인 리소스: Catalyst UI Kit + Compass (zip, 미통합).

Plan Mode 진입 전, 다음 6축으로 탐색하라:
1. 코드 품질 (기능 완성도, 기술 부채, 테스트 커버리지)
2. TO-BE (6개월 목표, KPI, 사용자 여정)
3. GAP (데이터 파이프라인, UX, AI 추천 품질, 테스트, 지역 확장)
4. 디자인 리소스 (Catalyst/Compass 적용 vs 현재 UI 유지)
5. 경쟁 환경 (카카오맵, 네이버, 맘카페 대비 차별화)
6. 리스크 (카카오 의존성, 데이터 신선도, Cold Start)

불확실한 정보는 질문으로 확인. 실행 제안 금지. 탐색과 정리에만 집중.
결과를 요약 → 우선순위 매트릭스 → Plan Mode 준비도 체크리스트로 출력.
```

---

## 4. 프롬프트 체이닝 가이드

```
[Step 1] 마스터 탐색 프롬프트 전달
    ↓
[Step 2] Claude 질문에 답변 (2-3회 왕복)
    ↓
[Step 3] 탐색 결과 요약 확인
    ↓
[Step 4] "Plan Mode 진입 준비도" 6/6 확인
    ↓
[Step 5] Plan Mode 전환 프롬프트:

    "탐색 결과를 기반으로 Plan Mode로 전환한다.
     KidsMap(AI 키즈 장소 검색 플랫폼)의 실행 계획을 수립하라:
     1. Phase별 마일스톤 (4주 단위)
     2. 각 Phase의 태스크 (Story 단위)
     3. Catalyst/Compass 디자인 마이그레이션 계획
     4. 크롤링 파이프라인 안정화 계획
     5. AI 추천 품질 개선 계획
     6. 테스트 전략 (현재 1개 → 목표 커버리지)
     7. 지역 확장 전략 (강남/분당 → 수도권 전체)
     8. 배포 전략"
```

---

## 5. KidsMap 데이터 구조 요약

### 장소 카테고리 (8개)
| ID | 이름 | 필터 분류 | 색상 |
|----|------|-----------|------|
| amusement_park | 놀이공원/테마파크 | 야외 (Green) | |
| zoo_aquarium | 동물원/수족관 | 야외 (Green) | |
| nature_park | 자연/공원 | 야외 (Green) | |
| kids_cafe | 키즈카페/실내놀이터 | 실내 (Blue) | |
| museum | 박물관/체험관 | 실내 (Blue) | |
| restaurant | 놀이방 있는 식당 | 식당 (Orange) | |
| public_facility | 공공시설 (육아나눔터 등) | 공공 (Purple) | |
| other | 기타 | 실내 | |

### 연령대 (4개)
| ID | 범위 | 설명 |
|----|------|------|
| infant | 0-2세 | 영아 |
| toddler | 3-5세 | 유아 |
| child | 6-9세 | 아동 |
| elementary | 10-12세 | 초등 |

### 키즈 전용 메타데이터
- 편의시설: 수유실, 기저귀교환대, 유모차접근, 아기의자, 주차장
- 식당 전용: 놀이방 유무/크기, 키즈메뉴, 아기의자 수
- 품질: A-F 등급, 완성도(0-100%), 신선도(fresh→outdated)
- 혼잡도: 현재 1-5단계, 시간대별 예측, 주말/공휴일

### 데이터 소스 (6개)
| 소스 | 데이터 | 용도 |
|------|--------|------|
| 카카오 로컬 API | 장소 기본 정보 | 검색, 좌표, 영업시간 |
| 네이버 검색 API | 블로그, 클립 | 리뷰/콘텐츠 보강 |
| 한국관광공사 TourAPI | 관광지, 체험시설 | 야외 장소 데이터 |
| 전국어린이놀이시설 API | 공공 놀이터 | 공공시설 데이터 |
| YouTube Data API | 장소 관련 영상 | 콘텐츠 보강 |
| 네이버 블로그 | 후기, 방문기 | 리뷰 콘텐츠 |

### DB 테이블 (3개)
| 테이블 | 역할 | 핵심 컬럼 |
|--------|------|-----------|
| kidsmap_place_blocks | 장소 데이터 | data(JSONB), category, lat/lng, quality_grade, freshness |
| kidsmap_content_blocks | 콘텐츠 | data(JSONB), related_place_id, content_type |
| kidsmap_crawl_jobs | 크롤링 작업 | type, status, source, region, stats |

---

## 6. 사전 준비 체크리스트

탐색 프롬프트 사용 전 확인 사항:

- [x] KidsMap 현재 코드 확인 (fix-infinite-loading 브랜치, 34파일)
- [x] 아키텍처 문서 확인 (09-kidsmap-architecture.md)
- [x] 데이터 모델 확인 (types.ts 1,024줄, migration.sql 398줄)
- [x] 디자인 리소스 확인 (Catalyst + Compass zip)
- [ ] 크롤링 파이프라인 실제 가동 상태 확인
- [ ] 예산/인력/일정 확인
- [ ] 수익화 모델 방향 확인
- [ ] QETTA 모듈 유지 vs 독립 앱 분리 결정

---

*이 문서는 KidsMap 앱 개선 프로젝트의 탐색 단계에서 사용됩니다.*
*KidsMap = AI 기반 어린이 놀이 공간 검색 플랫폼 (QETTA 내 독립 모듈)*
