/**
 * Email Service
 *
 * Centralized email sending service using Resend
 * @module lib/email/service
 */

import { Resend } from 'resend'
import { render } from '@react-email/components'
import { ENV } from '@/lib/env/validate'
import { logger } from '@/lib/api/logger'
import VerificationEmail from '@/emails/verification-email'
import PasswordResetEmail from '@/emails/password-reset-email'

/**
 * Custom error thrown when email service is not configured
 */
export class EmailNotConfiguredError extends Error {
  constructor(message = 'Email service not configured - RESEND_API_KEY is missing') {
    super(message)
    this.name = 'EmailNotConfiguredError'
  }
}

/**
 * Custom error thrown when email sending fails
 */
export class EmailSendError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message)
    this.name = 'EmailSendError'
  }
}

/**
 * Resend 클라이언트 초기화
 */
let resend: Resend | null = null

function getResendClient(): Resend | null {
  if (!ENV.RESEND_API_KEY) {
    logger.warn('[Email] RESEND_API_KEY not configured - email sending disabled')
    return null
  }

  if (!resend) {
    resend = new Resend(ENV.RESEND_API_KEY)
  }

  return resend
}

/**
 * 발신자 이메일 주소
 * Resend에서 검증된 도메인 사용 (실제 배포 시 변경 필요)
 */
const FROM_EMAIL = 'QETTA <onboarding@resend.dev>'

/**
 * 이메일 인증 메일 발송
 *
 * @param to - 수신자 이메일
 * @param verificationUrl - 인증 링크 URL
 * @throws {EmailNotConfiguredError} RESEND_API_KEY가 설정되지 않은 경우
 * @throws {EmailSendError} 이메일 발송에 실패한 경우
 *
 * @example
 * ```ts
 * try {
 *   await sendVerificationEmail(
 *     'user@example.com',
 *     'https://qetta.com/verify-email?token=abc123'
 *   )
 * } catch (error) {
 *   if (error instanceof EmailNotConfiguredError) {
 *     // Handle missing configuration
 *   } else if (error instanceof EmailSendError) {
 *     // Handle send failure
 *   }
 * }
 * ```
 */
export async function sendVerificationEmail(
  to: string,
  verificationUrl: string
): Promise<void> {
  const client = getResendClient()

  // Resend가 설정되지 않은 경우
  if (!client) {
    logger.warn('[Email] Resend not configured - cannot send email:', {
      to,
      verificationUrl,
    })
    throw new EmailNotConfiguredError()
  }

  try {
    // React Email 템플릿 렌더링
    const emailHtml = await render(
      VerificationEmail({
        verificationUrl,
        email: to,
      })
    )

    // Resend로 이메일 발송
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'QETTA 이메일 인증',
      html: emailHtml,
    })

    if (error) {
      logger.error('[Email] Failed to send verification email:', error)
      throw new EmailSendError('Failed to send verification email', error)
    }

    logger.info('[Email] Verification email sent:', {
      to,
      messageId: data?.id,
    })
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof EmailNotConfiguredError || error instanceof EmailSendError) {
      throw error
    }

    // Wrap unexpected errors
    logger.error('[Email] Unexpected error sending verification email:', error)
    throw new EmailSendError('Unexpected error sending verification email', error)
  }
}

/**
 * 비밀번호 재설정 메일 발송
 *
 * @param to - 수신자 이메일
 * @param resetUrl - 재설정 링크 URL
 * @throws {EmailNotConfiguredError} RESEND_API_KEY가 설정되지 않은 경우
 * @throws {EmailSendError} 이메일 발송에 실패한 경우
 *
 * @example
 * ```ts
 * try {
 *   await sendPasswordResetEmail(
 *     'user@example.com',
 *     'https://qetta.com/reset-password?token=xyz789'
 *   )
 * } catch (error) {
 *   if (error instanceof EmailNotConfiguredError) {
 *     // Handle missing configuration
 *   } else if (error instanceof EmailSendError) {
 *     // Handle send failure
 *   }
 * }
 * ```
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const client = getResendClient()

  // Resend가 설정되지 않은 경우
  if (!client) {
    logger.warn('[Email] Resend not configured - cannot send email:', {
      to,
      resetUrl,
    })
    throw new EmailNotConfiguredError()
  }

  try {
    // React Email 템플릿 렌더링
    const emailHtml = await render(
      PasswordResetEmail({
        resetUrl,
        email: to,
      })
    )

    // Resend로 이메일 발송
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'QETTA 비밀번호 재설정',
      html: emailHtml,
    })

    if (error) {
      logger.error('[Email] Failed to send password reset email:', error)
      throw new EmailSendError('Failed to send password reset email', error)
    }

    logger.info('[Email] Password reset email sent:', {
      to,
      messageId: data?.id,
    })
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof EmailNotConfiguredError || error instanceof EmailSendError) {
      throw error
    }

    // Wrap unexpected errors
    logger.error('[Email] Unexpected error sending password reset email:', error)
    throw new EmailSendError('Unexpected error sending password reset email', error)
  }
}
