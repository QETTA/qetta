'use client'

import type { AGILayer } from '@/types/inbox'
import { AGI_LAYER_BADGES } from '@/types/inbox'

interface LayerVisualizationProps {
  layer: AGILayer
  confidence: number
}

/**
 * 3-Tier AGI Layer Visualization - Dark Theme
 *
 * Displays the current AGI processing layer with confidence bar.
 * Preserved from original QettaAiAgent component.
 *
 * Layers:
 * - L1: Rule Engine (Free, <10ms)
 * - L2: StoFo Engine (₩60만/년, <1초)
 * - L3: Claude API (₩600만/년, <5초)
 */
export function LayerVisualization({ layer, confidence }: LayerVisualizationProps) {
  const currentBadge = AGI_LAYER_BADGES[layer - 1]

  const layerColors = {
    1: { active: 'bg-emerald-500', text: 'text-emerald-400' },
    2: { active: 'bg-amber-500', text: 'text-amber-400' },
    3: { active: 'bg-zinc-500', text: 'text-zinc-400' },
  }

  return (
    <div className="bg-zinc-800/50 rounded-xl ring-1 ring-white/10 p-4">
      {/* 3-Tier Visual Indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((l) => (
            <div
              key={l}
              className={`w-8 h-2 rounded-full transition-all ${
                l <= layer
                  ? `${layerColors[l as AGILayer].active}`
                  : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
            layer === 1
              ? 'bg-emerald-500/10 text-emerald-400'
              : layer === 2
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-zinc-500/10 text-zinc-400'
          }`}
        >
          L{layer}
        </span>
      </div>

      {/* Layer Info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{currentBadge.name}</div>
          <div className="text-xs text-zinc-500">{currentBadge.latency} response</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500">Confidence</div>
          <div className={`text-lg font-bold ${layerColors[layer].text}`}>
            {Math.round(confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${layerColors[layer].active}`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>

      {/* Cost Info */}
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span>Cost</span>
        <span className="font-medium">{currentBadge.cost}</span>
      </div>
    </div>
  )
}
