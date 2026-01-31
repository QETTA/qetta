import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Accessibility Store - 중장년 UX 최적화를 위한 접근성 설정
 *
 * 핵심 원칙 (마스터 플랜 섹션 8):
 * - 큰 글씨: 본문 18px+, 제목 24px+
 * - 명확한 CTA: "다음 단계", "제출하기" 등 구체적
 * - 높은 대비: 시인성 향상
 *
 * @see docs/plans/2026-01-22-domain-engine-master-plan.md
 */

export type FontSizeMode = 'normal' | 'large' | 'extra-large'

export interface AccessibilitySettings {
  // Font size mode
  fontSizeMode: FontSizeMode
  setFontSizeMode: (mode: FontSizeMode) => void

  // High contrast mode
  highContrast: boolean
  toggleHighContrast: () => void

  // Reduce motion
  reduceMotion: boolean
  toggleReduceMotion: () => void

  // Show tooltips by default
  showTooltips: boolean
  toggleShowTooltips: () => void

  // Auto-save indicator
  showAutoSaveIndicator: boolean
  toggleShowAutoSaveIndicator: () => void
}

// Font size multipliers
export const FONT_SIZE_SCALES: Record<FontSizeMode, number> = {
  normal: 1,
  large: 1.25, // 18px base → 본문 18px+
  'extra-large': 1.5, // 제목 24px+ 달성
}

// CSS variable names for dynamic font sizing
export const FONT_SIZE_CSS_VARS = {
  base: '--font-size-base',
  sm: '--font-size-sm',
  lg: '--font-size-lg',
  xl: '--font-size-xl',
  '2xl': '--font-size-2xl',
  '3xl': '--font-size-3xl',
}

// Base sizes in pixels
const BASE_SIZES = {
  base: 14,
  sm: 12,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
}

/**
 * Calculate scaled font sizes based on mode
 */
export function getScaledFontSizes(mode: FontSizeMode) {
  const scale = FONT_SIZE_SCALES[mode]
  return {
    base: Math.round(BASE_SIZES.base * scale),
    sm: Math.round(BASE_SIZES.sm * scale),
    lg: Math.round(BASE_SIZES.lg * scale),
    xl: Math.round(BASE_SIZES.xl * scale),
    '2xl': Math.round(BASE_SIZES['2xl'] * scale),
    '3xl': Math.round(BASE_SIZES['3xl'] * scale),
  }
}

/**
 * Apply font size CSS variables to document root
 */
export function applyFontSizeVars(mode: FontSizeMode) {
  if (typeof document === 'undefined') return

  const sizes = getScaledFontSizes(mode)
  const root = document.documentElement

  root.style.setProperty(FONT_SIZE_CSS_VARS.base, `${sizes.base}px`)
  root.style.setProperty(FONT_SIZE_CSS_VARS.sm, `${sizes.sm}px`)
  root.style.setProperty(FONT_SIZE_CSS_VARS.lg, `${sizes.lg}px`)
  root.style.setProperty(FONT_SIZE_CSS_VARS.xl, `${sizes.xl}px`)
  root.style.setProperty(FONT_SIZE_CSS_VARS['2xl'], `${sizes['2xl']}px`)
  root.style.setProperty(FONT_SIZE_CSS_VARS['3xl'], `${sizes['3xl']}px`)

  // Add class for conditional styling
  root.classList.remove('font-normal', 'font-large', 'font-extra-large')
  root.classList.add(`font-${mode.replace('-', '-')}`)

  // Set data attribute for CSS selectors
  root.dataset.fontMode = mode
}

export const useAccessibilityStore = create<AccessibilitySettings>()(
  persist(
    (set, get) => ({
      // Font size
      fontSizeMode: 'normal',
      setFontSizeMode: (mode) => {
        set({ fontSizeMode: mode })
        applyFontSizeVars(mode)
      },

      // High contrast
      highContrast: false,
      toggleHighContrast: () => {
        const newValue = !get().highContrast
        set({ highContrast: newValue })
        if (typeof document !== 'undefined') {
          document.documentElement.dataset.highContrast = String(newValue)
        }
      },

      // Reduce motion
      reduceMotion: false,
      toggleReduceMotion: () => {
        const newValue = !get().reduceMotion
        set({ reduceMotion: newValue })
        if (typeof document !== 'undefined') {
          document.documentElement.dataset.reduceMotion = String(newValue)
        }
      },

      // Tooltips
      showTooltips: true,
      toggleShowTooltips: () => set({ showTooltips: !get().showTooltips }),

      // Auto-save indicator
      showAutoSaveIndicator: true,
      toggleShowAutoSaveIndicator: () =>
        set({ showAutoSaveIndicator: !get().showAutoSaveIndicator }),
    }),
    {
      name: 'qetta-accessibility-settings',
      onRehydrateStorage: () => (state) => {
        // Apply settings on rehydration
        if (state) {
          applyFontSizeVars(state.fontSizeMode)
          if (typeof document !== 'undefined') {
            document.documentElement.dataset.highContrast = String(
              state.highContrast
            )
            document.documentElement.dataset.reduceMotion = String(
              state.reduceMotion
            )
          }
        }
      },
    }
  )
)
