'use client'

/**
 * Qetta Docs Preview Component
 *
 * Spreadsheet-style preview for TMS sensor data with hash verification.
 * Split into sub-components for better maintainability.
 *
 * @module components/dashboard/docs/preview
 *
 * @example
 * ```tsx
 * <QettaDocsPreview />
 * ```
 */

import {
  DEFAULT_DATA,
  calculateVerificationCounts,
} from './docs-preview-constants.js'
import {
  DocsPreviewMenuBar,
  DocsPreviewToolbar,
  DocsPreviewFormulaBar,
} from './docs-preview-toolbar'
import { DocsPreviewTable } from './docs-preview-table'
import { DocsPreviewFooter } from './docs-preview-footer'

// =============================================================================
// Component
// =============================================================================

export function QettaDocsPreview() {
  const data = DEFAULT_DATA
  const { verifiedCount, totalCount } = calculateVerificationCounts(data)

  return (
    <div className="rounded-lg bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[580px] lg:h-[580px] ring-1 ring-white/10 transition-shadow hover:shadow-3xl">
      {/* Top Menu Bar */}
      <DocsPreviewMenuBar />

      {/* Toolbar */}
      <DocsPreviewToolbar />

      {/* Formula Bar */}
      <DocsPreviewFormulaBar />

      {/* Spreadsheet Grid */}
      <DocsPreviewTable data={data} />

      {/* Sheet Tabs */}
      <DocsPreviewFooter
        verifiedCount={verifiedCount}
        totalCount={totalCount}
      />
    </div>
  )
}

export default QettaDocsPreview
