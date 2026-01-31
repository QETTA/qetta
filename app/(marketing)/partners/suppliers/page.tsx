'use client'

import {
  ClockIcon,
  DocumentCheckIcon,
  CogIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { DISPLAY_METRICS, STRUCTURE_METRICS } from '@/constants/metrics'
import {
  PartnerHero,
  PainVsSolution,
  BenefitsGrid,
  StatsBar,
  PricingCTA,
  FinalCTA,
  type BenefitItem,
} from '@/components/landing/partners/shared'

const benefits: BenefitItem[] = [
  {
    icon: ClockIcon,
    title: `${DISPLAY_METRICS.timeSaved.value} Time Saved`,
    description: `Automate customer reports ${DISPLAY_METRICS.timeSaved.detail}`,
    detail: 'Auto-collect MES, PLC, OPC-UA data and generate formatted reports',
  },
  {
    icon: DocumentCheckIcon,
    title: `${DISPLAY_METRICS.rejectionReduction.value} Rejection Reduction`,
    description: 'Minimize rework with auto-validation of format errors and missing fields',
    detail: 'Manage customer requirements as BLOCKs to ensure accuracy',
  },
  {
    icon: CogIcon,
    title: 'BLOCK Composition System',
    description: 'Select industry-specific BLOCKs for automotive, semiconductor, electronics',
    detail: `${STRUCTURE_METRICS.terminologyMappings} terminology mappings with ${DISPLAY_METRICS.termAccuracy.value} accuracy`,
  },
  {
    icon: ChartBarIcon,
    title: 'Real-time Data Collection',
    description: 'Auto-collect evidence data with SENSE sensors + MONITOR control',
    detail: 'SHA-256 hash chain for data integrity verification',
  },
]

const painPoints = [
  '8 hours spent weekly on repetitive customer reports',
  'Confusion from different formats and requirements per customer',
  'Manual work from data collection to document creation',
  'Repetitive copy-paste of MES/PLC data to Excel',
]

const solutions = [
  'Auto data collection: Real-time with SENSE sensors',
  'BLOCK composition: Industry templates + auto terminology mapping',
  `Auto document generation: ${DISPLAY_METRICS.docSpeed.value} (${DISPLAY_METRICS.docSpeed.detail})`,
  'Integrity verification: Evidence via SHA-256 hash chain',
]

const stats = [
  { value: DISPLAY_METRICS.timeSaved.value, label: DISPLAY_METRICS.timeSaved.label },
  { value: DISPLAY_METRICS.rejectionReduction.value, label: DISPLAY_METRICS.rejectionReduction.label },
  { value: DISPLAY_METRICS.docSpeed.value, label: DISPLAY_METRICS.docSpeed.label },
  { value: DISPLAY_METRICS.apiUptime.value, label: DISPLAY_METRICS.apiUptime.label },
]

export default function SuppliersPage() {
  return (
    <div className="bg-zinc-950 min-h-screen">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-zinc-400/15 via-zinc-500/8 to-transparent rounded-full blur-3xl" />
      </div>

      <PartnerHero
        badgeIcon={CogIcon}
        badgeText="Solution for Suppliers"
        headline="Customer Reports,"
        headlineGradient="8 Hours to 30 Minutes"
        subheadline={
          <>
            Industry-specific BLOCK composition platform for HW equipment and parts suppliers.
            <br />
            Auto-handle different formats and terminology per customer.
          </>
        }
        primaryCta="30-Day Free Trial"
      />

      <PainVsSolution painPoints={painPoints} solutions={solutions} />

      <BenefitsGrid
        title="Key Features"
        subtitle="Build your branded AI platform by composing industry BLOCKs"
        benefits={benefits}
      />

      <StatsBar stats={stats} />

      <PricingCTA />

      <FinalCTA
        headline="Get Started Now"
        description={
          <>
            Experience {DISPLAY_METRICS.timeSaved.value} time savings with a 30-day free trial.
            <br />
            Start immediately without credit card registration.
          </>
        }
        ctaText="Start 30-Day Free Trial"
      />
    </div>
  )
}
