'use server'

/**
 * Server Action: Register User
 *
 * 사용자 등록
 * Replaces: POST /api/auth/register
 *
 * Features:
 * - Email/Password 등록
 * - bcrypt 해싱
 * - 이메일 중복 체크
 *
 * @see lib/auth for NextAuth configuration
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/api/logger'

interface RegisterUserParams {
  email: string
  password: string
  name?: string
}

export async function registerUser(params: RegisterUserParams) {
  try {
    const { email, password, name } = params

    // Validation
    if (!email || !password) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'email and password are required',
        },
      }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format',
        },
      }
    }

    // Password strength check (min 8 characters)
    if (password.length < 8) {
      return {
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters',
        },
      }
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
        },
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'USER',
      },
    })

    // Revalidate auth pages
    revalidatePath('/login')

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: '회원가입 완료',
    }
  } catch (error) {
    logger.error('[User Registration Error]', error)

    return {
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
