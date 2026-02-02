import { MyPageClient } from './mypage-client'

// Force dynamic rendering - no SSR
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default function MyPage() {
  return <MyPageClient />
}
