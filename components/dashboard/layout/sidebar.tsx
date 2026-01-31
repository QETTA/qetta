'use client'

import { memo } from 'react'
import Link from 'next/link'
import type { ProductTab } from '@/types/inbox'
import { useCrossFunctional } from '../context'
import { ENGINE_PRESETS, QETTA_METRICS } from '@/lib/super-model'
import { AccessibilityToggle } from '../accessibility-toggle'
import { Badge } from '@/components/catalyst/badge'
import { PreviewModeBadge } from '../preview-banner'

interface QettaLeftSidebarProps {
  activeTab: ProductTab
  onTabChange: (tab: ProductTab) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

// DOCS-VERIFY-APPLY Triangle + MONITOR
// URL-based routing for SEO and deep linking
const navItems = [
  {
    id: 'DOCS',
    label: 'DOCS',
    sublabel: 'Evidence',
    href: '/docs',
    count: 6,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    highlight: true,
    description: 'Auto document generation',
  },
  {
    id: 'VERIFY',
    label: 'VERIFY',
    sublabel: 'Verify',
    href: '/verify',
    count: 10,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    description: 'Hashchain verification',
  },
  {
    id: 'APPLY',
    label: 'APPLY',
    sublabel: 'Match',
    href: '/apply',
    count: 3,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    description: 'Global tender matching',
  },
  {
    id: 'MONITOR',
    label: 'MONITOR',
    sublabel: 'Monitor',
    href: '/monitor',
    count: 1,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    description: 'Dashboard monitoring',
  },
]

// Domain engine color mapping (6 Engine Presets - Super-Model v4.0)
const engineColors: Record<string, string> = {
  blue: 'bg-blue-500',        // MANUFACTURING
  emerald: 'bg-emerald-500',  // ENVIRONMENT
  zinc: 'bg-zinc-500',    // DIGITAL
  indigo: 'bg-indigo-500',    // FINANCE
  fuchsia: 'bg-fuchsia-500',  // STARTUP
  amber: 'bg-amber-500',      // EXPORT
}

// Document categories (original buckets restored)
const documentBuckets = [
  { id: 'tms-report', label: 'TMS Reports' },
  { id: 'env-form', label: 'Environment Forms' },
  { id: 'overseas-tender', label: 'Overseas Tender' },
  { id: 'internal', label: 'Internal Docs' },
]

export const QettaLeftSidebar = memo(function QettaLeftSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}: QettaLeftSidebarProps) {
  const { showToast } = useCrossFunctional()

  const handleSearchClick = () => {
    showToast('Search coming soon (Cmd+K)', 'info')
  }

  const handleCategoryAdd = () => {
    showToast('Add category coming soon', 'info')
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } flex-shrink-0 bg-zinc-900 border-r border-white/10 hidden sm:flex flex-col transition-all duration-300`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo Header - Catalyst Dark style */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          {!collapsed ? (
            <div className="flex flex-col">
              <span className="text-white font-semibold text-base tracking-tight">QETTA</span>
              <span className="text-[10px] text-zinc-500 font-medium">Documentation Platform</span>
            </div>
          ) : (
            <span className="text-white font-bold text-lg">Q</span>
          )}
        </div>
        {/* Preview mode badge or BETA badge */}
        {!collapsed && (
          <div className="flex items-center gap-1">
            <PreviewModeBadge />
            {process.env.NODE_ENV !== 'production' && (
              <Badge color="zinc" className="text-[10px]">BETA</Badge>
            )}
          </div>
        )}
      </div>

      {/* Search Bar - Catalyst Dark style */}
      <div className="px-3 py-3">
        <button
          onClick={handleSearchClick}
          data-testid="sidebar-search-button"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 ring-1 ring-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Search (Cmd+K)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          {!collapsed && (
            <>
              <span className="text-sm flex-1 text-left">Search</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-500 rounded border border-white/10">Cmd+K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation - Catalyst Dark style with URL-based routing */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={() => onTabChange(item.id as ProductTab)}
                data-testid={`sidebar-tab-${item.id.toLowerCase()}`}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/30 ${
                  activeTab === item.id
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                } ${item.highlight ? 'relative' : ''}`}
                aria-current={activeTab === item.id ? 'page' : undefined}
                aria-label={`${item.label} ${item.count > 0 ? `(${item.count} items)` : ''}`}
              >
                <span className={activeTab === item.id ? 'text-white' : 'text-zinc-500'}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.count > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.highlight
                            ? 'bg-white/10 text-white'
                            : activeTab === item.id
                            ? 'bg-white/10 text-white'
                            : 'bg-white/5 text-zinc-500'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                    {item.highlight && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span>
                      </span>
                    )}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Secondary Nav - Archive/Spam */}
        <ul className="mt-4 pt-4 border-t border-white/5 space-y-1">
          <li>
            <button aria-label="Archive" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              {!collapsed && <span>Archive</span>}
            </button>
          </li>
          <li>
            <button aria-label="Spam" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              {!collapsed && <span>Spam</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Domain engine status section - Catalyst Dark */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Domain Engines</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </span>
          </div>
          {/* Core Metrics 6-Metric Grid - Super-Model v4.0 */}
          <div className="bg-zinc-800/50 rounded-lg p-3 ring-1 ring-white/10 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-300">Core Metrics</span>
              <span className="text-xs text-zinc-500">Real-time</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-zinc-900 rounded px-2 py-1.5 ring-1 ring-white/5">
                <div className="text-base font-semibold text-zinc-300">{QETTA_METRICS.TIME_REDUCTION}</div>
                <div className="text-[10px] text-zinc-500">Time saved</div>
              </div>
              <div className="bg-zinc-900 rounded px-2 py-1.5 ring-1 ring-white/5">
                <div className="text-base font-semibold text-emerald-400">{QETTA_METRICS.REJECTION_REDUCTION}</div>
                <div className="text-[10px] text-zinc-500">Rejection ↓</div>
              </div>
              <div className="bg-zinc-900 rounded px-2 py-1.5 ring-1 ring-white/5">
                <div className="text-base font-semibold text-blue-400">{QETTA_METRICS.GENERATION_SPEED}</div>
                <div className="text-[10px] text-zinc-500">Generation</div>
              </div>
              <div className="bg-zinc-900 rounded px-2 py-1.5 ring-1 ring-white/5">
                <div className="text-base font-semibold text-amber-400">{QETTA_METRICS.API_UPTIME}</div>
                <div className="text-[10px] text-zinc-500">Uptime</div>
              </div>
              <div className="bg-zinc-900 rounded px-2 py-1.5 ring-1 ring-white/5">
                <div className="text-base font-semibold text-indigo-400">{QETTA_METRICS.ACCURACY}</div>
                <div className="text-[10px] text-zinc-500">Accuracy</div>
              </div>
              <div className="bg-zinc-900 rounded px-2 py-1.5 ring-1 ring-white/5">
                <div className="text-base font-semibold text-fuchsia-400">{QETTA_METRICS.GLOBAL_TENDER_DB}</div>
                <div className="text-[10px] text-zinc-500">Global DB</div>
              </div>
            </div>
          </div>
          {/* Domain engine list - Catalyst Dark */}
          <ul className="space-y-1">
            {ENGINE_PRESETS.map((engine) => (
              <li key={engine.id}>
                <button className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${engineColors[engine.color]}`}></span>
                    <span>{engine.name}</span>
                  </div>
                  <Badge color="zinc" className="text-[10px]">{engine.id}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Document categories section - Catalyst Dark */}
      {!collapsed && (
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Categories</span>
            <button
              onClick={handleCategoryAdd}
              className="text-zinc-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 rounded transition-colors"
              aria-label="Add category"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
          <ul className="space-y-0.5">
            {documentBuckets.map((bucket) => (
              <li key={bucket.id}>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                  <span>{bucket.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accessibility settings - Senior UX */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Display</span>
          </div>
          <AccessibilityToggle compact />
        </div>
      )}

      {/* Footer Actions - Catalyst Dark style */}
      <div className="px-3 py-3 border-t border-white/5 space-y-2">
        {/* Home link */}
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Go to homepage"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          {!collapsed && <span className="text-sm">Home</span>}
        </Link>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          data-testid="sidebar-collapse-toggle"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <svg
            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>
    </aside>
  )
})
