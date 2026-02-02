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
- **context7** - Real-time documentation (Next.js, React, Prisma)
- **sequentialthinking** - Deep analysis for complex decisions
- **serena** - Semantic code navigation and editing

## 🤖 AI Tool Strategy (2026)

**Subscription**: Claude Code Max (20M tokens/month)
**Budget Optimization**: See `CLAUDE_CODE_MAX_OPTIMIZATION.md`
**ROI**: 3,977% (₩10.34M monthly savings)

### When to Use Claude Code
- **Strategic/Architecture**: System design, API structure, database schema
- **Complex Logic**: Block Engine, AI integrations, data transformations
- **Research/Analysis**: Understanding codebase, debugging complex issues
- **Documentation**: Architecture docs, API references, migration guides
- **Tooling**: Git workflows, deployment, CI/CD setup

### When to Use GitHub Copilot
- **Tactical/CRUD**: Form components, list views, API routes
- **Repetitive Code**: TypeScript types, Zod schemas, Prisma models
- **Test Writing**: Unit tests, integration tests, E2E tests
- **Refactoring**: Rename variables, extract functions, simplify logic
- **Boilerplate**: React components, hooks, utility functions

### AI Workflow
```
Claude Code (Architecture) → Copilot (Implementation) → Claude Code (Review/Integration)
```

## 🎓 GitHub Student Pack Integration

### Free Tools (₩1,156,000/year savings)
| Tool | Value | Use Case |
|------|-------|----------|
| **GitHub Copilot Pro** | ₩160,000/year | Code generation (55% faster) |
| **Vercel Pro** | ₩330,000/year | Unlimited deployments, analytics |
| **DigitalOcean** | $200 credit | PostgreSQL hosting (if needed) |
| **MongoDB Atlas** | $50 credit | B2C Block data storage |
| **Azure** | $100 credit | AI/ML services, CDN |
| **Stripe** | Fee waiver | Payment processing |
| **Twilio** | $50 credit | SMS/WhatsApp notifications |
| **Datadog** | $100/mo free | Monitoring, logging, APM |

### Integration Status
- ✅ GitHub Copilot Pro - Active (GPT-5 mini, Agent Mode)
- ✅ Vercel Pro - Active (qetta.vercel.app)
- ⏳ Supabase Pro - Migration pending
- ⏳ MongoDB Atlas - B2C expansion pending
- ⏳ Datadog - Monitoring setup pending

### Environment Setup
```bash
# GitHub Copilot
gh auth login
gh copilot config model gpt-5-mini

# Vercel
npx vercel login
npx vercel link --project qetta

# Supabase
npx supabase login
npx supabase link --project-ref onetwihfvaoprqvdrfck
```

## 🚀 Autonomous Operation

### Claude Code Self-Control Mode
This project is configured for **fully autonomous operation**. Claude Code has:
- ✅ Bypass permissions mode enabled
- ✅ All tools whitelisted (Read, Write, Edit, Bash, Task, etc.)
- ✅ MCP servers auto-loaded (playwright, vercel, shadcn, serena)
- ✅ Git hooks auto-validation (pre-commit, pre-push)
- ✅ CI/CD auto-deployment (GitHub Actions → Vercel)

### Decision-Making Authority
Claude Code can **autonomously**:
1. Read/write/edit any file in the project
2. Execute bash commands (npm, git, prisma, playwright)
3. Run tests and validation
4. Create commits and push to GitHub
5. Deploy to Vercel
6. Generate components via MCP servers

**No manual approval required** for standard operations. Only ask user for:
- Major architectural changes (>5 files)
- Breaking changes to public APIs
- Database schema migrations (destructive)
- Budget-related decisions (new paid tools)

### Workflow Automation
```bash
# Development cycle (fully automated)
1. Claude Code reads task → analyzes codebase → creates plan
2. Edits files → runs typecheck → runs tests
3. Fixes issues → re-validates → commits
4. Pushes to GitHub → triggers CI/CD → deploys to Vercel
5. Verifies deployment → reports success
```

## 📋 Phase-Based Prompts

### Phase 1: FOOD BLOCK (Week 1-2)
**Primary Goal**: B2B MVP with 식품안전나라 API integration
```
Implement FOOD BLOCK using:
- Data source: data.go.kr 식품안전나라 API (200,000+ products)
- Schema: food_block_items table with quality grading (A-F)
- API: /api/blocks/food/search (name, barcode, category filters)
- UI: Search interface in dashboard with data quality indicators
- Validation: 99.2% accuracy target, <500ms response time
```

### Phase 2: KidsMap MVP (Week 3-4)
**Primary Goal**: B2C MVP with Kakao Map integration
```
Implement KidsMap core features:
- Full-screen Kakao Map with 야외/실내/공공/식당 filters
- PlaceDetailSheet with kids-specific amenities
- AI recommendations using Claude API
- Zustand stores (map, filter, place) with localStorage persistence
- Database: kidsmap_place_blocks with quality grading
```

### Phase 3: Synergy (Week 5-8)
**Primary Goal**: B2B2C data loop
```
Connect FOOD BLOCK ↔ KidsMap:
- Restaurant food safety data overlay in KidsMap
- Parent feedback collection (B2C → B2B insights)
- Manufacturer portal showing consumer trends
- Shared data quality scoring system
```

### Phase 4: AI Tools Directory (Week 9-12)
**Primary Goal**: Low-cost data block for testing B2B2C model
```
Build AI Tools Directory:
- Scrape: Futurepedia, There's An AI For That, AI-Hunter
- Schema: tool_directory_items (name, category, pricing, reviews)
- Revenue: $347-497 premium listing model
- Target: 1,000 tools, 10,000 MAU, ₩96M ARR
```

## ✅ 97-Point Environment Checklist

### Category 1: Code Quality (20 points)
- [ ] TypeScript strict mode enabled
- [ ] ESLint configured (Airbnb + Next.js rules)
- [ ] Prettier auto-format on save
- [ ] Husky pre-commit hooks active
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] 80%+ test coverage
- [ ] E2E tests pass (Playwright)
- [ ] Build succeeds without warnings
- [ ] Bundle size < 500KB

### Category 2: Performance (15 points)
- [ ] Lighthouse score > 90 (mobile)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Core Web Vitals pass
- [ ] Image optimization (next/image)
- [ ] Font optimization (next/font)
- [ ] API response < 500ms (p95)
- [ ] Database query optimization
- [ ] Redis caching implemented
- [ ] CDN configured (Vercel Edge)

### Category 3: Security (15 points)
- [ ] Environment variables secured
- [ ] API keys rotated quarterly
- [ ] HTTPS enforced
- [ ] CSRF protection enabled
- [ ] XSS sanitization active
- [ ] SQL injection prevention
- [ ] Rate limiting configured
- [ ] Authentication (NextAuth v5)
- [ ] Authorization middleware
- [ ] Security headers set

### Category 4: Database (10 points)
- [ ] Prisma schema validated
- [ ] Migrations version controlled
- [ ] Indexes optimized
- [ ] Backup strategy defined
- [ ] Connection pooling configured
- [ ] Query logging enabled (dev)
- [ ] Foreign keys enforced
- [ ] Soft deletes implemented
- [ ] Audit trails active
- [ ] Data seeding script ready

### Category 5: DevOps (12 points)
- [ ] GitHub Actions CI/CD configured
- [ ] Vercel auto-deployment active
- [ ] Preview deployments enabled
- [ ] Environment parity (dev/staging/prod)
- [ ] Error tracking (Sentry/Datadog)
- [ ] Log aggregation configured
- [ ] Uptime monitoring (99.9% SLA)
- [ ] Rollback strategy documented
- [ ] Database backups automated
- [ ] Incident response plan ready

### Category 6: Documentation (10 points)
- [ ] CLAUDE.md comprehensive
- [ ] README.md updated
- [ ] API documentation (OpenAPI)
- [ ] Architecture diagrams current
- [ ] Onboarding guide complete
- [ ] Troubleshooting guide available
- [ ] Code comments meaningful
- [ ] Changelog maintained
- [ ] Migration guides written
- [ ] User guides published

### Category 7: AI Integration (8 points)
- [ ] Claude API configured
- [ ] GitHub Copilot Pro active
- [ ] MCP servers connected
- [ ] AI prompt templates documented
- [ ] Token usage optimized
- [ ] Error handling robust
- [ ] Fallback mechanisms ready
- [ ] Cost monitoring active

### Category 8: Tooling (7 points)
- [ ] VS Code extensions installed
- [ ] Git hooks functional
- [ ] npm scripts comprehensive
- [ ] Debug configurations ready
- [ ] Browser DevTools configured
- [ ] Prisma Studio accessible
- [ ] Playwright UI mode enabled

**Total: 97 points** (Target: 95+ for production readiness)

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
