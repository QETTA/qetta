'use client'

import dynamic from 'next/dynamic'

/**
 * Chatbot Provider - Client Component Wrapper
 *
 * This wrapper is necessary because:
 * - Root layout is a Server Component in Next.js 15
 * - `ssr: false` with `next/dynamic` is only allowed in Client Components
 * - The chatbot uses browser APIs (window, localStorage) that require client-side rendering
 */

const QettaChatbot = dynamic(
  () => import('./qetta-chatbot').then((m) => m.QettaChatbot),
  {
    ssr: false,
    loading: () => null, // No loading state for the floating button
  }
)

export function ChatbotProvider() {
  return <QettaChatbot />
}
