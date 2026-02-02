import { memo } from 'react'
import { Badge } from '@/components/catalyst/badge'
import { DISPLAY_METRICS } from '@/constants/metrics'
import { AnimatedSection, GlassCard } from './shared'

/**
 * ApplySection - 서버 컴포넌트로 정적 콘텐츠 렌더링
 *
 * APPLY (글로벌 입찰 매칭) 기능을 소개하는 섹션입니다.
 */
export const ApplySection = memo(function ApplySection() {
  return (
    <section
      className="relative bg-zinc-950 px-6 py-32 lg:px-8"
      aria-labelledby="apply-heading"
      aria-describedby="apply-description"
      role="region"
    >
      <div className="mx-auto max-w-7xl">
        {/* APPLY - Global Tender Matching */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: Description */}
          <div className="lg:col-span-5">
            <AnimatedSection direction="left">
              <Badge color="zinc" className="mb-6">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Global tender database
                </span>
              </Badge>

              <h2
                id="apply-heading"
                className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
              >
                Access {DISPLAY_METRICS.globalTenders.value}
                <br />
                global opportunities
              </h2>

              <p id="apply-description" className="mt-6 text-lg text-zinc-400">
                Search and match against international tenders from SAM.gov (US), UNGM (UN),
                Goszakup (Kazakhstan), and 50+ procurement platforms worldwide.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { region: 'United States', count: '280,000+', platform: 'SAM.gov' },
                  { region: 'United Nations', count: '150,000+', platform: 'UNGM' },
                  { region: 'Kazakhstan', count: '120,000+', platform: 'Goszakup' },
                  { region: 'Europe & Others', count: '80,000+', platform: '50+ platforms' },
                ].map((item) => (
                  <GlassCard key={item.region} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{item.region}</p>
                      <p className="text-sm text-zinc-400">{item.platform}</p>
                    </div>
                    <p className="text-lg font-semibold text-zinc-400">{item.count}</p>
                  </GlassCard>
                ))}
              </div>

              <GlassCard variant="gradientAmber" className="mt-8">
                <p className="text-sm font-medium text-amber-400">
                  🌍 Updated daily from official government APIs
                </p>
              </GlassCard>
            </AnimatedSection>
          </div>

          {/* Right: Globe/Map Visualization */}
          <div className="lg:col-span-7">
            <AnimatedSection direction="right" delay={0.2}>
              {/* Search Interface Mockup */}
              <div className="overflow-hidden rounded-lg bg-zinc-900/50 shadow-2xl ring-1 shadow-black/20 ring-white/15">
                {/* Search Bar */}
                <div className="border-b border-white/5 bg-zinc-900/50 px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <div className="flex-1 text-sm text-zinc-400">
                      Search for &quot;environmental monitoring equipment&quot;
                    </div>
                    <div className="flex gap-2">
                      <Badge color="zinc">AI Match</Badge>
                      <Badge color="green">{DISPLAY_METRICS.globalTenders.value} results</Badge>
                    </div>
                  </div>
                </div>

                {/* Results List */}
                <div className="space-y-3 p-6">
                  {[
                    {
                      title: 'Air Quality Monitoring System - EPA',
                      country: 'United States',
                      value: '$2.5M',
                      match: '95%',
                      flag: '🇺🇸',
                    },
                    {
                      title: 'Environmental Data Platform - UNEP',
                      country: 'United Nations',
                      value: '€1.8M',
                      match: '92%',
                      flag: '🇺🇳',
                    },
                    {
                      title: 'Smart City IoT Sensors - Astana',
                      country: 'Kazakhstan',
                      value: '₸850M',
                      match: '88%',
                      flag: '🇰🇿',
                    },
                  ].map((tender) => (
                    <div
                      key={tender.title}
                      className="group rounded-lg bg-zinc-800/50 px-4 py-4 ring-1 ring-white/15 transition-all hover:bg-zinc-800/60 hover:ring-white/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{tender.flag}</span>
                            <p className="font-medium text-white group-hover:text-zinc-100">
                              {tender.title}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">{tender.country}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-semibold text-white">{tender.value}</p>
                          <Badge color="green" className="mt-1">
                            {tender.match} match
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Stats */}
                <div className="border-t border-white/5 bg-zinc-900/50 px-6 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-zinc-400">Showing 3 of 1,247 matching tenders</p>
                    <div className="flex gap-4">
                      <span className="text-zinc-400">Last updated: 2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Region Pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                {['🇺🇸 Americas', '🇪🇺 Europe', '🌏 Asia', '🌍 Africa', '🇦🇺 Oceania'].map(
                  (region) => (
                    <button
                      key={region}
                      className="rounded-full bg-zinc-900/50 px-4 py-2 text-sm text-zinc-400 ring-1 ring-white/15 transition-colors hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      {region}
                    </button>
                  )
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  )
})
