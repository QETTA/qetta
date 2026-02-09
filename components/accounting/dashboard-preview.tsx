/**
 * Dashboard Preview Component
 * Live updates with animated counters for landing page demonstration
 *
 * @see Plan: Part D1 - Premium Landing Page Components
 */

'use client'

import { useEffect, useState } from 'react'
import { AnimatedNumber, AnimatedCurrency } from './animated-number'

interface DashboardStats {
  conversions: number
  revenue: number
  partners: number
  avgCommission: number
}

export function DashboardPreview() {
  const [stats, setStats] = useState<DashboardStats>({
    conversions: 127,
    revenue: 14500,
    partners: 23,
    avgCommission: 725
  })

  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    if (!isLive) return

    // Simulate live updates every 5 seconds
    const interval = setInterval(() => {
      setStats((prev) => ({
        conversions: prev.conversions + Math.floor(Math.random() * 3),
        revenue: prev.revenue + Math.floor(Math.random() * 800 + 200),
        partners: prev.partners + (Math.random() > 0.9 ? 1 : 0),
        avgCommission: prev.avgCommission + Math.floor(Math.random() * 50 - 25)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [isLive])

  return (
    <div className="relative">
      {/* Live Indicator */}
      <div className="absolute -top-3 -right-3 z-10 flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1.5">
        {isLive && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
        )}
        <span className="text-xs font-medium text-zinc-400">
          {isLive ? 'Live' : 'Paused'}
        </span>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
        {/* Conversions Today */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-400">Conversions Today</p>
          <p className="text-3xl font-bold tabular-nums text-white">
            <AnimatedNumber value={stats.conversions} duration={1000} />
          </p>
          <p className="text-xs text-emerald-400">
            +{Math.floor(stats.conversions * 0.12)} from yesterday
          </p>
        </div>

        {/* Revenue */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-400">Revenue</p>
          <p className="text-3xl font-bold tabular-nums text-emerald-400">
            <AnimatedCurrency value={stats.revenue} duration={1000} />
          </p>
          <p className="text-xs text-zinc-500">
            Avg: ${Math.floor(stats.revenue / stats.conversions)}
          </p>
        </div>

        {/* Active Partners */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-400">Active Partners</p>
          <p className="text-3xl font-bold tabular-nums text-white">
            <AnimatedNumber value={stats.partners} duration={1000} />
          </p>
          <p className="text-xs text-zinc-500">
            Across 50+ cafes
          </p>
        </div>

        {/* Avg Commission */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-400">Avg Commission</p>
          <p className="text-3xl font-bold tabular-nums text-white">
            <AnimatedCurrency value={stats.avgCommission} duration={1000} />
          </p>
          <p className="text-xs text-zinc-500">
            Per conversion
          </p>
        </div>

        {/* Activity Feed */}
        <div className="col-span-2 mt-2 space-y-2 border-t border-zinc-800 pt-4">
          <p className="text-xs font-medium text-zinc-500">Recent Activity</p>
          <div className="space-y-1.5">
            <ActivityItem
              text="New conversion from Gangnam Cafe"
              time="2 min ago"
              type="conversion"
            />
            <ActivityItem
              text="Partner approved for payout"
              time="5 min ago"
              type="payout"
            />
            <ActivityItem
              text="New referral link generated"
              time="8 min ago"
              type="link"
            />
          </div>
        </div>
      </div>

      {/* Toggle Live Updates (for demo purposes) */}
      <button
        onClick={() => setIsLive(!isLive)}
        className="mt-4 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        {isLive ? 'Pause' : 'Resume'} Live Updates
      </button>
    </div>
  )
}

interface ActivityItemProps {
  text: string
  time: string
  type: 'conversion' | 'payout' | 'link'
}

function ActivityItem({ text, time, type }: ActivityItemProps) {
  const colors = {
    conversion: 'bg-emerald-500',
    payout: 'bg-blue-500',
    link: 'bg-purple-500'
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className={`h-1.5 w-1.5 rounded-full ${colors[type]}`} />
      <span className="flex-1 text-zinc-300">{text}</span>
      <span className="text-zinc-600">{time}</span>
    </div>
  )
}

/**
 * Mini Dashboard Preview
 * Compact version for smaller spaces
 */
export function MiniDashboardPreview() {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div>
        <p className="text-xs text-zinc-500">Conversions</p>
        <p className="text-2xl font-bold text-white">
          <AnimatedNumber value={127} />
        </p>
      </div>
      <div>
        <p className="text-xs text-zinc-500">Revenue</p>
        <p className="text-2xl font-bold text-emerald-400">
          <AnimatedCurrency value={14500} />
        </p>
      </div>
      <div className="col-span-2 flex items-center gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Live updates
      </div>
    </div>
  )
}
