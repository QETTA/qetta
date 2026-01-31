import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

/**
 * PageHeader - Consistent page title component
 *
 * Usage:
 * <PageHeader
 *   title="Settings"
 *   description="Manage your account settings and preferences"
 *   actions={<Button>Save</Button>}
 * />
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="space-y-1">
        <Heading level={1}>{title}</Heading>
        {description && (
          <Text className="text-foreground-secondary max-w-2xl">
            {description}
          </Text>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
