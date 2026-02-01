import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://qetta.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/monitor',
          '/apply',
          '/generate',
          '/docs',
          '/box',
          '/documents',
          '/settings/',
          '/verify',
          '/widgets-demo',
          '/map',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
