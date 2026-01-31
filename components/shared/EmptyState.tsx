import { Button } from '@/components/catalyst/button'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    href?: string
  }
}

/**
 * EmptyState - Consistent empty state UI
 *
 * Usage:
 * <EmptyState
 *   icon={<DocumentIcon className="w-12 h-12" />}
 *   title="No documents yet"
 *   description="Get started by generating your first document"
 *   action={{ label: "Generate Document", onClick: () => {} }}
 * />
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 text-foreground-muted opacity-50">
          {icon}
        </div>
      )}

      <Heading level={3} className="mb-2">
        {title}
      </Heading>

      <Text className="text-foreground-secondary max-w-md mb-6">
        {description}
      </Text>

      {action && (
        <Button
          color="dark/zinc"
          onClick={action.onClick}
          href={action.href}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
