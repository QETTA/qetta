import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Redirecting...',
  description: 'Redirecting to QETTA Dashboard',
}

/**
 * Legacy /box route - redirects to /docs
 * Maintains backwards compatibility for existing bookmarks/links
 */
export default function BoxPage() {
  redirect('/docs')
}
