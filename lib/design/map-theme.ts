/**
 * QETTA Map App Design System - Light Mode Only
 * 2026 iOS-inspired design with Apple Liquid Glass influence
 * Citymapper / Apple Maps / Kakao Map hybrid UX
 */

export const mapTheme = {
  // ============================================
  // Colors - Light Mode (iOS 26 Liquid Glass inspired)
  // ============================================
  colors: {
    // Primary backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F7',
    backgroundTertiary: '#EFEFF4',
    backgroundElevated: '#FFFFFF',

    // Glass effects (Liquid Glass style)
    glass: {
      background: 'rgba(255, 255, 255, 0.72)',
      backgroundHover: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(0, 0, 0, 0.06)',
      borderStrong: 'rgba(0, 0, 0, 0.12)',
    },

    // Text colors
    text: {
      primary: '#1D1D1F',
      secondary: '#6E6E73',
      tertiary: '#8E8E93',
      placeholder: '#C7C7CC',
      inverse: '#FFFFFF',
    },

    // Brand / Accent (Kakao Yellow inspired with modern twist)
    accent: {
      primary: '#FEE500',       // Kakao Yellow
      primaryDark: '#E6CF00',
      secondary: '#007AFF',     // iOS Blue
      secondaryDark: '#0056B3',
      success: '#34C759',       // iOS Green
      warning: '#FF9500',       // iOS Orange
      error: '#FF3B30',         // iOS Red
    },

    // Map-specific colors
    map: {
      currentLocation: '#007AFF',
      destination: '#FF3B30',
      route: '#007AFF',
      routeAlt: '#8E8E93',
      traffic: {
        clear: '#34C759',
        slow: '#FF9500',
        heavy: '#FF3B30',
      },
      poi: {
        restaurant: '#FF9500',
        cafe: '#8B4513',
        shopping: '#AF52DE',
        parking: '#007AFF',
        gas: '#FF3B30',
        default: '#8E8E93',
      },
    },

    // Bottom sheet
    sheet: {
      background: '#FFFFFF',
      handle: '#D1D1D6',
      divider: '#E5E5EA',
    },

    // Search bar
    search: {
      background: '#EFEFF4',
      backgroundFocused: '#FFFFFF',
      placeholder: '#8E8E93',
      icon: '#8E8E93',
    },

    // Tab bar
    tabBar: {
      background: 'rgba(255, 255, 255, 0.94)',
      active: '#007AFF',
      inactive: '#8E8E93',
      border: 'rgba(0, 0, 0, 0.08)',
    },
  },

  // ============================================
  // Typography - Apple SF Pro inspired
  // ============================================
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", "Menlo", Monaco, Consolas, monospace',
    },
    sizes: {
      // Display
      displayLarge: { size: '34px', lineHeight: '41px', weight: '700', letterSpacing: '-0.4px' },
      displayMedium: { size: '28px', lineHeight: '34px', weight: '700', letterSpacing: '-0.4px' },
      displaySmall: { size: '22px', lineHeight: '28px', weight: '700', letterSpacing: '-0.4px' },

      // Title
      titleLarge: { size: '20px', lineHeight: '25px', weight: '600', letterSpacing: '-0.4px' },
      titleMedium: { size: '17px', lineHeight: '22px', weight: '600', letterSpacing: '-0.4px' },
      titleSmall: { size: '15px', lineHeight: '20px', weight: '600', letterSpacing: '-0.2px' },

      // Body
      bodyLarge: { size: '17px', lineHeight: '22px', weight: '400', letterSpacing: '-0.4px' },
      bodyMedium: { size: '15px', lineHeight: '20px', weight: '400', letterSpacing: '-0.2px' },
      bodySmall: { size: '13px', lineHeight: '18px', weight: '400', letterSpacing: '-0.1px' },

      // Caption
      caption: { size: '12px', lineHeight: '16px', weight: '400', letterSpacing: '0' },
      captionMedium: { size: '11px', lineHeight: '13px', weight: '500', letterSpacing: '0.6px' },
    },
  },

  // ============================================
  // Spacing - iOS Human Interface Guidelines
  // ============================================
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',

    // Safe areas
    safeTop: 'env(safe-area-inset-top, 47px)',
    safeBottom: 'env(safe-area-inset-bottom, 34px)',
    safeLeft: 'env(safe-area-inset-left, 0px)',
    safeRight: 'env(safe-area-inset-right, 0px)',

    // Tab bar height
    tabBarHeight: '83px', // 49px + safe area
    searchBarHeight: '52px',
  },

  // ============================================
  // Border Radius - iOS style
  // ============================================
  borderRadius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    full: '9999px',

    // iOS continuous corners
    card: '12px',
    button: '12px',
    input: '10px',
    sheet: '20px',
    modal: '16px',
  },

  // ============================================
  // Shadows - iOS depth system
  // ============================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04)',
    md: '0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.06)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.12), 0 16px 48px rgba(0, 0, 0, 0.08)',

    // Specific components
    card: '0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)',
    sheet: '0 -4px 24px rgba(0, 0, 0, 0.12)',
    tabBar: '0 -0.5px 0 rgba(0, 0, 0, 0.3)',
    button: '0 2px 4px rgba(0, 0, 0, 0.08)',
    searchBar: '0 2px 12px rgba(0, 0, 0, 0.08)',
  },

  // ============================================
  // Animations - iOS spring physics
  // ============================================
  animations: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      springOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
      easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      easeOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    },
  },

  // ============================================
  // Blur effects - Liquid Glass
  // ============================================
  blur: {
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '40px',

    // Component specific
    tabBar: '20px',
    sheet: '12px',
    modal: '40px',
  },

  // ============================================
  // Z-Index layers
  // ============================================
  zIndex: {
    base: 0,
    map: 1,
    controls: 10,
    searchBar: 20,
    sheet: 30,
    modal: 40,
    toast: 50,
    splash: 100,
  },
} as const

// CSS Variables for runtime usage
export const mapThemeCSSVariables = `
  /* Map App Theme - Light Mode */
  --map-bg: ${mapTheme.colors.background};
  --map-bg-secondary: ${mapTheme.colors.backgroundSecondary};
  --map-bg-tertiary: ${mapTheme.colors.backgroundTertiary};

  --map-glass-bg: ${mapTheme.colors.glass.background};
  --map-glass-border: ${mapTheme.colors.glass.border};

  --map-text-primary: ${mapTheme.colors.text.primary};
  --map-text-secondary: ${mapTheme.colors.text.secondary};
  --map-text-tertiary: ${mapTheme.colors.text.tertiary};

  --map-accent-primary: ${mapTheme.colors.accent.primary};
  --map-accent-secondary: ${mapTheme.colors.accent.secondary};

  --map-safe-top: ${mapTheme.spacing.safeTop};
  --map-safe-bottom: ${mapTheme.spacing.safeBottom};
  --map-tab-height: ${mapTheme.spacing.tabBarHeight};

  --map-blur-tab: ${mapTheme.blur.tabBar};
  --map-blur-sheet: ${mapTheme.blur.sheet};
`

export type MapTheme = typeof mapTheme
