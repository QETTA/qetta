import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 압축 활성화
  compress: true,

  // 실험적 기능
  experimental: {
    // Server Actions 활성화 (이미 기본값이지만 명시적으로)
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 대형 라이브러리 번들 최적화
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      '@radix-ui/react-icons',
      '@headlessui/react',
    ],
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.hancom.com',
      },
    ],
  },
}

// Sentry 설정
const sentryConfig = {
  // Vercel 환경에서 소스맵 자동 업로드
  silent: !process.env.CI,

  // 조직 및 프로젝트 설정 (환경변수로)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 소스맵 설정
  widenClientFileUpload: true,
  hideSourceMaps: true,

  // 트리 쉐이킹으로 번들 크기 최적화
  disableLogger: true,

  // 빌드 시 텔레메트리 비활성화
  automaticVercelMonitors: true,
}

// Sentry DSN이 설정된 경우에만 Sentry 래핑
export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig
