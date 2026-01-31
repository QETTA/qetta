'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { MetricBlockExtension } from './extensions/MetricBlock'
import { DocumentBlockExtension } from './extensions/DocumentBlock'

export interface QettaReadOnlyEditorProps {
  content: string
  className?: string
}

/**
 * QettaReadOnlyEditor
 *
 * Read-only editor for rendering AI responses.
 * Supports custom blocks like MetricBlock, DocumentBlock, etc.
 *
 * Theme: Catalyst Dark
 */
export function QettaReadOnlyEditor({ content, className }: QettaReadOnlyEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      MetricBlockExtension,
      DocumentBlockExtension,
    ],
    content,
    editable: false,
    immediatelyRender: false, // Prevent SSR hydration mismatch
    editorProps: {
      attributes: {
        class: [
          'prose prose-invert prose-zinc prose-sm max-w-none',
          'prose-headings:text-white prose-headings:font-semibold',
          'prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-1',
          'prose-strong:text-white',
          'prose-code:bg-zinc-800 prose-code:text-zinc-300 prose-code:rounded prose-code:px-1',
          'prose-ul:text-zinc-300 prose-ol:text-zinc-300 prose-ul:my-1 prose-ol:my-1',
          'prose-li:marker:text-zinc-500 prose-li:my-0.5',
          'prose-a:text-zinc-300',
        ].join(' '),
      },
    },
  })

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-3 bg-zinc-800 rounded w-3/4 mb-1.5" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
      </div>
    )
  }

  return (
    <div className={className}>
      <EditorContent editor={editor} />
    </div>
  )
}

export default QettaReadOnlyEditor
