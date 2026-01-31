import { memo, type ComponentProps } from 'react'

type IconProps = ComponentProps<'svg'>

/**
 * QETTA Logo Icon
 *
 * Diamond-shaped logo icon for QETTA branding.
 * Memoized for performance in frequently re-rendered contexts.
 *
 * @example
 * <QettaLogoIcon className="w-6 h-6 text-white" />
 */
export const QettaLogoIcon = memo(function QettaLogoIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z" />
    </svg>
  )
})
