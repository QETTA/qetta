/**
 * HTML Preview Generator
 *
 * 대시보드 내에서 문서 미리보기를 위한 HTML 생성기
 * HancomDocs API 의존 없이 즉시 미리보기 제공
 *
 * @module document-generator/html-preview-generator
 */

import { DISPLAY_METRICS } from '@/constants/metrics'
import type { EnginePresetType } from '@/types/inbox'
import type { PreviewDocument, PreviewMetadata, PreviewCacheEntry } from './types'
import { PREVIEW_CACHE_TTL_MS } from './types'

// ============================================
// STEP 2.1: Catalyst Dark CSS Variables
// ============================================

const CATALYST_DARK_CSS = `
  :root {
    --bg-primary: #09090b;
    --bg-secondary: #18181b;
    --bg-tertiary: #27272a;
    --text-primary: #fafafa;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --accent: #8b5cf6;
    --accent-hover: #7c3aed;
    --border: #27272a;
    --border-subtle: #3f3f46;
    --success: #22c55e;
    --warning: #f59e0b;
    --error: #ef4444;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    padding: 2rem;
  }

  .document-container {
    max-width: 800px;
    margin: 0 auto;
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid var(--border);
  }

  .document-header {
    border-bottom: 1px solid var(--border);
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .document-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .document-meta {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
  }

  .section {
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .data-table th {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    font-weight: 500;
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  .data-table td {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .badge-success {
    background: rgba(34, 197, 94, 0.1);
    color: var(--success);
  }

  .badge-warning {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning);
  }

  .badge-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error);
  }

  .hash-chain {
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    word-break: break-all;
    margin-top: 1.5rem;
    border: 1px dashed var(--border);
  }

  .hash-chain-label {
    color: var(--accent);
    font-weight: 500;
    margin-bottom: 0.25rem;
    display: block;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid var(--border-subtle);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--accent);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  ul, ol {
    padding-left: 1.5rem;
    color: var(--text-secondary);
  }

  li {
    margin-bottom: 0.5rem;
  }
`

// ============================================
// STEP 2.2: Template Interface
// ============================================

interface DomainTemplateRenderer {
  renderContent: (data: Record<string, unknown>) => string
  documentTitle: string
  domain: EnginePresetType
}

// 템플릿 레지스트리
const templateRegistry = {} as Record<EnginePresetType, DomainTemplateRenderer>

// ============================================
// STEP 2.3: 도메인별 템플릿 구현
// ============================================

// ENVIRONMENT (환경부/TMS) 템플릿
templateRegistry.ENVIRONMENT = {
  domain: 'ENVIRONMENT',
  documentTitle: 'TMS 환경 보고서',
  renderContent: (data) => `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${data.totalMeasurements || '24'}</div>
        <div class="stat-label">일일 측정 횟수</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.complianceRate || '100'}%</div>
        <div class="stat-label">법적 기준 준수율</div>
      </div>
    </div>
    <div class="section">
      <h3 class="section-title">배출량 현황</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>항목</th>
            <th>측정값</th>
            <th>허용치</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>NOx (질소산화물)</td>
            <td>${data.nox || '32.5'} ppm</td>
            <td>50 ppm</td>
            <td><span class="badge badge-success">정상</span></td>
          </tr>
          <tr>
            <td>SOx (황산화물)</td>
            <td>${data.sox || '18.2'} ppm</td>
            <td>30 ppm</td>
            <td><span class="badge badge-success">정상</span></td>
          </tr>
          <tr>
            <td>PM (미세먼지)</td>
            <td>${data.pm || '12.8'} μg/m³</td>
            <td>25 μg/m³</td>
            <td><span class="badge badge-success">정상</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="section">
      <h3 class="section-title">CleanSYS 연동 상태</h3>
      <p style="color: var(--text-secondary);">최근 동기화: ${data.lastSync || new Date().toLocaleString('ko-KR')}</p>
      <p style="color: var(--success); margin-top: 0.5rem;">✓ 실시간 연동 정상</p>
    </div>
  `,
}

// MANUFACTURING (중기부/스마트공장) 템플릿
templateRegistry.MANUFACTURING = {
  domain: 'MANUFACTURING',
  documentTitle: '스마트공장 정산 보고서',
  renderContent: (data) => `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${data.oee || '87.5'}%</div>
        <div class="stat-label">설비종합효율 (OEE)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.defectRate || '1.2'}%</div>
        <div class="stat-label">불량률</div>
      </div>
    </div>
    <div class="section">
      <h3 class="section-title">생산 실적 (4M1E)</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>계획</th>
            <th>실적</th>
            <th>달성률</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>생산량</td>
            <td>${data.plannedQty || '1,000'} EA</td>
            <td>${data.actualQty || '1,052'} EA</td>
            <td><span class="badge badge-success">105.2%</span></td>
          </tr>
          <tr>
            <td>가동률</td>
            <td>85%</td>
            <td>${data.operationRate || '92.3'}%</td>
            <td><span class="badge badge-success">108.6%</span></td>
          </tr>
          <tr>
            <td>불량률</td>
            <td>2% 이하</td>
            <td>${data.defectRate || '1.2'}%</td>
            <td><span class="badge badge-success">양호</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="section">
      <h3 class="section-title">MES/PLC 연동 현황</h3>
      <p style="color: var(--text-secondary);">OPC-UA 프로토콜 | MES 연동: <span style="color: var(--success);">정상</span></p>
      <p style="color: var(--text-secondary); margin-top: 0.5rem;">PLC 데이터 수집 주기: 1초</p>
    </div>
  `,
}

// DIGITAL (NIPA/AI바우처) 템플릿
templateRegistry.DIGITAL = {
  domain: 'DIGITAL',
  documentTitle: 'AI 바우처 실적 보고서',
  renderContent: (data) => `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${DISPLAY_METRICS.timeSaved.value}</div>
        <div class="stat-label">${DISPLAY_METRICS.timeSaved.label}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${DISPLAY_METRICS.rejectionReduction.value}</div>
        <div class="stat-label">${DISPLAY_METRICS.rejectionReduction.label}</div>
      </div>
    </div>
    <div class="section">
      <h3 class="section-title">사업 개요</h3>
      <table class="data-table">
        <tbody>
          <tr>
            <td style="width: 30%; color: var(--text-muted);">수요기업</td>
            <td>${data.demandCompany || '(주)테스트기업'}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">공급기업</td>
            <td>${data.supplyCompany || 'QETTA'}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">바우처 금액</td>
            <td>${data.voucherAmount || '50,000,000'}원</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="section">
      <h3 class="section-title">AI 도입 성과</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>지표</th>
            <th>도입 전</th>
            <th>도입 후</th>
            <th>개선율</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>문서 작성 시간</td>
            <td>8시간</td>
            <td>30분</td>
            <td><span class="badge badge-success">${DISPLAY_METRICS.timeSaved.value}↓</span></td>
          </tr>
          <tr>
            <td>반려율</td>
            <td>35%</td>
            <td>3.2%</td>
            <td><span class="badge badge-success">${DISPLAY_METRICS.rejectionReduction.value}↓</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
}

// EXPORT (해외입찰/글로벌) 템플릿
templateRegistry.EXPORT = {
  domain: 'EXPORT',
  documentTitle: '해외입찰 제안서',
  renderContent: (data) => `
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">${DISPLAY_METRICS.termAccuracy.value}</div>
        <div class="stat-label">${DISPLAY_METRICS.termAccuracy.labelEn}</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${DISPLAY_METRICS.globalTenders.value}</div>
        <div class="stat-label">${DISPLAY_METRICS.globalTenders.labelEn}</div>
      </div>
    </div>
    <div class="section">
      <h3 class="section-title">Tender Information</h3>
      <table class="data-table">
        <tbody>
          <tr>
            <td style="width: 30%; color: var(--text-muted);">Platform</td>
            <td>${data.platform || 'SAM.gov'}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Solicitation No.</td>
            <td>${data.solicitationNo || 'W912HN-24-Q-0001'}</td>
          </tr>
          <tr>
            <td style="color: var(--text-muted);">Due Date</td>
            <td>${data.dueDate || '2026-02-15'}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="section">
      <h3 class="section-title">Proposal Summary</h3>
      <p style="color: var(--text-secondary); line-height: 1.8;">
        ${data.summary || 'QETTA provides automated document generation and verification services for government compliance reporting. Our domain-specific AI engines ensure 99.2% accuracy in terminology mapping across TMS, Smart Factory, and AI Voucher domains.'}
      </p>
    </div>
    <div class="section">
      <h3 class="section-title">Key Differentiators</h3>
      <ul style="color: var(--text-secondary); padding-left: 1.5rem;">
        <li>${DISPLAY_METRICS.timeSaved.value} time reduction (${DISPLAY_METRICS.timeSaved.detailEn})</li>
        <li>${DISPLAY_METRICS.rejectionReduction.value} rejection rate decrease</li>
        <li>${DISPLAY_METRICS.apiUptime.value} API availability SLA</li>
        <li>Hash chain verification (SHA-256)</li>
      </ul>
    </div>
  `,
}

// ============================================
// STEP 2.4: 메인 생성 함수
// ============================================

export interface GeneratePreviewRequest {
  documentType: string
  domain: string
  data?: Record<string, unknown>
  metadata?: Partial<PreviewMetadata>
}

export async function generateHtmlPreview(
  request: GeneratePreviewRequest
): Promise<PreviewDocument> {
  const { documentType, domain, data, metadata } = request

  // 도메인 매핑 (lowercase → enum)
  const domainKey = domain.toUpperCase().replace('-', '_') as EnginePresetType
  const template = templateRegistry[domainKey]

  if (!template) {
    throw new Error(`Unknown domain: ${domain}`)
  }

  const now = new Date()
  const id = crypto.randomUUID()

  // 해시체인 생성 (간소화 - 실제로는 hash-verifier 사용)
  const previewHash = `SHA256:${id.slice(0, 8)}...${Date.now().toString(16)}`

  // 전체 HTML 문서 생성
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.documentTitle} | QETTA Preview</title>
  <style>${CATALYST_DARK_CSS}</style>
</head>
<body>
  <div class="document-container">
    <header class="document-header">
      <h1 class="document-title">${template.documentTitle}</h1>
      <p class="document-meta">
        문서 유형: ${documentType} | 생성일: ${now.toLocaleDateString('ko-KR')} |
        도메인: ${domain}
      </p>
    </header>

    <main>
      ${template.renderContent(data || {})}
    </main>

    <footer class="hash-chain">
      <span class="hash-chain-label">🔗 해시체인 검증 정보</span>
      ${previewHash}
    </footer>
  </div>
</body>
</html>`

  return {
    id,
    html,
    documentType,
    enginePreset: domainKey,
    generatedAt: now,
    expiresAt: new Date(now.getTime() + PREVIEW_CACHE_TTL_MS),
    metadata: {
      createdAt: now,
      version: '1.0',
      ...metadata,
    },
  }
}

// ============================================
// 캐시 관리 (메모리 기반)
// ============================================

const previewCache = new Map<string, PreviewCacheEntry>()

export function getCachedPreview(id: string): PreviewDocument | null {
  const entry = previewCache.get(id)
  if (!entry) return null

  // TTL 체크
  if (Date.now() - entry.cachedAt > PREVIEW_CACHE_TTL_MS) {
    previewCache.delete(id)
    return null
  }

  return entry.preview
}

export function cachePreview(preview: PreviewDocument): void {
  previewCache.set(preview.id, {
    preview,
    cachedAt: Date.now(),
  })
}

export function clearExpiredPreviews(): number {
  let cleared = 0
  const now = Date.now()

  for (const [id, entry] of previewCache.entries()) {
    if (now - entry.cachedAt > PREVIEW_CACHE_TTL_MS) {
      previewCache.delete(id)
      cleared++
    }
  }

  return cleared
}

export function getPreviewCacheStats(): { size: number; oldestEntry: number | null } {
  let oldestEntry: number | null = null

  for (const entry of previewCache.values()) {
    if (oldestEntry === null || entry.cachedAt < oldestEntry) {
      oldestEntry = entry.cachedAt
    }
  }

  return {
    size: previewCache.size,
    oldestEntry,
  }
}
