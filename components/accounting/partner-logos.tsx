/**
 * Partner Logos Carousel
 * Infinite marquee animation showcasing trusted partners
 *
 * @see Plan: Part D1 - Premium Landing Page Components
 */

'use client'

import Image from 'next/image'

interface Partner {
  name: string
  logo: string
  category: 'government' | 'corporate' | 'startup'
}

const partners: Partner[] = [
  // Government & Public
  { name: 'K-Startup', logo: '/logos/k-startup.svg', category: 'government' },
  { name: 'NIPA', logo: '/logos/nipa.svg', category: 'government' },
  { name: 'SAM.gov', logo: '/logos/sam-gov.svg', category: 'government' },
  { name: 'KOTRA', logo: '/logos/kotra.svg', category: 'government' },

  // Corporate
  { name: 'Samsung SDS', logo: '/logos/samsung-sds.svg', category: 'corporate' },
  { name: 'LG CNS', logo: '/logos/lg-cns.svg', category: 'corporate' },
  { name: 'Kakao', logo: '/logos/kakao.svg', category: 'corporate' },
  { name: 'Naver', logo: '/logos/naver.svg', category: 'corporate' },

  // Startups & Partners
  { name: 'Vercel', logo: '/logos/vercel.svg', category: 'startup' },
  { name: 'Anthropic', logo: '/logos/anthropic.svg', category: 'startup' },
  { name: 'Prisma', logo: '/logos/prisma.svg', category: 'startup' },
  { name: 'Supabase', logo: '/logos/supabase.svg', category: 'startup' }
]

export function PartnerLogos({ speed = 'normal' }: { speed?: 'slow' | 'normal' | 'fast' }) {
  const animationDuration = speed === 'slow' ? '60s' : speed === 'fast' ? '20s' : '40s'

  return (
    <div className="relative w-full overflow-hidden bg-zinc-950 py-12">
      {/* Gradient overlays for fade effect */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-zinc-950 to-transparent" />

      {/* Marquee container */}
      <div className="flex gap-12" style={{ animation: `marquee ${animationDuration} linear infinite` }}>
        {/* First set of logos */}
        {partners.map((partner, index) => (
          <LogoCard key={`first-${index}`} partner={partner} />
        ))}

        {/* Duplicate set for seamless loop */}
        {partners.map((partner, index) => (
          <LogoCard key={`second-${index}`} partner={partner} />
        ))}
      </div>

      {/* CSS animation definition */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}

function LogoCard({ partner }: { partner: Partner }) {
  return (
    <div className="group relative flex h-20 w-40 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      {/* Logo */}
      <div className="relative h-full w-full grayscale transition-all duration-300 group-hover:grayscale-0">
        <Image
          src={partner.logo}
          alt={`${partner.name} logo`}
          fill
          className="object-contain"
          unoptimized // For SVGs
        />
      </div>

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 scale-0 rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
        {partner.name}
        <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
      </div>
    </div>
  )
}

/**
 * Category-filtered Partner Logos
 * Show only specific category of partners
 */
export function CategoryPartnerLogos({ category }: { category: Partner['category'] }) {
  const filtered = partners.filter((p) => p.category === category)

  return (
    <div className="relative w-full overflow-hidden py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-zinc-950 to-transparent" />

      <div className="flex gap-8" style={{ animation: 'marquee 30s linear infinite' }}>
        {filtered.map((partner, index) => (
          <LogoCard key={`cat-first-${index}`} partner={partner} />
        ))}
        {filtered.map((partner, index) => (
          <LogoCard key={`cat-second-${index}`} partner={partner} />
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Static Partner Grid
 * Non-animated version for smaller spaces or less emphasis
 */
export function PartnerGrid() {
  return (
    <div className="grid grid-cols-4 gap-6 md:grid-cols-6">
      {partners.slice(0, 8).map((partner, index) => (
        <div
          key={index}
          className="flex h-16 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 grayscale transition-all hover:border-zinc-700 hover:grayscale-0"
        >
          <Image
            src={partner.logo}
            alt={`${partner.name} logo`}
            width={80}
            height={32}
            className="object-contain"
            unoptimized
          />
        </div>
      ))}
    </div>
  )
}
