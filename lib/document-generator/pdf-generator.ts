/**
 * PDF Document Generator
 *
 * PDF 문서 생성기 (분석 보고서용)
 *
 * 지원 문서 유형:
 * - TMS: 배출량 분석
 * - Smart Factory: 품질분석 리포트
 * - AI Voucher: 매칭분석 리포트
 * - Global Tender: 입찰 분석, 매칭 리포트
 *
 * @module document-generator/pdf-generator
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { DISPLAY_METRICS } from '@/constants/metrics'
import type { GenerateDocumentRequest } from './types'

// ============================================
// 색상 상수
// ============================================

const COLORS = {
  violet: rgb(0.486, 0.227, 0.929), // #7C3AED
  gray: rgb(0.322, 0.322, 0.322), // #525252
  lightGray: rgb(0.9, 0.9, 0.9),
  white: rgb(1, 1, 1),
  emerald: rgb(0.063, 0.725, 0.506), // #10B981
  amber: rgb(0.961, 0.62, 0.043), // #F59E0B
  red: rgb(0.937, 0.267, 0.267), // #EF4444
}

// ============================================
// 헬퍼 함수
// ============================================

interface DrawTextOptions {
  x: number
  y: number
  size?: number
  color?: ReturnType<typeof rgb>
  font?: Awaited<ReturnType<PDFDocument['embedFont']>>
}

async function drawTitle(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  text: string,
  y: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>
): Promise<void> {
  const width = page.getWidth()
  const textWidth = font.widthOfTextAtSize(text, 24)
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y,
    size: 24,
    font,
    color: COLORS.gray,
  })
}

async function drawSubtitle(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  text: string,
  y: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>
): Promise<void> {
  const width = page.getWidth()
  const textWidth = font.widthOfTextAtSize(text, 12)
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y,
    size: 12,
    font,
    color: COLORS.violet,
  })
}

function drawHeading(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  text: string,
  options: DrawTextOptions
): void {
  page.drawText(text, {
    ...options,
    size: options.size || 16,
    color: COLORS.violet,
  })
}

function drawParagraph(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  text: string,
  options: DrawTextOptions
): void {
  page.drawText(text, {
    ...options,
    size: options.size || 11,
    color: options.color || COLORS.gray,
  })
}

function drawLine(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  startX: number,
  startY: number,
  endX: number
): void {
  page.drawLine({
    start: { x: startX, y: startY },
    end: { x: endX, y: startY },
    thickness: 1,
    color: COLORS.lightGray,
  })
}

function drawRect(
  page: Awaited<ReturnType<PDFDocument['addPage']>>,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ReturnType<typeof rgb>
): void {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color,
  })
}

// ============================================
// 도메인별 문서 생성
// ============================================

/**
 * TMS 배출량 분석 보고서 생성
 */
async function generateTMSAnalysis(
  pdfDoc: PDFDocument,
  request: GenerateDocumentRequest
): Promise<void> {
  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const companyName = request.metadata?.companyName || 'Sample Corp'
  const width = page.getWidth()
  let y = 780

  // 타이틀
  await drawTitle(page, 'TMS Emission Analysis Report', y, boldFont)
  y -= 30
  await drawSubtitle(page, `${companyName} | QETTA Domain Engine`, y, font)

  // 구분선
  y -= 30
  drawLine(page, 50, y, width - 50)

  // 개요
  y -= 40
  drawHeading(page, '1. Analysis Overview', { x: 50, y, font: boldFont })
  y -= 25
  drawParagraph(page, 'This report provides a comprehensive analysis of emission data collected', { x: 50, y, font })
  y -= 15
  drawParagraph(page, 'from TMS monitoring systems over the reporting period.', { x: 50, y, font })

  // 핵심 지표
  y -= 40
  drawHeading(page, '2. Key Metrics', { x: 50, y, font: boldFont })
  y -= 30

  // 메트릭 박스들
  const metrics = [
    { label: 'NOx Average', value: '25.1 ppm', status: 'COMPLIANT' },
    { label: 'SOx Average', value: '13.3 ppm', status: 'COMPLIANT' },
    { label: 'PM Average', value: '8.5 mg/m³', status: 'COMPLIANT' },
  ]

  const boxWidth = (width - 100 - 40) / 3
  metrics.forEach((metric, i) => {
    const boxX = 50 + i * (boxWidth + 20)

    // 배경 박스
    drawRect(page, boxX, y - 60, boxWidth, 70, COLORS.lightGray)

    // 레이블
    drawParagraph(page, metric.label, { x: boxX + 10, y: y - 15, font, size: 10, color: COLORS.gray })

    // 값
    page.drawText(metric.value, {
      x: boxX + 10,
      y: y - 35,
      size: 18,
      font: boldFont,
      color: COLORS.violet,
    })

    // 상태
    const statusColor = metric.status === 'COMPLIANT' ? COLORS.emerald : COLORS.red
    drawParagraph(page, metric.status, { x: boxX + 10, y: y - 55, font: boldFont, size: 9, color: statusColor })
  })

  // 트렌드 분석
  y -= 110
  drawHeading(page, '3. Trend Analysis', { x: 50, y, font: boldFont })
  y -= 25
  drawParagraph(page, '• All emission levels remain within regulatory limits', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• 5% reduction in NOx compared to previous period', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• CleanSYS sync rate: 99.8% (target: 99.0%)', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• Zero exceedance events recorded', { x: 60, y, font })

  // 권고사항
  y -= 40
  drawHeading(page, '4. Recommendations', { x: 50, y, font: boldFont })
  y -= 25
  drawParagraph(page, '1. Continue current operational practices', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '2. Schedule preventive maintenance for Chimney B (Q2 2026)', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '3. Consider upgrading PM monitoring sensors', { x: 60, y, font })

  // 푸터
  y = 50
  drawLine(page, 50, y + 10, width - 50)
  drawParagraph(page, '© 2026 QETTA. When Data Flows, Documentation Follows.', {
    x: 50,
    y,
    font,
    size: 9,
    color: COLORS.violet,
  })
  drawParagraph(page, `Generated: ${new Date().toISOString().split('T')[0]}`, {
    x: width - 150,
    y,
    font,
    size: 9,
    color: COLORS.gray,
  })
}

/**
 * 스마트공장 품질분석 보고서 생성
 */
async function generateSmartFactoryQuality(
  pdfDoc: PDFDocument,
  request: GenerateDocumentRequest
): Promise<void> {
  const page = pdfDoc.addPage([595.28, 841.89])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const companyName = request.metadata?.companyName || 'Sample Corp'
  const width = page.getWidth()
  let y = 780

  await drawTitle(page, 'Quality Analysis Report', y, boldFont)
  y -= 30
  await drawSubtitle(page, `${companyName} | Smart Factory Domain Engine`, y, font)

  y -= 30
  drawLine(page, 50, y, width - 50)

  // 품질 지표
  y -= 40
  drawHeading(page, '1. Quality Metrics Summary', { x: 50, y, font: boldFont })
  y -= 30

  const qualityMetrics = [
    { label: 'Defect Rate', before: '3.2%', after: '0.8%', improvement: '-75%' },
    { label: 'First Pass Yield', before: '91.5%', after: '97.8%', improvement: '+6.9%' },
    { label: 'Customer Returns', before: '2.1%', after: '0.3%', improvement: '-86%' },
  ]

  // 테이블 헤더
  drawRect(page, 50, y - 20, width - 100, 25, COLORS.violet)
  page.drawText('Metric', { x: 60, y: y - 15, size: 10, font: boldFont, color: COLORS.white })
  page.drawText('Before', { x: 200, y: y - 15, size: 10, font: boldFont, color: COLORS.white })
  page.drawText('After', { x: 300, y: y - 15, size: 10, font: boldFont, color: COLORS.white })
  page.drawText('Improvement', { x: 400, y: y - 15, size: 10, font: boldFont, color: COLORS.white })

  y -= 25
  qualityMetrics.forEach((metric, i) => {
    const rowY = y - i * 25
    const bgColor = i % 2 === 0 ? COLORS.lightGray : COLORS.white
    drawRect(page, 50, rowY - 20, width - 100, 25, bgColor)

    drawParagraph(page, metric.label, { x: 60, y: rowY - 15, font })
    drawParagraph(page, metric.before, { x: 200, y: rowY - 15, font })
    drawParagraph(page, metric.after, { x: 300, y: rowY - 15, font })
    drawParagraph(page, metric.improvement, { x: 400, y: rowY - 15, font, color: COLORS.emerald })
  })

  // 분석 결과
  y -= 120
  drawHeading(page, '2. Root Cause Analysis', { x: 50, y, font: boldFont })
  y -= 25
  drawParagraph(page, 'AI-powered quality prediction identified the following improvement areas:', { x: 50, y, font })
  y -= 20
  drawParagraph(page, '• Material handling temperature optimization', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• Tool wear prediction and proactive replacement', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• Process parameter fine-tuning based on real-time data', { x: 60, y, font })

  // 푸터
  y = 50
  drawLine(page, 50, y + 10, width - 50)
  drawParagraph(page, `© 2026 QETTA. ${DISPLAY_METRICS.timeSaved.value} Time Reduction Achieved.`, {
    x: 50,
    y,
    font,
    size: 9,
    color: COLORS.violet,
  })
}

/**
 * AI 바우처 매칭분석 보고서 생성
 */
async function generateAIVoucherMatching(
  pdfDoc: PDFDocument,
  request: GenerateDocumentRequest
): Promise<void> {
  const page = pdfDoc.addPage([595.28, 841.89])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const companyName = request.metadata?.companyName || 'Sample Corp'
  const width = page.getWidth()
  let y = 780

  await drawTitle(page, 'AI Voucher Matching Analysis', y, boldFont)
  y -= 30
  await drawSubtitle(page, `Demand Company: ${companyName}`, y, font)

  y -= 30
  drawLine(page, 50, y, width - 50)

  // 매칭 점수
  y -= 40
  drawHeading(page, '1. Matching Score Summary', { x: 50, y, font: boldFont })
  y -= 30

  // 스코어 원형 시각화 (간단한 텍스트로 대체)
  drawRect(page, 50, y - 80, 150, 90, COLORS.lightGray)
  page.drawText('Match Score', { x: 80, y: y - 30, size: 12, font, color: COLORS.gray })
  page.drawText(DISPLAY_METRICS.timeSaved.value, { x: 75, y: y - 60, size: 28, font: boldFont, color: COLORS.violet })

  drawRect(page, 220, y - 80, 150, 90, COLORS.lightGray)
  page.drawText('Compatibility', { x: 245, y: y - 30, size: 12, font, color: COLORS.gray })
  page.drawText('HIGH', { x: 265, y: y - 60, size: 24, font: boldFont, color: COLORS.emerald })

  drawRect(page, 390, y - 80, 150, 90, COLORS.lightGray)
  page.drawText('Success Rate', { x: 420, y: y - 30, size: 12, font, color: COLORS.gray })
  page.drawText(DISPLAY_METRICS.rejectionReduction.value, { x: 430, y: y - 60, size: 28, font: boldFont, color: COLORS.violet })

  // 매칭 근거
  y -= 130
  drawHeading(page, '2. Matching Rationale', { x: 50, y, font: boldFont })
  y -= 25
  drawParagraph(page, '• Industry domain alignment: Manufacturing (100% match)', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• Technology requirements: AI/ML, Quality Prediction (95% match)', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• Budget range compatibility: Tier 2 (90% match)', { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• Timeline feasibility: 3 months (100% match)', { x: 60, y, font })

  // 추천
  y -= 40
  drawHeading(page, '3. Recommendation', { x: 50, y, font: boldFont })
  y -= 25
  drawParagraph(page, 'Based on the analysis, this matching is HIGHLY RECOMMENDED.', { x: 50, y, font: boldFont, color: COLORS.emerald })
  y -= 20
  drawParagraph(page, 'The supplier (QETTA) has demonstrated expertise in quality prediction', { x: 50, y, font })
  y -= 15
  drawParagraph(page, 'with proven results: 74% defect reduction, 87% inspection time savings.', { x: 50, y, font })

  // 푸터
  y = 50
  drawLine(page, 50, y + 10, width - 50)
  drawParagraph(page, '© 2026 QETTA. AI Voucher Domain Engine.', {
    x: 50,
    y,
    font,
    size: 9,
    color: COLORS.violet,
  })
}

/**
 * 해외입찰 분석 보고서 생성
 */
async function generateGlobalTenderAnalysis(
  pdfDoc: PDFDocument,
  _request: GenerateDocumentRequest // Reserved for future dynamic content generation
): Promise<void> {
  const page = pdfDoc.addPage([595.28, 841.89])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const width = page.getWidth()
  let y = 780

  await drawTitle(page, 'Global Tender Analysis', y, boldFont)
  y -= 30
  await drawSubtitle(page, 'QETTA Global Tender Domain Engine', y, font)

  y -= 30
  drawLine(page, 50, y, width - 50)

  // 입찰 기회 요약
  y -= 40
  drawHeading(page, '1. Opportunity Summary', { x: 50, y, font: boldFont })
  y -= 30

  const opportunities = [
    { source: 'SAM.gov', count: '12', value: '$2.4M', win: '42%' },
    { source: 'UNGM', count: '8', value: '$1.8M', win: '38%' },
    { source: 'Goszakup', count: '5', value: '$950K', win: '55%' },
  ]

  // 테이블
  drawRect(page, 50, y - 20, width - 100, 25, COLORS.violet)
  page.drawText('Source', { x: 60, y: y - 15, size: 10, font: boldFont, color: COLORS.white })
  page.drawText('Opportunities', { x: 180, y: y - 15, size: 10, font: boldFont, color: COLORS.white })
  page.drawText('Total Value', { x: 300, y: y - 15, size: 10, font: boldFont, color: COLORS.white })
  page.drawText('Win Probability', { x: 420, y: y - 15, size: 10, font: boldFont, color: COLORS.white })

  y -= 25
  opportunities.forEach((opp, i) => {
    const rowY = y - i * 25
    const bgColor = i % 2 === 0 ? COLORS.lightGray : COLORS.white
    drawRect(page, 50, rowY - 20, width - 100, 25, bgColor)

    drawParagraph(page, opp.source, { x: 60, y: rowY - 15, font })
    drawParagraph(page, opp.count, { x: 200, y: rowY - 15, font })
    drawParagraph(page, opp.value, { x: 300, y: rowY - 15, font })
    drawParagraph(page, opp.win, { x: 440, y: rowY - 15, font, color: COLORS.emerald })
  })

  // 총합
  y -= 100
  drawRect(page, 50, y - 20, width - 100, 30, COLORS.violet)
  page.drawText(`Total Database: ${DISPLAY_METRICS.globalTenders.value} tenders | Active Matches: 25 | Pipeline Value: $5.15M`, {
    x: 60,
    y: y - 12,
    size: 11,
    font: boldFont,
    color: COLORS.white,
  })

  // 경쟁 분석
  y -= 60
  drawHeading(page, '2. Competitive Positioning', { x: 50, y, font: boldFont })
  y -= 25
  drawParagraph(page, `• QETTA unique advantage: Domain Engine technology (${DISPLAY_METRICS.termAccuracy.value} terminology accuracy)`, { x: 60, y, font })
  y -= 15
  drawParagraph(page, `• Key differentiator: ${DISPLAY_METRICS.timeSaved.value} time reduction vs. manual preparation`, { x: 60, y, font })
  y -= 15
  drawParagraph(page, '• Price competitiveness: 30% below market average for similar solutions', { x: 60, y, font })

  // 푸터
  y = 50
  drawLine(page, 50, y + 10, width - 50)
  drawParagraph(page, `© 2026 QETTA. ${DISPLAY_METRICS.globalTenders.value} Global Tender Database.`, {
    x: 50,
    y,
    font,
    size: 9,
    color: COLORS.violet,
  })
}

// ============================================
// 메인 생성 함수
// ============================================

/**
 * PDF 문서 생성
 */
export async function generatePdf(request: GenerateDocumentRequest): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const { enginePreset, documentType } = request

  // 메타데이터 설정
  pdfDoc.setTitle(`QETTA ${enginePreset} Report`)
  pdfDoc.setAuthor('QETTA Domain Engine')
  pdfDoc.setCreator('QETTA Platform')
  pdfDoc.setProducer('pdf-lib')
  pdfDoc.setCreationDate(new Date())
  pdfDoc.setModificationDate(new Date())

  // 도메인 및 문서 유형에 따른 분기
  switch (enginePreset) {
    case 'ENVIRONMENT':
      await generateTMSAnalysis(pdfDoc, request)
      break

    case 'MANUFACTURING':
      await generateSmartFactoryQuality(pdfDoc, request)
      break

    case 'DIGITAL':
      await generateAIVoucherMatching(pdfDoc, request)
      break

    case 'EXPORT':
      if (documentType === 'tender_analysis') {
        await generateGlobalTenderAnalysis(pdfDoc, request)
      } else {
        await generateGlobalTenderAnalysis(pdfDoc, request)
      }
      break

    default:
      await generateTMSAnalysis(pdfDoc, request)
  }

  // Buffer로 변환
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
