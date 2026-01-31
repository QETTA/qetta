/**
 * Common Type Definitions
 *
 * Shared types used across the application.
 *
 * @example
 * import type { Status, ApiResponse, PaginatedResponse } from '@/types/common'
 */

// ============================================================================
// Status Types
// ============================================================================

/** Common status for items (documents, tasks, etc.) */
export type Status = 'pending' | 'active' | 'completed' | 'failed' | 'warning'

/** Priority levels */
export type Priority = 'critical' | 'high' | 'medium' | 'low'

/** QETTA Product Tabs */
export type ProductTab = 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR'

// ============================================================================
// API Response Types
// ============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

/** Paginated API response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/** API error response */
export interface ApiError {
  success: false
  error: string
  code?: string
  details?: Record<string, unknown>
}

// ============================================================================
// Entity Types
// ============================================================================

/** Base entity with common fields */
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

/** Entity with soft delete */
export interface SoftDeletable {
  deletedAt?: string | null
}

/** Entity with audit fields */
export interface Auditable {
  createdBy?: string
  updatedBy?: string
}

// ============================================================================
// Domain Engine Types
// ============================================================================

/** 6 Engine Presets */
export type EnginePresetType =
  | 'MANUFACTURING'
  | 'ENVIRONMENT'
  | 'DIGITAL'
  | 'FINANCE'
  | 'STARTUP'
  | 'EXPORT'

/**
 * 10 Industry BLOCKs (v2.1 KSIC 기반)
 *
 * v2.1 변경사항:
 * - 신규: FOOD, TEXTILE, METAL, GENERAL
 * - 흡수: SEMICONDUCTOR→ELECTRONICS, ENERGY→ENVIRONMENT, HEALTHCARE→BIO_PHARMA
 * - 삭제: AUTONOMOUS, LOGISTICS, CONSTRUCTION
 */
export type IndustryBlockType =
  | 'FOOD'        // 식품/음료 (KSIC 10, 11)
  | 'TEXTILE'     // 섬유/의류 (KSIC 13, 14)
  | 'METAL'       // 금속/철강 (KSIC 24, 25)
  | 'CHEMICAL'    // 화학/소재 (KSIC 20, 22)
  | 'ELECTRONICS' // 전자/반도체 (KSIC 26, 27) - SEMICONDUCTOR 흡수
  | 'MACHINERY'   // 기계/장비 (KSIC 28, 29)
  | 'AUTOMOTIVE'  // 자동차/부품 (KSIC 30)
  | 'BIO_PHARMA'  // 바이오/제약 (KSIC 21) - HEALTHCARE 흡수
  | 'ENVIRONMENT' // 환경/에너지 (KSIC 35, 38) - ENERGY 흡수
  | 'GENERAL'     // 일반제조 (기타)

// ============================================================================
// UI Component Types
// ============================================================================

/** Color variants for badges and buttons */
export type ColorVariant =
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'red'
  | 'blue'
  | 'indigo'
  | 'fuchsia'
  | 'zinc'

/** Size variants for components */
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// ============================================================================
// Utility Types
// ============================================================================

/** Make all properties optional recursively */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Make specific properties required */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/** Make specific properties optional */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Extract the resolved type of a Promise */
export type Awaited<T> = T extends Promise<infer U> ? U : T
