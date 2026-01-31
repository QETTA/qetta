'use client'

/**
 * Dashboard Mockup Parts
 *
 * Sub-components for LinearDashboardMockup
 * Extracted for better maintainability.
 *
 * @module landing/dashboard-mockup-parts
 */

import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

export interface SidebarItemProps {
  icon: string
  label: string
  badge?: number
  active?: boolean
}

export interface DocumentListItemProps {
  title: string
  subtitle: string
  domain: string
  domainColor: 'emerald' | 'orange' | 'amber' | 'blue' | 'purple' | 'cyan'
  status: 'verified' | 'generating' | 'pending'
  time: string
  progress?: number
  active?: boolean
  isMounted?: boolean
}

// =============================================================================
// SidebarItem Component
// =============================================================================

export function SidebarItem({
  icon,
  label,
  badge,
  active
}: SidebarItemProps) {
  return (
    <div className={cn(
      'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200',
      active
        ? 'bg-gradient-to-r from-zinc-500/20 to-zinc-600/10 text-white shadow-[inset_0_0_0_1px_rgba(161,161,170,0.3)]'
        : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
    )}>
      <span className="text-base transition-transform group-hover:scale-110">{icon}</span>
      <span className="text-xs font-medium flex-1">{label}</span>
      {badge !== undefined && (
        <span className={cn(
          'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
          active
            ? 'bg-zinc-500 text-white shadow-[0_0_8px_rgba(161,161,170,0.4)]'
            : 'bg-white/[0.08] text-white/50'
        )}>
          {badge}
        </span>
      )}
    </div>
  )
}

// =============================================================================
// DocumentListItem Component
// =============================================================================

const DOMAIN_COLOR_MAP = {
  emerald: 'from-emerald-500 to-emerald-600',
  orange: 'from-orange-500 to-orange-600',
  amber: 'from-amber-500 to-amber-600',
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  cyan: 'from-cyan-500 to-cyan-600',
}

const STATUS_CONFIG = {
  verified: {
    icon: '✓',
    color: 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]',
  },
  generating: {
    icon: '◐',
    color: 'bg-blue-500/20 text-blue-400 animate-pulse',
  },
  pending: {
    icon: '○',
    color: 'bg-amber-500/20 text-amber-400',
  },
}

export function DocumentListItem({
  title,
  subtitle,
  domain,
  domainColor,
  status,
  time,
  progress,
  active,
  isMounted = true
}: DocumentListItemProps) {
  const { icon, color } = STATUS_CONFIG[status]

  return (
    <div className={cn(
      'group px-4 py-3.5 border-b border-white/[0.04] cursor-pointer transition-all duration-200',
      active
        ? 'bg-gradient-to-r from-white/[0.06] to-transparent border-l-2 border-l-zinc-400'
        : 'hover:bg-white/[0.03]'
    )}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center text-xs mt-0.5', color)}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-white font-medium truncate group-hover:text-white/90">{title}</span>
            <span className="text-[10px] text-white/30 whitespace-nowrap">{time}</span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-white/40 truncate font-mono">{subtitle}</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {/* Domain tag */}
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-gradient-to-r bg-opacity-20', DOMAIN_COLOR_MAP[domainColor])}>
              <span className={cn('w-1.5 h-1.5 rounded-full bg-gradient-to-r', DOMAIN_COLOR_MAP[domainColor])} />
              <span className="text-white/70">{domain}</span>
            </span>
          </div>

          {/* Progress bar - CSS transition */}
          {status === 'generating' && progress !== undefined && (
            <div className="mt-2.5 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full transition-all duration-800 ease-out"
                style={{ width: isMounted ? `${progress}%` : '0%' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// CodeLine Component
// =============================================================================

export function CodeLine({ num, content }: { num: number; content: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="w-8 text-right pr-3 text-white/20 select-none text-[10px]">{num}</span>
      <div className="flex-1">{content}</div>
    </div>
  )
}

// =============================================================================
// CodeEditorPreview Component (Linear Style)
// =============================================================================

export function CodeEditorPreview() {
  return (
    <div className="space-y-1">
      <CodeLine num={1} content={<><span className="text-white/30">{'// Document: MES-Q4-2024-REPORT'}</span></>} />
      <CodeLine num={2} content={<><span className="text-white/30">{'// Status: Generating (73%)'}</span></>} />
      <CodeLine num={3} content={null} />
      <CodeLine num={4} content={
        <>
          <span className="text-purple-400">interface</span>
          <span className="text-white/90"> ComplianceDocument </span>
          <span className="text-white/40">{'{'}</span>
        </>
      } />
      <CodeLine num={5} content={
        <div className="pl-4">
          <span className="text-cyan-400">docId</span>
          <span className="text-white/40">: </span>
          <span className="text-amber-300">&quot;MES-Q4-2024&quot;</span>
          <span className="text-white/40">;</span>
        </div>
      } />
      <CodeLine num={6} content={
        <div className="pl-4">
          <span className="text-cyan-400">type</span>
          <span className="text-white/40">: </span>
          <span className="text-amber-300">&quot;manufacturing&quot;</span>
          <span className="text-white/40">;</span>
        </div>
      } />
      <CodeLine num={7} content={
        <div className="pl-4">
          <span className="text-cyan-400">status</span>
          <span className="text-white/40">: </span>
          <span className="text-blue-400">&quot;generating&quot;</span>
          <span className="text-white/40">;</span>
        </div>
      } />
      <CodeLine num={8} content={
        <div className="pl-4">
          <span className="text-cyan-400">progress</span>
          <span className="text-white/40">: </span>
          <span className="text-orange-400">73</span>
          <span className="text-white/40">;</span>
        </div>
      } />
      <CodeLine num={9} content={
        <div className="pl-4">
          <span className="text-cyan-400">metrics</span>
          <span className="text-white/40">: {'{'}</span>
        </div>
      } />
      <CodeLine num={10} content={
        <div className="pl-8">
          <span className="text-cyan-400">production</span>
          <span className="text-white/40">: </span>
          <span className="text-orange-400">12847</span>
          <span className="text-white/40">,</span>
          <span className="text-white/25 ml-2">{'// units'}</span>
        </div>
      } />
      <CodeLine num={11} content={
        <div className="pl-8">
          <span className="text-cyan-400">defectRate</span>
          <span className="text-white/40">: </span>
          <span className="text-orange-400">0.023</span>
          <span className="text-white/40">,</span>
          <span className="text-white/25 ml-2">{'// 2.3%'}</span>
        </div>
      } />
      <CodeLine num={12} content={
        <div className="pl-8">
          <span className="text-cyan-400">efficiency</span>
          <span className="text-white/40">: </span>
          <span className="text-orange-400">94.7</span>
        </div>
      } />
      <CodeLine num={13} content={
        <div className="pl-4">
          <span className="text-white/40">{'}'}</span>
        </div>
      } />
      <CodeLine num={14} content={
        <>
          <span className="text-white/40">{'}'}</span>
        </>
      } />
      <CodeLine num={15} content={null} />

      {/* Inline tooltip (Linear style autocomplete) */}
      <div className="mt-4 ml-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1e] border border-white/[0.1] rounded-lg shadow-lg">
          <span className="text-blue-400 animate-pulse">◐</span>
          <span className="text-white/60 text-[10px]">Generating 4M1E analysis...</span>
          <span className="text-white/30 text-[10px]">73%</span>
        </div>
      </div>
    </div>
  )
}
