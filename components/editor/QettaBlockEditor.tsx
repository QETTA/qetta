'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { forwardRef, useImperativeHandle } from 'react'
import { MetricBlockExtension } from './extensions/MetricBlock'
import { DocumentBlockExtension } from './extensions/DocumentBlock'
import { HashVerifyBlockExtension } from './extensions/HashVerifyBlock'
import { SlashCommandExtension } from './extensions/SlashCommand'

export interface QettaBlockEditorProps {
  content?: string
  placeholder?: string
  editable?: boolean
  onUpdate?: (content: string) => void
  className?: string
}

export interface QettaBlockEditorRef {
  getContent: () => string
  setContent: (content: string) => void
  insertMetricBlock: (attrs: MetricBlockAttributes) => void
  insertDocumentBlock: (attrs: DocumentBlockAttributes) => void
  insertHashVerifyBlock: (attrs: HashVerifyBlockAttributes) => void
}

export interface MetricBlockAttributes {
  value: string
  label: string
  detail?: string
  trend?: 'up' | 'down' | 'neutral'
  domain?: 'ENVIRONMENT' | 'MANUFACTURING' | 'DIGITAL' | 'EXPORT'
}

export interface DocumentBlockAttributes {
  fileName: string
  fileType: 'docx' | 'xlsx' | 'pdf'
  fileSize?: string
  status?: 'ready' | 'generating' | 'error'
  previewUrl?: string
}

export interface HashVerifyBlockAttributes {
  documentName: string
  hash: string
  previousHash?: string
  status: 'verified' | 'pending' | 'failed'
  timestamp: string
  verifiedBy?: string
}

/**
 * QettaBlockEditor
 *
 * Tiptap-based block editor for rendering AI responses in a structured format.
 * - MetricBlock: QETTA key metrics (93.8%, 91%, etc.)
 * - DocumentBlock: Document preview (DOCX, XLSX, PDF)
 *
 * Theme: Catalyst Dark
 */
export const QettaBlockEditor = forwardRef<QettaBlockEditorRef, QettaBlockEditorProps>(
  function QettaBlockEditor(
    { content = '', placeholder = 'Enter AI response...', editable = true, onUpdate, className },
    ref
  ) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        MetricBlockExtension,
        DocumentBlockExtension,
        HashVerifyBlockExtension,
        SlashCommandExtension,
      ],
      content,
      editable,
      immediatelyRender: false, // Prevent SSR hydration mismatch
      onUpdate: ({ editor }) => {
        onUpdate?.(editor.getHTML())
      },
      editorProps: {
        attributes: {
          class: [
            'prose prose-invert prose-zinc max-w-none',
            'focus:outline-none',
            'prose-headings:text-white prose-headings:font-semibold',
            'prose-p:text-zinc-300 prose-p:leading-relaxed',
            'prose-strong:text-white prose-strong:font-semibold',
            'prose-code:bg-zinc-800 prose-code:text-zinc-300 prose-code:rounded prose-code:px-1',
            'prose-pre:bg-zinc-800/50 prose-pre:rounded-lg',
            'prose-ul:text-zinc-300 prose-ol:text-zinc-300',
            'prose-li:marker:text-zinc-500',
            'prose-a:text-zinc-300 prose-a:no-underline hover:prose-a:underline',
          ].join(' '),
        },
      },
    })

    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() ?? '',
      setContent: (newContent: string) => {
        editor?.commands.setContent(newContent)
      },
      insertMetricBlock: (attrs: MetricBlockAttributes) => {
        editor?.commands.insertContent({
          type: 'metricBlock',
          attrs,
        })
      },
      insertDocumentBlock: (attrs: DocumentBlockAttributes) => {
        editor?.commands.insertContent({
          type: 'documentBlock',
          attrs,
        })
      },
      insertHashVerifyBlock: (attrs: HashVerifyBlockAttributes) => {
        editor?.commands.insertContent({
          type: 'hashVerifyBlock',
          attrs,
        })
      },
    }))

    if (!editor) {
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
        </div>
      )
    }

    const containerClasses = [
      'relative rounded-lg',
      'bg-zinc-900 ring-1 ring-white/10',
      editable ? 'hover:ring-white/20' : '',
      'transition-all',
      className ?? '',
    ].filter(Boolean).join(' ')

    return (
      <div className={containerClasses}>
        <EditorContent
          editor={editor}
          className="p-4 min-h-[120px]"
        />
      </div>
    )
  }
)

export default QettaBlockEditor
