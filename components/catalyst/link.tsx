'use client'

import NextLink from 'next/link'
import React, { forwardRef } from 'react'
import clsx from 'clsx'

export const Link = forwardRef(function Link(
  { className, ...props }: { href: string } & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <NextLink
      {...props}
      ref={ref}
      className={clsx(
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-sm',
        className
      )}
    />
  )
})
