'use client'

import {
  ShieldCheckIcon,
  EyeIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { DISPLAY_METRICS } from '@/constants/metrics'
import {
  PartnerHero,
  PainVsSolution,
  BenefitsGrid,
  StepsSection,
  StatsBar,
  PricingCTA,
  FinalCTA,
  type BenefitItem,
} from '@/components/landing/partners/shared'

const benefits: BenefitItem[] = [
  {
    icon: ShieldCheckIcon,
    title: 'SHA-256 Hash Chain Verification',
    description: 'Cryptographically verify data integrity from suppliers',
    detail: 'Traceable document generation process via SHA-256 hash chain',
  },
  {
    icon: EyeIcon,
    title: 'Real-time Supply Chain Monitoring',
    description: 'Monitor multiple suppliers from a single dashboard',
    detail: 'Instant anomaly detection with MONITOR dashboard',
  },
  {
    icon: ClockIcon,
    title: 'Auto-respond to Regulatory Changes',
    description: 'BLOCKs auto-update when regulations change',
    detail: 'Instant propagation to suppliers (no manual notifications)',
  },
  {
    icon: DocumentMagnifyingGlassIcon,
    title: 'Automatic Evidence Collection',
    description: 'Record supplier data on hash chain',
    detail: 'Timestamp-based evidence for dispute resolution',
  },
]

const painPoints = [
  'Cannot trust data submitted by suppliers',
  'Different formats from each supplier make data aggregation difficult',
  'Must notify suppliers manually when regulations change',
  'Lack of evidence for root cause analysis when issues arise',
]

const solutions = [
  'Hash chain verification: SHA-256 ensures data integrity',
  'Unified BLOCK: Consolidate supplier formats into one BLOCK',
  'Auto-update: BLOCKs auto-reflect regulatory changes',
  'Evidence collection: All data changes recorded on hash chain',
]

const steps = [
  { step: '1', title: 'SENSE Data Collection', desc: 'Auto-collect real-time data from supplier equipment' },
  { step: '2', title: 'VERIFY Hash Chain', desc: 'Cryptographic verification with SHA-256' },
  { step: '3', title: 'MONITOR Dashboard', desc: 'Instant anomaly detection from unified dashboard' },
]

const stats = [
  { value: DISPLAY_METRICS.apiUptime.value, label: DISPLAY_METRICS.apiUptime.label },
  { value: DISPLAY_METRICS.termAccuracy.value, label: DISPLAY_METRICS.termAccuracy.label },
  { value: 'SHA-256', label: 'Hash Chain Algorithm' },
  { value: 'Real-time', label: 'Data Sync' },
]

export default function BuyersPage() {
  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-zinc-500/15 via-zinc-400/8 to-transparent rounded-full blur-3xl" />
      </div>

      <PartnerHero
        badgeIcon={ShieldCheckIcon}
        badgeText="Solution for Buyers"
        headline="Supplier Data,"
        headlineGradient="Now Trustworthy"
        subheadline={
          <>
            Verify supplier data integrity with SHA-256 hash chain.
            <br />
            Real-time supply chain monitoring for manufacturers and factory operators.
          </>
        }
        primaryCta="Apply for Pilot Program"
      />

      <PainVsSolution painPoints={painPoints} solutions={solutions} />

      <BenefitsGrid
        title="Key Features"
        subtitle="VERIFY Hash Chain + MONITOR Real-time Control"
        benefits={benefits}
      />

      <StepsSection title="How It Works" steps={steps} />

      <StatsBar stats={stats} />

      <PricingCTA />

      <FinalCTA
        headline="Start with a Pilot Program"
        description={
          <>
            Verify supply chain monitoring effectiveness with a 3-month pilot.
            <br />
            Free integration with up to 2 suppliers.
          </>
        }
        ctaText="Apply for Pilot Program"
      />
    </div>
  )
}
