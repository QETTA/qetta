'use client'

import { Link } from '@/components/ui/link'
import { Checkbox, Field, Input, Label } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/16/solid'
import { clsx } from 'clsx'
import { useActionState, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/(auth)/login/actions'
import { clientLogger } from '@/lib/logger/client'
import { OAuthButtons, OAuthDivider } from './oauth-buttons'

/**
 * Login form state type
 */
type LoginState = { error: string } | Record<string, never>

const initialState: LoginState = {}

/**
 * LoginForm - Linear-style login form
 *
 * Linear App design system:
 * - zinc color palette
 * - titanium silver accent
 * - semi-transparent input fields
 * - minimal typography
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const [showRegisteredMessage, setShowRegisteredMessage] = useState(false)

  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    async (_prevState, formData) => {
      const result = await login(formData)
      return result ?? {}
    },
    initialState
  )

  const errorMessage = 'error' in state ? state.error : null

  // Show registration success message
  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      setShowRegisteredMessage(true)
      const timer = setTimeout(() => setShowRegisteredMessage(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  useEffect(() => {
    if (errorMessage) {
      clientLogger.warn('[Login] Error:', errorMessage)
    }
  }, [errorMessage])

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in to your account
        </p>
      </div>

      {/* Registration success message */}
      {showRegisteredMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 ring-1 ring-emerald-500/20"
        >
          Account created! Sign in with your email and password.
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/20"
        >
          {errorMessage}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        {/* Email field */}
        <Field className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
            Email
          </Label>
          <Input
            required
            autoFocus
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            placeholder="you@company.com"
            disabled={isPending}
            aria-describedby="email-hint"
            aria-invalid={errorMessage ? 'true' : undefined}
            className={clsx(
              'block w-full h-11 rounded-lg bg-zinc-900/50 text-white',
              'ring-1 ring-white/10 placeholder:text-zinc-500',
              'px-4 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-zinc-900/70',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
          />
          <span id="email-hint" className="sr-only">Enter your email</span>
        </Field>

        {/* Password field */}
        <Field className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-zinc-300">
            Password
          </Label>
          <Input
            required
            type="password"
            name="password"
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-describedby="password-hint"
            aria-invalid={errorMessage ? 'true' : undefined}
            className={clsx(
              'block w-full h-11 rounded-lg bg-zinc-900/50 text-white',
              'ring-1 ring-white/10 placeholder:text-zinc-500',
              'px-4 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-zinc-900/70',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
          />
          <span id="password-hint" className="sr-only">Enter your password</span>
        </Field>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between text-sm">
          <Field className="flex items-center gap-2">
            <Checkbox
              name="remember-me"
              disabled={isPending}
              className={clsx(
                'group block size-4 rounded border border-white/20 bg-zinc-900/50',
                'data-checked:bg-zinc-500 data-checked:border-zinc-500',
                'focus:outline-none focus:ring-2 focus:ring-white/30',
                'disabled:opacity-50',
                'transition-colors duration-150'
              )}
            >
              <CheckIcon className="fill-white opacity-0 group-data-checked:opacity-100 size-3" />
            </Checkbox>
            <Label className="text-zinc-400 cursor-pointer select-none">
              Remember me
            </Label>
          </Field>
          <Link
            href="/forgot-password"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Sign in button */}
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
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* OAuth divider */}
      <OAuthDivider />

      {/* OAuth buttons */}
      <OAuthButtons disabled={isPending} />

      {/* Sign up link */}
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
