'use client'

import { Link } from '@/components/ui/link'
import { Checkbox, Field, Input, Label } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/16/solid'
import { clsx } from 'clsx'
import { useActionState, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/(auth)/login/actions'
import { clientLogger } from '@/lib/logger/client'

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
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-zinc-900/80 text-zinc-500">
            or
          </span>
        </div>
      </div>

      {/* OAuth buttons */}
      <div className="space-y-3">
        {/* Google sign in */}
        <button
          type="button"
          onClick={() => {
            window.location.href = '/api/auth/signin/google'
          }}
          className={clsx(
            'w-full h-11 rounded-lg text-sm font-medium',
            'bg-white text-zinc-900',
            'hover:bg-zinc-100',
            'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-zinc-950',
            'transition-all duration-200',
            'flex items-center justify-center gap-3'
          )}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {/* GitHub sign in */}
        <button
          type="button"
          onClick={() => {
            window.location.href = '/api/auth/signin/github'
          }}
          className={clsx(
            'w-full h-11 rounded-lg text-sm font-medium',
            'bg-zinc-800 text-white ring-1 ring-white/10',
            'hover:bg-zinc-700',
            'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-zinc-950',
            'transition-all duration-200',
            'flex items-center justify-center gap-3'
          )}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          Continue with GitHub
        </button>
      </div>

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
