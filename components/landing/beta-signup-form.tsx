'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
  { id: 'food', name: 'Food & Beverage' },
  { id: 'textile', name: 'Textile' },
  { id: 'metal', name: 'Metal & Machinery' },
  { id: 'chemical', name: 'Chemical' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'automotive', name: 'Automotive' },
  { id: 'energy', name: 'Energy' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'consulting', name: 'Consulting' },
  { id: 'other', name: 'Other' },
] as const

interface FormData {
  email: string
  name: string
  company: string
  industry: string
}

export function BetaSignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    company: '',
    industry: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/beta/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'beta-landing',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to sign up')
      }

      setStatus('success')

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/docs')
      }, 1500)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Welcome to QETTA Beta</h3>
        <p className="text-zinc-400 mb-4">Redirecting to dashboard...</p>
        <div className="w-8 h-8 mx-auto border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-white">Join Beta Program</h2>
        <p className="text-zinc-400 mt-2">Get instant access to QETTA dashboard</p>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Your Name
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="John Doe"
          className={cn(
            'w-full h-11 px-4 rounded-lg text-sm',
            'bg-zinc-900/50 border border-zinc-800',
            'text-white placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-700',
            'transition-all'
          )}
          required
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Work Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="you@company.com"
          className={cn(
            'w-full h-11 px-4 rounded-lg text-sm',
            'bg-zinc-900/50 border border-zinc-800',
            'text-white placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-700',
            'transition-all'
          )}
          required
        />
      </div>

      {/* Company */}
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Company Name
        </label>
        <input
          id="company"
          type="text"
          value={formData.company}
          onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
          placeholder="Acme Corp"
          className={cn(
            'w-full h-11 px-4 rounded-lg text-sm',
            'bg-zinc-900/50 border border-zinc-800',
            'text-white placeholder:text-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-700',
            'transition-all'
          )}
          required
        />
      </div>

      {/* Industry */}
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Industry
        </label>
        <select
          id="industry"
          value={formData.industry}
          onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
          className={cn(
            'w-full h-11 px-4 rounded-lg text-sm',
            'bg-zinc-900/50 border border-zinc-800',
            'text-white',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-700',
            'transition-all'
          )}
          required
        >
          <option value="" disabled>
            Select your industry
          </option>
          {INDUSTRIES.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {ind.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {status === 'error' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className={cn(
          'w-full h-11 rounded-lg text-sm font-medium',
          'bg-white text-zinc-900',
          'hover:bg-zinc-100',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all'
        )}
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
            Signing up...
          </span>
        ) : (
          'Get Instant Access'
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-zinc-500 text-center">
        By signing up, you agree to our Terms of Service and Privacy Policy.
        <br />
        Beta access is free during the trial period.
      </p>
    </form>
  )
}
