'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface EditorState {
  isEditing: boolean
  activeBlockId: string | null
  selectedText: string
}

interface EditorContextType {
  state: EditorState
  setEditing: (isEditing: boolean) => void
  setActiveBlock: (blockId: string | null) => void
  setSelectedText: (text: string) => void
}

const EditorContext = createContext<EditorContextType | null>(null)

/**
 * QettaEditorProvider - Context Provider for Block Editor State
 *
 * Manages global editor state including:
 * - Current editing mode
 * - Active block selection
 * - Selected text for AI operations
 *
 * This provider wraps the AI panel and chat thread to enable
 * block-level interactions between the editor and AI.
 */
export function QettaEditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>({
    isEditing: false,
    activeBlockId: null,
    selectedText: '',
  })

  const setEditing = useCallback((isEditing: boolean) => {
    setState((prev) => ({ ...prev, isEditing }))
  }, [])

  const setActiveBlock = useCallback((blockId: string | null) => {
    setState((prev) => ({ ...prev, activeBlockId: blockId }))
  }, [])

  const setSelectedText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, selectedText: text }))
  }, [])

  return (
    <EditorContext.Provider
      value={{
        state,
        setEditing,
        setActiveBlock,
        setSelectedText,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

/**
 * useEditorContext - Hook to access editor context
 *
 * @throws Error if used outside of QettaEditorProvider
 */
export function useEditorContext() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditorContext must be used within QettaEditorProvider')
  }
  return context
}

/**
 * useEditorState - Hook for read-only access to editor state
 *
 * Use this when you only need to read the state without modifying it.
 */
export function useEditorState() {
  const { state } = useEditorContext()
  return state
}
