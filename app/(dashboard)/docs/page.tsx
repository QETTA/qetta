import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { DashboardSkeleton } from '@/components/dashboard/skeleton'

const QettaDashboardPage = dynamic(
  () => import('@/components/dashboard/page').then(mod => ({ default: mod.QettaDashboardPage })),
  { loading: () => <DashboardSkeleton /> }
)

export const metadata: Metadata = {
  title: 'DOCS - Automated Document Generation',
  description: 'QETTA DOCS - 8 hours → 30 minutes, 93.8% time reduction. Auto-generate compliance documents.',
  keywords: ['document automation', 'DOCX', 'PDF', 'XLSX', 'compliance', 'government forms'],
}

export default function DocsPage() {
  return <QettaDashboardPage initialTab="DOCS" />
}
