'use client'

import type { Alert, MonitorSummary } from '@/stores/monitor-data-store'

interface MonitorSidebarProps {
  isConnected: boolean
  sseError: string | null
  equipmentCount: number
  alerts: Alert[]
  summary: MonitorSummary | null
}

export function MonitorSidebar({
  isConnected,
  sseError,
  equipmentCount,
  alerts,
  summary,
}: MonitorSidebarProps) {
  return (
    <div className="hidden md:flex w-[180px] min-w-[180px] bg-zinc-900 border-r border-white/10 flex-col">
      {/* Connection status indicator */}
      {!isConnected && (
        <div className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20">
          <span className="text-xs text-red-400">⚠️ {sseError || 'Disconnected'}</span>
        </div>
      )}
      {/* Logo */}
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white text-sm">Qetta</span>
          <svg className="w-2.5 h-2.5 text-zinc-500" viewBox="0 0 10 10" fill="none">
            <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2"/>
          <circle cx="8" cy="8" r="1.2"/>
          <circle cx="8" cy="13" r="1.2"/>
        </svg>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2.5 text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span className="text-[13px]">Search</span>
          <span className="ml-auto text-[11px] text-zinc-500 bg-white/10 px-1.5 py-0.5 rounded font-medium">⌘K</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 overflow-auto">
        {/* 전체 설비 - Active */}
        <a href="#" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-white/10 text-white mb-0.5">
          <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4"/>
          </svg>
          <span className="flex-1 text-[13px] font-medium">All Equipment</span>
          <span className="text-[12px] text-zinc-400">{summary?.totalEquipment || equipmentCount}</span>
        </a>

        {/* 알람 */}
        <a href="#" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-400 hover:bg-white/5 mb-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="flex-1 text-[13px]">Alerts</span>
          <span className="text-[12px] text-zinc-500">{alerts.length}</span>
        </a>

        {/* 위험 */}
        <a href="#" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-400 hover:bg-white/5 mb-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
          </svg>
          <span className="flex-1 text-[13px]">Critical</span>
          <span className="text-[12px] text-zinc-500">{summary?.critical || 0}</span>
        </a>

        {/* 주의 */}
        <a href="#" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-400 hover:bg-white/5 mb-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span className="flex-1 text-[13px]">Warning</span>
          <span className="text-[12px] text-zinc-500">{summary?.warning || 0}</span>
        </a>

        {/* 정상 */}
        <a href="#" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-400 hover:bg-white/5 mb-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <polyline points="21,8 21,21 3,21 3,8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          <span className="text-[13px]">Normal</span>
        </a>

        {/* 정비 이력 */}
        <a href="#" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-400 hover:bg-white/5 mb-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <span className="text-[13px]">Maintenance History</span>
        </a>

        {/* Buckets Section */}
        <div className="mt-5 mb-2">
          <span className="px-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Equipment Groups</span>
        </div>
        <a href="#" className="block px-2.5 py-1.5 text-[13px] text-zinc-400 hover:bg-white/5 rounded-md">Water Treatment</a>
        <a href="#" className="block px-2.5 py-1.5 text-[13px] text-zinc-400 hover:bg-white/5 rounded-md">Sludge Processing</a>
        <a href="#" className="block px-2.5 py-1.5 text-[13px] text-zinc-400 hover:bg-white/5 rounded-md">Flow Measurement</a>
        <a href="#" className="block px-2.5 py-1.5 text-[13px] text-zinc-400 hover:bg-white/5 rounded-md">Environmental Monitoring</a>
      </nav>
    </div>
  )
}
