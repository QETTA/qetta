/**
 * KidsMap Share Utilities
 *
 * Centralized sharing logic with Web Share API + clipboard fallback
 */

export interface ShareOptions {
  title: string
  text?: string
  url: string
}

export async function shareContent(options: ShareOptions): Promise<'shared' | 'copied' | 'failed'> {
  const fullUrl = options.url.startsWith('http')
    ? options.url
    : `${window.location.origin}${options.url}`

  try {
    if (navigator.share) {
      await navigator.share({ ...options, url: fullUrl })
      return 'shared'
    } else {
      await navigator.clipboard.writeText(fullUrl)
      return 'copied'
    }
  } catch (error) {
    if ((error as DOMException)?.name === 'AbortError') {
      return 'failed' // User cancelled
    }
    // Fallback: try clipboard
    try {
      await navigator.clipboard.writeText(fullUrl)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
}

export function getPlaceShareUrl(placeId: string): string {
  return `/map?placeId=${placeId}`
}

export function getContentShareUrl(contentId: string): string {
  return `/feed/${contentId}`
}
