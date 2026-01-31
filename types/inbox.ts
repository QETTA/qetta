/**
 * QETTA Inbox Item Types
 * DOCS-VERIFY-APPLY Triangle Structure
 *
 * @see generators/gov-support/data/qetta-super-model.json (Single Source of Truth)
 */

import type { EnginePresetType, IndustryBlockType } from '@/lib/super-model'

// ============================================
// Common Types
// ============================================

export type ProductTab = 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR'
// DOCS-VERIFY-APPLY Triangle (Major Features)
// MONITOR (Minor Feature - Infrastructure)

export type Priority = 'critical' | 'high' | 'medium' | 'low'

// Re-export from super-model loader
export type { EnginePresetType, IndustryBlockType }

// ============================================
// Engine Presets & Metrics
// @see lib/super-model/loader.ts
// Import ENGINE_PRESETS and QETTA_METRICS from super-model loader
// ============================================

export type AGILayer = 1 | 2 | 3

export interface AGILayerBadge {
  layer: AGILayer
  name: string
  cost: string
  latency: string
  bgColor: string
  textColor: string
}

export const AGI_LAYER_BADGES: AGILayerBadge[] = [
  {
    layer: 1,
    name: 'Rule Engine',
    cost: '무료',
    latency: '<10ms',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  {
    layer: 2,
    name: 'StoFo Engine',
    cost: '₩60만/년',
    latency: '<1초',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  {
    layer: 3,
    name: 'Claude API',
    cost: '₩600만/년',
    latency: '<5초',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-700',
  },
]

// ============================================
// DOCS Inbox Item
// ============================================

export type DocsStatus =
  | 'draft'
  | 'generating'
  | 'review'
  | 'submitted'
  | 'archived'

export interface DocsInboxItem {
  id: string
  type: 'DOCS'
  title: string
  status: DocsStatus
  deadline?: Date
  regulatory: boolean
  formats: ('DOCX' | 'PDF' | 'XLSX')[]
  languages: ('ko' | 'en' | 'ru' | 'kk' | 'zh' | 'ar')[]
  hashVerified: boolean
  assignee?: string
  createdAt: Date
  updatedAt?: Date
  sourceApplyId?: string
  linkedVerifyIds?: string[]
}

// ============================================
// VERIFY Inbox Item
// ============================================

export type VerifyStatus =
  | 'requested'
  | 'verifying'
  | 'verified'
  | 'failed'
  | 'certified'

export interface HashChain {
  algorithm: 'SHA-256'
  hash: string
  prevHash: string
  verified: boolean
}

export interface VerifyInboxItem {
  id: string
  type: 'VERIFY'
  title: string
  status: VerifyStatus
  documentRef: string
  hashChain: HashChain
  issuer: string
  requestedAt: Date
  verifiedAt?: Date
  sourceDocsId?: string
}

// ============================================
// APPLY Inbox Item
// ============================================

export type ApplyPlatform = 'G2B' | 'UNGM' | 'goszakup' | 'SAM' | 'TED' | 'ADB'

export type ApplyStatus =
  | 'discovered'
  | 'analyzing'
  | 'qualified'
  | 'not_qualified'
  | 'applied'
  | 'awarded'

export interface ApplyInboxItem {
  id: string
  type: 'APPLY'
  title: string
  platform: ApplyPlatform
  country: string
  status: ApplyStatus
  matchScore: number
  budget: string
  budgetAmount?: number
  deadline: Date
  dDay: string
  createdAt: Date
  generatedDocsIds?: string[]
}

// ============================================
// MONITOR Inbox Item
// ============================================

export type MonitorSeverity = 'normal' | 'warning' | 'critical'

export interface MonitorInboxItem {
  id: string
  type: 'MONITOR'
  title: string
  severity: MonitorSeverity
  equipment: {
    id: string
    name: string
    location: string
  }
  sensor: {
    metric: string
    value: number
    threshold: number
    unit: string
  }
  aiAnalysis: {
    layer: AGILayer
    suggestion: string
    confidence: number
  }
  detectedAt: Date
  resolvedAt?: Date
}

// ============================================
// Union Type
// ============================================

export type QettaInboxItem =
  | DocsInboxItem
  | VerifyInboxItem
  | ApplyInboxItem
  | MonitorInboxItem

// ============================================
// AI Agent Context
// ============================================

export interface EntityInfo {
  name: string
  badge: string
  badgeColor: string
  role: string
  organization: string
}

export interface AIAnalysisContext {
  summary: string
  layer: AGILayer
  confidence: number
}

export interface SuggestedAction {
  label: string
  action: () => void
}

export interface RelatedItem {
  title: string
  time: string
  preview: string
}

export interface AIAgentContext {
  entityInfo: EntityInfo
  analysis: AIAnalysisContext
  suggestedActions: {
    primary: SuggestedAction
    secondary?: SuggestedAction
  }
  relatedItems: RelatedItem[]
}

// ============================================
// Document Item (Center Panel)
// ============================================

export interface DocumentItem {
  id: string
  title: string
  preview: string
  time: string
  status: 'active' | 'pending' | 'completed' | 'warning'
  unread?: boolean
  assignee?: string
  isResponding?: boolean
  count?: number
  priority?: Priority
}

export interface DocumentDetail {
  id: string
  title: string
  from: string
  email: string
  date: string
  content: string
  replies?: {
    from: string
    email: string
    date: string
    content: string
  }[]
}
