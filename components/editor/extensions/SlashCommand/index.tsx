'use client'

import { Extension, type Editor } from '@tiptap/react'
import type { Range } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance } from 'tippy.js'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react'
import {
  ChartBarIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DocumentIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { DISPLAY_METRICS } from '@/constants/metrics'

/**
 * Slash Command List
 */
export interface SlashCommandItem {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  command: (props: { editor: Editor; range: Range }) => void
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Metric',
    description: `QETTA key metrics block (${DISPLAY_METRICS.timeSaved.value}, ${DISPLAY_METRICS.rejectionReduction.value})`,
    icon: ChartBarIcon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'metricBlock',
          attrs: {
            value: DISPLAY_METRICS.timeSaved.value,
            label: 'Time Reduction',
            detail: '8h → 30m',
            trend: 'up',
            domain: 'DIGITAL',
          },
        })
        .run()
    },
  },
  {
    title: 'Document (DOCX)',
    description: 'Word document preview block',
    icon: DocumentTextIcon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'documentBlock',
          attrs: {
            fileName: 'report.docx',
            fileType: 'docx',
            fileSize: '245 KB',
            status: 'ready',
          },
        })
        .run()
    },
  },
  {
    title: 'Spreadsheet (XLSX)',
    description: 'Excel spreadsheet preview block',
    icon: TableCellsIcon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'documentBlock',
          attrs: {
            fileName: 'data.xlsx',
            fileType: 'xlsx',
            fileSize: '128 KB',
            status: 'ready',
          },
        })
        .run()
    },
  },
  {
    title: 'PDF',
    description: 'PDF document preview block',
    icon: DocumentIcon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'documentBlock',
          attrs: {
            fileName: 'document.pdf',
            fileType: 'pdf',
            fileSize: '512 KB',
            status: 'ready',
          },
        })
        .run()
    },
  },
  {
    title: 'Hash Verify',
    description: 'Hash chain verification block (SHA-256)',
    icon: ShieldCheckIcon,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'hashVerifyBlock',
          attrs: {
            documentName: 'TMS_report_2026-01-22.pdf',
            hash: 'a7f3c9e2d1b8f6a4e5c7d9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0',
            previousHash: 'f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9',
            status: 'verified',
            timestamp: new Date().toISOString(),
            verifiedBy: 'QETTA System',
          },
        })
        .run()
    },
  },
]

/**
 * Command List Component (Dropdown UI)
 */
interface CommandListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  function CommandList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command]
    )

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="rounded-lg bg-zinc-900 p-3 text-sm text-zinc-500 ring-1 ring-white/10">
          No commands found
        </div>
      )
    }

    return (
      <div className="w-64 overflow-hidden rounded-lg bg-zinc-900 shadow-xl ring-1 ring-white/10">
        <div className="p-1">
          {items.map((item, index) => {
            const Icon = item.icon
            const isSelected = index === selectedIndex
            return (
              <button
                key={item.title}
                onClick={() => selectItem(index)}
                className={[
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left',
                  'transition-colors',
                  isSelected
                    ? 'bg-zinc-700/50 text-white'
                    : 'text-zinc-300 hover:bg-white/5',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex size-8 items-center justify-center rounded-md',
                    isSelected ? 'bg-zinc-600/50' : 'bg-white/5',
                  ].join(' ')}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {item.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }
)

/**
 * Suggestion Plugin Configuration
 */
const suggestionConfig: Omit<SuggestionOptions<SlashCommandItem>, 'editor'> = {
  items: ({ query }) => {
    return SLASH_COMMANDS.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
  },
  render: () => {
    let component: ReactRenderer<CommandListRef> | null = null
    let popup: Instance[] | null = null

    return {
      onStart: (props) => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) return

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },
      onUpdate: (props) => {
        component?.updateProps(props)

        if (!props.clientRect) return

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide()
          return true
        }
        return component?.ref?.onKeyDown(props) ?? false
      },
      onExit: () => {
        popup?.[0]?.destroy()
        component?.destroy()
      },
    }
  },
}

/**
 * SlashCommand Tiptap Extension
 *
 * Usage: Type `/` in the editor to open command palette
 */
export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: SlashCommandItem
        }) => {
          props.command({ editor, range })
        },
        ...suggestionConfig,
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export default SlashCommandExtension
