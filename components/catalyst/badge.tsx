import clsx from 'clsx'

const colors = {
  red: 'bg-red-500/10 text-red-400',
  orange: 'bg-orange-500/10 text-orange-400',
  amber: 'bg-amber-400/10 text-amber-400',
  yellow: 'bg-yellow-400/10 text-yellow-300',
  lime: 'bg-lime-400/10 text-lime-300',
  green: 'bg-green-500/10 text-green-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  teal: 'bg-teal-500/10 text-teal-300',
  cyan: 'bg-cyan-400/10 text-cyan-300',
  sky: 'bg-sky-500/10 text-sky-300',
  blue: 'bg-blue-500/10 text-blue-400',
  indigo: 'bg-indigo-500/10 text-indigo-400',
  violet: 'bg-zinc-500/10 text-zinc-400',
  purple: 'bg-purple-500/10 text-purple-400',
  fuchsia: 'bg-fuchsia-400/10 text-fuchsia-400',
  pink: 'bg-pink-400/10 text-pink-400',
  rose: 'bg-rose-400/10 text-rose-400',
  zinc: 'bg-white/5 text-zinc-400',
}

type BadgeProps = { color?: keyof typeof colors }

export function Badge({ color = 'zinc', className, ...props }: BadgeProps & React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      className={clsx(
        className,
        'inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-sm/5 font-medium sm:text-xs/5',
        colors[color]
      )}
    />
  )
}
