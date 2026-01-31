/**
 * Account Settings Page
 *
 * Account security, API keys, session management
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { AccountForm } from '@/components/settings/account-form'

export const metadata = {
  title: 'Account Settings - QETTA',
  description: 'Security settings and account management',
}

export default async function AccountPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <PageHeader
        title="Account Settings"
        description="Manage security, API keys, and sessions"
      />

      <Suspense fallback={<LoadingState message="Loading account information..." />}>
        <AccountForm userId={session.user.id} />
      </Suspense>
    </div>
  )
}
