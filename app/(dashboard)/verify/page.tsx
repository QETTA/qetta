import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { DashboardSkeleton } from '@/components/dashboard/skeleton'

const QettaDashboardPage = dynamic(
  () => import('@/components/dashboard/page').then(mod => ({ default: mod.QettaDashboardPage })),
  { loading: () => <DashboardSkeleton /> }
)

export const metadata: Metadata = {
  title: 'VERIFY - Hash Chain Verification',
  description: 'QETTA VERIFY - SHA-256 hash chain document integrity verification. 99.9% API uptime.',
  keywords: ['hash chain', 'SHA-256', 'document verification', 'integrity', 'API'],
}

export default function VerifyPage() {
  return <QettaDashboardPage initialTab="VERIFY" />
}
