'use client'

/**
 * Partner Landing Page Shared Components
 *
 * CSS-based animation (framer-motion alternative)
 * Implements whileInView with useIntersectionObserver + CSS transition
 *
 * @module landing/partners/shared
 */

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Container } from '@/components/ui/container'
import { ChecklistItem } from '@/components/landing/blocks/shared'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { cn } from '@/lib/utils'

// ── Types ───────────────────────────────────────────────────

export interface BenefitItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
  detail: string
}

export interface StatItem {
  value: string
  label: string
}

export interface StepItem {
  step: string
  title: string
  desc: string
}

// ── Hero Section ────────────────────────────────────────────

export function PartnerHero({
  badgeIcon: BadgeIcon,
  badgeText,
  headline,
  headlineGradient,
  subheadline,
  primaryCta,
  primaryCtaHref = '/pricing',
}: {
  badgeIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  badgeText: string
  headline: string
  headlineGradient: string
  subheadline: React.ReactNode
  primaryCta: string
  primaryCtaHref?: string
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <section className="pt-32 pb-20 sm:pt-40 sm:pb-24">
      <Container>
        <div className="text-center">
          <div
            className={cn(
              'mb-8 transition-all duration-500 ease-out',
              'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
            style={{ transitionDelay: isMounted ? '0ms' : '0ms' }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-zinc-300 ring-1 ring-white/10 backdrop-blur-lg">
              <BadgeIcon className="w-4 h-4" />
              <span>{badgeText}</span>
            </span>
          </div>

          <h1
            className={cn(
              'mx-auto max-w-5xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl',
              'transition-all duration-500 ease-out',
              'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
            style={{ transitionDelay: isMounted ? '100ms' : '0ms' }}
          >
            <span className="block">{headline}</span>
            <span className="block mt-2">
              <span className="bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 bg-clip-text text-transparent">
                {headlineGradient}
              </span>
            </span>
          </h1>

          <p
            className={cn(
              'mx-auto mt-6 max-w-2xl text-lg text-zinc-400',
              'transition-all duration-500 ease-out',
              'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
            style={{ transitionDelay: isMounted ? '200ms' : '0ms' }}
          >
            {subheadline}
          </p>

          <div
            className={cn(
              'mt-10 flex items-center justify-center gap-4',
              'transition-all duration-500 ease-out',
              'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
              isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
            style={{ transitionDelay: isMounted ? '300ms' : '0ms' }}
          >
            <Link
              href={primaryCtaHref}
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 shadow-lg hover:bg-zinc-100 transition-colors"
            >
              {primaryCta}
            </Link>
            <Link
              href="#benefits"
              className="rounded-full bg-transparent px-8 py-3 text-sm font-semibold text-white ring-1 ring-white/20 hover:ring-white/30 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ── Pain vs Solution ────────────────────────────────────────

export function PainVsSolution({
  painPoints,
  solutions,
}: {
  painPoints: string[]
  solutions: string[]
}) {
  const { ref: leftRef, isVisible: leftVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })
  const { ref: rightRef, isVisible: rightVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section className="py-16 sm:py-20 border-y border-white/5">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div
            ref={leftRef}
            className={cn(
              'transition-all duration-500 ease-out',
              'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-x-0',
              leftVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'
            )}
          >
            <h2 className="text-2xl font-semibold text-white mb-6">Are you experiencing these challenges?</h2>
            <ul className="space-y-4">
              {painPoints.map((pain) => (
                <li key={pain} className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-red-500/50 flex-shrink-0" />
                  <p className="text-zinc-400">{pain}</p>
                </li>
              ))}
            </ul>
          </div>

          <div
            ref={rightRef}
            className={cn(
              'transition-all duration-500 ease-out',
              'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-x-0',
              rightVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'
            )}
          >
            <h2 className="text-2xl font-semibold text-white mb-6">QETTA provides the solution</h2>
            <ul className="space-y-4">
              {solutions.map((solution) => (
                <ChecklistItem key={solution} label={solution} color="zinc" />
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ── Benefits Grid ───────────────────────────────────────────

export function BenefitsGrid({
  title,
  subtitle,
  benefits,
}: {
  title: string
  subtitle: string
  benefits: BenefitItem[]
}) {
  const { ref: headerRef, isVisible: headerVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })
  const { ref: gridRef, isVisible: gridVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section id="benefits" className="py-16 sm:py-20">
      <Container>
        <div ref={headerRef} className="text-center mb-16">
          <h2
            className={cn(
              'text-3xl font-semibold text-white sm:text-4xl',
              'transition-all duration-500 ease-out',
              'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              'mt-4 text-lg text-zinc-400',
              'transition-all duration-500 ease-out',
              'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
            style={{ transitionDelay: headerVisible ? '100ms' : '0ms' }}
          >
            {subtitle}
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className={cn(
                  'rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:ring-white/20 transition-all backdrop-blur-lg',
                  'duration-300 ease-out',
                  'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
                  gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                )}
                style={{ transitionDelay: gridVisible ? `${index * 50}ms` : '0ms' }}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-800 ring-1 ring-white/10 mb-6">
                  <Icon className="w-6 h-6 text-zinc-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-zinc-400 mb-4">{benefit.description}</p>
                <p className="text-sm text-zinc-500">{benefit.detail}</p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

// ── Stats Bar ───────────────────────────────────────────────

export function StatsBar({ stats }: { stats: StatItem[] }) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section className="py-16 sm:py-20 border-y border-white/5">
      <Container>
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'transition-all duration-300 ease-out',
                'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              )}
              style={{ transitionDelay: isVisible ? `${i * 50}ms` : '0ms' }}
            >
              <p className="text-3xl font-semibold text-white sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ── Steps Section ───────────────────────────────────────────

export function StepsSection({ title, steps }: { title: string; steps: StepItem[] }) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section className="py-16 sm:py-20 border-y border-white/5">
      <Container>
        <h2 className="text-3xl font-semibold text-white text-center mb-12">{title}</h2>
        <div
          ref={ref}
          className={`grid grid-cols-1 gap-8 ${steps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}
        >
          {steps.map((item, i) => (
            <div
              key={item.step}
              className={cn(
                'text-center transition-all duration-300 ease-out',
                'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              )}
              style={{ transitionDelay: isVisible ? `${i * 50}ms` : '0ms' }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-400/10 text-zinc-300 font-semibold text-lg mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

// ── Pricing CTA (replaces inline pricing tiers) ─────────────

export function PricingCTA() {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div
          ref={ref}
          className={cn(
            'rounded-2xl bg-white/5 p-12 ring-1 ring-white/10 text-center backdrop-blur-lg',
            'transition-all duration-300 ease-out',
            'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}
        >
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Pricing</h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Starter (30-day free) - Professional - Enterprise
            <br />
            Choose the plan that fits your business.
          </p>
          <div className="mt-8">
            <Link
              href="/pricing"
              className="inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 shadow-lg hover:bg-zinc-100 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

// ── Final CTA ───────────────────────────────────────────────

export function FinalCTA({
  headline,
  description,
  ctaText,
  ctaHref = '/pricing',
}: {
  headline: string
  description: React.ReactNode
  ctaText: string
  ctaHref?: string
}) {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div
          ref={ref}
          className={cn(
            'rounded-2xl bg-gradient-to-br from-zinc-400/10 via-zinc-500/5 to-transparent p-12 ring-1 ring-white/10 text-center backdrop-blur-lg',
            'transition-all duration-300 ease-out',
            'motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          )}
        >
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">{headline}</h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">{description}</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href={ctaHref}
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-950 shadow-lg hover:bg-zinc-100 transition-colors"
            >
              {ctaText}
            </Link>
            <Link
              href="/"
              className="text-sm font-semibold text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              ← View other solutions
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
