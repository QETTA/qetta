/**
 * Center Panel Constants
 *
 * Mock data and constants for the center panel document list.
 *
 * @module components/dashboard/layout/center-panel-constants
 */

import type { ProductTab, DocumentItem, IndustryBlockType } from '@/types/inbox'
import { QETTA_METRICS, INDUSTRY_BLOCK_COLORS } from '@/lib/super-model'

// =============================================================================
// Types
// =============================================================================

export type DomainTag =
  | 'MANUFACTURING'
  | 'ENVIRONMENT'
  | 'DIGITAL'
  | 'FINANCE'
  | 'STARTUP'
  | 'EXPORT'

export interface DocumentWithTags extends DocumentItem {
  domainTag?: DomainTag
  industryBlock?: IndustryBlockType
}

// =============================================================================
// Priority Sort
// =============================================================================

export const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function sortByPriority<T extends DocumentItem>(docs: T[]): T[] {
  return [...docs].sort((a, b) => {
    // 1. Priority (critical > high > medium > low)
    const priorityA = PRIORITY_ORDER[a.priority || 'medium']
    const priorityB = PRIORITY_ORDER[b.priority || 'medium']
    if (priorityA !== priorityB) return priorityA - priorityB

    // 2. Unread first
    if (a.unread && !b.unread) return -1
    if (!a.unread && b.unread) return 1

    // 3. Active/responding items first
    if (a.isResponding && !b.isResponding) return -1
    if (!a.isResponding && b.isResponding) return 1

    return 0
  })
}

// =============================================================================
// Domain Tag Styles
// =============================================================================

export const DOMAIN_TAG_STYLES: Record<DomainTag, string> = {
  MANUFACTURING: 'bg-blue-500/10 text-blue-400',
  ENVIRONMENT: 'bg-emerald-500/10 text-emerald-400',
  DIGITAL: 'bg-zinc-500/10 text-zinc-300',
  FINANCE: 'bg-indigo-500/10 text-indigo-400',
  STARTUP: 'bg-fuchsia-500/10 text-fuchsia-400',
  EXPORT: 'bg-amber-400/10 text-amber-400',
}

export const DOMAIN_TAG_LABELS: Record<DomainTag, string> = {
  MANUFACTURING: 'Factory',
  ENVIRONMENT: 'ENVIRONMENT',
  DIGITAL: 'Voucher',
  FINANCE: 'FINANCE',
  STARTUP: 'STARTUP',
  EXPORT: 'Global',
}

export { INDUSTRY_BLOCK_COLORS }

// =============================================================================
// Tab Titles
// =============================================================================

export const TAB_TITLES: Record<ProductTab, string> = {
  DOCS: 'Documents',
  VERIFY: 'Verification',
  APPLY: 'Global Tenders',
  MONITOR: 'Monitoring',
}

// =============================================================================
// Priority Badge Styles
// =============================================================================

export const PRIORITY_BADGE_STYLES: Record<
  string,
  { className: string; label: string }
> = {
  critical: { className: 'bg-red-500/10 text-red-400', label: 'Critical' },
  high: { className: 'bg-amber-500/10 text-amber-400', label: 'High' },
  medium: { className: 'bg-zinc-500/10 text-zinc-400', label: 'Medium' },
  low: { className: 'bg-zinc-500/5 text-zinc-500', label: 'Low' },
}

// =============================================================================
// Mock Documents Data
// =============================================================================

export const DOCUMENTS_BY_TAB: Record<ProductTab, DocumentWithTags[]> = {
  DOCS: [
    {
      id: 'doc-1',
      title: 'TMS Daily Report Generation Request',
      preview: `Generating TMS daily report for Ministry of Environment submission based on 2026-01-22 measurement data. Includes NOx, SOx, PM concentration values. Estimated generation time: ${QETTA_METRICS.GENERATION_SPEED}s`,
      time: '6h ago',
      status: 'active',
      unread: true,
      assignee: 'AI processing...',
      isResponding: true,
      priority: 'high',
      domainTag: 'ENVIRONMENT',
      industryBlock: 'CHEMICAL',
    },
    {
      id: 'doc-2',
      title: 'Smart Factory Settlement Report Request',
      preview:
        'MES-based settlement report for SME Ministry submission. Includes OEE analysis and 4M1E data. Checking PLC integration data...',
      time: '6h ago',
      status: 'pending',
      unread: true,
      priority: 'medium',
      domainTag: 'MANUFACTURING',
      industryBlock: 'ELECTRONICS',
    },
    {
      id: 'doc-3',
      title: 'AI Voucher Performance Report',
      preview:
        'Supplier performance report for NIPA submission. Includes voucher settlement details for 3 demand companies...',
      time: '8h ago',
      status: 'pending',
      priority: 'medium',
      domainTag: 'DIGITAL',
      industryBlock: 'BIO_PHARMA',
    },
    {
      id: 'doc-4',
      title: 'Monthly Ministry of Environment Report Complete',
      preview:
        'CleanSYS integration complete. Hashchain verification passed. SHA-256 integrity confirmed.',
      time: '12h ago',
      status: 'completed',
      priority: 'low',
      domainTag: 'ENVIRONMENT',
    },
    {
      id: 'doc-5',
      title: 'Global Tender Proposal Draft',
      preview:
        'SAM.gov environmental monitoring equipment procurement proposal. Auto-translating to 6 languages...',
      time: '1d ago',
      status: 'warning',
      priority: 'medium',
      domainTag: 'EXPORT',
    },
    {
      id: 'doc-6',
      title: 'OEE Analysis Report',
      preview:
        'Monthly overall equipment effectiveness analysis. Availability: 98.2%, Performance: 95.1%, Quality: 99.8%...',
      time: '2w ago',
      status: 'pending',
      priority: 'low',
      domainTag: 'MANUFACTURING',
    },
  ],
  VERIFY: [
    {
      id: 'verify-1',
      title: 'QR Verification Request #VRF-2026-001',
      preview:
        'SHA-256 hashchain verification. Original document: TMS_20260122.pdf. Verifier: Metropolitan Air Quality Control Office',
      time: '2h ago',
      status: 'active',
      unread: true,
      assignee: 'Auto-verifying...',
      isResponding: true,
      priority: 'high',
      domainTag: 'ENVIRONMENT',
    },
    {
      id: 'verify-2',
      title: 'Enterprise QC Document Verification',
      preview:
        'Samsung SDI delivery quality document integrity verification. Tracing source data via hashchain. Total: 23 items',
      time: '5h ago',
      status: 'pending',
      unread: true,
      count: 23,
      priority: 'high',
      domainTag: 'MANUFACTURING',
    },
    {
      id: 'verify-3',
      title: 'Sensor Data Traceback Complete',
      preview:
        '2026-01-15 ~ 2026-01-22 NOx/SOx measurement source data traceback. Integrity verification complete.',
      time: '1d ago',
      status: 'completed',
      priority: 'medium',
      domainTag: 'ENVIRONMENT',
    },
  ],
  APPLY: [
    {
      id: 'apply-1',
      title: '🇰🇿 Kazakhstan Water Treatment Tender',
      preview: `goszakup.gov.kz #KZ-2026-4521. Budget: $2.5M. D-26. AI match score: 94%. Global DB ${QETTA_METRICS.GLOBAL_TENDER_DB} analysis`,
      time: '3h ago',
      status: 'active',
      unread: true,
      assignee: 'AI analyzing...',
      isResponding: true,
      priority: 'high',
      domainTag: 'EXPORT',
    },
    {
      id: 'apply-2',
      title: '🇺🇳 UNGM Environmental Equipment Tender',
      preview:
        'UN Global Marketplace. Africa water treatment facility. Budget: $8.2M. AIFC LAB proof-of-concept match.',
      time: '1d ago',
      status: 'pending',
      unread: true,
      priority: 'high',
      domainTag: 'EXPORT',
    },
    {
      id: 'apply-3',
      title: '🇺🇸 SAM.gov Federal Procurement Tender',
      preview:
        'US Federal environmental monitoring equipment. NAICS: 334516. Budget: $1.8M. Auto-translation to 6 languages.',
      time: '3d ago',
      status: 'pending',
      priority: 'medium',
      domainTag: 'EXPORT',
    },
  ],
  MONITOR: [
    {
      id: 'monitor-1',
      title: '⚠️ NOx Concentration Threshold Warning',
      preview:
        'Equipment #A-003 NOx concentration reached 90% threshold. StoFo Engine analysis: RUL 14 days predicted. Preventive maintenance recommended.',
      time: 'Just now',
      status: 'warning',
      unread: true,
      assignee: 'Urgent alert',
      isResponding: true,
      priority: 'critical',
      domainTag: 'ENVIRONMENT',
    },
  ],
}
