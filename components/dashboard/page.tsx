'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { QettaLeftSidebar } from './layout/sidebar'
import { QettaCenterPanel } from './layout/center-panel'
import { QettaRightPanel } from './layout/right-panel'
import { QettaAiPanel, MobileBottomSheet, MobileFAB } from './ai/panel'
import { PhoneSupportFAB } from './phone-support-fab'
import { AccessibilityProvider } from './accessibility-toggle'
import { QettaMonitorPreview } from './monitor/preview'
import type { ProductTab, AIAgentContext, AGILayer } from '@/types/inbox'
import type { ApplyInboxItem } from '@/types/inbox'

// ============================================
// Route Config - URL ↔ Tab mapping
// ============================================

const TAB_ROUTES: Record<ProductTab, string> = {
  DOCS: '/docs',
  VERIFY: '/verify',
  APPLY: '/apply',
  MONITOR: '/monitor',
}

const ROUTE_TABS: Record<string, ProductTab> = {
  '/docs': 'DOCS',
  '/verify': 'VERIFY',
  '/apply': 'APPLY',
  '/monitor': 'MONITOR',
}

// ============================================
// Toast Component
// ============================================

interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const bgColors = {
    success: 'bg-emerald-500/90',
    info: 'bg-zinc-500/90',
    warning: 'bg-amber-500/90',
    error: 'bg-red-500/90',
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-lg ring-1 ring-white/10 flex items-center gap-3 animate-slide-in backdrop-blur-sm`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================
// Cross-functional Context (Single Source of Truth)
// ============================================

import { useCallback, useMemo } from 'react'
import { CrossFunctionalContext, type CrossFunctionalContextType } from './context'
export { useCrossFunctional } from './context'

// ============================================
// Main Dashboard Page Component
// ============================================

interface QettaDashboardPageProps {
  initialTab: ProductTab
}

export function QettaDashboardPage({ initialTab }: QettaDashboardPageProps) {
  const router = useRouter()
  const pathname = usePathname()

  // State
  const [activeTab, setActiveTabState] = useState<ProductTab>(initialTab)
  const [selectedDocument, setSelectedDocument] = useState<string | null>('doc-1')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [agentContext, setAgentContext] = useState<AIAgentContext | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Sync URL → State on initial load and browser navigation
  useEffect(() => {
    const tabFromUrl = ROUTE_TABS[pathname]
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl)
    }
  }, [pathname, activeTab])

  // Tab change handler - updates both state and URL
  const setActiveTab = useCallback(
    (tab: ProductTab) => {
      setActiveTabState(tab)
      const route = TAB_ROUTES[tab]
      if (pathname !== route) {
        router.push(route)
      }
      // Close mobile menu when tab changes
      setMobileMenuOpen(false)
    },
    [pathname, router]
  )

  // Toast management
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, type }])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      toastTimersRef.current.delete(id)
    }, 4000)
    toastTimersRef.current.set(id, timer)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => clearTimeout(timer))
      toastTimersRef.current.clear()
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Cross-functional Action: APPLY → DOCS
  const createDocsFromApply = useCallback(
    (applyItem: ApplyInboxItem) => {
      const newDocsId = `docs-${applyItem.id}-${Date.now()}`
      const languages = applyItem.platform === 'goszakup' ? (['ru', 'kk'] as const) : (['ko', 'en'] as const)

      setAgentContext({
        entityInfo: {
          name: applyItem.platform,
          badge: '입찰 연계',
          badgeColor: 'blue',
          role: '자동 생성',
          organization: applyItem.country,
        },
        analysis: {
          summary: `${applyItem.title} 입찰을 위한 제안서가 자동 생성 중입니다. 예상 언어: ${languages.join(', ')}`,
          layer: 3 as AGILayer,
          confidence: 0.85,
        },
        suggestedActions: {
          primary: {
            label: '생성 진행 확인',
            action: () => {
              setActiveTab('DOCS')
              setSelectedDocument(newDocsId)
            },
          },
          secondary: {
            label: '원본 입찰 보기',
            action: () => {
              setActiveTab('APPLY')
              setSelectedDocument(applyItem.id)
            },
          },
        },
        relatedItems: [
          {
            title: applyItem.title,
            time: 'now',
            preview: `원본 입찰 공고 (${applyItem.platform})`,
          },
        ],
      })

      setActiveTab('DOCS')
      setSelectedDocument(newDocsId)
      showToast(`"${applyItem.title}" 입찰 제안서 생성 시작`, 'info')
    },
    [setActiveTab, showToast]
  )

  // Cross-functional Action: DOCS → VERIFY
  const requestVerifyFromDocs = useCallback(
    (docsId: string) => {
      const newVerifyId = `verify-${docsId}-${Date.now()}`

      setAgentContext({
        entityInfo: {
          name: 'QETTA Cert Authority',
          badge: '검증 요청',
          badgeColor: 'emerald',
          role: '해시 검증',
          organization: 'Internal',
        },
        analysis: {
          summary: '문서의 해시체인 무결성 검증을 시작합니다. SHA-256 알고리즘으로 모든 센서 데이터 원본을 역추적합니다.',
          layer: 1 as AGILayer,
          confidence: 0.99,
        },
        suggestedActions: {
          primary: {
            label: '검증 결과 확인',
            action: () => {
              setActiveTab('VERIFY')
              setSelectedDocument(newVerifyId)
            },
          },
        },
        relatedItems: [
          {
            title: `문서 ID: ${docsId}`,
            time: 'now',
            preview: '검증 대상 문서',
          },
        ],
      })

      setActiveTab('VERIFY')
      setSelectedDocument(newVerifyId)
      showToast('검증 요청이 접수되었습니다', 'success')
    },
    [setActiveTab, showToast]
  )

  // Cross-functional Action: MONITOR → DOCS
  const createEmergencyReport = useCallback(
    (monitorId: string) => {
      const newDocsId = `docs-emergency-${monitorId}-${Date.now()}`

      setAgentContext({
        entityInfo: {
          name: '긴급 보고서',
          badge: '자동 생성',
          badgeColor: 'red',
          role: '이상 알림',
          organization: 'QETTA MONITOR',
        },
        analysis: {
          summary: '설비 이상 감지 긴급 보고서를 자동 생성합니다. TMS 제출용 양식이 적용됩니다.',
          layer: 2 as AGILayer,
          confidence: 0.92,
        },
        suggestedActions: {
          primary: {
            label: '보고서 확인',
            action: () => {
              setActiveTab('DOCS')
              setSelectedDocument(newDocsId)
            },
          },
        },
        relatedItems: [
          {
            title: `알림 ID: ${monitorId}`,
            time: 'now',
            preview: '원인 알림',
          },
        ],
      })

      setActiveTab('DOCS')
      setSelectedDocument(newDocsId)
      showToast('긴급 보고서 생성 시작', 'warning')
    },
    [setActiveTab, showToast]
  )

  // Cross-functional Action: MONITOR → VERIFY
  const submitSensorDataForVerify = useCallback(
    (monitorId: string) => {
      const newVerifyId = `verify-sensor-${monitorId}-${Date.now()}`

      setAgentContext({
        entityInfo: {
          name: '환경부 TMS',
          badge: '데이터 제출',
          badgeColor: 'emerald',
          role: '센서 검증',
          organization: 'Government',
        },
        analysis: {
          summary: 'OTT 센서 데이터를 TMS 검증용으로 제출합니다. 해시체인으로 무결성이 보장됩니다.',
          layer: 1 as AGILayer,
          confidence: 0.99,
        },
        suggestedActions: {
          primary: {
            label: '검증 상태 확인',
            action: () => {
              setActiveTab('VERIFY')
              setSelectedDocument(newVerifyId)
            },
          },
        },
        relatedItems: [
          {
            title: `센서 데이터: ${monitorId}`,
            time: 'now',
            preview: '제출 대상',
          },
        ],
      })

      setActiveTab('VERIFY')
      setSelectedDocument(newVerifyId)
      showToast('센서 데이터 검증 요청 완료', 'success')
    },
    [setActiveTab, showToast]
  )

  // Context value - memoized
  const contextValue = useMemo<CrossFunctionalContextType>(
    () => ({
      activeTab,
      setActiveTab,
      selectedDocument,
      setSelectedDocument,
      createDocsFromApply,
      requestVerifyFromDocs,
      createEmergencyReport,
      submitSensorDataForVerify,
      agentContext,
      setAgentContext,
      showToast,
    }),
    [
      activeTab,
      setActiveTab,
      selectedDocument,
      agentContext,
      createDocsFromApply,
      requestVerifyFromDocs,
      createEmergencyReport,
      submitSensorDataForVerify,
      showToast,
    ]
  )

  return (
    <AccessibilityProvider>
      <CrossFunctionalContext.Provider value={contextValue}>
        <div className="flex h-screen bg-zinc-950 overflow-hidden">
          {/* Mobile Menu Button - visible only on mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-900 ring-1 ring-white/10 text-white hover:bg-zinc-800 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>

          {/* Mobile Overlay - backdrop when menu is open */}
          {mobileMenuOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Left Sidebar - Desktop: always visible, Mobile: overlay drawer */}
          <div
            className={`
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
              md:translate-x-0
              fixed md:static
              inset-y-0 left-0
              z-40 md:z-auto
              transition-transform duration-300
            `}
          >
            <QettaLeftSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          {/* Conditional Rendering: MONITOR Tab (3-column Widget System) vs Other Tabs (2-column) */}
          {activeTab === 'MONITOR' && process.env.NEXT_PUBLIC_ENABLE_MONITOR_WIDGETS === 'true' ? (
            // MONITOR Tab: 3-column layout (Equipment List + Widget Dashboard + Detail Panel)
            <QettaMonitorPreview />
          ) : (
            <>
              {/* Center Panel - 380px, document list */}
              <QettaCenterPanel activeTab={activeTab} selectedDocument={selectedDocument} onSelectDocument={setSelectedDocument} />

              {/* Right Panel - flex-1, document detail */}
              <QettaRightPanel selectedDocument={selectedDocument} activeTab={activeTab} />
            </>
          )}

          {/* AI Panel - Desktop only */}
          <div className="hidden md:flex">
            <QettaAiPanel activeTab={activeTab} selectedDocument={selectedDocument} externalContext={agentContext} />
          </div>

          {/* Mobile AI Panel */}
          <MobileBottomSheet activeTab={activeTab} selectedDocument={selectedDocument} externalContext={agentContext} />
          <MobileFAB />

          {/* Phone Support FAB - 중장년 UX */}
          <PhoneSupportFAB phoneNumber="1588-0000" label="전화 상담" bottomOffset={100} />

          {/* Toast Notifications */}
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </div>
      </CrossFunctionalContext.Provider>
    </AccessibilityProvider>
  )
}
