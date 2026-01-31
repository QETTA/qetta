'use client'

import { useState } from 'react'
import { DocumentTextIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useWizardStore } from '../store'
import { WIDGET_TEMPLATES, type WidgetDocumentType } from '../types'

interface StepDataSourceProps {
  onNext: () => void
}

export function StepDataSource({ onNext }: StepDataSourceProps) {
  const { documentType, setDocumentType } = useWizardStore()
  const [hoveredType, setHoveredType] = useState<WidgetDocumentType | null>(null)

  const handleSelect = (type: WidgetDocumentType) => {
    // Map document type to engine preset
    const presetMap: Record<WidgetDocumentType, 'DIGITAL' | 'MANUFACTURING' | 'STARTUP'> = {
      result_report: 'DIGITAL',
      performance_report: 'DIGITAL',
      sustainability_plan: 'DIGITAL',
      settlement_report: 'MANUFACTURING',
      business_plan: 'STARTUP',
    }

    setDocumentType(type, presetMap[type])
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          어떤 문서를 생성할까요?
        </h2>
        <p className="text-zinc-400">
          생성할 문서 유형을 선택하세요
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WIDGET_TEMPLATES.map((template) => (
          <button
            key={template.documentType}
            onClick={() => handleSelect(template.documentType)}
            onMouseEnter={() => setHoveredType(template.documentType)}
            onMouseLeave={() => setHoveredType(null)}
            className={cn(
              'group relative p-6 rounded-xl border transition-all duration-200',
              'bg-zinc-900/50 hover:bg-zinc-800/50',
              'border-zinc-800 hover:border-zinc-500/50',
              'text-left',
              documentType === template.documentType && 'border-zinc-500 ring-2 ring-zinc-500/20'
            )}
          >
            {/* Icon */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl">{template.icon}</span>
              <div>
                <h3 className="font-semibold text-white group-hover:text-white transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-zinc-500">
                  {template.description}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs">
              <span className="text-zinc-500">
                ⏱️ ~{template.estimatedTimeMinutes}분
              </span>
              <span className="text-emerald-500 font-medium">
                💚 {Math.round(template.timeSavedMinutes / 60)}시간 절감
              </span>
            </div>

            {/* Arrow */}
            <ChevronRightIcon
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5',
                'text-zinc-600 group-hover:text-white transition-all',
                'group-hover:translate-x-1'
              )}
            />
          </button>
        ))}
      </div>

      {/* Time savings highlight */}
      <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-zinc-500/10 to-fuchsia-500/10 border border-zinc-500/20">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-zinc-500/20">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">
              평균 93.8% 시간 절감
            </p>
            <p className="text-sm text-zinc-400">
              8시간 걸리던 문서 작성을 30분 만에 완료하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
