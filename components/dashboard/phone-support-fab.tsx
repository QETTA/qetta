'use client'

import { useState } from 'react'

/**
 * PhoneSupportFAB - 전화 상담 연결 Floating Action Button
 *
 * 중장년 UX 원칙:
 * - "젊은 직원이 없어서 온라인 신청도 힘들어"
 * - 전화 상담 연결 버튼을 우측 하단에 고정
 *
 * @see docs/plans/2026-01-22-domain-engine-master-plan.md 섹션 8.2
 */

interface PhoneSupportFABProps {
  /** Phone number to call */
  phoneNumber?: string
  /** Display label */
  label?: string
  /** Position offset from bottom */
  bottomOffset?: number
}

const DEFAULT_PHONE = '1588-0000' // 예시 번호

export function PhoneSupportFAB({
  phoneNumber = DEFAULT_PHONE,
  label = '전화 상담',
  bottomOffset = 24,
}: PhoneSupportFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleClick = () => {
    if (isExpanded) {
      // Trigger phone call
      window.location.href = `tel:${phoneNumber.replace(/-/g, '')}`
    } else {
      setIsExpanded(true)
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(false)
  }

  return (
    <div
      className="fixed right-6 z-50 flex flex-col items-end gap-3"
      style={{ bottom: `${bottomOffset}px` }}
    >
      {/* Expanded Info Card */}
      {isExpanded && (
        <div
          className="
            bg-zinc-900 rounded-2xl p-5 shadow-2xl ring-1 ring-white/10
            animate-in slide-in-from-bottom-4 fade-in duration-200
            min-w-[260px]
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">전화 상담 연결</h3>
            <button
              onClick={handleClose}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="닫기"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Phone Number */}
          <div className="bg-zinc-500/10 rounded-xl p-4 mb-4">
            <p className="text-xs text-white mb-1">상담 전화번호</p>
            <p className="text-2xl font-bold text-white tracking-wide">
              {phoneNumber}
            </p>
          </div>

          {/* Operating Hours */}
          <div className="text-sm text-zinc-400 mb-4">
            <p className="flex items-center gap-2 mb-1">
              <ClockIcon className="w-4 h-4" />
              <span>평일 09:00 - 18:00</span>
            </p>
            <p className="text-xs text-zinc-500">점심시간 12:00 - 13:00</p>
          </div>

          {/* Call Button */}
          <button
            onClick={handleClick}
            className="
              w-full py-3.5 px-6 rounded-xl
              bg-emerald-500 hover:bg-emerald-400
              text-white font-semibold text-lg
              flex items-center justify-center gap-2
              transition-colors
            "
          >
            <PhoneIcon className="w-5 h-5" />
            지금 전화하기
          </button>

          {/* Alternative Contact */}
          <p className="text-xs text-zinc-600 text-center mt-3">
            또는 카카오톡 <span className="text-zinc-400">@qetta</span>
          </p>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={handleClick}
        className={`
          flex items-center gap-2 px-5 py-3.5 rounded-full
          shadow-lg shadow-emerald-500/20
          transition-all duration-200
          ${
            isExpanded
              ? 'bg-zinc-800 text-zinc-400'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-105'
          }
        `}
        aria-label={label}
        aria-expanded={isExpanded}
      >
        <PhoneIcon className="w-5 h-5" />
        <span className="font-semibold">{label}</span>
      </button>
    </div>
  )
}

// Icons
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
