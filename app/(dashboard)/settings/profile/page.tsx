/**
 * Profile Settings Page
 *
 * User profile settings (name, email, avatar)
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ProfileForm } from '@/components/settings/profile-form'

export const metadata = {
  title: 'Profile Settings - QETTA',
  description: 'Edit profile information',
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <PageHeader
        title="Profile Settings"
        description="Update your basic information and manage your profile"
      />

      <Suspense fallback={<LoadingState message="Loading profile information..." />}>
        <ProfileForm user={session.user} />
      </Suspense>
    </div>
  )
}
