import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buyer Partners - QETTA',
  description:
    'Supplier data you can trust. SHA-256 hash chain + QR code traceability verification. 99.9% API uptime.',
  openGraph: {
    title: 'Buyer Partners - QETTA',
    description: 'Supplier data verification with 99.9% reliability via hash chain.',
    url: 'https://qetta.io/partners/buyers',
    type: 'website',
  },
}

export default function BuyersLayout({ children }: { children: React.ReactNode }) {
  return children
}
