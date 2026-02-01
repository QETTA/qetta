# KidsMap 아키텍처 설계 문서 v1.0

## Executive Summary

### 프로젝트 개요

**KidsMap**은 AI 기반 어린이 놀이 공간 검색 플랫폼입니다. 카카오맵 기반의 MAP-FIRST 아키텍처와 Claude AI 추천 엔진을 결합하여, 부모들이 아이 연령/날씨/시간대에 최적화된 놀이 장소를 빠르게 찾을 수 있도록 지원합니다.

### 핵심 차별점

```
┌──────────────────────────────────────────────────────────────────┐
│                  KidsMap vs 일반 지도 앱                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   일반 지도 앱              vs         KidsMap                    │
│   ─────────────                      ─────────────               │
│   키워드 검색                         AI 맥락 인식 추천            │
│   성인 중심 정보                      Kids 전용 메타데이터         │
│   리뷰만 의존                         실시간 혼잡도 + 신선도        │
│   놀이방/수유실 정보 없음              핵심 편의시설 명시            │
│   정적 검색 결과                      날씨/시간대 최적화            │
│                                                                  │
│   ════════════════════════════════════════════════════════════   │
│                                                                  │
│   "키즈카페 어디 있지?"    →    "2살 아기, 비오는 날, 오전 10시"   │
│   수동 필터링/검색               한 번에 최적 장소 추천            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 타겟 지역

- **서울**: 강남구, 서초구, 송파구
- **성남**: 분당구, 수정구 (위례)

### 핵심 기능 트리

```
KidsMap
├─ 🗺️ MAP-FIRST 인터페이스
│  ├─ Kakao Map SDK 통합
│  ├─ 실시간 마커 렌더링
│  └─ 사용자 위치 추적
│
├─ 🎯 Quick Filter (야외/실내/공공/식당)
│  ├─ 원탭 카테고리 필터링
│  ├─ 색상 코딩 (Green/Blue/Purple/Orange)
│  └─ 즉시 지도 업데이트
│
├─ 🤖 AI 추천 엔진
│  ├─ Claude API 기반
│  ├─ 맥락 인식 (날씨, 시간, 연령)
│  └─ 개인화 (최근 방문, 선호도)
│
├─ 📱 Bottom Sheet
│  ├─ Google Maps 스타일
│  ├─ Kids 특화 정보 (수유실, 기저귀 교환대)
│  ├─ 식당 메타데이터 (놀이방 크기, 키즈메뉴)
│  └─ 액션 (저장, 길찾기, 공유)
│
└─ 💾 데이터 블록 시스템
   ├─ PlaceBlock (장소 데이터)
   ├─ ContentBlock (리뷰/영상)
   ├─ Quality Grading (A-F)
   └─ Freshness (fresh → outdated)
```

---

## 1. 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │  Map Page    │  │ Zustand      │  │ Components   │        │
│   │  (map-first) │  │ Stores       │  │ (UI Layer)   │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
│          │                 │                  │                │
│          └─────────────────┴──────────────────┘                │
│                           │                                    │
│   ┌───────────────────────┴───────────────────────┐           │
│   │         Kakao Map SDK (Client-side)           │           │
│   │         + useKakaoMap Hook                    │           │
│   └───────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /api/kidsmap/places         ← Place Search                   │
│   /api/kidsmap/recommendations ← AI Recommendations             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────▼────────┐ ┌─────▼──────┐ ┌────────▼────────┐
│   PostgreSQL    │ │ Claude API │ │ Kakao Local API │
│   (Supabase)    │ │            │ │                 │
└─────────────────┘ └────────────┘ └─────────────────┘
```

### 1.2 데이터 흐름

```
사용자 액션               지도 이동
    │                      │
    ▼                      ▼
┌────────────────────────────────┐
│      filterStore 상태 변경      │
│   (category, ageGroups, ...)   │
└────────────────────────────────┘
              │
              ▼
┌────────────────────────────────┐
│  API Call: /api/kidsmap/places │
│  params: lat, lng, category    │
└────────────────────────────────┘
              │
              ▼
┌────────────────────────────────┐
│   PlaceBlockRepository.search  │
│   + Haversine Distance Calc    │
└────────────────────────────────┘
              │
              ▼
┌────────────────────────────────┐
│  placeStore.setSearchResult    │
│  + markers 업데이트             │
└────────────────────────────────┘
              │
              ▼
┌────────────────────────────────┐
│    Kakao Map에 마커 렌더링      │
│    useKakaoMap.addMarker()     │
└────────────────────────────────┘
```

---

## 2. 기술 스택

### 2.1 Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15 (App Router) | SSR, API Routes |
| UI Library | React | 19 | Component System |
| Language | TypeScript | 5 | Type Safety |
| Styling | Tailwind CSS | 4 | Utility-first CSS |
| State | Zustand | 5 | Client State Management |
| Database | PostgreSQL | 16 | Relational DB |
| ORM | Prisma | 7 | Type-safe DB Access |
| Map SDK | Kakao Maps | JavaScript SDK | Map Rendering |
| AI | Claude API | Sonnet 4 | Recommendations |
| UI Components | HeadlessUI | 2 | Accessible Components |

### 2.2 Environment Variables

```bash
# Kakao Map
NEXT_PUBLIC_KAKAO_MAP_KEY=         # JavaScript SDK Key (Public)
KAKAO_REST_API_KEY=                # REST API Key (Server)

# Claude AI
ANTHROPIC_API_KEY=                 # AI Recommendations

# Database
DATABASE_URL=                      # PostgreSQL Connection

# Data Sources (크롤링용)
TOUR_API_KEY=                      # 한국관광공사
PLAYGROUND_API_KEY=                # 어린이놀이터
YOUTUBE_API_KEY=                   # YouTube 리뷰
NAVER_CLIENT_ID=                   # Naver Blog/Clip
NAVER_CLIENT_SECRET=
REDIS_URL=                         # BullMQ Crawling Queue
```

---

## 3. 데이터 모델

### 3.1 Database Schema

#### kidsmap_place_blocks

```sql
CREATE TABLE kidsmap_place_blocks (
    id UUID PRIMARY KEY,

    -- 정규화된 데이터 (NormalizedPlace)
    data JSONB NOT NULL,

    -- 블록 메타
    status block_status NOT NULL DEFAULT 'active',
    quality_grade quality_grade NOT NULL DEFAULT 'C',
    freshness freshness_level NOT NULL DEFAULT 'fresh',
    completeness INT NOT NULL DEFAULT 0,  -- 0-100

    -- 검색 최적화 (JSONB에서 추출)
    name VARCHAR(255) NOT NULL,
    category place_category NOT NULL,
    source place_source NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address TEXT,
    region_code VARCHAR(10),

    -- 중복 체크
    dedupe_hash VARCHAR(64) UNIQUE NOT NULL,

    -- 관계
    related_content_ids UUID[],
    search_keywords TEXT[],

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_crawled_at TIMESTAMPTZ DEFAULT NOW(),
    crawl_count INT DEFAULT 1,

    -- 인덱스
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_location (latitude, longitude),
    INDEX idx_region (region_code),
    INDEX idx_quality (quality_grade),
    GIN INDEX idx_data (data),
    GIN INDEX idx_keywords (search_keywords)
);
```

### 3.2 TypeScript Types

#### NormalizedPlace (Core Type)

```typescript
interface NormalizedPlace {
  // 기본 정보
  id: string
  source: PlaceSource
  sourceUrl: string
  fetchedAt: string

  // 장소 정보
  name: string
  category: PlaceCategory
  address?: string
  latitude?: number
  longitude?: number
  tel?: string
  description?: string

  // Kids 메타데이터
  recommendedAges?: AgeGroup[]
  amenities?: Amenities
  operatingHours?: OperatingHours
  crowdLevel?: CrowdLevel

  // 식당 전용
  restaurantMetadata?: RestaurantMetadata

  // Raw Data
  rawData?: unknown
}
```

#### RestaurantMetadata

```typescript
interface RestaurantMetadata {
  hasPlayroom: boolean
  playroomSize?: number             // 평수
  playroomAges?: AgeGroup[]
  guardianRequired?: boolean        // 보호자 동반 필수
  attendantAvailable?: boolean      // 놀이방 선생님
  kidsMenuAvailable?: boolean
  kidsMenuPriceRange?: { min: number; max: number }
  babyChairCount?: number
  nursingRoomAvailable?: boolean
  changingStationAvailable?: boolean
  parkingInfo?: {
    available: boolean
    free?: boolean
    capacity?: number
  }
  reservation?: ReservationInfo
  waitingTime?: number              // 대기시간 (분)
  cuisineType?: string[]
  priceLevel?: number               // 1-5
}
```

#### Amenities

```typescript
interface Amenities {
  parking?: boolean
  nursingRoom?: boolean
  diaperChangingStation?: boolean   // 기저귀 교환대
  strollerAccess?: boolean
  indoor?: boolean
  outdoor?: boolean
  freeEntry?: boolean
  restaurant?: boolean
}
```

#### CrowdLevel (혼잡도)

```typescript
interface CrowdLevel {
  current?: number                  // 현재 혼잡도 (1-5)
  hourly?: Array<{                  // 시간대별 예측
    hour: number                    // 0-23
    level: number                   // 1-5
  }>
  weekend?: number                  // 주말 평균
  holiday?: number                  // 공휴일 평균
  lastUpdated?: string
}
```

---

## 4. 상태 관리 (Zustand Stores)

### 4.1 mapStore

```typescript
interface MapState {
  // 지도 상태
  center: MapCenter                 // { lat, lng }
  zoom: number                      // 1-14
  bounds: MapBounds | null

  // 마커
  markers: PlaceMarker[]
  selectedMarkerId: string | null

  // 사용자 위치
  userLocation: MapCenter | null
  isLocating: boolean

  // Actions
  setCenter: (center: MapCenter) => void
  setMarkers: (markers: PlaceMarker[]) => void
  selectMarker: (markerId: string | null) => void
  requestUserLocation: () => Promise<void>
  panTo: (center: MapCenter, zoom?: number) => void
}
```

**Persistence**: 없음 (세션 상태만)

### 4.2 filterStore

```typescript
interface FilterState {
  // Quick Filter
  filterCategory: FilterCategory | null  // 'outdoor' | 'indoor' | 'public' | 'restaurant'

  // 상세 필터
  placeCategories: PlaceCategory[]
  ageGroups: AgeGroup[]
  maxDistance: number | null
  priceRange: { min: number | null; max: number | null }

  // Amenities
  amenities: {
    parking?: boolean
    nursingRoom?: boolean
    diaperChangingStation?: boolean
    strollerAccess?: boolean
  }

  // Restaurant
  restaurant: {
    hasPlayroom?: boolean
    kidsMenuAvailable?: boolean
    reservationAvailable?: boolean
  }

  // Sorting
  sortBy: 'distance' | 'rating' | 'recent' | 'popular'
  openNow: boolean

  // Actions
  setFilterCategory: (category: FilterCategory | null) => void
  setAgeGroups: (ages: AgeGroup[]) => void
  clearFilters: () => void
}
```

**Persistence**: localStorage (kidsmap-filter-storage)

### 4.3 placeStore

```typescript
interface PlaceState {
  // 검색 결과
  searchResult: SearchResult | null
  isSearching: boolean
  searchError: string | null

  // 선택된 장소 (Bottom Sheet)
  selectedPlace: PlaceWithDistance | null

  // 즐겨찾기
  favorites: string[]               // Place IDs
  favoritePlaces: PlaceWithDistance[]

  // 최근 방문
  recentVisits: Array<{
    placeId: string
    placeName: string
    visitedAt: string
  }>  // 최대 20개

  // AI 추천
  recommendations: PlaceWithDistance[]
  isLoadingRecommendations: boolean

  // Actions
  setSearchResult: (result: SearchResult) => void
  selectPlace: (place: PlaceWithDistance | null) => void
  toggleFavorite: (placeId: string, place?: PlaceWithDistance) => void
  addRecentVisit: (placeId: string, placeName: string) => void
}
```

**Persistence**: localStorage (kidsmap-place-storage)
- favorites, favoritePlaces, recentVisits만 persist

---

## 5. API Routes 설계

### 5.1 GET /api/kidsmap/places

**목적**: 장소 검색 및 필터링

#### Request

```typescript
GET /api/kidsmap/places?lat=37.497&lng=127.027&radius=5000&category=outdoor&ageGroups=toddler,child&page=1&pageSize=20&openNow=true
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | ✓ | 중심 위도 |
| lng | number | ✓ | 중심 경도 |
| radius | number | | 반경 (m, default: 5000) |
| q | string | | 검색 키워드 |
| category | FilterCategory | | 'outdoor', 'indoor', 'public', 'restaurant' |
| placeCategories | string | | 'kids_cafe,museum' (comma-separated) |
| ageGroups | string | | 'infant,toddler' (comma-separated) |
| page | number | | 페이지 번호 (default: 1) |
| pageSize | number | | 페이지 크기 (default: 20) |
| openNow | boolean | | 영업 중인 곳만 |

#### Response

```json
{
  "success": true,
  "data": {
    "places": [
      {
        "id": "uuid-...",
        "name": "강남 키즈카페",
        "category": "kids_cafe",
        "address": "서울 강남구...",
        "latitude": 37.497,
        "longitude": 127.027,
        "distance": 1234,
        "recommendedAges": ["toddler", "child"],
        "amenities": {
          "parking": true,
          "nursingRoom": true,
          "diaperChangingStation": true
        },
        "qualityGrade": "A",
        "completeness": 95,
        "blockId": "uuid-..."
      }
    ],
    "total": 42,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

#### Implementation

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // 1. Parse parameters
  const lat = parseFloat(searchParams.get('lat')!)
  const lng = parseFloat(searchParams.get('lng')!)
  const radius = parseInt(searchParams.get('radius') || '5000')

  // 2. Build filter
  const filter = {
    status: 'active',
    categories: placeCategories.length > 0 ? placeCategories : undefined,
    searchKeyword: query || undefined,
  }

  // 3. Search from repository
  const repo = getPlaceBlockRepository()
  const result = await repo.search(filter, { page, pageSize, sortBy })

  // 4. Calculate distance (Haversine formula)
  result.data = result.data.map(place => ({
    ...place,
    distance: calculateDistance(lat, lng, place.latitude, place.longitude)
  }))

  // 5. Filter by radius
  result.data = result.data.filter(place => place.distance <= radius)

  // 6. Filter by age groups (client-side)
  if (ageGroups.length > 0) {
    result.data = result.data.filter(place =>
      ageGroups.some(age => place.recommendedAges?.includes(age))
    )
  }

  return NextResponse.json({ success: true, data: result })
}
```

### 5.2 POST /api/kidsmap/recommendations

**목적**: AI 기반 맥락 인식 추천

#### Request

```json
{
  "userLocation": { "lat": 37.497, "lng": 127.027 },
  "childAge": "toddler",
  "weather": "비",
  "time": "2026-02-01T10:00:00Z",
  "recentVisits": ["place-id-1", "place-id-2"],
  "preferences": {
    "categories": ["kids_cafe", "indoor_playground"],
    "maxDistance": 5000,
    "priceRange": { "min": null, "max": 50000 }
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "place-id",
        "name": "강남 키즈카페",
        "category": "kids_cafe",
        "distance": 1234,
        "...": "..."
      }
    ],
    "reasoning": "비 오는 날 오전 10시에는 실내 키즈카페가 적합합니다. 2-3세 유아 전용 공간이 있는 곳을 추천드립니다. 주말 혼잡도를 고려하여 한산한 시간대입니다."
  }
}
```

#### Claude Prompt 구조

```typescript
function buildRecommendationPrompt(request, places) {
  const ageDescription = {
    infant: '영아 (0-2세)',
    toddler: '유아 (3-5세)',
    child: '아동 (6-9세)',
    elementary: '초등학생 (10-12세)',
  }[request.childAge]

  const hour = new Date(request.time).getHours()
  const isWeekend = new Date(request.time).getDay() === 0 || === 6

  return `당신은 KidsMap AI 추천 엔진입니다. 부모를 위해 최적의 놀이 장소를 추천하세요.

## 사용자 정보
- 자녀 연령: ${ageDescription}
- 현재 위치: (${request.userLocation.lat}, ${request.userLocation.lng})
- 날씨: ${request.weather || '정보 없음'}
- 시간: ${hour}시 (${isWeekend ? '주말' : '평일'})

## 추천 기준
1. **연령 적합성**: ${ageDescription}에 적합한 장소
2. **시간대**: ${hour}시 기준 영업 중이거나 방문하기 좋은 시간
3. **날씨**: ${request.weather === '비' ? '실내 장소 우선' : '야외 장소 포함'}
4. **혼잡도**: ${isWeekend ? '주말 혼잡도 고려' : '평일 한산한 시간대'}
5. **품질**: 높은 품질 등급 우선

## 가능한 장소 (${places.length}개)
${places.slice(0, 20).map((place, idx) => `
${idx + 1}. ID: ${place.id}
   이름: ${place.name}
   카테고리: ${place.category}
   품질: ${place.qualityGrade}
   편의시설: ${JSON.stringify(place.amenities)}
   추천 연령: ${place.recommendedAges?.join(', ')}
`).join('\n')}

## 응답 형식 (JSON)
{
  "recommendations": ["place_id_1", "place_id_2", "place_id_3"],
  "reasoning": "추천 이유를 간단히 설명"
}

**중요**: 위 JSON 형식으로만 응답하세요.`
}
```

---

## 6. 컴포넌트 구조

### 6.1 Directory Structure

```
app/
├─ (kidsmap)/
│  ├─ layout.tsx              ← KakaoMapProvider
│  └─ map/
│     └─ page.tsx             ← Main MAP-FIRST Page

components/
└─ kidsmap/
   ├─ place-detail-sheet.tsx  ← Bottom Sheet
   ├─ quick-filter.tsx        ← Filter Chips
   └─ index.ts

contexts/
└─ kakao-map-context.tsx      ← SDK Loader

hooks/
└─ use-kakao-map.ts           ← Map Hook

stores/
└─ kidsmap/
   ├─ map-store.ts
   ├─ filter-store.ts
   ├─ place-store.ts
   └─ index.ts
```

### 6.2 Component: KidsMapPage

**Path**: `app/(kidsmap)/map/page.tsx`

**Features**:
- Full-screen Kakao Map
- Quick Filter overlay (top-left)
- Results count (top-right)
- User location button (bottom-right)
- Bottom Sheet (bottom)

**Key Hooks**:
- `useKakaoMapContext()`: SDK 로딩 상태
- `useKakaoMap()`: 지도 인스턴스
- `useMapStore()`: 지도 상태
- `useFilterStore()`: 필터 상태
- `usePlaceStore()`: 장소 데이터

**Effects**:

```typescript
// 1. 사용자 위치 요청
useEffect(() => {
  if (!userLocation) {
    requestUserLocation()
  }
}, [])

// 2. 검색 (지도/필터 변경 시)
useEffect(() => {
  if (isReady && center) {
    searchPlaces()
  }
}, [isReady, center, filterCategory, ageGroups])

// 3. 마커 렌더링
useEffect(() => {
  if (!isReady || !searchResult) return
  clearMarkers()
  searchResult.places.forEach(place => {
    addMarker({ ...place, onClick: (id) => selectPlace(id) })
  })
}, [isReady, searchResult])

// 4. 선택된 장소로 이동
useEffect(() => {
  if (selectedPlace) {
    panTo({ lat: selectedPlace.latitude, lng: selectedPlace.longitude }, 3)
  }
}, [selectedPlace])
```

### 6.3 Component: PlaceDetailSheet

**Path**: `components/kidsmap/place-detail-sheet.tsx`

**Features**:
- HeadlessUI Dialog
- Drag-to-close gesture
- Kids metadata display
- Restaurant section (conditional)
- Action buttons (favorite, directions, share)

**Sections**:

```
┌─────────────────────────────────┐
│ ╌╌╌╌╌╌╌╌ (drag handle)         │ ← Drag gesture area
├─────────────────────────────────┤
│ 강남 키즈카페           ✕       │ ← Header
│ Kids Cafe                       │
├─────────────────────────────────┤
│ 📍 1.2 km away                  │
│ 서울 강남구 테헤란로 123        │ ← Location
│                                 │
│ Recommended Ages                │ ← Ages
│ [Toddler 3-5] [Child 6-9]       │
│                                 │
│ Amenities                       │ ← Amenities
│ 🅿️ Parking  🍼 Nursing Room    │
│ 👶 Diaper Station  🚼 Stroller  │
│                                 │
│ 🎮 Restaurant with Playroom     │ ← Restaurant (if applicable)
│ • Playroom: 30평                │
│ • Kids menu available           │
│ • Baby chairs: 10               │
│                                 │
│ ☎ 02-1234-5678                  │ ← Contact
├─────────────────────────────────┤
│ [♥ Save] [→ Directions] [⋯ Share] │ ← Actions
└─────────────────────────────────┘
```

**Gestures**:

```typescript
const handleTouchMove = (e: React.TouchEvent) => {
  const deltaY = e.touches[0].clientY - dragStartY.current
  if (deltaY > 0) {
    setDragY(deltaY)
  }
}

const handleTouchEnd = () => {
  if (dragY > 100) {
    selectPlace(null)  // Close
  }
  setDragY(0)
}
```

### 6.4 Component: QuickFilter

**Path**: `components/kidsmap/quick-filter.tsx`

**Variants**:
1. **QuickFilter**: Full version with labels
2. **QuickFilterCompact**: Icon-only version
3. **QuickFilterBadge**: Active filter badge

**Filters**:

| Value | Icon | Label (EN) | Label (KR) | Color |
|-------|------|------------|------------|-------|
| outdoor | 🌳 | Outdoor | 야외 | Green |
| indoor | 🏠 | Indoor | 실내 | Blue |
| public | 🏛️ | Public | 공공 | Purple |
| restaurant | 🍽️ | Restaurant | 식당 | Orange |

**State**:

```typescript
const handleFilterClick = (category: FilterCategory) => {
  if (filterCategory === category) {
    setFilterCategory(null)  // Deselect
  } else {
    setFilterCategory(category)  // Select
  }
}
```

---

## 7. Kakao Map 통합

### 7.1 SDK Loading (Context)

**Path**: `contexts/kakao-map-context.tsx`

```typescript
export function KakaoMapProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY
    if (!key) {
      setError(new Error('Kakao Map API key is required'))
      return
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => setIsLoaded(true))
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services,clusterer`
    script.onload = () => {
      window.kakao.maps.load(() => setIsLoaded(true))
    }
    script.onerror = () => {
      setError(new Error('Failed to load Kakao Maps SDK'))
    }
    document.head.appendChild(script)
  }, [])

  return (
    <KakaoMapContext.Provider value={{ isLoaded, error, kakao: window.kakao }}>
      {children}
    </KakaoMapContext.Provider>
  )
}
```

### 7.2 Map Hook

**Path**: `hooks/use-kakao-map.ts`

```typescript
export function useKakaoMap(options?: UseKakaoMapOptions) {
  const { isLoaded, kakao } = useKakaoMapContext()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())

  // Initialize map
  const initMap = useCallback((container: HTMLElement) => {
    if (!isLoaded || !kakao) return

    const mapCenter = new kakao.maps.LatLng(center.lat, center.lng)
    const mapInstance = new kakao.maps.Map(container, {
      center: mapCenter,
      level: zoom,
    })

    // Sync events with Zustand
    kakao.maps.event.addListener(mapInstance, 'center_changed', () => {
      setCenter({ lat: mapInstance.getCenter().getLat(), ... })
    })

    setMap(mapInstance)
  }, [isLoaded, kakao])

  // Marker management
  const addMarker = useCallback((markerData: PlaceMarker) => {
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(markerData.lat, markerData.lng),
      map,
      title: markerData.title,
    })

    kakao.maps.event.addListener(marker, 'click', () => {
      markerData.onClick?.(markerData.id)
    })

    markersRef.current.set(markerData.id, marker)
    return marker
  }, [map, kakao])

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()
  }, [])

  return {
    mapRef,
    map,
    isReady: !!map,
    initMap,
    addMarker,
    clearMarkers,
    panTo: (center, level) => {
      map.panTo(new kakao.maps.LatLng(center.lat, center.lng))
      if (level) map.setLevel(level)
    },
  }
}
```

---

## 8. 데이터 블록 시스템

### 8.1 Quality Grading

**완전성 점수 (0-100)**:

```typescript
function calculateCompleteness(place: NormalizedPlace): number {
  let score = 0
  let totalWeight = 0

  const weights = {
    name: 15,
    address: 10,
    location: 20,
    tel: 5,
    description: 10,
    amenities: 15,
    operatingHours: 10,
    recommendedAges: 10,
    crowdLevel: 5,
  }

  if (place.name) score += weights.name
  if (place.address) score += weights.address
  if (place.latitude && place.longitude) score += weights.location
  if (place.tel) score += weights.tel
  if (place.description) score += weights.description
  if (place.amenities && Object.keys(place.amenities).length > 0) score += weights.amenities
  if (place.operatingHours) score += weights.operatingHours
  if (place.recommendedAges && place.recommendedAges.length > 0) score += weights.recommendedAges
  if (place.crowdLevel) score += weights.crowdLevel

  totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  return Math.round((score / totalWeight) * 100)
}
```

**품질 등급 (A-F)**:

| Grade | Completeness | 설명 |
|-------|--------------|-----|
| A | 90-100 | 매우 완전한 데이터 |
| B | 75-89 | 양호한 데이터 |
| C | 60-74 | 보통 데이터 |
| D | 40-59 | 부족한 데이터 |
| F | 0-39 | 매우 부족한 데이터 |

### 8.2 Freshness Levels

**신선도 계산** (자동 트리거):

```sql
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
```

| Level | Days Since Crawl | Action Required |
|-------|-----------------|----------------|
| fresh | < 7 days | None |
| recent | 7-30 days | Monitor |
| stale | 30-90 days | Re-crawl soon |
| outdated | > 90 days | Re-crawl urgently |

### 8.3 Deduplication

**해시 생성**:

```typescript
function generatePlaceDedupeHash(place: NormalizedPlace): string {
  const normalizedName = place.name.toLowerCase().replace(/\s+/g, '')
  const normalizedAddress = (place.address || '').toLowerCase().replace(/\s+/g, '')
  const latRounded = place.latitude?.toFixed(6) || ''
  const lngRounded = place.longitude?.toFixed(6) || ''

  const composite = `${normalizedName}|${normalizedAddress}|${latRounded}|${lngRounded}`

  return createHash('sha256').update(composite, 'utf8').digest('hex')
}
```

**중복 처리**:

```sql
INSERT INTO kidsmap_place_blocks (...)
VALUES (...)
ON CONFLICT (dedupe_hash)
DO UPDATE SET
    data = EXCLUDED.data,
    updated_at = NOW(),
    last_crawled_at = NOW(),
    crawl_count = kidsmap_place_blocks.crawl_count + 1;
```

---

## 9. 크롤링 아키텍처

### 9.1 Data Sources

| Source | Type | Coverage | Update Frequency |
|--------|------|----------|-----------------|
| 한국관광공사 API | Official | Nationwide | Daily |
| 어린이놀이터 API | Official | Public playgrounds | Weekly |
| Kakao Local API | Commercial | POI search | Real-time |
| YouTube API | UGC | Reviews/Videos | Daily |
| Naver Blog | UGC | Reviews | Daily |
| Naver Clip | UGC | Short videos | Daily |

### 9.2 Crawl Jobs (BullMQ)

```typescript
interface CrawlJob {
  id: string
  type: CrawlJobType
  status: CrawlJobStatus
  priority: number  // 1-10
  config: {
    source: DataSource
    region?: string
    category?: PlaceCategory
    batchSize?: number
    retryCount?: number
  }
  progress: {
    totalEstimated: number
    processed: number
    succeeded: number
    failed: number
    skipped: number
    percentage: number
  }
  result?: {
    newBlocks: number
    updatedBlocks: number
    skippedBlocks: number
    errors: number
  }
}
```

**Job Types**:

| Type | Description | Frequency |
|------|-------------|-----------|
| FULL_CRAWL | 전체 데이터 수집 | Monthly |
| INCREMENTAL | 증분 업데이트 | Daily |
| REGION_CRAWL | 특정 지역 | On-demand |
| CATEGORY_CRAWL | 특정 카테고리 | On-demand |
| CONTENT_REFRESH | 콘텐츠 업데이트 | Weekly |
| QUALITY_CHECK | 품질 검증 | Weekly |
| DEDUP_SCAN | 중복 제거 | Monthly |

### 9.3 ETL Pipeline

```
┌──────────────┐
│  Data Source │
│ (API/Scrape) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Extract    │ ← Raw data fetch
│ (API Client) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Transform   │ ← Normalize to NormalizedPlace
│ (Normalizer) │    + Quality check
└──────┬───────┘    + Dedupe hash
       │
       ▼
┌──────────────┐
│   Quality    │ ← Calculate completeness
│   Grading    │    + Assign grade
└──────┬───────┘    + Extract keywords
       │
       ▼
┌──────────────┐
│     Load     │ ← Upsert to DB
│ (Repository) │    + Update stats
└──────────────┘
```

---

## 10. 성능 최적화

### 10.1 Database Indexes

```sql
-- 1. 위치 검색 최적화
CREATE INDEX idx_place_blocks_location ON kidsmap_place_blocks(latitude, longitude);

-- 2. 카테고리 필터링
CREATE INDEX idx_place_blocks_category ON kidsmap_place_blocks(category)
WHERE status = 'active';

-- 3. 품질 정렬
CREATE INDEX idx_place_blocks_quality ON kidsmap_place_blocks(quality_grade, completeness DESC);

-- 4. Full-text search (Korean)
CREATE INDEX idx_place_blocks_name ON kidsmap_place_blocks
USING gin(to_tsvector('korean', name));

-- 5. JSONB 검색
CREATE INDEX idx_place_blocks_data ON kidsmap_place_blocks USING gin(data);

-- 6. Keywords 검색
CREATE INDEX idx_place_blocks_keywords ON kidsmap_place_blocks USING gin(search_keywords);
```

### 10.2 Caching Strategy

| Layer | Strategy | TTL | Tool |
|-------|----------|-----|------|
| API Response | Server-side cache | 5 min | Redis |
| Place Search | In-memory cache | 1 min | Map<string, SearchResult> |
| Kakao API | Client cache | 30 min | KakaoLocalClient |
| Static Assets | CDN | 1 year | Vercel Edge |
| Map Tiles | Browser cache | 7 days | Kakao SDK |

### 10.3 Query Optimization

**Bad**:
```typescript
// ❌ N+1 query problem
for (const placeId of placeIds) {
  const place = await prisma.kidsmapPlaceBlock.findUnique({ where: { id: placeId } })
}
```

**Good**:
```typescript
// ✅ Batch query
const places = await prisma.kidsmapPlaceBlock.findMany({
  where: { id: { in: placeIds } }
})
```

### 10.4 Frontend Performance

| Technique | Implementation | Impact |
|-----------|----------------|--------|
| Code Splitting | Next.js dynamic imports | -40% initial bundle |
| Image Optimization | next/image | -60% image size |
| Virtualization | react-window (future) | Infinite scroll |
| Debouncing | Search input (300ms) | -90% API calls |
| Lazy Loading | Bottom sheet content | -20% initial render |
| Service Worker | Offline map tiles (future) | Offline support |

---

## 11. 보안 및 권한

### 11.1 Row Level Security (RLS)

```sql
-- Place Blocks: 읽기는 모두 허용, 쓰기는 service_role만
CREATE POLICY "place_blocks_read_policy" ON kidsmap_place_blocks
    FOR SELECT
    USING (status IN ('active', 'archived'));

CREATE POLICY "place_blocks_write_policy" ON kidsmap_place_blocks
    FOR ALL
    USING (auth.role() = 'service_role');
```

### 11.2 API Keys

| Key | Type | Exposure | Usage |
|-----|------|----------|-------|
| NEXT_PUBLIC_KAKAO_MAP_KEY | Public | Client-side | Map rendering |
| KAKAO_REST_API_KEY | Private | Server-side | Kakao API calls |
| ANTHROPIC_API_KEY | Private | Server-side | AI recommendations |
| DATABASE_URL | Private | Server-side | Prisma connection |

**Environment Validation**:

```typescript
const requiredEnvVars = [
  'NEXT_PUBLIC_KAKAO_MAP_KEY',
  'KAKAO_REST_API_KEY',
  'ANTHROPIC_API_KEY',
  'DATABASE_URL',
]

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
}
```

### 11.3 Rate Limiting

| Endpoint | Limit | Window | Strategy |
|----------|-------|--------|----------|
| /api/kidsmap/places | 100 req | 1 min | IP-based |
| /api/kidsmap/recommendations | 10 req | 1 min | IP-based |
| Claude API | 5000 req | 1 day | Account-based |
| Kakao API | 300,000 req | 1 day | Account-based |

---

## 12. 배포 및 모니터링

### 12.1 Deployment Stack

| Component | Platform | Configuration |
|-----------|----------|---------------|
| Frontend | Vercel | Edge Functions, ISR |
| Database | Supabase | PostgreSQL 16 |
| Redis | Upstash | Serverless Redis |
| CDN | Vercel Edge | Global |
| Analytics | Vercel Analytics | Web Vitals |

### 12.2 Environment Setup

```bash
# Production
vercel env add NEXT_PUBLIC_KAKAO_MAP_KEY
vercel env add KAKAO_REST_API_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add DATABASE_URL
vercel env add REDIS_URL

# Preview
vercel env add NEXT_PUBLIC_KAKAO_MAP_KEY preview
...

# Development
cp .env.example .env.local
# Fill in values
```

### 12.3 Health Checks

```typescript
// /api/health
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    kakaoApi: await checkKakaoApi(),
    claudeApi: await checkClaudeApi(),
  }

  const isHealthy = Object.values(checks).every(check => check.status === 'ok')

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  }, {
    status: isHealthy ? 200 : 503
  })
}
```

### 12.4 Monitoring Metrics

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| Response Time | Vercel Analytics | > 2s |
| Error Rate | Sentry | > 1% |
| API Quota | Custom | > 80% |
| Database Connections | Supabase | > 80 |
| Cache Hit Rate | Redis | < 70% |
| Map Load Time | Real User Monitoring | > 3s |

---

## 13. 향후 개선 사항

### 13.1 Phase 2 Features

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| 실시간 혼잡도 | High | Medium | High |
| 예약 시스템 연동 | Medium | High | Medium |
| 사용자 리뷰 | Medium | Medium | High |
| AI 채팅봇 | Low | High | Medium |
| 오프라인 지도 | Low | Very High | Low |
| 푸시 알림 | Medium | Medium | Medium |

### 13.2 Technical Debt

- [ ] PostGIS 확장으로 지리 검색 최적화
- [ ] Marker Clustering 구현 (대량 마커 시)
- [ ] Service Worker 오프라인 지원
- [ ] E2E 테스트 (Playwright)
- [ ] Storybook 컴포넌트 문서화
- [ ] Performance Budget 설정

### 13.3 Scalability Roadmap

**현재 (MVP)**:
- 단일 PostgreSQL 인스턴스
- 서버리스 API Routes
- 클라이언트 사이드 필터링

**Phase 2 (1,000 동시 사용자)**:
- Read Replica 추가
- Redis 캐싱 도입
- CDN 엣지 캐싱

**Phase 3 (10,000 동시 사용자)**:
- Elasticsearch 검색 엔진
- 마이크로서비스 분리 (검색/추천)
- Kafka 이벤트 스트리밍

---

## 14. 참고 자료

### 14.1 External APIs

| API | Documentation | Rate Limit |
|-----|---------------|------------|
| Kakao Maps | https://apis.map.kakao.com | 300k/day |
| Kakao Local | https://developers.kakao.com/docs/latest/ko/local/dev-guide | 300k/day |
| Claude API | https://docs.anthropic.com/claude/reference | 5k/day |
| 한국관광공사 | https://api.visitkorea.or.kr | Unlimited |

### 14.2 Internal Docs

- `/docs/planning/03-block-system.md`: Block Engine 설계
- `/docs/06-design-system.md`: UI/UX 가이드라인
- `/CLAUDE.md`: 프로젝트 전체 컨텍스트

### 14.3 Key Commits

```bash
# Type system & Prisma schema
git show 7a08d35

# Zustand stores
git show ed998c0

# API routes
git show 20d151b

# Kakao Map integration
git show 08c0242

# Bottom sheet
git show c1313b5

# Quick filter
git show fe8f941
```

---

## 15. 결론

KidsMap 아키텍처는 **MAP-FIRST 철학**과 **Kids-specific 메타데이터**를 핵심으로 설계되었습니다.

### 핵심 성과

✅ **완전한 타입 안정성**: TypeScript + Prisma로 End-to-End 타입 체크
✅ **최적화된 상태 관리**: 3개 Zustand 스토어로 관심사 분리
✅ **AI 네이티브**: Claude API로 맥락 인식 추천
✅ **Kids 전용**: 수유실, 기저귀 교환대, 놀이방 크기 등 핵심 메타
✅ **확장 가능**: Block 시스템으로 대규모 데이터 관리

### 다음 단계

1. ✅ 핵심 아키텍처 완성 (본 문서)
2. 🔄 CLAUDE.md에 KidsMap 프롬프트 추가
3. 📝 API 문서화 (Swagger/OpenAPI)
4. 🧪 E2E 테스트 작성
5. 🚀 MVP 배포 (Vercel)

---

**문서 버전**: 1.0
**최종 수정**: 2026-02-01
**작성자**: Claude (Sonnet 4.5)
**세션**: https://claude.ai/code/session_012jjXPRW8gGSpe4iwtGSCyL
