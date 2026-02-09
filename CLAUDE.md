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

---

## 🏦 Accounting & Settlement Module

**Partner Accounting and Referral Settlement System** - B2B2C revenue sharing with cafe partners.

| Aspect | Details |
|--------|---------|
| **Purpose** | Track cafe partnerships, referral conversions, automate monthly payouts |
| **Commission Model** | 5% revenue share on first-touch attributed conversions |
| **Attribution Window** | 7-day cookie (first-touch only) |
| **Settlement Cycle** | Monthly (draft → approved → paid) |
| **Database** | PostgreSQL via Prisma (ACID transactions) |
| **Authentication** | NextAuth (admin) + x-api-key (partner) |

### Architecture Decisions

#### ✅ Database: PostgreSQL via Prisma
- **Why**: Financial ledgers require ACID transactions, foreign key enforcement
- **Models**: ReferralPartner, ReferralCafe, PartnerApiKey, ReferralLink, ReferralConversion, PayoutLedger, ExternalPost
- **Benefits**: Transaction support, cascade rules, consistency with existing User/Payment models

#### ✅ Authentication: 2 Systems (NOT 5)
- **Admin Dashboard**: NextAuth with `role: 'ADMIN'` check
  - Routes: `app/(dashboard)/accounting/*`
  - Session-based, no API keys
- **Partner API**: Extend existing x-api-key pattern
  - Add `key_type: 'partner'` field to differentiate from firm keys
  - Routes: `server/src/routes/accounting-partners.ts`

#### ✅ Rollback: Compensating Ledger Entries
- **State Machine**: `draft → approved → processing → paid → [adjustment_pending] → adjusted`
- **Ledger Types**:
  - `PAYOUT` (positive amount)
  - `ADJUSTMENT` (negative amount, references original ledger)
  - `CLAWBACK` (recovery from partner)
- **Audit Trail**: Immutable snapshot with SHA-256 hash at approval time

### Database Schema

#### Core Models (8 New)

```prisma
model ReferralPartner {
  id              String   @id @default(cuid())
  orgId           String   @unique @map("org_id")
  orgName         String   @map("org_name")
  businessNumber  String   @unique @map("business_number")
  contactEmail    String   @map("contact_email")
  status          PartnerStatus @default(ACTIVE)

  cafes           ReferralCafe[]
  apiKeys         PartnerApiKey[]
  payoutLedgers   PayoutLedger[]

  @@map("referral_partners")
}

model ReferralCafe {
  id              String   @id @default(cuid())
  partnerId       String   @map("partner_id")
  cafeName        String   @map("cafe_name")
  commissionRate  Decimal  @db.Decimal(5,4) @map("commission_rate")
  status          CafeStatus @default(ACTIVE)

  partner         ReferralPartner @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  referralLinks   ReferralLink[]

  @@index([partnerId, status])
  @@map("referral_cafes")
}

model PartnerApiKey {
  id              String   @id @default(cuid())
  partnerId       String   @map("partner_id")
  keyHash         String   @unique @map("key_hash")  // SHA-256
  keyPrefix       String   @map("key_prefix")       // pk_abc123...
  keyType         String   @default("partner") @map("key_type")
  permissions     String[] // ['read:cafes', 'write:posts']

  partner         ReferralPartner @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  @@map("partner_api_keys")
}

model ReferralLink {
  id              String   @id @default(cuid())
  cafeId          String   @map("cafe_id")
  shortCode       String   @unique @map("short_code")  // ABCD1234
  fullUrl         String   @map("full_url")
  utmSource       String?  @map("utm_source")
  utmCampaign     String?  @map("utm_campaign")
  clicks          Int      @default(0)
  status          LinkStatus @default(ACTIVE)

  cafe            ReferralCafe @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  conversions     ReferralConversion[]

  @@index([cafeId, status])
  @@map("referral_links")
}

model ReferralConversion {
  id              String   @id @default(cuid())
  userId          String   @unique @map("user_id")  // First-touch only
  linkId          String   @map("link_id")

  ipHash          String   @map("ip_hash")
  attributedAt    DateTime @map("attributed_at")

  subscriptionId  String?  @map("subscription_id")
  amount          Decimal  @db.Decimal(10,2)
  commissionRate  Decimal  @db.Decimal(5,4) @map("commission_rate")
  commissionAmount Decimal @db.Decimal(10,2) @map("commission_amount")

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  link            ReferralLink @relation(fields: [linkId], references: [id])

  @@index([linkId, attributedAt])
  @@map("referral_conversions")
}

model PayoutLedger {
  id              String   @id @default(cuid())
  partnerId       String   @map("partner_id")
  periodStart     DateTime @map("period_start")
  periodEnd       DateTime @map("period_end")
  status          PayoutStatus @default(DRAFT)
  ledgerType      LedgerType @default(PAYOUT) @map("ledger_type")

  snapshotHash    String?  @map("snapshot_hash")  // SHA-256 of approval snapshot
  conversionIds   String[] @map("conversion_ids")

  totalConversions Int     @default(0) @map("total_conversions")
  totalRevenue    Decimal  @db.Decimal(10,2) @default(0) @map("total_revenue")
  totalCommission Decimal  @db.Decimal(10,2) @default(0) @map("total_commission")

  approvedBy      String?  @map("approved_by")
  approvedAt      DateTime? @map("approved_at")
  paidAt          DateTime? @map("paid_at")

  referenceLedgerId String? @map("reference_ledger_id")  // For adjustments
  adjustmentReason  String? @map("adjustment_reason")

  partner         ReferralPartner @relation(fields: [partnerId], references: [id])

  @@unique([partnerId, periodStart, periodEnd, version])
  @@index([status, periodStart])
  @@map("payout_ledgers")
}

model ExternalPost {
  id              String   @id @default(cuid())
  partnerId       String   @map("partner_id")
  postType        PostType @map("post_type")  // BLOG, INSTAGRAM, YOUTUBE
  url             String   @unique
  title           String

  publishedAt     DateTime @map("published_at")

  @@index([partnerId, postType])
  @@map("external_posts")
}
```

### API Routes

#### Admin Routes (NextAuth Protected)

**Directory**: `app/api/accounting/admin/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/accounting/admin/partners` | POST | Create partner |
| `/api/accounting/admin/partners/[id]/cafes` | POST | Add cafe |
| `/api/accounting/admin/partners/[id]/api-keys` | POST | Generate API key (returns raw key ONCE) |
| `/api/accounting/admin/cafes/[id]/referral-links` | POST | Create referral link |
| `/api/accounting/admin/payouts/preview` | POST | Calculate payout with snapshot |
| `/api/accounting/admin/payouts/approve` | POST | Approve payout (verify snapshotHash) |
| `/api/accounting/admin/payouts/[id]/adjust` | POST | Create adjustment ledger |

#### Partner Routes (x-api-key Protected)

**Directory**: `server/src/routes/accounting-partners.ts`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/qetta/v1/partners/me/cafes` | GET | List partner's cafes |
| `/api/qetta/v1/partners/me/referral-links` | GET | List referral links with stats |
| `/api/qetta/v1/partners/me/payouts` | GET | Payout history |
| `/api/qetta/v1/partners/me/external-posts/batch` | POST | Upload posts (blog/Instagram/YouTube) |

### Authentication Details

#### Admin Authentication
```typescript
// app/(dashboard)/accounting/layout.tsx
export default async function AccountingLayout({ children }) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return <>{children}</>
}
```

#### Partner Authentication
```typescript
// server/src/middleware/partnerAuth.ts
export async function requirePartnerAuth(req, res, next) {
  const apiKey = req.headers['x-api-key']

  const keyRecord = await prisma.partnerApiKey.findUnique({
    where: { keyHash: sha256(apiKey) },
    include: { partner: true }
  })

  if (!keyRecord || keyRecord.keyType !== 'partner') {
    return res.status(401).json({ error: 'Invalid partner API key' })
  }

  req.partner = keyRecord.partner
  next()
}
```

### Critical Rules

#### 1. Idempotency
- **Payout**: Unique index on `(partnerId, periodStart, periodEnd, version)` prevents duplicate runs
- **Attribution**: Unique index on `userId` enforces first-touch only
- **Snapshot Verification**: Approve endpoint checks `snapshotHash` to prevent tampering

#### 2. First-Touch Attribution
- **Cookie**: `qetta_ref` (7-day expiry, httpOnly, secure)
- **Constraint**: `userId` unique in `referral_conversions` table
- **Fallback**: IP hash + user agent hash if cookie missing

#### 3. Compensating Ledger Entries
- **Never Hard-Delete**: Use `LedgerType.ADJUSTMENT` for corrections
- **Reference Tracking**: `referenceLedgerId` links adjustments to original payout
- **Audit Trail**: All changes logged with `adjustmentReason`

#### 4. Snapshot-Based Approval
- **Hash**: SHA-256 of conversion IDs + amounts + commission rates
- **Verification**: Approve endpoint recalculates hash and compares
- **Prevents**: Tampering between preview and approval

### Common Tasks

#### Generate Partner API Key (Admin)
```bash
curl -X POST http://localhost:3003/api/accounting/admin/partners/[partnerId]/api-keys \
  -H "Cookie: next-auth.session-token=xxx" \
  -H "Content-Type: application/json" \
  -d '{"permissions":["read:cafes","write:posts"],"expiresInDays":365}'

# Response (raw key shown ONCE, cannot recover)
{
  "apiKey": "pk_abc123def456...",
  "keyPrefix": "pk_abc123",
  "expiresAt": "2027-02-08T00:00:00Z"
}
```

#### Run Monthly Payout (Admin)
```bash
# 1. Preview
curl -X POST http://localhost:3003/api/accounting/admin/payouts/preview \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "partnerId": "cuid_partner123",
    "periodStart": "2026-02-01T00:00:00Z",
    "periodEnd": "2026-02-28T23:59:59Z"
  }'

# Response
{
  "snapshotId": "snap_xyz789",
  "snapshotHash": "a1b2c3d4...",
  "totalConversions": 42,
  "totalCommission": 2100000
}

# 2. Approve (verify snapshot unchanged)
curl -X POST http://localhost:3003/api/accounting/admin/payouts/approve \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{
    "partnerId": "cuid_partner123",
    "snapshotId": "snap_xyz789",
    "approvedBy": "admin@qetta.com"
  }'
```

#### Partner: List Cafes
```bash
curl -X GET http://localhost:3003/api/qetta/v1/partners/me/cafes \
  -H "x-api-key: pk_abc123..."

# Response
{
  "cafes": [
    {
      "id": "cafe_xyz",
      "name": "HQ Location",
      "commissionRate": 0.05,
      "totalConversions": 42,
      "totalCommission": 2100000
    }
  ]
}
```

### Referral Tracking Flow

1. **User Clicks Link**: Visit `https://qetta.com/r/ABCD1234`
2. **Cookie Set**: `qetta_ref=ABCD1234` (7 days, httpOnly, secure)
3. **Redirect**: To `/register?ref=ABCD1234`
4. **User Signs Up**: Normal registration flow
5. **User Pays**: Subscription purchase triggers webhook
6. **Attribution**: Webhook checks `qetta_ref` cookie → creates `ReferralConversion` (first-touch only)
7. **Monthly Payout**: Admin runs payout → calculates commission → approves → marks paid

### Security Notes

- **API Keys**: Display raw key ONLY ONCE during creation (cannot recover)
- **Key Rotation**: Admin can delete key from `partner_api_keys` → partner receives 401
- **Attribution Window**: 7-day cookie prevents indefinite tracking
- **Snapshot Verification**: Prevents tampering between preview and approval
- **Audit Logging**: All admin actions logged with NextAuth user ID

### Testing

```bash
# Database migration
npx prisma migrate dev --name add_accounting_models

# Verify schema
npm run db:studio

# Run validation
npm run validate

# E2E tests
npm run e2e -- accounting.spec.ts
```

### Documentation

- **Plan File**: `/root/.claude/plans/floofy-rolling-meteor.md`
- **Serena Memories**: `.serena/memories/10-architecture-core.md`, `40-quality-workflow.md`
- **API Testing**: See plan file "Verification Plan" section

### Troubleshooting

**API key authentication failing?**
→ Verify `keyType = 'partner'` in `partner_api_keys` table

**Attribution not working?**
→ Check `qetta_ref` cookie is set (httpOnly, secure, 7-day expiry)

**Payout approval failing?**
→ Verify `snapshotHash` matches (no data changed between preview and approval)

**Duplicate conversions?**
→ Check `userId` unique constraint in `referral_conversions` table