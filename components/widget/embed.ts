/**
 * QETTA Widget Embed Script
 *
 * 외부 사이트에서 위젯을 임베드할 수 있는 스크립트
 *
 * Usage:
 * <script src="https://widget.qetta.ai/v2/embed.js"></script>
 * <script>
 *   QettaWidget.init({
 *     partnerId: 'YOUR_PARTNER_ID',
 *     theme: 'dark',
 *     allowedDocTypes: ['result_report', 'performance_report'],
 *     onComplete: (doc) => console.log('Document:', doc),
 *   });
 * </script>
 * <button onclick="QettaWidget.open()">📄 AI 문서 생성</button>
 */

import type { EmbedConfig, GeneratedWidgetDocument, PartnerConfig } from './types'

interface QettaWidgetAPI {
  init: (config: EmbedConfig) => void
  open: (containerId?: string) => void
  close: () => void
  reset: () => void
  getConfig: () => EmbedConfig | null
  isOpen: () => boolean
}

// Global state
let _config: EmbedConfig | null = null
let _isOpen = false
let _container: HTMLElement | null = null

/**
 * Initialize the widget
 */
function init(config: EmbedConfig): void {
  _config = {
    ...config,
    theme: config.theme ?? 'dark',
    locale: config.locale ?? 'ko',
  }

  // Log initialization
  console.log('[QETTA Widget] Initialized with config:', {
    partnerId: config.partnerId,
    theme: config.theme,
    allowedDocTypes: config.allowedDocTypes,
  })
}

/**
 * Open the widget
 * @param containerId - Optional container ID for inline mode. If not provided, opens as modal.
 */
function open(containerId?: string): void {
  if (!_config) {
    console.error('[QETTA Widget] Not initialized. Call QettaWidget.init() first.')
    return
  }

  if (_isOpen) {
    console.warn('[QETTA Widget] Already open')
    return
  }

  _isOpen = true

  if (containerId) {
    // Inline mode
    _container = document.getElementById(containerId)
    if (!_container) {
      console.error(`[QETTA Widget] Container #${containerId} not found`)
      _isOpen = false
      return
    }
  } else {
    // Modal mode - create overlay
    _container = document.createElement('div')
    _container.id = 'qetta-widget-modal'
    _container.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
    `
    document.body.appendChild(_container)
  }

  // Render widget (in real implementation, this would mount React)
  renderWidget(_container)
}

/**
 * Close the widget
 */
function close(): void {
  if (!_isOpen) return

  _isOpen = false

  if (_container?.id === 'qetta-widget-modal') {
    _container.remove()
  } else if (_container) {
    _container.innerHTML = ''
  }

  _container = null
}

/**
 * Reset the widget state
 */
function reset(): void {
  // In real implementation, this would reset the Zustand store
  console.log('[QETTA Widget] Reset')
}

/**
 * Get current config
 */
function getConfig(): EmbedConfig | null {
  return _config
}

/**
 * Check if widget is open
 */
function isOpen(): boolean {
  return _isOpen
}

/**
 * Render the widget (placeholder - real implementation would mount React)
 */
function renderWidget(container: HTMLElement): void {
  // In production, this would use React.render or createRoot
  // For now, show a placeholder that redirects to the full app

  const widgetUrl = `${window.location.origin}/widgets-demo`

  container.innerHTML = `
    <div style="
      width: 100%;
      max-width: 900px;
      background: #09090b;
      border-radius: 16px;
      border: 1px solid #27272a;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    ">
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        border-bottom: 1px solid #27272a;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: linear-gradient(135deg, #8B5CF6, #D946EF);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          ">Q</div>
          <span style="color: white; font-weight: 600;">QETTA Docs</span>
        </div>
        <button onclick="QettaWidget.close()" style="
          background: none;
          border: none;
          color: #71717a;
          cursor: pointer;
          padding: 8px;
          font-size: 24px;
          line-height: 1;
        ">×</button>
      </div>
      <iframe
        src="${widgetUrl}"
        style="
          width: 100%;
          height: 600px;
          border: none;
        "
        title="QETTA Document Generator"
      ></iframe>
    </div>
  `
}

// Export the API
export const QettaWidget: QettaWidgetAPI = {
  init,
  open,
  close,
  reset,
  getConfig,
  isOpen,
}

// Make it available globally for script tag usage
if (typeof window !== 'undefined') {
  (window as unknown as { QettaWidget: QettaWidgetAPI }).QettaWidget = QettaWidget
}
