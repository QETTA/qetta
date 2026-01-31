import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Consultant Partners - QETTA',
  description:
    'QETTA stays hidden, you shine. B2B2B white-label platform for partner branding. 630,000+ global tender database.',
  openGraph: {
    title: 'Consultant Partners - QETTA',
    description: 'B2B2B white-label. QETTA stays hidden, you shine.',
    url: 'https://qetta.io/partners/consultants',
    type: 'website',
  },
}

export default function ConsultantsLayout({ children }: { children: React.ReactNode }) {
  return children
}
