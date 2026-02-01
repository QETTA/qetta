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
├── (marketing)/       # Landing/marketing pages
└── api/               # API routes

components/            # React components
├── auth/              # Auth forms
├── dashboard/         # Dashboard UI
├── landing/           # Marketing components
└── layout/            # Shared layouts

lib/                   # Core business logic (38 modules)
├── block-engine/      # 3-Layer Block Engine ⭐
├── skill-engine/      # Skill-based automation
├── claude/            # Claude API integration
├── auth/              # Authentication logic
├── db/                # Database (Prisma)
└── ...
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
