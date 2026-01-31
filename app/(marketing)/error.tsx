'use client'

import { Button } from '@/components/catalyst/button'
import { CTA_LABELS } from '@/constants/messages'

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm font-medium text-red-400">An error occurred</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Unable to load page
        </h1>
        <p className="mt-4 text-sm text-zinc-400">
          {error.message || 'A temporary issue occurred. Please try again later.'}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={reset}>{CTA_LABELS.RETRY}</Button>
          <Button href="/" outline>
            {CTA_LABELS.HOME}
          </Button>
        </div>
      </div>
    </div>
  )
}
