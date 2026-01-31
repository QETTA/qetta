'use client'

import type { ProductTab } from '@/types/inbox'
import { useChatThread } from './hooks/use-chat-thread'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ChatEmptyState } from './chat-empty-state'
import { RetryIcon } from './chat-icons'

// Re-export types for backwards compatibility
export type { Message, SkillResult } from './chat-types'

interface ChatThreadProps {
  activeTab: ProductTab
  selectedDocument: string | null
  externalContext?: import('@/types/inbox').AIAgentContext | null
}

/**
 * ChatThread - Claude-inspired Chat Interface
 *
 * Design Philosophy:
 * - Clean, minimal UI with no visual clutter
 * - Professional copywriting (no cutesy language)
 * - Subtle domain context without emoji overload
 * - Focus on content, not decoration
 */
export function ChatThread({ activeTab, selectedDocument, externalContext: _externalContext }: ChatThreadProps) {
  const {
    // State
    messages,
    input,
    setInput,
    isLoading,
    isGeneratingDoc,
    error,
    lastUserMessage,
    selectedPreset,
    domainConfig,
    conversations,
    quickSuggestions,
    isCommandPaletteOpen,

    // Refs
    messagesEndRef,
    textareaRef,

    // Handlers
    handleCommandSelect,
    handleDownload,
    handleEditInHancom,
    handleSubmit,
    handleKeyDown,
    handleStop,
    handleFeedback,
    handleQuickSuggestion,
    handleRetry,
    handleRegenerate,
    closeCommandPalette,
    getFeedback,
  } = useChatThread({ activeTab, selectedDocument })

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <ChatEmptyState
            selectedPreset={selectedPreset}
            domainConfig={domainConfig}
            quickSuggestions={quickSuggestions}
            conversations={conversations}
            onQuickSuggestion={handleQuickSuggestion}
          />
        ) : (
          // Message list
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                selectedPreset={selectedPreset}
                domainConfig={domainConfig}
                isLoading={isLoading}
                isLastMessage={message.id === messages[messages.length - 1]?.id}
                isGeneratingDoc={isGeneratingDoc}
                getFeedback={getFeedback}
                onFeedback={handleFeedback}
                onRegenerate={handleRegenerate}
                onDownload={handleDownload}
                onEditInHancom={handleEditInHancom}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display with Retry button */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-red-400 flex-1">{error}</p>
            {lastUserMessage && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              >
                <RetryIcon className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <ChatInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isCommandPaletteOpen={isCommandPaletteOpen}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        onStop={handleStop}
        onCommandSelect={handleCommandSelect}
        onCloseCommandPalette={closeCommandPalette}
        textareaRef={textareaRef}
      />
    </div>
  )
}
