/**
 * Analytics Event Tracking for QETTA Landing
 *
 * Tracks user interactions with CTAs, forms, and key conversion points.
 *
 * @requires @next/third-parties (for GoogleAnalytics)
 * @requires @vercel/analytics (for Vercel Analytics)
 *
 * Installation:
 * npm install @next/third-parties @vercel/analytics @vercel/speed-insights
 */

import { logger } from '@/lib/api/logger'

// Event types for type safety
export type AnalyticsEvent =
  | 'cta_partner_click' // 파트너 되기 CTA
  | 'cta_trial_click' // 30일 무료 체험 CTA
  | 'engine_card_click' // Domain Engine 카드 클릭
  | 'docs_section_view' // DOCS 섹션 진입
  | 'verify_section_view' // VERIFY 섹션 진입
  | 'apply_section_view' // APPLY 섹션 진입
  | 'form_submit' // Contact/Demo 폼 제출
  | 'download_resource' // 리소스 다운로드
  | 'video_play' // 비디오 재생 (향후)

// Event properties for additional context
export interface AnalyticsEventProperties {
  category?: string
  label?: string
  value?: number
  section?: string
  engineName?: string
  buttonText?: string
  [key: string]: string | number | undefined
}

/**
 * Track a custom event
 * Sends event to both Google Analytics 4 and Vercel Analytics
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  properties?: AnalyticsEventProperties
) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: properties?.category,
      event_label: properties?.label,
      value: properties?.value,
      ...properties,
    })
  }

  // Vercel Analytics (if available)
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', eventName, properties)
  }

  // Development-only logging
  logger.debug('[Analytics]', eventName, properties)
}

/**
 * Track CTA button clicks
 */
export function trackCTAClick(buttonText: string, section?: string) {
  const eventName =
    buttonText === '파트너 되기' ? 'cta_partner_click' : 'cta_trial_click'

  trackEvent(eventName, {
    category: 'CTA',
    label: buttonText,
    section,
    buttonText,
  })
}

/**
 * Track section views (DOCS-VERIFY-APPLY triangle)
 */
export function trackSectionView(
  sectionName: 'DOCS' | 'VERIFY' | 'APPLY' | 'FEATURES'
) {
  const eventName = `${sectionName.toLowerCase()}_section_view` as AnalyticsEvent

  trackEvent(eventName, {
    category: 'Section View',
    label: sectionName,
    section: sectionName,
  })
}

/**
 * Track Domain Engine card interactions
 */
export function trackEngineClick(engineName: string) {
  trackEvent('engine_card_click', {
    category: 'Engagement',
    label: engineName,
    engineName,
  })
}

/**
 * Track form submissions
 */
export function trackFormSubmit(formType: 'contact' | 'demo' | 'partner') {
  trackEvent('form_submit', {
    category: 'Conversion',
    label: formType,
    value: formType === 'partner' ? 100 : 50, // Weighted value for conversion tracking
  })
}

/**
 * Initialize Vercel Analytics
 * Call this once in app/layout.tsx
 */
export function initVercelAnalytics() {
  // This will be handled by the Analytics component from @vercel/analytics/react
  // Just a placeholder for documentation
  return null
}

// Type augmentation for window.gtag
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void
    va?: (command: string, ...args: unknown[]) => void
  }
}
