/**
 * Agent Layer Visualization Component
 *
 * 3-Tier AGI layer visualization with confidence indicator.
 *
 * @module components/dashboard/ai/agent-layer-visualization
 */

import type { AGILayer } from '@/types/inbox'
import { AGI_LAYER_BADGES } from '@/types/inbox'
import { Badge } from '@/components/catalyst/badge'
import { LAYER_COLORS } from './agent-constants'

// =============================================================================
// Types
// =============================================================================

export interface AgentLayerVisualizationProps {
  layer: AGILayer
  confidence: number
}

// =============================================================================
// Component
// =============================================================================

export function AgentLayerVisualization({
  layer,
  confidence,
}: AgentLayerVisualizationProps) {
  const currentBadge = AGI_LAYER_BADGES[layer - 1]
  const layerColor = LAYER_COLORS[layer]

  return (
    <div className="bg-zinc-800/50 rounded-xl ring-1 ring-white/10 p-4">
      {/* 3-Tier Visual Indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {([1, 2, 3] as const).map((l) => (
            <div
              key={l}
              className={`w-8 h-2 rounded-full transition-all ${
                l <= layer ? LAYER_COLORS[l].active : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
        <Badge
          color={layer === 1 ? 'emerald' : layer === 2 ? 'amber' : 'zinc'}
        >
          L{layer}
        </Badge>
      </div>

      {/* Layer Info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">
            {currentBadge.name}
          </div>
          <div className="text-xs text-zinc-500">{currentBadge.latency} response</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500">Confidence</div>
          <div className={`text-lg font-bold ${layerColor.text}`}>
            {Math.round(confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${layerColor.active}`}
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

export default AgentLayerVisualization
