'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAIPanelStore } from '@/stores/ai-panel-store'
import {
  getInlineCommandsForDomain,
  type InlineCommand as InlineCommandType,
} from '@/lib/domain-engines/constants'

interface InlineCommandPaletteProps {
  onSelect: (command: InlineCommandType, selectedText?: string) => void
  onClose: () => void
  selectedText?: string
}

/**
 * InlineCommandPalette - Command palette triggered by `/`
 *
 * Displays available commands based on current domain.
 * Commands are filtered by domain availability.
 */
export function InlineCommandPalette({
  onSelect,
  onClose,
  selectedText,
}: InlineCommandPaletteProps) {
  const { selectedPreset, inlineCommandQuery, setInlineCommandQuery } =
    useAIPanelStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get commands for current domain
  const availableCommands = getInlineCommandsForDomain(selectedPreset)

  // Filter commands by query
  const filteredCommands = availableCommands.filter((cmd) => {
    const query = inlineCommandQuery.toLowerCase().replace('/', '')
    return (
      cmd.trigger.toLowerCase().includes(query) ||
      cmd.label.toLowerCase().includes(query) ||
      cmd.labelKo.includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      cmd.descriptionKo.includes(query)
    )
  })

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands.length])

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = listRef.current?.children[selectedIndex] as HTMLElement
    selectedItem?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex], selectedText)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'Tab':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            setInlineCommandQuery(filteredCommands[selectedIndex].trigger)
          }
          break
      }
    },
    [filteredCommands, selectedIndex, onSelect, onClose, selectedText, setInlineCommandQuery]
  )

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 rounded-lg ring-1 ring-white/10 shadow-xl overflow-hidden z-50">
      {/* Search input */}
      <div className="p-2 border-b border-white/5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            /
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inlineCommandQuery.replace('/', '')}
            onChange={(e) => setInlineCommandQuery('/' + e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="w-full pl-6 pr-3 py-2 bg-zinc-800/50 text-white text-sm rounded-lg ring-1 ring-white/10 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500 outline-none"
          />
        </div>
      </div>

      {/* Commands list */}
      <div
        ref={listRef}
        className="max-h-[240px] overflow-y-auto p-1"
        role="listbox"
      >
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-zinc-500">
            No matching commands found
          </div>
        ) : (
          filteredCommands.map((command, index) => (
            <button
              key={command.id}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => onSelect(command, selectedText)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{command.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {command.labelKo}
                  </span>
                  <code className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {command.trigger}
                  </code>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {command.descriptionKo}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-white/5 flex items-center gap-4 text-[10px] text-zinc-500">
        <span>
          <kbd className="px-1 py-0.5 bg-zinc-800 rounded">↑↓</kbd> Navigate
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-zinc-800 rounded">Enter</kbd> Select
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-zinc-800 rounded">Esc</kbd> Close
        </span>
      </div>
    </div>
  )
}

/**
 * useInlineCommand - Hook for inline command detection
 *
 * Detects `/` input and triggers command palette
 */
export function useInlineCommand(inputValue: string) {
  const { setInlineCommandOpen, setInlineCommandQuery, inlineCommandOpen } =
    useAIPanelStore()

  useEffect(() => {
    // Check if input starts with /
    if (inputValue.startsWith('/')) {
      setInlineCommandOpen(true)
      setInlineCommandQuery(inputValue)
    } else if (inlineCommandOpen && !inputValue.includes('/')) {
      setInlineCommandOpen(false)
      setInlineCommandQuery('')
    }
  }, [inputValue, inlineCommandOpen, setInlineCommandOpen, setInlineCommandQuery])

  return {
    isCommandPaletteOpen: inlineCommandOpen,
    closeCommandPalette: () => {
      setInlineCommandOpen(false)
      setInlineCommandQuery('')
    },
  }
}

/**
 * InlineCommandTrigger - Shows available commands inline
 *
 * Used in document editor to show `/` command hint
 */
export function InlineCommandTrigger({
  onOpen,
}: {
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-400 hover:bg-white/5 rounded transition-colors"
    >
      <span className="text-zinc-400">/</span>
      <span>Commands</span>
    </button>
  )
}
