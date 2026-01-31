'use client'

import { Component, type ReactNode } from 'react'
import { clientLogger } from '@/lib/logger/client'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary for AI Panel
 *
 * Catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire panel.
 */
export class AIPanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    clientLogger.error('[AI Panel Error]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
            <AlertIcon className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200 mb-2">
            Something went wrong
          </h3>
          <p className="text-xs text-zinc-500 max-w-[240px] mb-4">
            {this.state.error?.message || 'An unexpected error occurred in the AI panel.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-600 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Reusable Error Fallback component for custom error UIs
 */
export function AIErrorFallback({
  error,
  onReset,
}: {
  error?: Error | null
  onReset?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
        <AlertIcon className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-sm font-medium text-zinc-200 mb-2">
        Something went wrong
      </h3>
      <p className="text-xs text-zinc-500 max-w-[240px] mb-4">
        {error?.message || 'An unexpected error occurred.'}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-4 py-2 text-xs font-medium text-white bg-zinc-600 hover:bg-zinc-500 rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}
