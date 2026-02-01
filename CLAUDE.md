# QETTA Project - Claude Code Instructions

## 🎯 Project Overview

**QETTA** - AI-powered government support document automation platform

| Aspect | Value |
|--------|-------|
| **Tech Stack** | Next.js 16, React 19, TypeScript 5, Tailwind 4, Prisma 7 |
| **Architecture** | 3-Layer Block Engine (L1 System → L2 Domain → L3 Context) |
| **Design System** | Linear-style (titanium silver/zinc on dark) |
| **Primary Language** | English (UI), Korean (government domain terms only) |

## 📁 Directory Structure

```
app/                    # Next.js App Router
├── (auth)/            # Authentication pages
├── (dashboard)/       # Dashboard pages
├── (kidsmap)/         # KidsMap MAP-FIRST pages
├── (marketing)/       # Landing/marketing pages
└── api/               # API routes
    ├── kidsmap/       # KidsMap API (places, recommendations)
    ├── monitor/       # Monitor SSE stream
    └── proposals/     # Proposal generation stream

components/            # React components
├── auth/              # Auth forms
├── dashboard/         # Dashboard UI (monitor, docs, shimmer)
├── kidsmap/           # KidsMap (map, filters, bottom sheet)
├── landing/           # Marketing components
└── layout/            # Shared layouts

contexts/              # React Contexts (KakaoMapProvider)
hooks/                 # Custom hooks (useKakaoMap, useMonitorSSE, useProposalStream)
stores/                # Zustand stores
├── kidsmap/           # map-store, filter-store, place-store
└── *.ts               # monitor-data-store, ai-panel-store

lib/                   # Core business logic
├── block-engine/      # 3-Layer Block Engine
├── skill-engine/      # Skill-based automation + KidsMap data sources
├── document-generator/ # Doc gen + KidsMap LRU cache
├── claude/            # Claude API integration
├── monitor/           # IoT simulator, sensors, alerts
├── auth/              # Authentication logic
├── db/                # Database (Prisma)
└── ...

prisma/                # Schema + migrations (including kidsmap_* tables)
```

## 🚫 Critical Rules

### Design
- **No violet/purple** - Use zinc/white only
- **Linear design** - Minimalist, functional
- **English UI** - All user-facing text in English

### Code
- **Conventional Commits** - `feat:`, `fix:`, `chore:`
- **3+ files** → Plan Mode required
- **New packages** → User approval required

### Forbidden Terms (in marketing/UI)
- ❌ "blockchain" → ✅ "hash-chain verification"
- ❌ "innovative" → ✅ Use specific metrics
- ❌ "100% guarantee" → ✅ "99.9% SLA"

## 🎨 Design Tokens

| Element | Value |
|---------|-------|
| Primary Button | `bg-zinc-600 hover:bg-zinc-500` |
| Background | `bg-zinc-950` |
| Text Primary | `text-white` |
| Text Secondary | `text-zinc-300`, `text-zinc-400` |
| Focus Ring | `ring-white/30` |
| Border | `border-zinc-800` |

## 📊 Core Metrics (Use These)

| Metric | Value |
|--------|-------|
| Time Reduction | 93.8% |
| Error Reduction | 91% |
| API Uptime | 99.9% |
| Accuracy | 99.2% |
| Tender Database | 630,000+ |

## 🧪 Commands

```bash
# Development
npm run dev              # Start (port 3003)

# Validation
npm run validate         # typecheck + lint + test
npm run build           # Production build
npm run e2e             # Playwright E2E

# Database
npm run db:generate     # Prisma generate
npm run db:push         # Push schema
npm run db:studio       # Prisma Studio
```

## 🔄 Workflow

1. Create feature branch (if needed)
2. Make changes
3. `npm run validate` - All checks pass
4. `git commit -m "type: description"`
5. Visual verification with Playwright (UI changes)

## 📦 Key Dependencies

| Category | Package |
|----------|---------|
| AI | @anthropic-ai/sdk |
| Database | @prisma/client, pg |
| Auth | next-auth v5 |
| Email | resend, react-email |
| Documents | docx, exceljs, pdf-lib |
| State | zustand |
| Editor | @tiptap/* |

## 🔌 MCP Servers Available

- **playwright** - E2E testing, screenshots
- **vercel** - Deployment management
- **shadcn** - UI component generation
- **magic-ui** - Animation components
- **memory** - Persistent knowledge graph

---

## 🗺️ KidsMap Feature Module

**KidsMap** is an AI-powered kids place finder integrated into QETTA. Separate architecture with MAP-FIRST design.

### Architecture Overview

| Aspect | Details |
|--------|---------|
| **Primary Interface** | Full-screen Kakao Map (MAP-FIRST) |
| **State Management** | 3 Zustand stores (map, filter, place) |
| **Database** | Separate `kidsmap_*` tables in PostgreSQL |
| **AI Engine** | Claude API for contextual recommendations |
| **Data Sources** | TourAPI, PlaygroundAPI, Kakao Local, YouTube, Naver |

### Directory Structure

```
app/(kidsmap)/          # KidsMap pages
├── layout.tsx          # KakaoMapProvider wrapper
└── map/page.tsx        # Main MAP-FIRST page

components/kidsmap/     # KidsMap-specific components
├── place-detail-sheet.tsx  # Bottom sheet (Google Maps style)
├── quick-filter.tsx        # 야외/실내/공공/식당 filters
└── index.ts

contexts/
└── kakao-map-context.tsx   # Kakao Maps SDK loader

hooks/
└── use-kakao-map.ts        # Map instance and controls

stores/kidsmap/         # State management
├── map-store.ts        # Map state (center, zoom, markers)
├── filter-store.ts     # Filters (category, age, distance)
├── place-store.ts      # Places (search results, favorites)
└── index.ts

lib/skill-engine/data-sources/kidsmap/  # Data infrastructure
├── types.ts            # Core types (NormalizedPlace, etc.)
├── blocks/             # PlaceBlock, ContentBlock repositories
├── api-clients/        # External API integrations
└── crawlers/           # Data collection (BullMQ)
```

### Core Types

#### NormalizedPlace
```typescript
interface NormalizedPlace {
  id: string
  name: string
  category: PlaceCategory
  address?: string
  latitude?: number
  longitude?: number
  recommendedAges?: AgeGroup[]     // 'infant' | 'toddler' | 'child' | 'elementary'
  amenities?: Amenities            // Kids-specific (nursing room, diaper station)
  restaurantMetadata?: RestaurantMetadata  // Playroom, kids menu
  crowdLevel?: CrowdLevel          // Hourly predictions
}
```

#### Quick Filter Categories
```typescript
type FilterCategory = 'outdoor' | 'indoor' | 'public' | 'restaurant'

// Maps to PlaceCategory[]
OUTDOOR → [nature_park, playground, water_park, ...]
INDOOR → [kids_cafe, museum, indoor_playground, ...]
PUBLIC → [childcare_center, toy_library, public_pool, ...]
RESTAURANT → [restaurant with hasPlayroom: true]
```

### API Routes

#### GET /api/kidsmap/places
**Purpose**: Search places with filters
```typescript
// Query params
lat, lng, radius, category, ageGroups, page, pageSize, openNow

// Response
{
  success: true,
  data: {
    places: PlaceWithDistance[],  // Includes distance from user
    total: number,
    hasMore: boolean
  }
}
```

#### POST /api/kidsmap/recommendations
**Purpose**: AI-powered contextual recommendations
```typescript
// Body
{
  userLocation: { lat, lng },
  childAge: AgeGroup,
  weather?: string,
  time?: string,
  recentVisits?: string[]
}

// Response
{
  success: true,
  data: {
    recommendations: PlaceWithDistance[],
    reasoning: string  // Claude's explanation
  }
}
```

### Zustand Stores

#### mapStore
- **State**: center, zoom, bounds, markers, userLocation
- **Persistence**: None (session only)
- **Key Actions**: setCenter, panTo, requestUserLocation

#### filterStore
- **State**: filterCategory, ageGroups, maxDistance, amenities
- **Persistence**: localStorage (kidsmap-filter-storage)
- **Key Actions**: setFilterCategory, setAgeGroups, clearFilters

#### placeStore
- **State**: searchResult, selectedPlace, favorites, recentVisits, recommendations
- **Persistence**: localStorage (favorites, recentVisits only)
- **Key Actions**: selectPlace, toggleFavorite, addRecentVisit

### Key Components

#### KidsMapPage (app/(kidsmap)/map/page.tsx)
- Full-screen map interface
- Integrates: QuickFilter, PlaceDetailSheet, map controls
- Auto-searches on filter/location change
- Renders markers from search results

#### PlaceDetailSheet (components/kidsmap/place-detail-sheet.tsx)
- Google Maps-style bottom sheet
- Drag-to-close gesture (HeadlessUI Dialog)
- Shows: name, distance, amenities, restaurant metadata
- Actions: Save (favorite), Directions (Kakao), Share (Web Share API)

#### QuickFilter (components/kidsmap/quick-filter.tsx)
- 4 category chips: 🌳 야외, 🏠 실내, 🏛️ 공공, 🍽️ 식당
- Color-coded (green/blue/purple/orange)
- Single-tap toggle, auto-triggers search

### Kakao Map Integration

#### KakaoMapProvider (contexts/kakao-map-context.tsx)
```typescript
// Dynamically loads SDK script
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services,clusterer" />

// Provides context
{ isLoaded, error, kakao: window.kakao }
```

#### useKakaoMap Hook (hooks/use-kakao-map.ts)
```typescript
const {
  mapRef,           // Attach to <div ref={mapRef} />
  map,              // Kakao Map instance
  isReady,          // Map initialized
  addMarker,        // Add marker with onClick handler
  clearMarkers,     // Remove all markers
  panTo,            // Move to location
} = useKakaoMap({ center, level })
```

### Data Block System

#### Quality Grading (A-F)
- **Completeness**: 0-100 (weighted scoring)
- **Grades**: A (90-100), B (75-89), C (60-74), D (40-59), F (0-39)
- **Factors**: name, location, amenities, hours, ages (각 가중치 다름)

#### Freshness Levels
- **fresh**: < 7 days since crawl
- **recent**: 7-30 days
- **stale**: 30-90 days
- **outdated**: > 90 days
- Auto-calculated via PostgreSQL trigger

#### Deduplication
```typescript
// Hash: SHA-256 of normalized name + address + coordinates
dedupe_hash = sha256(`${name.toLowerCase()}|${address.toLowerCase()}|${lat.toFixed(6)}|${lng.toFixed(6)}`)

// Upsert on conflict
ON CONFLICT (dedupe_hash) DO UPDATE SET ...
```

### Database Schema

```sql
-- Place data blocks
CREATE TABLE kidsmap_place_blocks (
    id UUID PRIMARY KEY,
    data JSONB NOT NULL,                    -- NormalizedPlace
    status block_status DEFAULT 'active',   -- draft/active/archived/deleted
    quality_grade quality_grade DEFAULT 'C',
    freshness freshness_level DEFAULT 'fresh',
    completeness INT DEFAULT 0,
    dedupe_hash VARCHAR(64) UNIQUE,

    -- Extracted for indexing
    name VARCHAR(255),
    category place_category,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    region_code VARCHAR(10),

    -- Indexes
    INDEX (status, category),
    INDEX (latitude, longitude),
    GIN INDEX (data),
    GIN INDEX (search_keywords)
);
```

### Environment Variables

```bash
# Frontend (Public)
NEXT_PUBLIC_KAKAO_MAP_KEY=   # Kakao JavaScript SDK key

# Backend (Private)
KAKAO_REST_API_KEY=          # Kakao REST API
ANTHROPIC_API_KEY=           # Claude AI
TOUR_API_KEY=                # 한국관광공사
PLAYGROUND_API_KEY=          # 어린이놀이터
YOUTUBE_API_KEY=             # YouTube Data API
NAVER_CLIENT_ID=             # Naver Blog/Clip
REDIS_URL=                   # BullMQ crawling queue
```

### Critical Rules for KidsMap

#### 1. MAP-FIRST Priority
- Map is **primary** interface, not secondary
- All interactions happen **on** the map (not separate list view)
- Bottom sheet is **overlay**, not navigation

#### 2. Kids-Specific Metadata
- **Always** include: nursing room, diaper station, stroller access
- **Restaurant**: playroom size, kids menu, baby chairs
- **Age filtering**: infant (0-2), toddler (3-5), child (6-9), elementary (10-12)

#### 3. State Management
- Use Zustand stores, **not** React state for shared data
- Persist: favorites, recentVisits (localStorage)
- **Don't** persist: map state, search results (session only)

#### 4. Performance
- Haversine distance calc **client-side** (avoid DB overhead)
- Debounce search on map move (300ms)
- Limit markers: max 100 visible (future: clustering)

#### 5. AI Recommendations
- **Context matters**: weather, time, child age, recent visits
- Claude prompt **must** include place list (max 20 for token efficiency)
- Response format: JSON with recommendations array + reasoning

### Common Tasks

#### Add New Place Category
1. Update `PLACE_CATEGORIES` in `lib/skill-engine/data-sources/kidsmap/types.ts`
2. Add to `PLACE_TO_FILTER_CATEGORY` mapping
3. Update `place_category` enum in Prisma schema
4. Run `npm run db:push`

#### Add New Amenity
1. Extend `Amenities` interface in types.ts
2. Update quality scoring weights in `blocks/repository.ts`
3. Add UI display in `PlaceDetailSheet` component

#### Modify AI Prompt
Edit `buildRecommendationPrompt()` in `/api/kidsmap/recommendations/route.ts`

### Testing

```bash
# Type check
npm run typecheck

# Run dev server
npm run dev

# Access KidsMap
http://localhost:3003/map

# Prisma Studio (view data)
npm run db:studio
```

### Documentation

- **Architecture**: `/docs/planning/09-kidsmap-architecture.md`
- **Block System**: `/docs/planning/03-block-system.md`
- **API Reference**: See architecture doc Section 7

### Troubleshooting

**Map not loading?**
→ Check `NEXT_PUBLIC_KAKAO_MAP_KEY` in browser console

**No search results?**
→ Verify database has active places: `SELECT COUNT(*) FROM kidsmap_place_blocks WHERE status = 'active'`

**AI recommendations failing?**
→ Check `ANTHROPIC_API_KEY` and Claude API quota

**Markers not clickable?**
→ Ensure `onClick` handler passed to `addMarker({ ...place, onClick: selectPlace })`
