import NextLink, { type LinkProps } from 'next/link'
import { forwardRef } from 'react'
import clsx from 'clsx'

export const Link = forwardRef(function Link(
  { className, ...props }: LinkProps & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <NextLink
      ref={ref}
      className={clsx(
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm',
        className
      )}
      {...props}
    />
  )
})
