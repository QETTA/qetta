'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

export interface HashVerifyBlockAttributes {
  documentName: string
  hash: string
  previousHash?: string
  status: 'verified' | 'pending' | 'failed'
  timestamp: string
  verifiedBy?: string
}

const STATUS_STYLES = {
  verified: {
    bgGradient: 'from-emerald-500/20 to-emerald-500/5',
    accentColor: 'text-emerald-400',
    ringColor: 'ring-emerald-500/30',
    icon: ShieldCheckIcon,
    label: 'Verified',
  },
  pending: {
    bgGradient: 'from-amber-500/20 to-amber-500/5',
    accentColor: 'text-amber-400',
    ringColor: 'ring-amber-500/30',
    icon: ClockIcon,
    label: 'Pending',
  },
  failed: {
    bgGradient: 'from-red-500/20 to-red-500/5',
    accentColor: 'text-red-400',
    ringColor: 'ring-red-500/30',
    icon: ExclamationTriangleIcon,
    label: 'Failed',
  },
} as const

function HashVerifyBlockView({ node }: NodeViewProps) {
  const attrs = node.attrs as unknown as HashVerifyBlockAttributes
  const { documentName, hash, previousHash, status, timestamp, verifiedBy } = attrs

  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
  const StatusIcon = style.icon

  const formatHash = (h: string) => {
    if (h.length <= 16) return h
    return h.slice(0, 8) + '...' + h.slice(-8)
  }

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ts
    }
  }

  return (
    <NodeViewWrapper className="my-3">
      <div
        className={[
          'relative overflow-hidden rounded-lg p-4',
          'bg-gradient-to-br ' + style.bgGradient,
          'ring-1 ' + style.ringColor,
          'transition-all hover:ring-2',
        ].join(' ')}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={'w-5 h-5 ' + style.accentColor} />
            <span className={'text-sm font-medium ' + style.accentColor}>
              {style.label}
            </span>
          </div>
          <span className="text-xs text-zinc-500">{formatTime(timestamp)}</span>
        </div>

        <div className="mb-3">
          <p className="text-sm font-medium text-white truncate">{documentName}</p>
          {verifiedBy && (
            <p className="text-xs text-zinc-500 mt-0.5">Verified by: {verifiedBy}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-black/20 rounded-md px-3 py-2">
            <span className="text-xs text-zinc-500 w-16">Hash</span>
            <code className="text-xs text-zinc-300 font-mono flex-1 truncate">
              {formatHash(hash)}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(hash)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Copy full hash"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {previousHash && (
            <div className="flex items-center gap-2 bg-black/10 rounded-md px-3 py-2">
              <span className="text-xs text-zinc-500 w-16">Prev</span>
              <code className="text-xs text-zinc-400 font-mono flex-1 truncate">
                {formatHash(previousHash)}
              </code>
            </div>
          )}
        </div>

        {previousHash && (
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
            <span>Hash chain connected (SHA-256)</span>
          </div>
        )}

        <div className="absolute top-2 right-2">
          <span
            className={[
              'text-[10px] font-medium px-1.5 py-0.5 rounded',
              'bg-black/20',
              style.accentColor,
            ].join(' ')}
          >
            VERIFY
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const HashVerifyBlockExtension = Node.create({
  name: 'hashVerifyBlock',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      documentName: {
        default: 'document.pdf',
      },
      hash: {
        default: '',
      },
      previousHash: {
        default: null,
      },
      status: {
        default: 'pending',
      },
      timestamp: {
        default: new Date().toISOString(),
      },
      verifiedBy: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="hash-verify-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'hash-verify-block' }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(HashVerifyBlockView)
  },
})

