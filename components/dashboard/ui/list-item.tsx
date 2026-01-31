import { cn } from '@/lib/utils'
import { StatusIndicator } from './status-indicator'
import type { DashboardStatusType } from '@/constants/dashboard-styles'

interface ListItemProps {
  title: string
  preview?: string
  time?: string
  status?: DashboardStatusType
  unread?: boolean
  isResponding?: boolean
  badge?: React.ReactNode
  avatar?: React.ReactNode
  onClick?: () => void
  selected?: boolean
  className?: string
  children?: React.ReactNode
}

/**
 * ListItem - 대시보드 목록 아이템 컴포넌트
 *
 * 문서, 검증, 입찰 목록 등에서 사용합니다.
 *
 * @example
 * <ListItem
 *   title="TMS 일일보고서"
 *   preview="NOx, SOx 데이터 포함..."
 *   time="2시간 전"
 *   status="active"
 *   unread
 * />
 */
export function ListItem({
  title,
  preview,
  time,
  status,
  unread,
  isResponding,
  badge,
  avatar,
  onClick,
  selected,
  className,
  children,
}: ListItemProps) {
  const isInteractive = Boolean(onClick)

  // Use semantic HTML: button for interactive, div for static
  const Component = isInteractive ? 'button' : 'div'

  // Build accessibility props for interactive items
  const accessibilityProps = isInteractive
    ? {
        type: 'button' as const,
        'aria-pressed': selected,
        'aria-label': `${title}${unread ? ' (unread)' : ''}${isResponding ? ' (AI processing)' : ''}`,
      }
    : {}

  return (
    <Component
      onClick={onClick}
      {...accessibilityProps}
      className={cn(
        'w-full text-left px-5 py-4 border-b border-white/5 transition-colors',
        isInteractive && 'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500',
        selected && 'bg-white/10 ring-1 ring-white/20',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator */}
        <div className="pt-2">
          {unread ? (
            <StatusIndicator status="info" type="dot" />
          ) : (
            <span className="block w-2 h-2" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3
              className={cn(
                'text-sm truncate',
                unread ? 'font-semibold text-white' : 'font-medium text-zinc-300'
              )}
            >
              {title}
            </h3>
            {time && <span className="text-xs text-zinc-500 flex-shrink-0">{time}</span>}
          </div>

          {/* Preview */}
          {preview && (
            <p className="text-sm text-zinc-500 line-clamp-2 mb-2">{preview}</p>
          )}

          {/* Status Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {status && <StatusIndicator status={status} type="dot" size="sm" />}
            {badge}
            {isResponding && (
              <div className="flex items-center gap-1.5 text-xs text-white">
                <StatusIndicator status="info" type="ping" size="sm" />
                <span>AI 처리 중...</span>
              </div>
            )}
            {children}
          </div>
        </div>

        {/* Avatar */}
        {avatar && !isResponding && avatar}
      </div>
    </Component>
  )
}

interface ListItemAvatarProps {
  initial: string
  className?: string
}

/**
 * ListItemAvatar - 목록 아이템 아바타
 *
 * @example
 * <ListItem
 *   title="문서"
 *   avatar={<ListItemAvatar initial="T" />}
 * />
 */
export function ListItemAvatar({ initial, className }: ListItemAvatarProps) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full bg-gradient-to-br from-zinc-500/20 to-zinc-600/20',
        'flex items-center justify-center flex-shrink-0 ring-1 ring-white/10',
        className
      )}
    >
      <span className="text-xs font-medium text-white">{initial}</span>
    </div>
  )
}
