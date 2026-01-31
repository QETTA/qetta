'use client'

// Platform data with real tender counts
const platforms = [
  { code: 'G2B', country: '🇰🇷', name: 'Naranjangter', count: 12450, color: 'bg-blue-500' },
  { code: 'UNGM', country: '🇺🇳', name: 'UN', count: 991, color: 'bg-sky-500' },
  { code: 'KZ', country: '🇰🇿', name: 'goszakup', count: 630_000, color: 'bg-emerald-500', highlight: true },
  { code: 'SAM', country: '🇺🇸', name: 'SAM.gov', count: 8234, color: 'bg-red-500' },
]

// Status styles for tender qualification (Catalyst Dark theme)
const qualificationStyles: Record<string, { badge: string; icon: string }> = {
  qualified: {
    badge: 'bg-emerald-500/10 text-emerald-400',
    icon: '✓'
  },
  pending: {
    badge: 'bg-amber-500/10 text-amber-400',
    icon: '⏳'
  },
  notQualified: {
    badge: 'bg-red-500/10 text-red-400',
    icon: '✕'
  },
  new: {
    badge: 'bg-blue-500/10 text-blue-400',
    icon: '★'
  }
}

// Sample matched tenders
const matchedTenders = [
  {
    id: 1,
    platform: 'KZ',
    country: '🇰🇿',
    title: 'Smart Factory Environmental Monitoring Equipment Supply',
    budget: '₩2.3B',
    deadline: 'D-7',
    status: 'qualified' as const,
    matchScore: 94
  },
  {
    id: 2,
    platform: 'UNGM',
    country: '🇺🇳',
    title: 'Water Quality Monitoring System',
    budget: '$1.2M',
    deadline: 'D-14',
    status: 'qualified' as const,
    matchScore: 89
  },
  {
    id: 3,
    platform: 'G2B',
    country: '🇰🇷',
    title: 'TMS Remote Monitoring System Project',
    budget: '₩850M',
    deadline: 'D-3',
    status: 'pending' as const,
    matchScore: 82
  },
  {
    id: 4,
    platform: 'SAM',
    country: '🇺🇸',
    title: 'Industrial IoT Sensor Network',
    budget: '$500K',
    deadline: 'D-21',
    status: 'new' as const,
    matchScore: 78
  },
]

// Format number with K/M suffix
const formatCount = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${Math.round(num / 1000)}K`
  return num.toString()
}

export function QettaApplyPreview() {
  const totalMatched = matchedTenders.filter(t => t.status === 'qualified').length
  const totalTenders = matchedTenders.length

  return (
    <div className="rounded-lg bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[580px] lg:h-[580px] ring-1 ring-white/10 transition-shadow hover:shadow-3xl">
      {/* Header Bar */}
      <div className="h-[40px] bg-zinc-800 flex items-center px-3 sm:px-4 gap-2 border-b border-white/10">
        {/* Qetta APPLY Icon */}
        <div className="w-[28px] h-[28px] flex items-center justify-center flex-shrink-0">
          <svg className="w-[20px] h-[20px] text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <span className="text-white text-[14px] font-semibold">Qetta.APPLY</span>
        <span className="text-zinc-500 text-[12px] ml-1 hidden sm:inline">Global Tender Matching</span>

        <div className="flex-1"></div>

        {/* AIFC Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-500/20 ring-1 ring-zinc-500/30 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
          <span className="text-zinc-400 text-[10px] font-medium">AIFC LAB Verified</span>
        </div>
      </div>

      {/* Platform Counters */}
      <div className="p-3 sm:p-4 bg-zinc-800/30 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] font-medium text-white">Real-time Tender Collection</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {platforms.map((platform) => (
            <div
              key={platform.code}
              className={`relative p-2 sm:p-3 rounded-lg transition-all duration-300 cursor-pointer group ${
                platform.highlight
                  ? 'bg-emerald-500/10 ring-2 ring-emerald-500/30 hover:ring-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-105'
                  : 'bg-zinc-800/50 ring-1 ring-white/10 hover:ring-white/20 hover:shadow-md hover:scale-102'
              }`}
            >
              {platform.highlight && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[9px] font-bold rounded-full shadow-sm animate-pulse">
                  ★ KEY
                </div>
              )}
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[14px] sm:text-[16px] transition-transform group-hover:scale-110">{platform.country}</span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">{platform.code}</span>
              </div>
              <div className={`text-[16px] sm:text-[20px] font-bold font-mono tabular-nums transition-all ${platform.highlight ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-white'}`}>
                {formatCount(platform.count)}
              </div>
              <div className="text-[9px] text-zinc-500 truncate">{platform.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Matched Tenders List */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <span className="text-[13px] font-semibold text-white">AI Matched Tenders</span>
              <span className="text-[10px] text-zinc-500">(Qualified)</span>
            </div>
            <span className="text-[11px] text-white font-medium">
              {totalMatched}/{totalTenders} matched
            </span>
          </div>

          {/* Tender Cards */}
          <div className="space-y-2">
            {matchedTenders.map((tender) => {
              const statusStyle = qualificationStyles[tender.status]
              return (
                <div
                  key={tender.id}
                  className="p-3 ring-1 ring-white/10 rounded-lg hover:ring-white/20 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    {/* Country Flag */}
                    <div className="w-[36px] h-[36px] rounded-lg bg-zinc-800 flex items-center justify-center text-[20px] flex-shrink-0">
                      {tender.country}
                    </div>

                    {/* Tender Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${statusStyle.badge}`}>
                          {statusStyle.icon} {tender.status === 'qualified' ? 'Qualified' : tender.status === 'pending' ? 'Pending' : tender.status === 'new' ? 'New' : 'Not Qualified'}
                        </span>
                        <span className="text-[9px] text-zinc-500">[{tender.platform}]</span>
                      </div>
                      <div className="text-[12px] font-medium text-white truncate mb-1">
                        {tender.title}
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-zinc-500">Budget: <span className="font-medium text-white">{tender.budget}</span></span>
                        <span className="text-zinc-500">Match: <span className="font-medium text-white">{tender.matchScore}%</span></span>
                      </div>
                    </div>

                    {/* Deadline */}
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`text-[12px] font-bold ${
                        tender.deadline === 'D-3' ? 'text-red-400' :
                        tender.deadline === 'D-7' ? 'text-amber-400' : 'text-zinc-400'
                      }`}>
                        {tender.deadline}
                      </span>
                      <span className="text-[9px] text-zinc-500">Deadline</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-[44px] bg-zinc-800/50 border-t border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Real-time updates</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span>Last sync: 14:32</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-[26px] px-3 text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-zinc-900"
            aria-label="Filter tender settings"
          >
            Filter
          </button>
          <button
            className="h-[26px] px-3 text-[11px] font-medium text-white bg-white/10 hover:bg-white/15 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-1 focus:ring-offset-zinc-900"
            aria-label="View all tenders"
          >
            View All
          </button>
        </div>
      </div>
    </div>
  )
}
