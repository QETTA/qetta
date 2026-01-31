/**
 * NextAuth.js Type Augmentations
 *
 * Extends NextAuth types to include custom user properties
 * See: https://next-auth.js.org/getting-started/typescript
 */

import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Extend the User type to include custom properties
   */
  interface User {
    id: string
    email: string
    name?: string
    role?: 'user' | 'admin'
  }

  /**
   * Extend the Session type to include custom user properties
   */
  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      name?: string
      role?: 'user' | 'admin'
    }
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the JWT type to include custom token properties
   */
  interface JWT {
    id: string
    email: string
    role?: 'user' | 'admin'
  }
}
