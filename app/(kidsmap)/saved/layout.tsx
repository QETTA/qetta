import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '저장한 콘텐츠',
  description: '나중에 보려고 저장한 키즈 장소 콘텐츠 목록입니다.',
}

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children
}
