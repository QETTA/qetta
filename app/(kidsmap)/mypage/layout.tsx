import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '마이페이지',
  description: 'KidsMap 프로필 및 설정',
}

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return children
}
