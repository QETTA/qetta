'use client'

import { Node, mergeAttributes } from '@tiptap/react'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { DocumentTextIcon, TableCellsIcon, DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

/**
 * File Type 아이콘 및 색상 매핑
 */
const FILE_TYPE_CONFIG = {
  docx: {
    Icon: DocumentTextIcon,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    ringColor: 'ring-blue-500/20',
    label: 'Word',
  },
  xlsx: {
    Icon: TableCellsIcon,
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    ringColor: 'ring-emerald-500/20',
    label: 'Excel',
  },
  pdf: {
    Icon: DocumentIcon,
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    ringColor: 'ring-red-500/20',
    label: 'PDF',
  },
} as const

type FileType = keyof typeof FILE_TYPE_CONFIG

interface DocumentBlockAttributes {
  fileName: string
  fileType: FileType
  fileSize?: string
  status?: 'ready' | 'generating' | 'error'
  previewUrl?: string
  downloadUrl?: string
}

/**
 * DocumentBlock View Component
 *
 * 문서 프리뷰 블록 (DOCX, XLSX, PDF)
 * - 파일명, 크기, 상태 표시
 * - 다운로드 버튼
 * - 미리보기 링크
 */
function DocumentBlockView({ node }: NodeViewProps) {
  const attrs = node.attrs as unknown as DocumentBlockAttributes
  const { fileName, fileType = 'docx', fileSize, status = 'ready', downloadUrl } = attrs

  const config = FILE_TYPE_CONFIG[fileType] || FILE_TYPE_CONFIG.docx
  const { Icon, bgColor, textColor, ringColor, label } = config

  const statusConfig = {
    ready: { text: 'Ready', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    generating: { text: 'Generating...', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    error: { text: 'Error', color: 'text-red-400', bg: 'bg-red-500/10' },
  }[status]

  return (
    <NodeViewWrapper className="my-2">
      <div
        className={`
          relative overflow-hidden rounded-lg p-4
          ${bgColor} ring-1 ${ringColor}
          transition-all hover:ring-2
        `}
      >
        <div className="flex items-center gap-4">
          {/* File Icon */}
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            bg-black/20
          `}>
            <Icon className={`w-6 h-6 ${textColor}`} />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">
                {fileName}
              </span>
              <span className={`
                text-[10px] font-medium px-1.5 py-0.5 rounded
                bg-black/20 ${textColor}
              `}>
                {label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {fileSize && (
                <span className="text-xs text-zinc-500">{fileSize}</span>
              )}
              <span className={`
                text-xs px-1.5 py-0.5 rounded
                ${statusConfig.bg} ${statusConfig.color}
              `}>
                {statusConfig.text}
              </span>
            </div>
          </div>

          {/* Download Button */}
          {status === 'ready' && downloadUrl && (
            <a
              href={downloadUrl}
              download
              className={`
                p-2 rounded-lg
                bg-white/5 hover:bg-white/10
                transition-colors
              `}
            >
              <ArrowDownTrayIcon className="w-5 h-5 text-zinc-400" />
            </a>
          )}

          {/* Loading Spinner */}
          {status === 'generating' && (
            <div className="p-2">
              <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

/**
 * DocumentBlock Tiptap Extension
 */
export const DocumentBlockExtension = Node.create({
  name: 'documentBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fileName: { default: 'document.docx' },
      fileType: { default: 'docx' },
      fileSize: { default: null },
      status: { default: 'ready' },
      previewUrl: { default: null },
      downloadUrl: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-document-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-document-block': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentBlockView)
  },
})

