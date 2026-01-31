'use client'

import { Link } from '@/components/ui/link'
import { Field, Input, Label } from '@headlessui/react'
import { clsx } from 'clsx'
import { useActionState, useEffect } from 'react'
import { clientLogger } from '@/lib/logger/client'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'

/**
 * Forgot password form state type
 */
type ForgotPasswordState = { error?: string; success?: boolean; resetUrl?: string }

const initialState: ForgotPasswordState = {}

/**
 * ForgotPasswordForm - Linear-style forgot password form
 *
 * Linear App design system:
 * - zinc color palette
 * - titanium silver accent
 * - semi-transparent input fields
 * - minimal typography
 */
export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<ForgotPasswordState, FormData>(
    async (_prevState, formData) => {
      const email = formData.get('email') as string

      if (!email) {
        return { error: 'Please enter your email address.' }
      }

      if (!email.includes('@')) {
        return { error: 'Please enter a valid email address.' }
      }

      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (!response.ok) {
          clientLogger.warn('[ForgotPassword] API error:', data)
          return { error: data.message || 'Failed to request password reset.' }
        }

        clientLogger.info('[ForgotPassword] Success:', { email })

        return {
          success: true,
          resetUrl: data.resetUrl, // dev only
        }
      } catch (error) {
        clientLogger.error('[ForgotPassword] Network error:', error)
        return { error: 'Network error. Please try again.' }
      }
    },
    initialState
  )

  const errorMessage = state.error
  const successMessage = state.success

  useEffect(() => {
    if (errorMessage) {
      clientLogger.warn('[ForgotPassword] Error:', errorMessage)
    }
  }, [errorMessage])

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to sign in
        </Link>

        <h1 className="text-2xl font-semibold text-white mb-2">Forgot password</h1>
        <p className="text-sm text-zinc-400">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg bg-emerald-500/10 p-6 ring-1 ring-emerald-500/20 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">
                Check your email
              </h3>
              <p className="text-sm text-zinc-400 mb-3">
                We've sent a password reset link to your email.
              </p>
              {state.resetUrl && (
                <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg ring-1 ring-white/10">
                  <p className="text-xs text-zinc-500 mb-2">Development mode - Test link:</p>
                  <a
                    href={state.resetUrl}
                    className="text-xs text-white hover:text-zinc-300 break-all"
                  >
                    {state.resetUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {!successMessage && (
        <form action={formAction} className="space-y-6">
          <Field className="space-y-2">
            <Label className="text-sm font-medium text-zinc-300">
              Email address
            </Label>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              required
              autoFocus
              disabled={isPending}
              placeholder="your@email.com"
              className={clsx(
                'block w-full h-11 rounded-lg bg-zinc-900/50 text-white',
                'ring-1 ring-white/10 placeholder:text-zinc-500',
                'px-4 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-zinc-900/70',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            />
          </Field>

          {/* Error message */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/20"
            >
              {errorMessage}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            className={clsx(
              'w-full h-11 rounded-lg text-sm font-semibold',
              'bg-zinc-600 text-white',
              'hover:bg-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-950',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </span>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      )}

      {/* Additional options */}
      <div className="mt-8 text-center text-sm">
        <span className="text-zinc-500">Don't have an account?</span>{' '}
        <Link
          href="/signup"
          className="text-white hover:text-zinc-300 font-medium transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}
