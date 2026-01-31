'use client'

import { createContext, useContext } from 'react'
import type { ProductTab, ApplyInboxItem, AIAgentContext } from '@/types/inbox'

export interface CrossFunctionalContextType {
  activeTab: ProductTab
  setActiveTab: (tab: ProductTab) => void
  selectedDocument: string | null
  setSelectedDocument: (id: string | null) => void
  createDocsFromApply: (applyItem: ApplyInboxItem) => void
  requestVerifyFromDocs: (docsId: string) => void
  createEmergencyReport: (monitorId: string) => void
  submitSensorDataForVerify: (monitorId: string) => void
  agentContext: AIAgentContext | null
  setAgentContext: (context: AIAgentContext | null) => void
  showToast: (message: string, type: 'success' | 'info' | 'warning' | 'error') => void
}

export const CrossFunctionalContext = createContext<CrossFunctionalContextType | null>(null)

export function useCrossFunctional() {
  const context = useContext(CrossFunctionalContext)
  if (!context) {
    throw new Error('useCrossFunctional must be used within a CrossFunctionalContext.Provider')
  }
  return context
}
