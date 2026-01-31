import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Supplier Partners - QETTA',
  description:
    'Write client reports in 30 minutes instead of 8 hours. Auto data collection + BLOCK composition + auto document generation. 93.8% time reduction.',
  openGraph: {
    title: 'Supplier Partners - QETTA',
    description: 'Client reports: 8 hours → 30 minutes. 93.8% time savings.',
    url: 'https://qetta.io/partners/suppliers',
    type: 'website',
  },
}

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return children
}
