/**
 * QettaMetricsBlock - QETTA 핵심 수치
 *
 * @theme Catalyst Dark
 */

'use client'

import { clsx } from 'clsx'
import type { QettaMetrics } from './types'

export function QettaMetricsBlock({ metrics }: { metrics: QettaMetrics }) {
  const metricItems = [
    {
      ...metrics.timeReduction,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      ...metrics.rejectionReduction,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      ...metrics.docSpeed,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
    },
    {
      ...metrics.apiUptime,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="mt-3 rounded-lg bg-zinc-800/50 p-4 ring-1 ring-white/10">
      <div className="mb-3 text-sm font-medium text-zinc-400">QETTA Key Metrics</div>
      <div className="grid grid-cols-2 gap-2">
        {metricItems.map((item) => (
          <div
            key={item.label}
            className={clsx('rounded-md p-2.5', item.bgColor)}
          >
            <div className={clsx('text-lg font-bold', item.color)}>
              {item.value}
            </div>
            <div className="text-xs text-zinc-400">{item.label}</div>
            <div className="text-xs text-zinc-500">{item.detail}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
