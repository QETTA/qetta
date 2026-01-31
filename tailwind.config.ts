import type { Config } from 'tailwindcss'

/**
 * QETTA Design System - Tailwind CSS v4 Configuration
 *
 * Maps all CSS variables from globals.css to Tailwind utilities
 * Enables usage like: bg-brand, text-foreground-secondary, animate-fade-in-up
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ==========================================
      // Design System Colors
      // ==========================================
      colors: {
        // Background colors
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        'background-elevated': 'var(--background-elevated)',
        'background-hover': 'var(--background-hover)',
        'background-active': 'var(--background-active)',

        // Foreground colors
        foreground: 'var(--foreground)',
        'foreground-secondary': 'var(--foreground-secondary)',
        'foreground-muted': 'var(--foreground-muted)',
        'foreground-disabled': 'var(--foreground-disabled)',

        // Border colors
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'border-medium': 'var(--border-medium)',
        'border-strong': 'var(--border-strong)',

        // Brand colors
        brand: 'var(--brand)',
        'brand-light': 'var(--brand-light)',
        'brand-dark': 'var(--brand-dark)',

        // Code diff colors
        'diff-red': 'var(--diff-red)',
        'diff-red-bg': 'var(--diff-red-bg)',
        'diff-green': 'var(--diff-green)',
        'diff-green-bg': 'var(--diff-green-bg)',
        'diff-comment-before': 'var(--diff-comment-before)',
        'diff-comment-after': 'var(--diff-comment-after)',
      },

      // ==========================================
      // Background Images
      // ==========================================
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },

      // ==========================================
      // Typography
      // ==========================================
      fontSize: {
        'hero': ['90px', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'hero-sm': ['56px', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        serif: ['Georgia', 'Times New Roman', 'var(--font-noto-sans-kr)', 'sans-serif'],
      },

      // ==========================================
      // Animations
      // ==========================================
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(161, 161, 170, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(161, 161, 170, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'code-line-fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'code-line-fade-in': 'code-line-fade-in 0.4s ease-out forwards',
        'spin-slow': 'spin-slow 3s linear infinite',
      },

      // ==========================================
      // Spacing & Layout
      // ==========================================
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ==========================================
      // Backdrop Blur
      // ==========================================
      backdropBlur: {
        xs: '2px',
      },

      // ==========================================
      // Border Radius
      // ==========================================
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // ==========================================
      // Box Shadow
      // ==========================================
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 20px rgba(161, 161, 170, 0.3)',
        'glow-lg': '0 0 40px rgba(161, 161, 170, 0.5)',
      },

      // ==========================================
      // Z-Index Scale
      // ==========================================
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // ==========================================
      // Transition Duration
      // ==========================================
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
    },
  },
  plugins: [],
}

export default config
