/**
 * Notifications Settings Page
 *
 * Notification settings (email, push notifications)
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { NotificationsForm } from '@/components/settings/notifications-form'

export const metadata = {
  title: 'Notification Settings - QETTA',
  description: 'Notification preferences',
}

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <PageHeader
        title="Notification Settings"
        description="Manage email and push notification preferences"
      />

      <Suspense fallback={<LoadingState message="Loading notification settings..." />}>
        <NotificationsForm userId={session.user.id} />
      </Suspense>
    </div>
  )
}
