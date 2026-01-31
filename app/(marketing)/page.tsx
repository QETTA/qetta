import type { Metadata } from 'next'
import { APP_URL } from '@/constants/urls'
import { DISPLAY_METRICS, STRUCTURE_METRICS } from '@/constants/metrics'
import { HeroSection } from '@/components/landing/blocks/HeroSection'
import { MinimalCTASection } from '@/components/landing/blocks/MinimalCTASection'

export const metadata: Metadata = {
  title: 'QETTA – Your Industry, Your Intelligence',
  description:
    'AI-powered government compliance document automation. 93.8% time saved, 91% error reduction, 630,000+ global tenders. Select BLOCKs. Build Intelligence.',
  openGraph: {
    title: 'QETTA – Your Industry, Your Intelligence',
    description:
      'AI-powered government compliance document automation. 93.8% time saved, 91% error reduction, 630,000+ global tenders.',
    url: APP_URL,
    siteName: 'QETTA',
    type: 'website',
  },
}

// Removed heavy sections (Product, Apply, Features, CTA)
// Replaced with MinimalCTASection for better performance
// Detailed content now available at dedicated pages:
// - /features - Full feature showcase
// - /how-it-works - Application process
// - /product - Technical details

// ISR: Revalidate homepage every hour (marketing content changes infrequently)
export const revalidate = 3600

export default function HomePage() {
  // JSON-LD structured data for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'QETTA',
    alternateName: 'QETTA Platform',
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    description: `Select BLOCKs. Build Intelligence. AI-powered government compliance document automation platform. ${DISPLAY_METRICS.timeSaved.value} time saved, ${DISPLAY_METRICS.rejectionReduction.value} error reduction, ${DISPLAY_METRICS.globalTenders.value} global tenders.`,
    slogan: 'Your Industry, Your Intelligence.',
    foundingDate: '2024',
    knowsAbout: [
      'Government Compliance',
      'Document Automation',
      'AI Document Generation',
      'Domain Engineering',
      'TMS Environmental Compliance',
      'Smart Factory MES',
      'AI Voucher NIPA',
      'Global Tender SAM.gov',
    ],
    areaServed: {
      '@type': 'Country',
      name: ['South Korea', 'United States', 'Kazakhstan', 'Global'],
    },
  }

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'QETTA Platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: '30-day free trial',
    },
    featureList: [
      `${DISPLAY_METRICS.timeSaved.value} time reduction (${DISPLAY_METRICS.timeSaved.detailEn})`,
      `${DISPLAY_METRICS.rejectionReduction.value} document rejection rate reduction`,
      `${DISPLAY_METRICS.docSpeed.valueEn} per document generation`,
      `${DISPLAY_METRICS.apiUptime.value} API uptime`,
      `${STRUCTURE_METRICS.industryBlocks} industry BLOCKs (automotive, semiconductor, energy, healthcare, etc.)`,
      `${STRUCTURE_METRICS.enginePresets} domain engines (MANUFACTURING, ENVIRONMENT, DIGITAL, FINANCE, STARTUP, EXPORT)`,
      `${DISPLAY_METRICS.globalTenders.value} global tender database (SAM.gov, UNGM, Goszakup)`,
      'SHA-256 hash chain verification',
    ],
    description:
      `Purpose-built tool for government compliance documents. Select industry BLOCKs, auto-generate documents in ${DISPLAY_METRICS.docSpeed.valueEn}. B2B2B whitelabel platform for partners.`,
  }

  return (
    <>
      {/*
        JSON-LD Structured Data for SEO
        SECURITY NOTE: dangerouslySetInnerHTML is safe here because:
        1. Data comes from static constants defined in this file
        2. JSON.stringify() escapes special characters, preventing XSS
        3. No user input is included in the schema objects
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <div className="bg-zinc-950">
        <HeroSection />
        <MinimalCTASection />
      </div>
    </>
  )
}
