'use client'

/**
 * Center Panel Document Item Component
 *
 * Renders individual document items in the center panel list.
 *
 * @module components/dashboard/layout/center-panel-document-item
 */

import type { IndustryBlockType } from '@/types/inbox'
import { INDUSTRY_BLOCK_COLORS } from '@/lib/super-model'
import {
  type DomainTag,
  type DocumentWithTags,
  DOMAIN_TAG_STYLES,
  DOMAIN_TAG_LABELS,
  PRIORITY_BADGE_STYLES,
} from './center-panel-constants'

// =============================================================================
// Types
// =============================================================================

export interface CenterPanelDocumentItemProps {
  doc: DocumentWithTags
  isSelected: boolean
  onSelect: () => void
}

// =============================================================================
// Sub-components
// =============================================================================

interface DomainTagBadgeProps {
  tag: DomainTag
}

function DomainTagBadge({ tag }: DomainTagBadgeProps) {
  const style = DOMAIN_TAG_STYLES[tag]
  const label = DOMAIN_TAG_LABELS[tag]

  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${style}`}>
      {label}
    </span>
  )
}

interface IndustryBlockBadgeProps {
  block: IndustryBlockType
}

function IndustryBlockBadge({ block }: IndustryBlockBadgeProps) {
  const style = INDUSTRY_BLOCK_COLORS[block]

  return (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-medium rounded ring-1 ${style}`}
    >
      {block}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: string
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const style = PRIORITY_BADGE_STYLES[priority]
  if (!style) return null

  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${style.className}`}>
      {style.label}
    </span>
  )
}

interface RespondingIndicatorProps {
  assignee?: string
}

function RespondingIndicator({ assignee }: RespondingIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{assignee}</span>
    </div>
  )
}

interface DocumentAvatarProps {
  title: string
}

function DocumentAvatar({ title }: DocumentAvatarProps) {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-500/20 to-zinc-600/20 flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
      <span className="text-xs font-medium text-zinc-300">
        {title.charAt(0)}
      </span>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function CenterPanelDocumentItem({
  doc,
  isSelected,
  onSelect,
}: CenterPanelDocumentItemProps) {
  const showPriorityBadge =
    doc.priority && (doc.priority === 'critical' || doc.priority === 'high')

  return (
    <button
      id={doc.id}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      data-testid={`document-item-${doc.id}`}
      className={`w-full text-left px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/30 ${
        isSelected ? 'bg-white/10 ring-1 ring-white/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator */}
        <div className="pt-2">
          {doc.unread ? (
            <span className="block w-2 h-2 rounded-full bg-white" />
          ) : (
            <span className="block w-2 h-2" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3
              className={`text-sm truncate ${
                doc.unread
                  ? 'font-semibold text-white'
                  : 'font-medium text-zinc-300'
              }`}
            >
              {doc.title}
            </h3>
            <span className="text-xs text-zinc-500 flex-shrink-0">
              {doc.time}
            </span>
          </div>

          {/* Preview */}
          <p className="text-sm text-zinc-500 line-clamp-2 mb-2">
            {doc.preview}
          </p>

          {/* Status / Assignee Row with Priority Badge, Domain Tag, and Industry BLOCK */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Domain Engine Tag (6 types) */}
            {doc.domainTag && <DomainTagBadge tag={doc.domainTag} />}

            {/* Industry BLOCK Tag (12 types) - Super-Model v4.0 */}
            {doc.industryBlock && <IndustryBlockBadge block={doc.industryBlock} />}

            {/* Priority Badge - only show for critical/high */}
            {showPriorityBadge && <PriorityBadge priority={doc.priority!} />}

            {/* Responding indicator */}
            {doc.isResponding && <RespondingIndicator assignee={doc.assignee} />}

            {/* Count badge */}
            {doc.count && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-white/5 text-zinc-400 rounded">
                {doc.count}
              </span>
            )}
          </div>
        </div>

        {/* Avatar (for non-responding items) */}
        {!doc.isResponding && <DocumentAvatar title={doc.title} />}
      </div>
    </button>
  )
}

export default CenterPanelDocumentItem
