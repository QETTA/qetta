'use client'

import { Link } from '@/components/ui/link'
import { clsx } from 'clsx'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clientLogger } from '@/lib/logger/client'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

/**
 * VerifyEmailForm - Linear-style email verification form
 *
 * Linear App design system:
 * - zinc color palette
 * - titanium silver accent
 * - minimal typography
 */
export function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'already_verified'>(
    'verifying'
  )
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.message || 'Failed to verify your email.')
          clientLogger.warn('[VerifyEmail] Verification failed:', data)
          return
        }

        if (data.alreadyVerified) {
          setStatus('already_verified')
          setMessage('This email is already verified.')
        } else {
          setStatus('success')
          setMessage('Your email has been verified.')
        }

        clientLogger.info('[VerifyEmail] Verification success')

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true')
        }, 3000)
      } catch (error) {
        clientLogger.error('[VerifyEmail] Verification error:', error)
        setStatus('error')
        setMessage('Network error.')
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Email verification</h1>
        <p className="text-sm text-zinc-400">
          {status === 'verifying' ? 'Verifying your email...' : ''}
        </p>
      </div>

      {/* Verification status */}
      <div className="text-center">
        {status === 'verifying' && (
          <div>
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-zinc-500 border-r-transparent mb-4" />
            <p className="text-sm text-zinc-400">Verifying...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <CheckCircleIcon className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Verified!</h2>
            <p className="text-sm text-zinc-400 mb-4">{message}</p>
            <p className="text-xs text-zinc-500">Redirecting to sign in...</p>
          </div>
        )}

        {status === 'already_verified' && (
          <div>
            <CheckCircleIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Already verified</h2>
            <p className="text-sm text-zinc-400 mb-4">{message}</p>
            <p className="text-xs text-zinc-500">Redirecting to sign in...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Verification failed</h2>
            <p className="text-sm text-zinc-400 mb-6">{message}</p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/login'}
                className={clsx(
                  'w-full h-11 rounded-lg text-sm font-semibold',
                  'bg-zinc-600 text-white',
                  'hover:bg-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-zinc-950',
                  'transition-all duration-200'
                )}
              >
                Go to sign in
              </button>

              <Link
                href="/signup"
                className="block text-center text-sm text-white hover:text-zinc-300 transition-colors"
              >
                Sign up again
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="mt-8 text-center">
        <p className="text-xs text-zinc-500">
          If problems persist,{' '}
          <Link
            href="mailto:support@qetta.co.kr"
            className="text-white hover:text-zinc-300"
          >
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
