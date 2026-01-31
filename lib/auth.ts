/**
 * NextAuth.js v5 Configuration
 *
 * QETTA 인증 시스템
 * - Credentials Provider (이메일/비밀번호)
 * - JWT 기반 세션 관리
 * - 보안 강화된 쿠키 설정
 * - 실제 DB 인증 (DATABASE_URL 설정 시)
 * - 데모 모드 (개발용)
 *
 * @see https://authjs.dev/getting-started/installation
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import type { NextAuthConfig } from 'next-auth'

import { ENV } from '@/lib/env/validate'
import { verifyPassword } from '@/lib/auth/password'
import { logger } from '@/lib/api/logger'

/**
 * Type augmentations are in src/types/next-auth.d.ts
 */

/**
 * OAuth 프로바이더 배열 구성
 * 환경 변수가 설정된 경우에만 활성화
 */
const oauthProviders = []

// Google OAuth (환경 변수 설정 시)
if (ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    Google({
      clientId: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
      // SECURITY: allowDangerousEmailAccountLinking 제거
      // 계정 연결은 signIn 콜백에서 안전하게 처리
    })
  )
}

// GitHub OAuth (환경 변수 설정 시)
if (ENV.GITHUB_CLIENT_ID && ENV.GITHUB_CLIENT_SECRET) {
  oauthProviders.push(
    GitHub({
      clientId: ENV.GITHUB_CLIENT_ID,
      clientSecret: ENV.GITHUB_CLIENT_SECRET,
      // SECURITY: allowDangerousEmailAccountLinking 제거
      // 계정 연결은 signIn 콜백에서 안전하게 처리
    })
  )
}

/**
 * NextAuth 설정
 *
 * - Credentials Provider (이메일/비밀번호)
 * - Google OAuth (설정 시)
 * - GitHub OAuth (설정 시)
 */
const authConfig: NextAuthConfig = {
  providers: [
    ...oauthProviders,
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 기본 검증
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // 이메일 형식 검증
        if (!email.includes('@')) {
          return null
        }

        // 비밀번호 길이 검증
        if (password.length < 4) {
          return null
        }

        /**
         * 실제 DB 인증 (DATABASE_URL 설정 시)
         *
         * 데이터베이스가 설정되어 있으면 Prisma로 사용자 조회
         * bcrypt로 비밀번호 검증
         */
        if (ENV.HAS_DATABASE) {
          try {
            // 동적 import로 순환 의존성 방지
            const { prisma } = await import('@/lib/db/prisma')

            const user = await prisma.user.findUnique({
              where: { email },
              select: {
                id: true,
                email: true,
                password: true,
                name: true,
                role: true,
              },
            })

            if (!user || !user.password) {
              // OAuth 전용 계정이거나 사용자 없음
              return null
            }

            // bcrypt로 비밀번호 검증
            const isValid = await verifyPassword(password, user.password)

            if (!isValid) {
              return null
            }

            // 인증 성공
            return {
              id: user.id,
              email: user.email,
              name: user.name ?? undefined,
              role: user.role.toLowerCase() as 'user' | 'admin',
            }
          } catch (error) {
            logger.error('[Auth] Database authentication error:', error)
            return null
          }
        }

        /**
         * 데모 모드 (DATABASE_URL 미설정 시)
         *
         * 개발 환경에서 DB 없이 테스트 가능
         * 모든 유효한 이메일/비밀번호 허용
         */
        logger.warn('[Auth] Running in DEMO mode - no database configured')

        return {
          id: `demo-${email.replace('@', '-at-')}`,
          email,
          name: email.split('@')[0],
          role: 'user' as const,
        }
      },
    }),
  ],

  /**
   * 세션 전략: JWT
   *
   * JWT는 stateless하며 서버리스 환경에 적합
   * maxAge: 30일 (rememberMe) 또는 1일 (기본)
   */
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1일 (기본)
  },

  /**
   * JWT 설정
   */
  jwt: {
    maxAge: 24 * 60 * 60, // 1일
  },

  /**
   * 페이지 설정
   */
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },

  /**
   * 콜백
   */
  callbacks: {
    /**
     * SignIn 콜백: OAuth 로그인 시 사용자 생성/연결
     */
    async signIn({ user, account, profile }) {
      // Credentials Provider는 이미 authorize에서 처리됨
      if (account?.provider === 'credentials') {
        return true
      }

      // OAuth Provider (Google, GitHub 등)
      if (account && ENV.HAS_DATABASE) {
        try {
          const { prisma } = await import('@/lib/db/prisma')

          // SECURITY: OAuth 제공자가 이메일을 제공하지 않으면 거부
          if (!user.email) {
            logger.error('[Auth] OAuth provider did not provide email:', {
              provider: account.provider,
            })
            return false
          }

          // 이메일로 기존 사용자 찾기
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (existingUser) {
            // SECURITY: 안전한 OAuth 계정 연결
            // 1. 사용자가 OAuth로만 생성된 경우 (password가 null) 또는
            // 2. 이메일이 인증된 경우 (이메일 소유권 증명)만 연결 허용
            const canLink = !existingUser.password || existingUser.emailVerified

            if (!canLink) {
              logger.warn('[Auth] OAuth linking blocked - unverified credentials account:', {
                email: user.email,
                provider: account.provider,
              })

              // 사용자에게 친절한 오류 메시지 반환
              return '/login?error=OAuthLinkingBlocked&message=이메일+인증이+필요합니다'
            }

            // 기존 OAuth 계정이 있는지 확인
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            })

            if (!existingAccount) {
              // OAuth 계정 연결
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state as string | undefined,
                },
              })

              // 감사 로그 기록
              await prisma.auditLog.create({
                data: {
                  userId: existingUser.id,
                  action: 'OAUTH_ACCOUNT_LINKED',
                  resource: 'Account',
                  resourceId: existingUser.id,
                  details: {
                    provider: account.provider,
                    linkedAt: new Date().toISOString(),
                  },
                  ipAddress: null,
                  userAgent: null,
                },
              })
            }

            // OAuth 로그인은 자동 인증됨 (제공자가 이메일을 검증함)
            if (!existingUser.emailVerified) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { emailVerified: new Date() },
              })
            }

            user.id = existingUser.id
            return true
          }

          // 새 사용자 생성 (이메일이 있음을 위에서 확인함)
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || profile?.name as string | null,
              image: user.image,
              emailVerified: new Date(), // OAuth는 이메일 자동 인증
              role: 'USER',
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state as string | undefined,
                },
              },
            },
          })

          user.id = newUser.id
          return true
        } catch (error) {
          logger.error('[Auth] OAuth sign-in error:', error)
          return false
        }
      }

      return true
    },

    /**
     * JWT 콜백: 토큰에 사용자 정보 추가
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email as string
        token.role = user.role
      }
      return token
    },

    /**
     * 세션 콜백: 클라이언트에 전달할 세션 정보
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.role = token.role as 'user' | 'admin' | undefined
      }
      return session
    },

    // Note: For route protection in NextAuth v4, use middleware.ts instead
  },

  /**
   * 이벤트 핸들러 (로깅 등)
   */
  events: {
    async signIn({ user }) {
      logger.debug(`[Auth] User signed in: ${user.email}`)
    },
    async signOut() {
      logger.debug('[Auth] User signed out')
    },
  },

  /**
   * 디버그 모드 (개발 환경에서만)
   */
  debug: process.env.NODE_ENV === 'development',

  /**
   * Trust Host 설정 (Vercel 배포용)
   */
  trustHost: true,
}

/**
 * NextAuth 인스턴스 생성 및 내보내기
 *
 * @example
 * // API Route에서 사용
 * import { handlers } from '@/lib/auth'
 * export const { GET, POST } = handlers
 *
 * @example
 * // Server Component에서 사용
 * import { auth } from '@/lib/auth'
 * const session = await auth()
 *
 * @example
 * // Middleware에서 사용
 * import { auth } from '@/lib/auth'
 * export default auth
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

/**
 * 타입 내보내기
 */
export type { Session } from 'next-auth'
