'use client'

/**
 * LinearDashboardMockup
 *
 * CSS-based animation (framer-motion alternative)
 * A dashboard mockup component in Linear App style.
 *
 * @module landing/LinearDashboardMockup
 */

import { useState, useEffect } from 'react'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { cn } from '@/lib/utils'
import {
  SidebarItem,
  DocumentListItem,
  CodeEditorPreview,
} from './dashboard-mockup-parts'

export function LinearDashboardMockup() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div className="relative w-full max-w-[900px] mx-auto">

      {/* ========== Background glow effect ========== */}
      <div className="absolute -inset-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-zinc-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-600/20 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-cyan-500/15 rounded-full blur-[60px]" />
      </div>

      {/* ========== Floating badge - Generated in 45s ========== */}
      <div
        className={cn(
          'absolute -top-4 -right-4 z-30 transition-all duration-500 ease-out',
          'motion-reduce:transition-none',
          isMounted
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-5 scale-90'
        )}
        style={{ transitionDelay: isMounted ? '600ms' : '0ms' }}
      >
        <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-md shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-emerald-300 text-sm font-medium">Generated in</span>
            <span className="text-emerald-100 text-lg font-bold">{DISPLAY_METRICS.docSpeed.valueEn?.replace('/doc', '') ?? '45s'}</span>
          </div>
        </div>
      </div>

      {/* ========== Main container - 3D perspective ========== */}
      <div className="relative" style={{ perspective: '2000px' }}>
        <div
          className={cn(
            'transition-all duration-1000',
            'motion-reduce:transition-none',
            isMounted
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: isMounted ? 'rotateX(0deg)' : 'rotateX(15deg)',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >

          {/* ========== macOS window frame ========== */}
          <div className="relative bg-[#0c0c0e] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden">

            {/* Window inner gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

            {/* ===== Window title bar ===== */}
            <div className="relative flex items-center px-4 py-3 bg-gradient-to-b from-[#1c1c1f] to-[#161618] border-b border-white/[0.06]">
              {/* macOS buttons */}
              <div className="flex items-center gap-2">
                <div className="group relative">
                  <span className="block w-3 h-3 rounded-full bg-[#ff5f57] shadow-[0_0_8px_rgba(255,95,87,0.5)] transition-all group-hover:shadow-[0_0_12px_rgba(255,95,87,0.7)]" />
                </div>
                <div className="group relative">
                  <span className="block w-3 h-3 rounded-full bg-[#febc2e] shadow-[0_0_8px_rgba(254,188,46,0.5)] transition-all group-hover:shadow-[0_0_12px_rgba(254,188,46,0.7)]" />
                </div>
                <div className="group relative">
                  <span className="block w-3 h-3 rounded-full bg-[#28c840] shadow-[0_0_8px_rgba(40,200,64,0.5)] transition-all group-hover:shadow-[0_0_12px_rgba(40,200,64,0.7)]" />
                </div>
              </div>

              {/* URL bar */}
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-black/30 border border-white/[0.06] rounded-lg">
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs text-white/50 font-mono tracking-wide">app.qetta.io/docs</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors">
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ===== 3-panel layout ===== */}
            <div className="flex h-[480px]">

              {/* ========== Left sidebar ========== */}
              <div className="w-60 bg-[#08080a] border-r border-white/[0.06] flex flex-col">

                {/* Workspace selector */}
                <div className="p-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-all">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-500 via-zinc-600 to-zinc-700 flex items-center justify-center shadow-lg shadow-zinc-500/20">
                      <span className="text-xs font-bold text-white">Q</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">QETTA</div>
                      <div className="text-[10px] text-white/40">Enterprise</div>
                    </div>
                    <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>

                {/* Search bar */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                    <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-xs text-white/30">Search...</span>
                    <span className="ml-auto text-[10px] text-white/20 px-1.5 py-0.5 bg-white/[0.06] rounded">⌘K</span>
                  </div>
                </div>

                {/* Navigation menu */}
                <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
                  <SidebarItem icon="📥" label="Inbox" badge={3} active />
                  <SidebarItem icon="📋" label="My Documents" />

                  <div className="pt-4 pb-2 px-3">
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-semibold">Workspace</span>
                  </div>

                  <SidebarItem icon="📄" label="DOCS" badge={127} />
                  <SidebarItem icon="✓" label="VERIFY" />
                  <SidebarItem icon="🔍" label="Opportunities" />
                  <SidebarItem icon="📊" label="Analytics" />

                  <div className="pt-4 pb-2 px-3">
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-semibold">Domains</span>
                  </div>

                  <SidebarItem icon="🏭" label="Manufacturing" />
                  <SidebarItem icon="🌱" label="Environment" />
                  <SidebarItem icon="💰" label="Finance" />
                </nav>

                {/* Bottom user area */}
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-all">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">JK</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white/80 truncate">user@company.com</div>
                      <div className="text-[10px] text-white/40">Pro Plan</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========== Center document list panel ========== */}
              <div className="flex-1 bg-[#0f0f11] border-r border-white/[0.06] flex flex-col min-w-0">

                {/* List header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0f0f11]/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-white">Documents</h2>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-500/20 text-zinc-300 rounded-full">127</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors">
                      <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors">
                      <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Document list */}
                <div className="flex-1 overflow-y-auto">
                  <DocumentListItem
                    title="Environmental Emissions Monthly Report"
                    subtitle="TMS-2024-ENV-0127.xlsx"
                    domain="Environment"
                    domainColor="emerald"
                    status="verified"
                    time="2 min ago"
                  />
                  <DocumentListItem
                    title="Smart Factory 4M1E Performance"
                    subtitle="MES-Q4-2024-REPORT.doc"
                    domain="Manufacturing"
                    domainColor="orange"
                    status="generating"
                    time="Just now"
                    progress={73}
                    active
                    isMounted={isMounted}
                  />
                  <DocumentListItem
                    title="KODIT Credit Guarantee Application"
                    subtitle="KODIT-FIN-2024-003.pdf"
                    domain="Finance"
                    domainColor="amber"
                    status="pending"
                    time="1 hour ago"
                  />
                  <DocumentListItem
                    title="NIPA AI Voucher Quarterly Report"
                    subtitle="NIPA-AI-Q3-RPT.xlsx"
                    domain="Digital"
                    domainColor="blue"
                    status="verified"
                    time="3 hours ago"
                  />
                  <DocumentListItem
                    title="TIPS Milestone Report"
                    subtitle="TIPS-MS-2024-09.doc"
                    domain="Startup"
                    domainColor="purple"
                    status="verified"
                    time="Yesterday"
                  />
                  <DocumentListItem
                    title="SAM.gov Tender Proposal"
                    subtitle="SAM-EPA-BID-2024.pdf"
                    domain="Export"
                    domainColor="cyan"
                    status="verified"
                    time="2 days ago"
                  />
                </div>
              </div>

              {/* ========== Right code editor style panel ========== */}
              <div className="w-[340px] bg-[#0a0a0c] flex flex-col">

                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/70">Preview</span>
                    <span className="px-2 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full uppercase tracking-wide">Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-[10px] text-zinc-400 hover:text-zinc-300 font-medium transition-colors">
                      Raw JSON
                    </button>
                    <span className="text-white/20">|</span>
                    <button className="text-[10px] text-white/40 hover:text-white/60 font-medium transition-colors">
                      Export
                    </button>
                  </div>
                </div>

                {/* Code editor area */}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed">
                  <CodeEditorPreview />
                </div>

                {/* Bottom status bar */}
                <div className="px-4 py-2 border-t border-white/[0.06] bg-[#08080a]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                        <span className="text-[10px] text-white/40">SHA-256 Valid</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-white/30 font-mono">
                      a3b2c1d4e5f6...
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="p-3 border-t border-white/[0.06] flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-zinc-600 to-zinc-700 hover:from-zinc-500 hover:to-zinc-600 rounded-lg text-xs font-semibold text-white transition-all shadow-lg shadow-zinc-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                  <button className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-xs font-medium text-white/70 transition-all border border-white/[0.06]">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== Floating stats card ========== */}
      <div
        className={cn(
          'absolute -bottom-8 -right-8 z-20 transition-all duration-500 ease-out',
          'motion-reduce:transition-none',
          isMounted
            ? 'opacity-100 translate-y-0 translate-x-0'
            : 'opacity-0 translate-y-5 translate-x-5'
        )}
        style={{ transitionDelay: isMounted ? '800ms' : '0ms' }}
      >
        <div className="px-5 py-3 bg-[#16161a]/90 border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">{DISPLAY_METRICS.timeSaved.value}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{DISPLAY_METRICS.timeSaved.labelEn}</div>
            </div>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">127</div>
              <div className="text-[10px] text-white/40 mt-0.5">Documents</div>
            </div>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">{DISPLAY_METRICS.apiUptime.value}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{DISPLAY_METRICS.apiUptime.labelEn}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LinearDashboardMockup
