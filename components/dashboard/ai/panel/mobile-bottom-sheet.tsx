'use client'

/**
 * MobileBottomSheet - Mobile-optimized AI Panel
 *
 * CSS 기반 애니메이션 (framer-motion 대체)
 * 터치 이벤트로 드래그 제스처 구현
 *
 * @module dashboard/ai/panel/mobile-bottom-sheet
 */

import { Fragment, useCallback, useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useAIPanelStore } from '@/stores/ai-panel-store'
import { DomainSelector } from './domain-selector'
import { ChatThread } from './chat-thread'
import { LayerVisualization } from './layer-visualization'
import { DOMAIN_ENGINE_CONFIGS } from '@/lib/domain-engines/constants'
import type { ProductTab, AIAgentContext, AGILayer } from '@/types/inbox'
import { AGI_LAYER_BADGES } from '@/types/inbox'
import { cn } from '@/lib/utils'

export interface MobileBottomSheetProps {
  activeTab: ProductTab
  selectedDocument: string | null
  externalContext?: AIAgentContext | null
}

/**
 * MobileBottomSheet - Mobile-optimized AI Panel
 *
 * Features:
 * - Slides up from bottom of screen
 * - Drag-to-close gesture (swipe down)
 * - Full-height with snap points
 * - Same functionality as desktop AI Panel
 *
 * Usage:
 * - Triggered by floating action button on mobile (<md breakpoint)
 * - Replaces sidebar AI panel on small screens
 *
 * Important:
 * - Uses JS media query instead of CSS md:hidden to avoid HeadlessUI FocusTrap errors
 * - FocusTrap cannot find focusable elements in CSS-hidden containers
 */
export function MobileBottomSheet({
  activeTab,
  selectedDocument,
  externalContext,
}: MobileBottomSheetProps) {
  const { isOpen, setOpen, selectedPreset } = useAIPanelStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Drag gesture state
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  // Check if mobile viewport (< md breakpoint = 768px)
  // Using JS instead of CSS md:hidden to prevent HeadlessUI FocusTrap errors
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Reset drag state when opening
  useEffect(() => {
    if (isOpen) {
      setDragY(0)
    }
  }, [isOpen])

  // Get current domain config
  const domainConfig = DOMAIN_ENGINE_CONFIGS[selectedPreset]

  // Determine layer based on external context or default
  const currentLayer: AGILayer = externalContext?.analysis.layer || 1
  const currentConfidence = externalContext?.analysis.confidence || 0.98

  // Touch handlers for drag gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - dragStartY.current
    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      setDragY(deltaY)
    }
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    // Close if dragged down more than 150px
    if (dragY > 150) {
      setOpen(false)
    }
    setDragY(0)
  }, [dragY, setOpen])

  // Toggle expanded state (full screen vs partial)
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // Don't render on desktop - prevents HeadlessUI FocusTrap errors
  // FocusTrap fails when Dialog is CSS-hidden but still in DOM
  if (!isMobile) return null

  // Calculate opacity and scale based on drag
  const opacity = Math.max(0.3, 1 - dragY / 300)
  const scale = Math.max(0.95, 1 - dragY / 3000)

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => setOpen(false)}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
        </Transition.Child>

        {/* Bottom Sheet Container */}
        <div className="fixed inset-0 flex items-end justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <Dialog.Panel
              ref={panelRef}
              className={cn(
                'w-full bg-zinc-900 rounded-t-2xl shadow-2xl ring-1 ring-white/10 flex flex-col',
                'transition-all',
                isDragging ? 'duration-0' : 'duration-300',
                isExpanded ? 'h-[95vh]' : 'h-[70vh]'
              )}
              style={{
                transform: `translateY(${dragY}px) scale(${scale})`,
                opacity,
              }}
            >
              {/* Drag Handle */}
              <div
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                onClick={toggleExpanded}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-10 h-1 rounded-full bg-zinc-600" />
              </div>

              {/* Header */}
              <div className="px-4 pb-3 flex items-center gap-2 border-b border-white/5">
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                  />
                </svg>
                <Dialog.Title className="text-sm font-semibold text-white flex-1">
                  QETTA Assistant
                </Dialog.Title>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-500/10 text-zinc-400 rounded">
                  3-Tier AGI
                </span>
                <span className={`text-lg ${domainConfig.styles.accent}`}>
                  {domainConfig.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto flex flex-col">
                {/* 3-Tier AGI Visualization - Compact on mobile */}
                <div className="p-3 border-b border-white/5">
                  <LayerVisualization
                    layer={currentLayer}
                    confidence={currentConfidence}
                  />
                </div>

                {/* Domain Engine Selector - Horizontal scroll on mobile */}
                <div className="px-3 py-2 border-b border-white/5 overflow-x-auto">
                  <DomainSelector compact />
                </div>

                {/* Chat Thread */}
                <div className="flex-1 overflow-hidden">
                  <ChatThread
                    activeTab={activeTab}
                    selectedDocument={selectedDocument}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-white/5 safe-area-inset-bottom">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Analysis Engine: L{currentLayer}</span>
                  <span>{AGI_LAYER_BADGES[currentLayer - 1].cost}</span>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

/**
 * MobileFAB - Floating Action Button to open AI Panel on mobile
 *
 * Shows only on mobile (<md breakpoint)
 * Positioned at bottom-right with safe area padding
 */
export function MobileFAB() {
  const { isOpen, toggleOpen, selectedPreset } = useAIPanelStore()
  const domainConfig = DOMAIN_ENGINE_CONFIGS[selectedPreset]

  // Hide FAB when bottom sheet is open
  if (isOpen) return null

  return (
    <button
      onClick={toggleOpen}
      className="md:hidden fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-zinc-600 hover:bg-zinc-700 text-white shadow-lg shadow-zinc-500/30 flex items-center justify-center transition-all active:scale-95 safe-area-inset-bottom"
      aria-label="Open AI Assistant"
    >
      <div className="relative">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
        {/* Domain indicator dot */}
        <span
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-zinc-600 ${domainConfig.styles.iconBg}`}
        />
      </div>
    </button>
  )
}
