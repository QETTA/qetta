import { Text } from '@/components/catalyst/text'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * LoadingState - Unified loading spinner
 *
 * Usage:
 * <LoadingState message="Loading documents..." size="lg" />
 */
export function LoadingState({
  message = 'Loading...',
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      {/* Spinner */}
      <div
        className={`${sizeClasses[size]} border-4 border-border-medium border-t-brand rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />

      {/* Message */}
      <Text className="text-foreground-secondary">
        {message}
      </Text>
    </div>
  )
}

/**
 * LoadingSpinner - Compact inline spinner
 */
export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-5 h-5 border-2 border-border-medium border-t-brand rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
