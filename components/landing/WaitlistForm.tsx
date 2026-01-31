'use client'

import { useState, FormEvent, useEffect } from 'react'
import { INDUSTRY_BLOCKS } from './IndustryBlockGrid'
import { cn } from '@/lib/utils'

// ============================================================================
// Type Definitions
// ============================================================================

/** Form submission status states */
type FormStatus = 'idle' | 'loading' | 'success' | 'error'

/** Form data structure for beta waitlist registration */
interface FormData {
  email: string
  name: string
  company: string
  industry: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * WaitlistForm
 *
 * CSS-based animation (framer-motion alternative)
 * Beta program waitlist registration form component
 *
 * @see {@link INDUSTRY_BLOCKS} Industry domain list
 */
export function WaitlistForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    company: '',
    industry: '',
  })
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  // Success state transition animation
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => setShowSuccess(true), 50)
      return () => clearTimeout(timer)
    } else {
      setShowSuccess(false)
    }
  }, [status])

  // Error display animation
  useEffect(() => {
    if (status === 'error' && errorMessage) {
      setShowError(true)
    } else {
      setShowError(false)
    }
  }, [status, errorMessage])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/beta/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setErrorMessage('This email is already registered.')
        } else {
          setErrorMessage(data.error || 'An error occurred.')
        }
        setStatus('error')
        return
      }

      setStatus('success')
      setFormData({ email: '', name: '', company: '', industry: '' })
    } catch {
      setErrorMessage('A network error occurred.')
      setStatus('error')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Success State */}
      {status === 'success' ? (
        <div
          className={cn(
            'text-center p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20',
            'transition-all duration-300',
            showSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
        >
          <div
            className={cn(
              'w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center',
              'transition-transform duration-500 delay-100',
              showSuccess ? 'scale-100' : 'scale-0'
            )}
          >
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Application Complete!</h3>
          <p className="text-zinc-400">We will notify you by email when the beta launches.</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Register with a different email
          </button>
        </div>
      ) : (
        /* Form State */
        <form
          onSubmit={handleSubmit}
          className="space-y-4 transition-opacity duration-200"
        >
          {/* Email (required) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@company.com"
              className="w-full px-4 py-3 bg-zinc-800/50 text-white rounded-xl ring-1 ring-white/10 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500 transition-all outline-none"
            />
          </div>

          {/* Name (optional) */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-zinc-800/50 text-white rounded-xl ring-1 ring-white/10 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500 transition-all outline-none"
            />
          </div>

          {/* Company (optional) */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Company
            </label>
            <input
              type="text"
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Acme Inc."
              className="w-full px-4 py-3 bg-zinc-800/50 text-white rounded-xl ring-1 ring-white/10 focus:ring-2 focus:ring-white/30 placeholder:text-zinc-500 transition-all outline-none"
            />
          </div>

          {/* Industry (optional) */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Industry of Interest
            </label>
            <select
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-800/50 text-white rounded-xl ring-1 ring-white/10 focus:ring-2 focus:ring-white/30 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">Select (optional)</option>
              {INDUSTRY_BLOCKS.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.icon} {block.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error message */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              showError ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMessage}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className={cn(
              'w-full px-6 py-3.5 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-700/50',
              'text-white font-medium rounded-xl transition-all duration-150',
              'hover:scale-[1.02] active:scale-[0.98]',
              'relative overflow-hidden'
            )}
          >
            {status === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Registering...
              </span>
            ) : (
              'Apply for Beta Program'
            )}
          </button>

          <p className="text-xs text-zinc-500 text-center">
            Your information will only be used for beta program notifications.
          </p>
        </form>
      )}
    </div>
  )
}
