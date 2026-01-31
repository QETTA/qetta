'use client'

import { useState, FormEvent } from 'react'
import { cn } from '@/lib/utils'

export function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="mt-8 max-w-md">
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-emerald-400">Subscribed! Check your inbox.</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-md">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={cn(
            'flex-1 h-11 px-4 rounded-lg text-sm',
            'bg-white/5 border border-white/10',
            'text-white placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20',
            'transition-all'
          )}
          required
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'h-11 px-5 rounded-lg text-sm font-medium',
            'bg-zinc-800 text-white border border-white/10',
            'hover:bg-zinc-700 hover:border-white/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all'
          )}
        >
          {status === 'loading' ? '...' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-400">Something went wrong. Try again.</p>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        Get weekly government tender updates. No spam.
      </p>
    </form>
  )
}
