import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '피드 - 아이와 갈만한 곳 영상·리뷰',
  description:
    '키즈맵 피드에서 아이와 함께 방문하기 좋은 장소의 영상, 블로그 리뷰, 숏폼 콘텐츠를 확인하세요. YouTube, 네이버 클립, 블로그 통합 검색.',
  openGraph: {
    title: 'KidsMap 피드 - 아이와 갈만한 곳 콘텐츠',
    description: 'YouTube, 네이버 클립, 블로그에서 키즈 장소 콘텐츠를 한눈에.',
    type: 'website',
  },
}

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children
}
