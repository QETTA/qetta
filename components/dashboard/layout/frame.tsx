'use client'

/**
 * QettaDashboardFrame - Dashboard-style wrapper for Preview components
 *
 * Adds a mini sidebar to any Preview component to provide visual consistency
 * with the main /box dashboard experience. Used on the landing page to show
 * a unified product look across all feature demos.
 */

export type DashboardTab = 'DOCS' | 'VERIFY' | 'APPLY' | 'MONITOR'

interface QettaDashboardFrameProps {
  activeTab: DashboardTab
  children: React.ReactNode
  className?: string
}

// Tab configuration matching QettaLeftSidebar
const tabConfig: Record<DashboardTab, { label: string; icon: React.ReactNode; highlight?: boolean }> = {
  DOCS: {
    label: 'Documents',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
      </svg>
    ),
  },
  VERIFY: {
    label: 'Verify',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  APPLY: {
    label: 'Apply',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
    highlight: true,
  },
  MONITOR: {
    label: 'Monitor',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
}

const tabOrder: DashboardTab[] = ['DOCS', 'VERIFY', 'APPLY', 'MONITOR']

export function QettaDashboardFrame({ activeTab, children, className = '' }: QettaDashboardFrameProps) {
  return (
    <div className={`rounded-xl shadow-lg border border-gray-200/50 overflow-hidden bg-white ${className}`}>
      <div className="flex">
        {/* Mini Sidebar - hidden on mobile, visible on sm+ */}
        <aside className="hidden sm:flex w-14 bg-zinc-950 flex-col flex-shrink-0" aria-label="Dashboard navigation">
          {/* Logo */}
          <div className="h-12 flex items-center justify-center border-b border-zinc-900/50">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
          </div>

          {/* Tab Icons */}
          <nav className="flex-1 py-2 px-1.5" aria-label="Feature tabs">
            <ul className="space-y-1">
              {tabOrder.map((tab) => {
                const config = tabConfig[tab]
                const isActive = activeTab === tab

                return (
                  <li key={tab}>
                    <div
                      className={`relative w-full flex items-center justify-center p-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-zinc-800/70 text-white'
                          : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                      }`}
                      title={config.label}
                      role="img"
                      aria-label={config.label}
                    >
                      <span aria-hidden="true">{config.icon}</span>
                      {/* Highlight indicator for APPLY tab */}
                      {config.highlight && !isActive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Bottom indicator */}
          <div className="h-10 flex items-center justify-center border-t border-zinc-900/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
