'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import type { Equipment } from '@/stores/monitor-data-store'

// Fallback messages for typewriter effect
const fallbackAgentMessages = [
  '2. Check shaft alignment and realign if necessary',
  '3. Vibration data trend analysis attached',
  'Anomaly detected: High-frequency vibration component increase (15-20Hz)',
  'Recommended action: Bearing replacement within 48 hours',
  '4. OPC-UA protocol data consistency verification complete',
  '5. MES system integration status normal (latency: 12ms)',
  'Analysis confidence: 94.2% (based on previous maintenance history)',
  'Auto-generated evidence document ready (DOCS integration)',
  '6. 4M1E Analysis: Man(Normal), Machine(Warning), Material(Normal)',
  'Expected OEE impact: Current 87.3% → After replacement 92.1%',
]

interface MonitorEquipmentDetailProps {
  selectedEquipment: Equipment | undefined
  isConnected: boolean
  sseError: string | null
  showWidgets: boolean
  detailPanelOpen: boolean
}

export function MonitorEquipmentDetail({
  selectedEquipment,
  isConnected,
  sseError,
  showWidgets,
  detailPanelOpen,
}: MonitorEquipmentDetailProps) {
  // Typewriter State
  const [messageIndex, setMessageIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  // Typewriter effect - type message character by character
  useEffect(() => {
    const currentMessage = fallbackAgentMessages[messageIndex]
    let timer1: ReturnType<typeof setTimeout> | undefined
    let timer2: ReturnType<typeof setTimeout> | undefined

    if (isTyping && displayText.length < currentMessage.length) {
      timer1 = setTimeout(() => {
        setDisplayText(currentMessage.slice(0, displayText.length + 1))
      }, 50) // 50ms per character
    }

    // When message is complete, wait then move to next
    if (displayText.length === currentMessage.length) {
      timer1 = setTimeout(() => {
        setIsTyping(false)
        // Wait before starting next message
        timer2 = setTimeout(() => {
          setMessageIndex((prev) => (prev + 1) % fallbackAgentMessages.length)
          setDisplayText('')
          setIsTyping(true)
        }, 1500) // Pause between messages
      }, 2000) // Display complete message for 2s
    }

    return () => {
      if (timer1) clearTimeout(timer1)
      if (timer2) clearTimeout(timer2)
    }
  }, [displayText, messageIndex, isTyping])

  return (
    <div className={`hidden sm:flex flex-col min-w-0 bg-zinc-900 ${
      showWidgets && detailPanelOpen
        ? 'w-[400px]'
        : 'flex-1'
    }`}>
      {/* Header */}
      <div className="h-[52px] px-5 flex items-center gap-3 border-b border-white/10">
        <svg className="w-4.5 h-4.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="none"/>
        </svg>
        <span className="font-semibold text-white text-[14px] flex-1 truncate">
          {selectedEquipment?.name
            ? `Re: ${selectedEquipment.name} Vibration Alert`
            : 'Re: Sludge Pump #1 Vibration Alert'}
        </span>
        {/* Status Badge - Connection/Analyzing */}
        {!isConnected ? (
          <span className="flex items-center gap-1.5 text-[13px] text-red-400 bg-red-500/10 px-3 py-1.5 rounded-md font-medium ring-1 ring-red-500/20">
            Offline
          </span>
        ) : sseError ? (
          <span className="flex items-center gap-1.5 text-[13px] text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-md font-medium ring-1 ring-amber-500/20">
            Connecting...
          </span>
        ) : (
          <button className="flex items-center gap-1.5 text-[13px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-md font-medium transition-colors ring-1 ring-emerald-500/20">
            Analyzing
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <svg className="w-4.5 h-4.5 text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <svg className="w-4.5 h-4.5 text-zinc-500 cursor-pointer hover:text-zinc-400 transition-colors" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2"/>
          <circle cx="8" cy="8" r="1.2"/>
          <circle cx="8" cy="13" r="1.2"/>
        </svg>
      </div>

      {/* Quick Stats - Inline OEE gauges (visible on md screens) */}
      {selectedEquipment && !showWidgets && (
        <div className="px-4 lg:px-6 py-4 border-b border-white/10 bg-zinc-950/50">
          <div className="grid grid-cols-4 gap-3">
            {/* OEE Overall */}
            <div className="text-center">
              <div className="text-xs text-zinc-500 mb-1">OEE</div>
              <div className="text-xl font-semibold text-white">
                {selectedEquipment.oee.overall.toFixed(1)}%
              </div>
            </div>
            {/* Availability */}
            <div className="text-center">
              <div className="text-xs text-zinc-500 mb-1">Availability</div>
              <div className="text-xl font-semibold text-emerald-400">
                {selectedEquipment.oee.availability.toFixed(1)}%
              </div>
            </div>
            {/* Performance */}
            <div className="text-center">
              <div className="text-xs text-zinc-500 mb-1">Performance</div>
              <div className="text-xl font-semibold text-blue-400">
                {selectedEquipment.oee.performance.toFixed(1)}%
              </div>
            </div>
            {/* Quality */}
            <div className="text-center">
              <div className="text-xs text-zinc-500 mb-1">Quality</div>
              <div className="text-xl font-semibold text-zinc-300">
                {selectedEquipment.oee.quality.toFixed(1)}%
              </div>
            </div>
          </div>
          {/* Sensor Status */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-zinc-400">
                {selectedEquipment.sensors.filter(s => s.status === 'normal').length} Normal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-xs text-zinc-400">
                {selectedEquipment.sensors.filter(s => s.status === 'warning').length} Warning
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-zinc-400">
                {selectedEquipment.sensors.filter(s => s.status === 'critical').length} Critical
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Thread */}
      <div className="flex-1 overflow-auto px-4 lg:px-6 py-5">
        {/* Alert Event */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-4">
            {/* Photo Avatar with subtle ring */}
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10">
              <Image
                src="/img/avatars/10-size-160.webp"
                alt="Sludge Pump"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-white text-[14px] block">Sludge Pump #1</span>
              <span className="text-[13px] text-zinc-400">From pump-1@qetta.monitor</span>
            </div>
            <span className="text-[13px] text-zinc-500 hidden sm:block">Today, 8:03 AM</span>
          </div>
          <div className="text-[14px] text-zinc-300 leading-relaxed ml-0 sm:ml-12 space-y-4">
            <p>Hello Qetta Administrator,</p>
            <p>Vibration sensor threshold exceeded on Sludge Pump #1. Current reading: 12.5 mm/s (Threshold: 10.0 mm/s)</p>
            <p>Possible bearing wear or shaft misalignment. Please inspect and take action.</p>
            <div>
              <p>Thank you,</p>
              <p>Sludge Pump #1</p>
              <p>Water Treatment Equipment, CMT Partner Integration</p>
            </div>
          </div>
        </div>

        {/* Layer 1 Reply */}
        <div>
          <div className="flex items-start gap-3 mb-4">
            {/* Photo Avatar with subtle ring */}
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10">
              <Image
                src="/img/avatars/13-size-160.webp"
                alt="Layer 1 Agent"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-white text-[14px] block">Layer 1 Agent</span>
              <span className="text-[13px] text-zinc-400">From layer1@qetta.ai</span>
            </div>
            <span className="text-[13px] text-zinc-500 hidden sm:block">Today, 8:03 AM</span>
          </div>
          <div className="text-[14px] text-zinc-300 leading-relaxed ml-0 sm:ml-12 space-y-4">
            <p>Hello,</p>
            <p>Here are the analysis results — vibration readings have exceeded the configured threshold. The following actions are recommended:</p>
            <p>1. Visual inspection of bearing condition and replace if necessary</p>
            {/* Typewriter animation - Agent actively analyzing */}
            <div className="pt-2">
              {/* Currently typing message */}
              <p className="inline">
                {displayText}
                {/* Blinking cursor */}
                {isTyping && (
                  <span className="inline-block w-0.5 h-4 bg-white ml-0.5 animate-blink align-middle"></span>
                )}
              </p>
              {/* Typing indicator dots when between messages */}
              {!isTyping && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="text-[11px] text-zinc-500 ml-1">Analyzing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Composer */}
      <div className="px-4 lg:px-5 pb-4 pt-2 border-t border-white/10">
        <div className="ring-2 ring-white/30 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-800 border-b border-white/10">
            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <polyline points="9,14 4,9 9,4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
            </svg>
            <span className="text-[13px] text-zinc-400">pump-1@qetta.monitor</span>
            <span className="ml-auto text-[13px] text-zinc-500 cursor-pointer hover:text-zinc-400">Cc</span>
          </div>
          <div className="px-3 py-3 min-h-[50px] lg:min-h-[70px] bg-zinc-800/50">
            <span className="text-[14px] text-zinc-500">Write maintenance request...</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/30 border-t border-white/10">
            <button className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-400 hover:bg-white/10 rounded transition-colors">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-[13px] text-zinc-400 hover:text-white px-2 py-1 transition-colors">
                Done
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {/* Send button */}
              <button className="text-[13px] bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-md font-medium transition-colors ring-1 ring-white/20">
                Send
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2.5 px-1">
          <span className="text-[12px] text-zinc-500 hidden sm:block">Use <code className="bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono">/</code> for shortcuts</span>
          <div className="flex items-center gap-2">
            {/* Responding avatar with green ring */}
            <div className="relative w-5 h-5">
              <Image
                src="/img/avatars/13-size-160.webp"
                alt="Layer 1 AI Analysis Agent - Analysis in progress"
                width={20}
                height={20}
                className="rounded-full object-cover ring-2 ring-emerald-500"
              />
            </div>
            <span className="text-[12px] text-zinc-400">Layer 1 Analyzing...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
