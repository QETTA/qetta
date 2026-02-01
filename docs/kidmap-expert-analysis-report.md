# KidsMap 전문가 분석 보고서

> **생성일**: 2026-02-01
> **분석 방법**: 4개 병렬 전문 에이전트 (코드 감사, 디자인, 아키텍처, 경쟁 분석)
> **분석 대상**: `claude/fix-infinite-loading-CeSxd` 브랜치, 34파일 11,229줄

---

## 1. 크리티컬 버그 (즉시 수정 필요)

| # | 버그 | 위치 | 심각도 |
|---|------|------|--------|
| **P0-1** | `ANTHROPIC_API_KEY` 미설정 시 모듈 로드 단계에서 크래시 | `api/kidsmap/recommendations/route.ts` (모듈 레벨 `new Anthropic()`) | **서버 다운** |
| **P0-2** | DB enum에 `restaurant`, `public_facility` 누락 → INSERT 실패 | `migration.sql` (`place_category` enum) | **데이터 저장 불가** |
| **P0-3** | 페이지네이션 깨짐: 거리/연령 필터가 DB 페이지네이션 **이후** 적용 → 페이지당 결과 수 부족, `hasMore` 부정확 | `api/kidsmap/places/route.ts` | **검색 결과 누락** |

---

## 2. 보안 취약점

| # | 취약점 | 위험도 | 조치 |
|---|--------|--------|------|
| **SEC-1** | 3개 API 라우트 전체 인증 없음 → 누구나 Claude API 호출 가능 | **높음** | NextAuth 미들웨어 적용 |
| **SEC-2** | Rate limiting 전무 | **높음** | Upstash Rate Limit 적용 |
| **SEC-3** | 에러 메시지에 내부 정보 노출 | 중간 | 에러 래핑 |
| **SEC-4** | Prompt injection: `placeName`/`category`가 Claude 프롬프트에 직접 삽입 | **높음** | 입력 검증 + 프롬프트 이스케이핑 |

---

## 3. 파일별 코드 품질 평가

### 등급 분포
```
A 등급 (11파일): types.ts, blocks/types.ts, blocks/index.ts, stores/*, layout/loading/error
B 등급 (8파일):  map/page.tsx, places/route.ts, quick-filter.tsx, kakao-client.ts, client.ts 등
C 등급 (3파일):  recommendations/route.ts, blocks/crawler.ts, blocks/pipeline.ts
```

### 핵심 기술 부채

| 부채 | 파일 | 우선순위 |
|------|------|----------|
| `bulkUpsert` N회 순차 DB 호출 (O(N)) | repository.ts | 높음 |
| Haversine 함수 4곳 중복 | places, client, store, pipeline | 중간 |
| `any` 타입 잔존 | 여러 파일 | 중간 |
| 맵 검색 debounce 없음 → 필터 토글마다 API 호출 | map/page.tsx | 높음 |
| AI 추천 캐싱 없음 → 매번 Claude 호출 | recommendations/route.ts | 높음 |
| Pipeline/Migrator 클래스 대부분 스텁 (하드코딩 반환) | pipeline.ts | 중간 |
| **테스트 커버리지 0%** (21+ 파일 중 테스트 1개) | 전체 | **높음** |

---

## 4. 디자인 리소스 분석

### Catalyst UI Kit (27개 프로덕션 컴포넌트)

| 컴포넌트 | KidsMap 적용도 | 용도 |
|----------|---------------|------|
| Button | ⭐⭐⭐⭐⭐ | 바텀시트 액션, CTA |
| Badge | ⭐⭐⭐⭐⭐ | 카테고리 태그, 등급 표시 |
| Dialog | ⭐⭐⭐⭐⭐ | 장소 상세, 필터 모달 |
| Link | ⭐⭐⭐⭐⭐ | 내비게이션 |
| Input | ⭐⭐⭐⭐ | 검색바 |
| Dropdown | ⭐⭐⭐⭐ | 정렬 옵션 |
| Pagination | ⭐⭐⭐⭐ | 검색 결과 |
| Avatar | ⭐⭐⭐ | 리뷰 작성자 |
| Switch | ⭐⭐⭐ | 영업 중 필터 |
| Table | ⭐⭐ | 업주 대시보드 (향후) |

### Compass 템플릿
- **부적합**: 콘텐츠 플랫폼용 레이아웃 → MAP-FIRST 아키텍처와 불일치
- **부분 활용 가능**: Auth 페이지, 향후 업주 대시보드

### 적용 전략: **Option B (부분 채택)** 추천

```
추천 방법:
1. Catalyst 27개 컴포넌트를 /components/ui/catalyst/에 배치
2. 기존 KidsMap의 인라인 SVG, 직접 구현 버튼 등을 Catalyst로 교체
3. Compass는 Auth 페이지에만 적용
4. MAP-FIRST 레이아웃은 현재 구조 유지

예상 작업량: 1-2주
위험도: 낮음
```

---

## 5. 아키텍처 갭 분석

### 문서화됨 BUT 미구현

| 기능 | 아키텍처 문서 | 실제 코드 |
|------|-------------|----------|
| PostGIS 공간 인덱스 | 언급됨 | 미구현 (Haversine 사용) |
| 마커 클러스터링 | 계획됨 | 미구현 |
| Service Worker 오프라인 | Phase 2 | 미구현 |
| E2E 테스트 | 계획됨 | 미구현 |
| Storybook | 계획됨 | 미구현 |
| 헬스체크 엔드포인트 | 계획됨 | 미구현 |
| Redis 캐싱 | 계획됨 | 미구현 |
| react-window 가상화 | 계획됨 | 미구현 |
| 한국어 Full-text search | 계획됨 | 미구현 |
| Row Level Security | 계획됨 | 미구현 |

### 구현됨 BUT 미문서화

| 기능 | 코드 위치 |
|------|----------|
| AI 쿠폰 시스템 | `lib/kidsmap/ai-coupon.ts` |
| NCP Object Storage | `.env.example` |
| 네이버 인증 풀 (rate limit 우회) | `naver-client.ts` |
| PWA manifest | `app/manifest.ts` |
| Vercel 배포 설정 | `vercel.json` |
| Monitor SSE 엔드포인트 | `api/monitor/stream` |

### 커밋 이력 (30개 커밋, 6단계)

```
Phase A: 초기 설정 + 개발 도구 (CLAUDE.md, husky, prettier)
Phase B: 데이터 크롤링 인프라 (YouTube, 네이버, 카카오, NCP)
Phase C: 프론트엔드 + API (맵, 스토어, 라우트, 컴포넌트)
Phase D: 아키텍처 문서화
Phase E: 버그 수정 (SSE 무한 로딩 — 브랜치 이름의 유래)
Phase F: 프로덕션 준비 (Vercel 배포, 보안 헤더, OAuth, PWA)
```

### 환경 변수 (22개)

```
# 카카오맵
NEXT_PUBLIC_KAKAO_MAP_KEY, KAKAO_REST_API_KEY

# AI
ANTHROPIC_API_KEY

# DB
DATABASE_URL, DIRECT_URL (Supabase)

# 네이버 (검색 + 클라우드)
NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
NCP_CLIENT_ID, NCP_CLIENT_SECRET
NCP_OBJECT_STORAGE_BUCKET, NCP_OBJECT_STORAGE_ENDPOINT, NCP_OBJECT_STORAGE_REGION
NCP_DATABASE_URL

# 공공데이터
TOUR_API_KEY, YOUTUBE_API_KEY, PLAYGROUND_API_KEY

# 인프라
REDIS_URL, SENTRY_DSN

# 결제 (QETTA 공유)
TOSS_CLIENT_KEY, TOSS_SECRET_KEY
```

---

## 6. 경쟁 환경 분석

### 시장 포지션: **블루오션**

한국에서 AI + 키즈 장소 검색을 결합한 서비스 **없음**.

### 직접 경쟁사

| 경쟁사 | 다운로드/회원 | 강점 | 약점 |
|--------|-------------|------|------|
| 애기야가자 (BabyGo) | 180만 DL | 장소 DB 3만+, 월 1.5만 리뷰 | AI 없음, 개인화 없음, 광고 과다 |
| 맘맘 (mom-mom) | 50만+ | VC 투자, 예약 1.5만 숙소 | 커머스 중심, AI 없음 |
| 엄마의지도 (MomsMap) | 20만 | 큐레이션 품질 최고, 시설 데이터 | 규모 작음, 콘텐츠 크리에이터 의존 |
| 맘스홀릭 베이비 | 350만 회원 | 신뢰도, 20년+ 역사 | 네이버 카페 형식, 앱/지도 기능 없음 |

### 카카오맵/네이버지도

```
카카오맵: 키즈 전용 기능 0개
네이버지도: 키즈 전용 기능 0개
→ 이것이 정확히 KidsMap의 기회
```

### KidsMap 4대 차별화

1. **Claude AI 대화형 추천** (시장 유일)
2. **카카오맵 네이티브 통합** (지도 앱 수준 UX)
3. **하이퍼로컬** (강남/분당 깊이 있는 데이터)
4. **인텔리전스 레이어** (정적 디렉토리가 아닌 맥락 인식)

### 위협

```
최대 위협: 카카오/네이버가 키즈 기능 네이티브 구축
발생 가능성: 중간 (2-3년 내)
대응: 빠른 출시 + 데이터/리뷰 해자 구축 + 카카오 파트너십 추진
```

### 시장 규모

- 글로벌 육아 앱: $1-2B (연 10-20% 성장)
- 아시아태평양: 54% 점유
- 한국 특수 상황: 저출산 → 아이 1명당 지출 증가 ("10 pocket" 트렌드)

---

## 7. 종합 우선순위 매트릭스

| # | 항목 | Impact | Effort | 우선순위 |
|---|------|--------|--------|----------|
| 1 | P0 크리티컬 버그 3건 수정 | **High** | **S** | **P0** |
| 2 | API 인증 + Rate Limiting 추가 | **High** | **M** | **P0** |
| 3 | Prompt injection 방지 | **High** | **S** | **P0** |
| 4 | AI 추천 캐싱 (Redis) | **High** | **M** | **P1** |
| 5 | 맵 검색 debounce 추가 | **High** | **S** | **P1** |
| 6 | Catalyst 컴포넌트 부분 채택 | Med | **M** | **P1** |
| 7 | 테스트 커버리지 (핵심 API + 스토어) | **High** | **L** | **P1** |
| 8 | DB enum 누락 카테고리 추가 | **High** | **S** | **P0** |
| 9 | bulkUpsert 배치 최적화 | Med | **M** | **P2** |
| 10 | Haversine 중복 제거 → 유틸 함수화 | Low | **S** | **P2** |
| 11 | PostGIS 도입 | Med | **L** | **P2** |
| 12 | 마커 클러스터링 | Med | **M** | **P2** |
| 13 | 지역 확장 (수도권 전체) | **High** | **XL** | **P3** |
| 14 | 커뮤니티 기능 (리뷰/사진) | **High** | **XL** | **P3** |
| 15 | 업주 대시보드 | Med | **XL** | **P3** |

---

## 8. Plan Mode 진입 준비도

- [x] 코드 품질 진단 완료 (34파일 전수 감사)
- [x] 크리티컬 버그 3건 식별
- [x] 보안 취약점 4건 식별
- [x] 디자인 리소스 적용 방향 결정 (Option B: 부분 채택)
- [x] 경쟁 환경 분석 완료 (블루오션 확인)
- [x] 아키텍처 갭 분석 완료 (구현 vs 문서)
- [ ] 예산/인력/일정 확인 (사용자 입력 필요)
- [ ] QETTA 모듈 유지 vs 독립 분리 결정 (사용자 입력 필요)

**준비도: 6/8 → Plan Mode 진입 가능 (2건 사용자 확인 후)**

---

*이 보고서는 4개 병렬 전문 에이전트의 분석 결과를 종합한 것입니다.*
