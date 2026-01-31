import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EnginePresetType } from '@/types/inbox'

/**
 * AI Panel Store - Extended Zustand with localStorage persistence
 *
 * Manages:
 * - isOpen: Panel visibility state (collapsed/expanded)
 * - isExpanded: Full expansion state for split view
 * - selectedPreset: Current engine preset selection
 * - conversationHistory: Per-preset conversation persistence
 *
 * Note: Message history is managed by useChat hook from Vercel AI SDK,
 * this store manages panel UI state and preset context.
 */

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  enginePreset: EnginePresetType
  artifacts?: ArtifactReference[]
}

export interface ArtifactReference {
  id: string
  type: 'document' | 'report' | 'analysis'
  title: string
  format: 'DOCX' | 'XLSX' | 'PDF' | 'HWP'
  previewUrl?: string
  downloadUrl?: string
  hashChain?: string
  verified?: boolean
  createdAt: number
}

interface AIPanelStore {
  // Panel visibility state
  isOpen: boolean
  isExpanded: boolean // Full split-view mode
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  toggleExpanded: () => void
  setExpanded: (expanded: boolean) => void

  // Engine preset selection
  selectedPreset: EnginePresetType
  setSelectedPreset: (preset: EnginePresetType) => void

  // Conversation history (per preset)
  conversations: Record<EnginePresetType, ConversationMessage[]>
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void
  clearConversation: (preset: EnginePresetType) => void
  clearAllConversations: () => void

  // Artifacts management
  artifacts: ArtifactReference[]
  addArtifact: (artifact: Omit<ArtifactReference, 'id' | 'createdAt'>) => void
  removeArtifact: (id: string) => void
  getArtifactsByPreset: (preset: EnginePresetType) => ArtifactReference[]

  // Inline command state
  inlineCommandOpen: boolean
  setInlineCommandOpen: (open: boolean) => void
  inlineCommandQuery: string
  setInlineCommandQuery: (query: string) => void

  // Session tracking
  sessionStartedAt: number | null
  startSession: () => void
}

const initialConversations: Record<EnginePresetType, ConversationMessage[]> = {
  MANUFACTURING: [],
  ENVIRONMENT: [],
  DIGITAL: [],
  FINANCE: [],
  STARTUP: [],
  EXPORT: [],
}

export const useAIPanelStore = create<AIPanelStore>()(
  persist(
    (set, get) => ({
      // Panel visibility
      isOpen: false,
      isExpanded: false,
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setExpanded: (expanded) => set({ isExpanded: expanded }),

      // Preset selection
      selectedPreset: 'ENVIRONMENT',
      setSelectedPreset: (preset) => set({ selectedPreset: preset }),

      // Conversation management
      conversations: initialConversations,
      addMessage: (message) =>
        set((state) => {
          const preset = message.enginePreset
          const newMessage: ConversationMessage = {
            ...message,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          }
          return {
            conversations: {
              ...state.conversations,
              [preset]: [...state.conversations[preset], newMessage],
            },
          }
        }),
      clearConversation: (preset) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [preset]: [],
          },
        })),
      clearAllConversations: () => set({ conversations: initialConversations }),

      // Artifacts management
      artifacts: [],
      addArtifact: (artifact) =>
        set((state) => ({
          artifacts: [
            ...state.artifacts,
            {
              ...artifact,
              id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: Date.now(),
            },
          ],
        })),
      removeArtifact: (id) =>
        set((state) => ({
          artifacts: state.artifacts.filter((a) => a.id !== id),
        })),
      getArtifactsByPreset: (_preset) => {
        // Filter artifacts based on current conversation context
        // In production, artifacts would have preset metadata
        // _preset parameter reserved for future filtering
        void _preset
        return get().artifacts
      },

      // Inline command
      inlineCommandOpen: false,
      setInlineCommandOpen: (open) => set({ inlineCommandOpen: open }),
      inlineCommandQuery: '',
      setInlineCommandQuery: (query) => set({ inlineCommandQuery: query }),

      // Session tracking
      sessionStartedAt: null,
      startSession: () =>
        set((state) => ({
          sessionStartedAt: state.sessionStartedAt ?? Date.now(),
        })),
    }),
    {
      name: 'qetta-ai-panel-storage',
      partialize: (state) => ({
        selectedPreset: state.selectedPreset,
        conversations: state.conversations,
        artifacts: state.artifacts,
        sessionStartedAt: state.sessionStartedAt,
      }),
      // Migrate legacy selectedDomain to selectedPreset
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>
        if (state && 'selectedDomain' in state && !('selectedPreset' in state)) {
          state.selectedPreset = state.selectedDomain
          delete state.selectedDomain
        }
        return state as unknown as AIPanelStore
      },
      version: 1,
    }
  )
)
