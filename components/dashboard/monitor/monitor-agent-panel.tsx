'use client'

import type { MonitorSummary } from '@/stores/monitor-data-store'

interface MonitorAgentPanelProps {
  confidence: number
  summary: MonitorSummary | null
}

export function MonitorAgentPanel({
  confidence,
  summary,
}: MonitorAgentPanelProps) {
  return (
    <div className="hidden xl:flex w-[270px] min-w-[270px] border-l border-white/10 flex-col bg-zinc-800/30">
      {/* Header */}
      <div className="h-[52px] px-5 flex items-center gap-2 border-b border-white/10">
        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
          <path d="M5 3v4M3 5h4M5 17v4M3 19h4"/>
        </svg>
        <span className="font-semibold text-white text-[14px]">Monitor Agent</span>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {/* Equipment Info */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-[14px]">Sludge Pump #1</span>
            {/* Badge - Warning style */}
            <span className="text-[11px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-medium ring-1 ring-amber-500/20">Attention Required</span>
          </div>
          <p className="text-[13px] text-zinc-400">Water Treatment Equipment, CMT Partner Integration</p>
        </div>

        {/* AI Analysis */}
        <div className="space-y-4 text-[13px] text-zinc-400 leading-normal mb-5">
          <p>Equipment status is stable, but vibration readings show an upward trend. Operators unfamiliar with technical documentation may need detailed guidance.</p>
          <p>Layer 1 has completed the necessary analysis, but the operator has not confirmed whether action has been taken.</p>
          {/* Key metrics - QETTA style */}
          <div className="grid grid-cols-2 gap-2 py-2">
            <div className="bg-zinc-800/50 rounded px-2.5 py-2">
              <span className="text-[11px] text-zinc-500 block">Analysis Confidence</span>
              <span className="text-[14px] text-white font-medium">{confidence.toFixed(1)}%</span>
            </div>
            <div className="bg-zinc-800/50 rounded px-2.5 py-2">
              <span className="text-[11px] text-zinc-500 block">Avg OEE</span>
              <span className="text-[14px] text-white font-medium">
                {summary?.avgOEE?.toFixed(1) || '87.3'}%
              </span>
            </div>
          </div>
          <p>If the operator does not respond within 12 hours, a follow-up notification will be sent:</p>
        </div>

        {/* Suggested Message */}
        <div className="border-l-[3px] border-zinc-600 pl-3 py-2 text-[13px] text-zinc-400 leading-normal mb-6">
          <p className="mb-2">Hello, I would like to confirm whether the vibration issue inspection is in progress.</p>
          <p className="mb-2">If additional support is needed, I can schedule remote technical assistance.</p>
          <p>Thank you, Layer 1 Agent</p>
        </div>

        {/* CTA Button - Outline style */}
        <button className="w-full bg-transparent hover:bg-white/10 text-white text-[13px] py-2.5 rounded-md font-medium mb-8 ring-1 ring-white/20 hover:ring-white/30 transition-colors">
          Schedule Follow-up
        </button>

        {/* Previous Alerts */}
        <div>
          <h3 className="text-[13px] text-zinc-500 mb-4">Previous Alerts</h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[13px] font-medium text-white">Sludge Pump #1 Vibration Alert</span>
                <span className="text-[12px] text-zinc-500 ml-2">6h ago</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug">Vibration readings exceeded threshold, attention required. Possible bearing wear...</p>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[13px] font-medium text-white">Scheduled Maintenance Complete</span>
                <span className="text-[12px] text-zinc-500 ml-2">2w ago</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug">Bearing replacement and lubricant refill completed. Next inspection in 3 months...</p>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[13px] font-medium text-white">TMS Report Auto-generated</span>
                <span className="text-[12px] text-zinc-500 ml-2">1mo ago</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug">CleanSYS integrated monthly emissions report auto-generated. Pending approval...</p>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[13px] font-medium text-white">OEE Target Achieved</span>
                <span className="text-[12px] text-zinc-500 ml-2">1mo ago</span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-snug">Equipment utilization rate 91.2% achieved. Smart factory KPI target exceeded...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
