/**
 * Dashboard Icons - Barrel Export
 * Re-exports icons needed by dashboard components
 */

export { MailIcon as EnvelopeIcon } from './mail-icon'
export { CogIcon as SettingsIcon } from './cog-icon'
export { ChevronIcon as ChevronDownIcon } from './chevron-icon'
export { AtSymbolIcon } from './at-symbol-icon'
export { PlusIcon } from './plus-icon'
export { InboxIcon as InboxEmptyIcon } from './inbox-icon'
export { PencilOnSquareIcon as PencilIcon } from './pencil-on-square-icon'

// DotsVerticalIcon - create inline since it doesn't exist
import { clsx } from 'clsx/lite'
import type { ComponentProps } from 'react'

export function DotsVerticalIcon({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 13 13"
      fill="none"
      strokeWidth={1}
      role="img"
      className={clsx('inline-block', className)}
      {...props}
    >
      <circle cx="6.5" cy="2.5" r="1" fill="currentColor" />
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="6.5" cy="10.5" r="1" fill="currentColor" />
    </svg>
  )
}
