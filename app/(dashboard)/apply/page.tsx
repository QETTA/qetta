import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { DashboardSkeleton } from '@/components/dashboard/skeleton'

const QettaDashboardPage = dynamic(
  () => import('@/components/dashboard/page').then(mod => ({ default: mod.QettaDashboardPage })),
  { loading: () => <DashboardSkeleton /> }
)

export const metadata: Metadata = {
  title: 'APPLY - Global Tender Matching',
  description: 'QETTA APPLY - 630K+ global tender database. Automated matching for SAM.gov, UNGM, Goszakup.',
  keywords: ['global tender', 'SAM.gov', 'UNGM', 'Goszakup', 'procurement', 'tender matching'],
}

export default function ApplyPage() {
  return <QettaDashboardPage initialTab="APPLY" />
}
