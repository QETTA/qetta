'use client'

import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { Link } from './link'

const styles = {
  base: [
    'relative isolate inline-flex items-baseline justify-center gap-x-2 rounded-lg border text-base/6 font-semibold',
    'px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] sm:text-sm/6',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    '*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:my-0.5 *:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center sm:*:data-[slot=icon]:my-1 sm:*:data-[slot=icon]:size-4',
  ],
  solid: [
    'border-transparent bg-zinc-600',
    'text-white',
    'hover:bg-zinc-500',
  ],
  outline: [
    'border-zinc-700 text-white',
    'hover:border-zinc-500',
  ],
  plain: [
    'border-transparent text-white',
    'hover:bg-white/10',
  ],
  colors: {
    'dark/zinc': [
      'text-white bg-zinc-600 border-zinc-700/90',
      'hover:bg-zinc-500',
    ],
    primary: [
      'text-white bg-zinc-600 border-zinc-700/90',
      'hover:bg-zinc-500',
    ],
    emerald: [
      'text-white bg-emerald-600 border-emerald-700/90',
      'hover:bg-emerald-500',
    ],
    red: [
      'text-white bg-red-600 border-red-700/90',
      'hover:bg-red-500',
    ],
    amber: [
      'text-amber-950 bg-amber-400 border-amber-500/80',
      'hover:bg-amber-300',
    ],
    zinc: [
      'text-white bg-zinc-600 border-zinc-700/90',
      'hover:bg-zinc-500',
    ],
  },
}

type ButtonProps = (
  | { color?: keyof typeof styles.colors; outline?: never; plain?: never }
  | { color?: never; outline: true; plain?: never }
  | { color?: never; outline?: never; plain: true }
) & { className?: string; children: React.ReactNode } & (
    | ({ href?: never } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>)
    | ({ href: string } & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>)
  )

export const Button = forwardRef(function Button(
  { color, outline, plain, className, children, ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLElement>
) {
  const classes = clsx(
    className,
    styles.base,
    outline ? styles.outline : plain ? styles.plain : clsx(styles.solid, styles.colors[color ?? 'dark/zinc'])
  )

  return typeof props.href === 'string' ? (
    <Link {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <TouchTarget>{children}</TouchTarget>
    </Link>
  ) : (
    <button {...props} className={clsx(classes, 'cursor-default')} ref={ref as React.ForwardedRef<HTMLButtonElement>}>
      <TouchTarget>{children}</TouchTarget>
    </button>
  )
})

export function TouchTarget({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span
        className="absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 pointer-fine:hidden"
        aria-hidden="true"
      />
      {children}
    </>
  )
}
