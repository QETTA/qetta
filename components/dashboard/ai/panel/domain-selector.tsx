'use client'

import { useAIPanelStore } from '@/stores/ai-panel-store'
import type { EnginePresetType } from '@/types/inbox'
import { DOMAIN_ENGINE_CONFIGS } from '@/lib/domain-engines/constants'

interface DomainSelectorProps {
  /** Compact mode for mobile - horizontal scroll, no label */
  compact?: boolean
}

/**
 * Domain Engine Selector
 *
 * Allows users to switch between 4 domain engines:
 * - TMS (환경관리)
 * - Smart Factory (스마트팩토리)
 * - AI Voucher (AI 바우처)
 * - Global Tender (해외입찰)
 *
 * Props:
 * - compact: If true, uses horizontal scroll layout for mobile
 */
export function DomainSelector({ compact = false }: DomainSelectorProps) {
  const { selectedPreset, setSelectedPreset } = useAIPanelStore()

  const domains: EnginePresetType[] = [
    'ENVIRONMENT',
    'MANUFACTURING',
    'DIGITAL',
    'EXPORT',
  ]

  return (
    <div>
      {/* Label - hidden in compact mode */}
      {!compact && (
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
          Select Domain Engine
        </label>
      )}

      {/* Domain buttons - flex wrap on desktop, horizontal scroll on mobile */}
      <div
        className={
          compact
            ? 'flex gap-2 overflow-x-auto pb-1 scrollbar-hide'
            : 'flex gap-1.5'
        }
      >
        {domains.map((domain) => {
          const config = DOMAIN_ENGINE_CONFIGS[domain]
          const isSelected = selectedPreset === domain

          return (
            <button
              key={domain}
              onClick={() => setSelectedPreset(domain)}
              className={`${compact ? 'flex-shrink-0 px-3 py-1.5' : 'flex-1 py-2 px-2'} flex flex-col items-center gap-1 rounded-lg transition-all ${
                isSelected
                  ? `${config.styles.badge}`
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 ring-1 ring-white/5 hover:ring-white/10'
              }`}
              aria-pressed={isSelected}
              aria-label={`Select ${config.label} engine`}
            >
              <span className={compact ? 'text-sm' : 'text-base'} aria-hidden="true">
                {config.icon}
              </span>
              <span
                className={`font-medium truncate max-w-full ${compact ? 'text-[9px]' : 'text-[10px]'}`}
              >
                {config.shortLabel}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected domain info - hidden in compact mode */}
      {!compact && (
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <span className={DOMAIN_ENGINE_CONFIGS[selectedPreset].styles.accent}>
            {DOMAIN_ENGINE_CONFIGS[selectedPreset].icon}
          </span>
          <span>{DOMAIN_ENGINE_CONFIGS[selectedPreset].label}</span>
          <span className="text-zinc-600">•</span>
          <span>{DOMAIN_ENGINE_CONFIGS[selectedPreset].ministry}</span>
        </div>
      )}
    </div>
  )
}
