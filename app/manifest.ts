import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'QETTA - AI 문서 자동화 플랫폼',
    short_name: 'QETTA',
    description: '지원서 작성부터 제출까지, AI가 함께합니다.',
    start_url: '/monitor',
    display: 'standalone',
    background_color: '#18181b',
    theme_color: '#18181b',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  }
}
