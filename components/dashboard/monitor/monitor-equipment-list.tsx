'use client'

import type { Equipment } from '@/stores/monitor-data-store'

interface MonitorEquipmentListProps {
  equipment: Equipment[]
  selectedEquipmentId: string | null
  onSelectEquipment: (id: string) => void
}

export function MonitorEquipmentList({
  equipment,
  selectedEquipmentId,
  onSelectEquipment,
}: MonitorEquipmentListProps) {
  return (
    <div className="w-full md:w-[240px] md:min-w-[240px] border-r border-white/10 flex flex-col bg-zinc-900">
      <div className="h-[52px] px-5 flex items-center justify-between border-b border-white/10">
        <h2 className="font-semibold text-white text-[14px]">Equipment Status</h2>
        <span className="text-xs text-zinc-500">{equipment.length} items</span>
      </div>

      <div className="flex-1 overflow-auto">
        {equipment.map((eq, index) => (
          <div
            key={eq.id}
            className={`px-5 py-3.5 border-b border-white/10 cursor-pointer transition-colors ${
              selectedEquipmentId === eq.id
                ? 'bg-white/10'
                : 'hover:bg-white/5'
            }`}
            onClick={() => onSelectEquipment(eq.id)}
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-semibold text-white text-[13px]">
                {eq.name}
                {eq.status === 'error' && ' Vibration Alert'}
                {eq.status === 'maintenance' && ' Maintenance Required'}
              </span>
              <span className="text-[12px] text-zinc-500 ml-2 flex-shrink-0">
                {new Date(eq.lastChecked).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-[13px] text-zinc-400 leading-snug mb-2.5 line-clamp-2">
              OEE: {eq.oee.overall.toFixed(1)}% | Sensors:{' '}
              {eq.sensors.filter((s) => s.status === 'normal').length}/
              {eq.sensors.length} Normal
            </p>
            {index === 0 && (
              <div className="flex items-center gap-2">
                <div className="relative w-5 h-5 rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3 text-emerald-400"
                  >
                    <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
                  </svg>
                </div>
                <span className="text-[12px] text-zinc-400">Layer 1 Analyzing...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
