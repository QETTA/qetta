'use client'

import { Link } from '@/components/ui/link'
import { Field, Input, Label } from '@headlessui/react'
import { clsx } from 'clsx'
import { useSearchParams, useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { clientLogger } from '@/lib/logger/client'

/**
 * Reset password form state type
 */
type ResetPasswordState = { error?: string; success?: boolean }

const initialState: ResetPasswordState = {}

/**
 * ResetPasswordForm - Linear-style reset password form
 *
 * Linear App design system:
 * - zinc color palette
 * - titanium silver accent
 * - semi-transparent input fields
 * - minimal typography
 */
export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [state, formAction, isPending] = useActionState<ResetPasswordState, FormData>(
    async (_prevState, formData) => {
      const newPassword = formData.get('password') as string
      const confirmPassword = formData.get('confirm-password') as string

      // Client-side validation
      if (!newPassword || !confirmPassword) {
        return { error: 'Please fill in all fields.' }
      }

      if (newPassword !== confirmPassword) {
        return { error: 'Passwords do not match.' }
      }

      if (newPassword.length < 8) {
        return { error: 'Password must be at least 8 characters.' }
      }

      if (!token) {
        return { error: 'Invalid link.' }
      }

      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword }),
        })

        const data = await response.json()

        if (!response.ok) {
          clientLogger.warn('[ResetPassword] API error:', data)
          return { error: data.message || 'Failed to reset password.' }
        }

        clientLogger.info('[ResetPassword] Success')

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login?reset=true')
        }, 3000)

        return { success: true }
      } catch (error) {
        clientLogger.error('[ResetPassword] Network error:', error)
        return { error: 'Network error. Please try again.' }
      }
    },
    initialState
  )

  const errorMessage = state.error
  const successMessage = state.success

  useEffect(() => {
    if (errorMessage) {
      clientLogger.warn('[ResetPassword] Error:', errorMessage)
    }
  }, [errorMessage])

  // No token case
  if (!token) {
    return (
      <div className="w-full text-center">
        <div className="mb-4">
          <svg
            className="h-12 w-12 text-red-400 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Invalid link
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          This password reset link is invalid.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-white hover:text-zinc-300 font-medium transition-colors"
        >
          Request new link
        </Link>
      </div>
    )
  }

  // Success message
  if (successMessage) {
    return (
      <div className="w-full text-center">
        <div className="mb-4">
          <svg
            className="h-12 w-12 text-emerald-400 mx-auto"
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
        <h2 className="text-lg font-semibold text-white mb-2">
          Password reset successful
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          You can now sign in with your new password.
        </p>
        <p className="text-xs text-zinc-500">
          Redirecting to sign in...
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Set new password</h1>
        <p className="text-sm text-zinc-400">
          Enter your new password.
        </p>
      </div>

      {/* Form */}
      <form action={formAction} className="space-y-5">
        {/* New password */}
        <Field className="space-y-2">
          <Label className="text-sm font-medium text-zinc-300">
            New password
          </Label>
          <Input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            autoFocus
            disabled={isPending}
            placeholder="••••••••"
            className={clsx(
              'block w-full h-11 rounded-lg bg-zinc-900/50 text-white',
              'ring-1 ring-white/10 placeholder:text-zinc-500',
              'px-4 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-zinc-900/70',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
          />
          <p className="text-xs text-zinc-500">
            At least 8 characters
          </p>
        </Field>

        {/* Confirm password */}
        <Field className="space-y-2">
          <Label className="text-sm font-medium text-zinc-300">
            Confirm password
          </Label>
          <Input
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            required
            disabled={isPending}
            placeholder="••••••••"
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
              Saving...
            </span>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      {/* Additional options */}
      <div className="mt-8 text-center text-sm">
        <Link
          href="/login"
          className="text-white hover:text-zinc-300 font-medium transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
