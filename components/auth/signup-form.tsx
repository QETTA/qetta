'use client'

import { Link } from '@/components/ui/link'
import { Checkbox, Field, Input, Label } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/16/solid'
import { clsx } from 'clsx'
import { useActionState, useEffect } from 'react'
import { clientLogger } from '@/lib/logger/client'
import { OAuthButtons, OAuthDivider } from './oauth-buttons'

/**
 * Signup form state type
 */
type SignupState = { error?: string }

const initialState: SignupState = {}

/**
 * SignupForm - Linear-style signup form
 *
 * Linear App design system:
 * - zinc color palette
 * - titanium silver accent
 * - semi-transparent input fields
 * - minimal typography
 */
export function SignupForm() {
  const [state, formAction, isPending] = useActionState<SignupState, FormData>(
    async (_prevState, formData) => {
      // Client-side validation
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      const confirmPassword = formData.get('confirm-password') as string
      const name = formData.get('name') as string

      if (!email || !password || !name) {
        return { error: 'Please fill in all fields.' }
      }

      if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' }
      }

      if (password.length < 8) {
        return { error: 'Password must be at least 8 characters.' }
      }

      try {
        // Call signup API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })

        const data = await response.json()

        if (!response.ok) {
          // API error handling
          clientLogger.warn('[Signup] API error:', data)

          // Use server-returned message if available
          if (data.message) {
            return { error: data.message }
          }

          // Default messages by error code
          switch (data.code) {
            case 'EMAIL_EXISTS':
              return { error: 'This email is already registered.' }
            case 'WEAK_PASSWORD':
              return { error: data.errors?.join(', ') || 'Password does not meet requirements.' }
            case 'INVALID_EMAIL':
              return { error: 'Please enter a valid email address.' }
            case 'DATABASE_NOT_CONFIGURED':
              return { error: 'Registration is currently unavailable.' }
            default:
              return { error: 'An error occurred during registration.' }
          }
        }

        // Signup success
        clientLogger.info('[Signup] Success:', { email })

        // Redirect to login page on success
        window.location.href = '/login?registered=true'

        return {}
      } catch (error) {
        clientLogger.error('[Signup] Network error:', error)
        return { error: 'Network error. Please try again.' }
      }
    },
    initialState
  )

  const errorMessage = state.error || null

  useEffect(() => {
    if (errorMessage) {
      clientLogger.warn('[Signup] Error:', errorMessage)
    }
  }, [errorMessage])

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Sign up
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Create your account to get started
        </p>
      </div>

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
        {/* Name field */}
        <Field className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-zinc-300">
            Name
          </Label>
          <Input
            required
            autoFocus
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            placeholder="John Doe"
            disabled={isPending}
            aria-describedby="name-hint"
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
          <span id="name-hint" className="sr-only">Enter your name</span>
        </Field>

        {/* Email field */}
        <Field className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
            Email
          </Label>
          <Input
            required
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
            autoComplete="new-password"
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
          <span id="password-hint" className="text-xs text-zinc-500">
            At least 8 characters
          </span>
        </Field>

        {/* Confirm password field */}
        <Field className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium text-zinc-300">
            Confirm password
          </Label>
          <Input
            required
            type="password"
            name="confirm-password"
            id="confirm-password"
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-describedby="confirm-password-hint"
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
          <span id="confirm-password-hint" className="sr-only">Confirm your password</span>
        </Field>

        {/* Terms agreement */}
        <Field className="flex items-start gap-2">
          <Checkbox
            name="terms"
            disabled={isPending}
            className={clsx(
              'group block size-4 rounded border border-white/20 bg-zinc-900/50 mt-0.5',
              'data-checked:bg-zinc-500 data-checked:border-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-white/30',
              'disabled:opacity-50',
              'transition-colors duration-150'
            )}
          >
            <CheckIcon className="fill-white opacity-0 group-data-checked:opacity-100 size-3" />
          </Checkbox>
          <Label className="text-sm text-zinc-400 cursor-pointer leading-tight">
            I agree to the{' '}
            <Link
              href="/company"
              className="text-white hover:text-zinc-300 transition-colors"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/company"
              className="text-white hover:text-zinc-300 transition-colors"
            >
              Privacy Policy
            </Link>
          </Label>
        </Field>

        {/* Sign up button */}
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
              Creating account...
            </span>
          ) : (
            'Sign up'
          )}
        </button>
      </form>

      {/* OAuth divider */}
      <OAuthDivider />

      {/* OAuth buttons */}
      <OAuthButtons disabled={isPending} />

      {/* Sign in link */}
      <div className="mt-8 text-center text-sm">
        <span className="text-zinc-500">Already have an account?</span>{' '}
        <Link
          href="/login"
          className="text-white hover:text-zinc-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
