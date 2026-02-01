/**
 * KidsMap Supabase Server Client
 *
 * For coupon cache and places data via Supabase (separate from Prisma).
 * Returns a mock client if Supabase credentials are not configured.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockResult: any = Promise.resolve({
  data: null,
  error: { message: 'Supabase not configured' },
})

const mockClient = {
  from: () => ({
    select: () => ({
      order: () => mockResult,
      eq: () => ({
        gte: () => ({
          order: () => ({
            limit: () => ({
              single: () => mockResult,
            }),
          }),
        }),
      }),
      single: () => mockResult,
    }),
    insert: () => mockResult,
    update: () => ({
      eq: () => mockResult,
    }),
  }),
}

export async function createKidsMapSupabaseClient() {
  if (!isSupabaseConfigured) {
    console.warn('[KidsMap] Supabase not configured, using mock client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mockClient as any
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Cookies can only be set in Server Actions or Route Handlers
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  )
}
