import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { DashboardSkeleton } from '@/components/dashboard/skeleton'
import { PreviewBanner } from '@/components/dashboard/preview-banner'

export const metadata: Metadata = {
  title: {
    template: '%s | QETTA Dashboard',
    default: 'Dashboard | QETTA',
  },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check Preview mode cookie on server
  const cookieStore = await cookies()
  const isPreviewMode = cookieStore.get('qetta_preview_mode')?.value === 'true'

  return (
    <>
      {/* Preview mode banner - fixed at top */}
      {isPreviewMode && <PreviewBanner />}

      <main id="main-content" className={isPreviewMode ? 'pt-12' : ''}>
        <Suspense fallback={<DashboardSkeleton />}>
          {children}
        </Suspense>
      </main>
    </>
  )
}
