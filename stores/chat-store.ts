import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Chat Store - Zustand with localStorage persistence
 *
 * Manages:
 * - isOpen: Panel visibility state
 * - feedbacks: User feedback (👍👎) for messages
 *
 * Note: Message history is managed by useChat hook from Vercel AI SDK,
 * which provides built-in streaming state management.
 */

export interface MessageFeedback {
  messageId: string
  feedback: 'positive' | 'negative' | null
  timestamp: number
}

interface ChatStore {
  // Panel state
  isOpen: boolean
  toggleOpen: () => void
  setOpen: (open: boolean) => void

  // Message feedback tracking
  feedbacks: Record<string, MessageFeedback>
  setFeedback: (
    messageId: string,
    feedback: 'positive' | 'negative' | null
  ) => void
  getFeedback: (messageId: string) => 'positive' | 'negative' | null

  // Session tracking
  sessionStartedAt: number | null
  startSession: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Panel state
      isOpen: false,
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),

      // Message feedback
      feedbacks: {},
      setFeedback: (messageId, feedback) =>
        set((state) => ({
          feedbacks: {
            ...state.feedbacks,
            [messageId]: {
              messageId,
              feedback,
              timestamp: Date.now(),
            },
          },
        })),
      getFeedback: (messageId) => {
        const feedback = get().feedbacks[messageId]
        return feedback?.feedback ?? null
      },

      // Session tracking
      sessionStartedAt: null,
      startSession: () =>
        set((state) => ({
          sessionStartedAt: state.sessionStartedAt ?? Date.now(),
        })),
    }),
    {
      name: 'qetta-chat-storage',
      partialize: (state) => ({
        feedbacks: state.feedbacks,
        sessionStartedAt: state.sessionStartedAt,
      }),
    }
  )
)
