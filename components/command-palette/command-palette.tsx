'use client'

/**
 * Command Palette (Cmd+K)
 *
 * 빠른 네비게이션과 명령 실행을 위한 팔레트
 * - Cmd+K (Mac) / Ctrl+K (Windows) 단축키
 * - 퍼지 검색
 * - 키보드 네비게이션
 * - 최근 사용 항목
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

export type CommandId = string

export interface Command {
  id: CommandId
  label: string
  description?: string
  icon?: string
  category: 'navigation' | 'action' | 'document' | 'settings' | 'recent'
  keywords?: string[]
  shortcut?: string
  action: () => void | Promise<void>
}

export interface CommandGroup {
  category: Command['category']
  label: string
  commands: Command[]
}

// ============================================
// Default Commands
// ============================================

function useDefaultCommands(): Command[] {
  const router = useRouter()

  return useMemo<Command[]>(() => [
    // Navigation
    {
      id: 'nav-docs',
      label: 'Go to DOCS',
      description: 'Document generation',
      icon: '📄',
      category: 'navigation',
      keywords: ['document', 'generate', 'create'],
      shortcut: 'G D',
      action: () => router.push('/docs'),
    },
    {
      id: 'nav-verify',
      label: 'Go to VERIFY',
      description: 'Hash-chain verification',
      icon: '🔐',
      category: 'navigation',
      keywords: ['verify', 'hash', 'check'],
      shortcut: 'G V',
      action: () => router.push('/verify'),
    },
    {
      id: 'nav-apply',
      label: 'Go to APPLY',
      description: 'Global tender matching',
      icon: '🌍',
      category: 'navigation',
      keywords: ['apply', 'tender', 'bid', 'match'],
      shortcut: 'G A',
      action: () => router.push('/apply'),
    },
    {
      id: 'nav-monitor',
      label: 'Go to MONITOR',
      description: 'Real-time equipment monitoring',
      icon: '📊',
      category: 'navigation',
      keywords: ['monitor', 'equipment', 'sensor', 'MES'],
      shortcut: 'G M',
      action: () => router.push('/monitor'),
    },
    {
      id: 'nav-settings',
      label: 'Settings',
      description: 'Account and preferences',
      icon: '⚙️',
      category: 'navigation',
      keywords: ['settings', 'preferences', 'account'],
      shortcut: 'G S',
      action: () => router.push('/settings/account'),
    },
    {
      id: 'nav-home',
      label: 'Go to Home',
      description: 'Landing page',
      icon: '🏠',
      category: 'navigation',
      keywords: ['home', 'landing'],
      action: () => router.push('/'),
    },

    // Actions
    {
      id: 'action-new-doc',
      label: 'New Document',
      description: 'Create a new document',
      icon: '➕',
      category: 'action',
      keywords: ['new', 'create', 'document'],
      shortcut: 'N',
      action: () => router.push('/docs?action=new'),
    },
    {
      id: 'action-search',
      label: 'Search Tenders',
      description: 'Search global tender database',
      icon: '🔍',
      category: 'action',
      keywords: ['search', 'find', 'tender'],
      shortcut: '/',
      action: () => router.push('/apply?focus=search'),
    },
    {
      id: 'action-export',
      label: 'Export Document',
      description: 'Export to PDF, DOCX, XLSX',
      icon: '📤',
      category: 'action',
      keywords: ['export', 'download', 'pdf', 'docx'],
      action: () => {
        // Trigger export modal
        window.dispatchEvent(new CustomEvent('qetta:export'))
      },
    },

    // Settings
    {
      id: 'settings-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: '🌓',
      category: 'settings',
      keywords: ['theme', 'dark', 'light', 'mode'],
      action: () => {
        // Theme toggle logic would go here
      },
    },
    {
      id: 'settings-notifications',
      label: 'Notification Settings',
      description: 'Manage notifications',
      icon: '🔔',
      category: 'settings',
      keywords: ['notifications', 'alerts'],
      action: () => router.push('/settings/notifications'),
    },
  ], [router])
}

// ============================================
// Fuzzy Search
// ============================================

function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  let queryIndex = 0
  for (const char of textLower) {
    if (char === queryLower[queryIndex]) {
      queryIndex++
      if (queryIndex === queryLower.length) return true
    }
  }
  return false
}

function searchCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands

  return commands.filter((cmd) => {
    // Match against label
    if (fuzzyMatch(cmd.label, query)) return true

    // Match against description
    if (cmd.description && fuzzyMatch(cmd.description, query)) return true

    // Match against keywords
    if (cmd.keywords?.some((kw) => fuzzyMatch(kw, query))) return true

    return false
  })
}

// ============================================
// Command Palette Component
// ============================================

interface CommandPaletteProps {
  additionalCommands?: Command[]
}

export function CommandPalette({ additionalCommands = [] }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultCommands = useDefaultCommands()
  const allCommands = useMemo(
    () => [...defaultCommands, ...additionalCommands],
    [defaultCommands, additionalCommands]
  )

  const filteredCommands = useMemo(
    () => searchCommands(allCommands, query),
    [allCommands, query]
  )

  // Group commands by category
  const groupedCommands = useMemo<CommandGroup[]>(() => {
    const groups: Record<Command['category'], Command[]> = {
      recent: [],
      navigation: [],
      action: [],
      document: [],
      settings: [],
    }

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd)
    })

    const categoryLabels: Record<Command['category'], string> = {
      recent: 'Recent',
      navigation: 'Navigation',
      action: 'Actions',
      document: 'Documents',
      settings: 'Settings',
    }

    return Object.entries(groups)
      .filter(([, commands]) => commands.length > 0)
      .map(([category, commands]) => ({
        category: category as Command['category'],
        label: categoryLabels[category as Command['category']],
        commands,
      }))
  }, [filteredCommands])

  // Flatten for keyboard navigation
  const flatCommands = useMemo(
    () => groupedCommands.flatMap((g) => g.commands),
    [groupedCommands]
  )

  // Keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (flatCommands[selectedIndex]) {
            flatCommands[selectedIndex].action()
            setIsOpen(false)
          }
          break
      }
    },
    [flatCommands, selectedIndex]
  )

  const handleCommandClick = useCallback(
    (command: Command) => {
      command.action()
      setIsOpen(false)
    },
    []
  )

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
      onClick={() => setIsOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className={cn(
          'relative w-full max-w-lg mx-4',
          'bg-zinc-900 border border-white/10 rounded-xl shadow-2xl',
          'animate-scale-in overflow-hidden'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <svg
            className="w-5 h-5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className={cn(
              'flex-1 bg-transparent text-white text-sm',
              'placeholder:text-zinc-500 focus:outline-none'
            )}
          />
          <kbd className="px-2 py-0.5 text-[10px] text-zinc-500 bg-zinc-800 rounded border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {groupedCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No commands found
            </div>
          ) : (
            groupedCommands.map((group) => (
              <div key={group.category} className="mb-2">
                <div className="px-2 py-1 text-xs text-zinc-500 uppercase tracking-wider">
                  {group.label}
                </div>
                {group.commands.map((command) => {
                  const commandIndex = flatCommands.indexOf(command)
                  const isSelected = commandIndex === selectedIndex

                  return (
                    <button
                      key={command.id}
                      onClick={() => handleCommandClick(command)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                        'text-left transition-colors',
                        isSelected
                          ? 'bg-white/10 text-white'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {command.icon && (
                        <span className="text-lg flex-shrink-0">{command.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {command.label}
                        </div>
                        {command.description && (
                          <div className="text-xs text-zinc-500 truncate">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <kbd className="px-2 py-0.5 text-[10px] text-zinc-500 bg-zinc-800 rounded border border-white/10">
                          {command.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-white/10">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-white/10">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-white/10">↵</kbd>
              <span>Select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-white/10">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-white/10">K</kbd>
            <span>Toggle</span>
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

