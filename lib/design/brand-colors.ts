/**
 * QETTA Brand Color System (Dark Theme Optimized)
 *
 * Design Philosophy:
 * - Single primary accent: violet-500 (#8b5cf6)
 * - Transparency-based hierarchy for depth
 * - Consistent domain engine colors
 * - Minimal, professional aesthetic (Claude-inspired)
 */

// =============================================================================
// CORE BRAND COLORS
// =============================================================================

export const QETTA_COLORS = {
  // Primary Brand - Violet (QETTA Signature)
  primary: {
    DEFAULT: '#8b5cf6', // violet-500
    light: '#a78bfa', // violet-400
    dark: '#7c3aed', // violet-600
    subtle: 'rgba(139, 92, 246, 0.1)', // 10% opacity
    ring: 'rgba(139, 92, 246, 0.2)', // 20% for rings
  },

  // Neutral Scale (zinc-based for dark theme)
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    850: '#1f1f23', // Custom: card background
    900: '#18181b',
    950: '#09090b', // Page background
  },

  // Semantic Colors
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
} as const

// =============================================================================
// DARK THEME TOKENS
// =============================================================================

export const DARK_THEME = {
  // Backgrounds
  bg: {
    page: 'bg-zinc-950', // #09090b
    panel: 'bg-zinc-900', // #18181b
    card: 'bg-zinc-800/50', // Semi-transparent
    input: 'bg-zinc-800', // Input fields
    hover: 'bg-white/5', // Hover state
    active: 'bg-white/10', // Active/Selected
  },

  // Text
  text: {
    primary: 'text-zinc-50', // White text
    secondary: 'text-zinc-400', // Muted
    tertiary: 'text-zinc-500', // Very muted
    disabled: 'text-zinc-600', // Disabled
    accent: 'text-violet-400', // Brand accent
  },

  // Borders & Rings
  border: {
    subtle: 'border-white/5',
    default: 'border-white/10',
    strong: 'border-white/20',
    ring: 'ring-1 ring-white/10',
    ringHover: 'ring-1 ring-white/20',
    ringFocus: 'ring-2 ring-violet-500/50',
  },

  // Brand Accent
  accent: {
    bg: 'bg-violet-500/10',
    bgHover: 'bg-violet-500/15',
    bgActive: 'bg-violet-500/20',
    text: 'text-violet-400',
    ring: 'ring-1 ring-violet-500/20',
    button: 'bg-violet-600 hover:bg-violet-500 text-white',
  },
} as const

// =============================================================================
// DOMAIN ENGINE COLORS (v4.0 - 6개 Engine Preset)
// =============================================================================

export const DOMAIN_COLORS = {
  MANUFACTURING: {
    name: 'MANUFACTURING',
    label: '제조/스마트공장',
    color: 'blue',
    icon: '⚙️',
    // Tailwind classes
    bg: 'bg-blue-500/10',
    bgHover: 'bg-blue-500/15',
    text: 'text-blue-400',
    ring: 'ring-1 ring-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
    dot: 'bg-blue-500',
  },
  ENVIRONMENT: {
    name: 'ENVIRONMENT',
    label: '환경/TMS',
    color: 'emerald',
    icon: '🌱',
    bg: 'bg-emerald-500/10',
    bgHover: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    ring: 'ring-1 ring-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  DIGITAL: {
    name: 'DIGITAL',
    label: 'AI/SW',
    color: 'violet',
    icon: '🤖',
    bg: 'bg-violet-500/10',
    bgHover: 'bg-violet-500/15',
    text: 'text-violet-400',
    ring: 'ring-1 ring-violet-500/20',
    badge: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
    dot: 'bg-violet-500',
  },
  FINANCE: {
    name: 'FINANCE',
    label: '융자/보증',
    color: 'indigo',
    icon: '💰',
    bg: 'bg-indigo-500/10',
    bgHover: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    ring: 'ring-1 ring-indigo-500/20',
    badge: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20',
    dot: 'bg-indigo-500',
  },
  STARTUP: {
    name: 'STARTUP',
    label: '창업지원',
    color: 'fuchsia',
    icon: '🚀',
    bg: 'bg-fuchsia-500/10',
    bgHover: 'bg-fuchsia-500/15',
    text: 'text-fuchsia-400',
    ring: 'ring-1 ring-fuchsia-500/20',
    badge: 'bg-fuchsia-500/10 text-fuchsia-400 ring-1 ring-fuchsia-500/20',
    dot: 'bg-fuchsia-500',
  },
  EXPORT: {
    name: 'EXPORT',
    label: '수출/글로벌',
    color: 'amber',
    icon: '🌐',
    bg: 'bg-amber-500/10',
    bgHover: 'bg-amber-500/15',
    text: 'text-amber-400',
    ring: 'ring-1 ring-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
    dot: 'bg-amber-500',
  },
} as const

// =============================================================================
// COMPONENT STYLES (Pre-composed class strings)
// =============================================================================

export const COMPONENT_STYLES = {
  // Buttons
  button: {
    primary:
      'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50',
    secondary:
      'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/20',
    ghost:
      'inline-flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-zinc-300 hover:bg-white/5 transition-colors',
    icon: 'p-2 rounded-lg text-zinc-400 hover:text-zinc-300 hover:bg-white/5 transition-colors',
  },

  // Input fields
  input: {
    default:
      'w-full px-4 py-3 bg-zinc-800 text-zinc-50 text-sm rounded-xl ring-1 ring-white/10 focus:ring-2 focus:ring-violet-500/50 placeholder:text-zinc-500 transition-all',
    textarea:
      'w-full px-4 py-3 bg-zinc-800 text-zinc-50 text-sm rounded-xl ring-1 ring-white/10 focus:ring-2 focus:ring-violet-500/50 placeholder:text-zinc-500 resize-none transition-all',
  },

  // Cards
  card: {
    default: 'bg-zinc-900 rounded-xl ring-1 ring-white/10',
    interactive:
      'bg-zinc-900 rounded-xl ring-1 ring-white/10 hover:ring-white/20 transition-all cursor-pointer',
    selected: 'bg-white/10 rounded-xl ring-1 ring-white/20',
  },

  // Badges
  badge: {
    default: 'px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-700 text-zinc-300',
    accent: 'px-2 py-0.5 text-xs font-medium rounded-full bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
    success: 'px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    warning: 'px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
    error: 'px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  },

  // Navigation
  nav: {
    item: 'px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors',
    itemActive: 'px-3 py-2 rounded-lg bg-white/10 text-white',
  },

  // Panels
  panel: {
    sidebar: 'bg-zinc-900 border-r border-white/10',
    main: 'bg-zinc-950',
    right: 'bg-zinc-900 border-l border-white/10',
  },

  // Message bubbles (Chat)
  message: {
    user: 'bg-violet-600 text-white rounded-2xl rounded-br-md px-4 py-2.5',
    assistant: 'bg-zinc-800 text-zinc-200 rounded-2xl rounded-bl-md px-4 py-2.5 ring-1 ring-white/5',
  },
} as const

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get domain color classes
 */
export function getDomainColors(domain: keyof typeof DOMAIN_COLORS) {
  return DOMAIN_COLORS[domain]
}

/**
 * Combine class names with proper spacing
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// Type exports
export type DomainColorKey = keyof typeof DOMAIN_COLORS
export type ComponentStyleKey = keyof typeof COMPONENT_STYLES
