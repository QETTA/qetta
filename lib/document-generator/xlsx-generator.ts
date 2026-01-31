/**
 * XLSX Document Generator
 *
 * Microsoft Excel 문서 생성기
 *
 * 지원 문서 유형:
 * - TMS: 측정기록부
 * - Smart Factory: 설비이력, OEE 보고서
 * - AI Voucher: 정산서
 * - Global Tender: 요건 체크리스트
 *
 * @module document-generator/xlsx-generator
 */

import { DISPLAY_METRICS } from '@/constants/metrics'
import ExcelJS from 'exceljs'
import type { GenerateDocumentRequest } from './types'

// ============================================
// 스타일 상수
// ============================================

const QETTA_VIOLET = 'FF7C3AED'
const QETTA_VIOLET_LIGHT = 'FFF5F3FF'
const QETTA_GRAY = 'FF525252'
const HEADER_BG = QETTA_VIOLET
const ALT_ROW_BG = 'FFF3F4F6'

// ============================================
// 헬퍼 함수
// ============================================

function setHeaderStyle(row: ExcelJS.Row): void {
  row.height = 25
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_BG },
    }
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 11,
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    }
  })
}

function setDataRowStyle(row: ExcelJS.Row, isAlt: boolean): void {
  row.height = 22
  row.eachCell((cell) => {
    if (isAlt) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ALT_ROW_BG },
      }
    }
    cell.font = {
      color: { argb: QETTA_GRAY },
      size: 10,
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    }
  })
}

function setTitleCell(worksheet: ExcelJS.Worksheet, text: string, row: number): void {
  worksheet.mergeCells(`A${row}:H${row}`)
  const cell = worksheet.getCell(`A${row}`)
  cell.value = text
  cell.font = {
    size: 16,
    bold: true,
    color: { argb: QETTA_GRAY },
  }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(row).height = 30
}

// ============================================
// 도메인별 문서 생성
// ============================================

/**
 * TMS 측정기록부 생성
 */
async function generateTMSMeasurementRecord(
  workbook: ExcelJS.Workbook,
  request: GenerateDocumentRequest
): Promise<void> {
  const sheet = workbook.addWorksheet('측정기록부')
  const companyName = request.metadata?.companyName || '주식회사 샘플'
  const reportDate = request.metadata?.reportDate || new Date().toISOString().split('T')[0]

  // 제목
  setTitleCell(sheet, `TMS 측정기록부 - ${companyName}`, 1)
  sheet.getCell('A2').value = `작성일: ${reportDate}`
  sheet.getRow(2).height = 20

  // 헤더
  const headers = ['일시', '굴뚝명', 'NOx (ppm)', 'SOx (ppm)', 'PM (mg/㎥)', '온도 (°C)', '유량 (㎥/h)', '상태']
  const headerRow = sheet.addRow(headers)
  setHeaderStyle(headerRow)

  // 샘플 데이터 (30일치)
  const stacks = ['굴뚝 A', '굴뚝 B', '굴뚝 C']
  for (let day = 1; day <= 30; day++) {
    for (const stack of stacks) {
      const row = sheet.addRow([
        `2026-01-${day.toString().padStart(2, '0')} 14:00`,
        stack,
        (20 + Math.random() * 10).toFixed(1),
        (10 + Math.random() * 8).toFixed(1),
        (5 + Math.random() * 5).toFixed(1),
        (180 + Math.random() * 40).toFixed(0),
        (5000 + Math.random() * 2000).toFixed(0),
        '정상',
      ])
      setDataRowStyle(row, day % 2 === 0)
    }
  }

  // 열 너비 설정
  sheet.columns = [
    { width: 20 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 10 },
  ]

  // 요약 시트
  const summarySheet = workbook.addWorksheet('요약')
  setTitleCell(summarySheet, 'TMS 월간 요약', 1)

  summarySheet.addRow([])
  const summaryHeader = summarySheet.addRow(['항목', '평균', '최대', '최소', '기준치', '적합 여부'])
  setHeaderStyle(summaryHeader)

  const summaryData = [
    ['NOx (ppm)', '25.1', '32.4', '18.7', '40', '적합'],
    ['SOx (ppm)', '13.3', '19.2', '8.5', '35', '적합'],
    ['PM (mg/㎥)', '8.5', '12.1', '5.2', '20', '적합'],
  ]
  summaryData.forEach((data, i) => {
    const row = summarySheet.addRow(data)
    setDataRowStyle(row, i % 2 === 1)
  })

  summarySheet.columns = [
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
  ]
}

/**
 * 스마트공장 설비이력 생성
 */
async function generateSmartFactoryEquipmentHistory(
  workbook: ExcelJS.Workbook,
  request: GenerateDocumentRequest
): Promise<void> {
  const sheet = workbook.addWorksheet('설비이력')
  const companyName = request.metadata?.companyName || '주식회사 샘플'

  setTitleCell(sheet, `설비이력 보고서 - ${companyName}`, 1)
  sheet.addRow([])

  // 헤더
  const headers = ['설비ID', '설비명', '모델', '도입일', '최근점검', '다음점검', '상태', '가동률']
  const headerRow = sheet.addRow(headers)
  setHeaderStyle(headerRow)

  // 샘플 데이터
  const equipmentData = [
    ['EQ-001', 'CNC 선반 #1', 'DMG MORI NLX 2500', '2024-03-15', '2026-01-10', '2026-04-10', '정상', '94.5%'],
    ['EQ-002', 'CNC 밀링 #1', 'Mazak VCN-530C', '2024-05-20', '2026-01-08', '2026-04-08', '정상', '91.2%'],
    ['EQ-003', '로봇 용접기', 'Fanuc ARC Mate 100', '2025-01-10', '2026-01-15', '2026-04-15', '정상', '88.7%'],
    ['EQ-004', '프레스 #1', 'Amada VIPROS 255', '2023-11-01', '2025-12-20', '2026-03-20', '점검 필요', '85.3%'],
    ['EQ-005', '레이저 절단기', 'Trumpf TruLaser 3030', '2025-06-15', '2026-01-12', '2026-04-12', '정상', '92.8%'],
  ]

  equipmentData.forEach((data, i) => {
    const row = sheet.addRow(data)
    setDataRowStyle(row, i % 2 === 1)

    // 상태에 따른 색상
    if (data[6] === '점검 필요') {
      row.getCell(7).font = { color: { argb: 'FFEF4444' }, bold: true }
    }
  })

  sheet.columns = [
    { width: 10 },
    { width: 15 },
    { width: 22 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
  ]

  // OEE 시트
  const oeeSheet = workbook.addWorksheet('OEE')
  setTitleCell(oeeSheet, '설비종합효율(OEE) 분석', 1)
  oeeSheet.addRow([])

  const oeeHeader = oeeSheet.addRow(['설비', '가용률', '성능률', '품질률', 'OEE', '목표', '달성'])
  setHeaderStyle(oeeHeader)

  const oeeData = [
    ['CNC 선반 #1', '95.0%', '92.0%', '98.5%', '86.1%', '85.0%', '달성'],
    ['CNC 밀링 #1', '93.5%', '89.0%', '97.8%', '81.4%', '80.0%', '달성'],
    ['로봇 용접기', '90.0%', '88.5%', '99.0%', '78.8%', '82.0%', '미달성'],
    ['프레스 #1', '88.0%', '85.0%', '96.5%', '72.1%', '78.0%', '미달성'],
    ['레이저 절단기', '96.0%', '94.5%', '99.5%', '90.2%', '88.0%', '달성'],
  ]

  oeeData.forEach((data, i) => {
    const row = oeeSheet.addRow(data)
    setDataRowStyle(row, i % 2 === 1)

    if (data[6] === '미달성') {
      row.getCell(7).font = { color: { argb: 'FFEF4444' }, bold: true }
    } else {
      row.getCell(7).font = { color: { argb: 'FF10B981' }, bold: true }
    }
  })

  oeeSheet.columns = [
    { width: 15 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
  ]
}

/**
 * AI 바우처 정산서 생성
 */
async function generateAIVoucherSettlement(
  workbook: ExcelJS.Workbook,
  request: GenerateDocumentRequest
): Promise<void> {
  const sheet = workbook.addWorksheet('정산서')
  const companyName = request.metadata?.companyName || '주식회사 샘플'
  const period = request.metadata?.period || { start: '2026-01-01', end: '2026-03-31' }

  setTitleCell(sheet, `AI 바우처 사업 정산서`, 1)
  sheet.getCell('A2').value = `수요기업: ${companyName}`
  sheet.getCell('A3').value = `정산기간: ${period.start} ~ ${period.end}`
  sheet.addRow([])

  // 집행 내역
  const headers = ['No.', '비목', '내용', '계약금액', '집행금액', '잔액', '집행률', '비고']
  const headerRow = sheet.addRow(headers)
  setHeaderStyle(headerRow)

  const expenseData = [
    ['1', 'AI 솔루션 개발', '품질 예측 모델 개발', '40,000,000', '40,000,000', '0', '100%', '-'],
    ['2', '시스템 구축', '대시보드 개발 및 배포', '30,000,000', '29,500,000', '500,000', '98.3%', '일부 이월'],
    ['3', '데이터 수집/정제', '센서 데이터 ETL 구축', '15,000,000', '15,000,000', '0', '100%', '-'],
    ['4', '교육훈련', '사용자 교육 5회', '10,000,000', '10,000,000', '0', '100%', '-'],
    ['5', '유지보수', '3개월 운영 지원', '5,000,000', '3,000,000', '2,000,000', '60%', '계속 진행'],
  ]

  expenseData.forEach((data, i) => {
    const row = sheet.addRow(data)
    setDataRowStyle(row, i % 2 === 1)
  })

  // 합계 행
  const totalRow = sheet.addRow(['', '합계', '', '100,000,000', '97,500,000', '2,500,000', '97.5%', ''])
  totalRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: QETTA_VIOLET_LIGHT },
    }
  })

  sheet.columns = [
    { width: 6 },
    { width: 18 },
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 10 },
    { width: 12 },
  ]
}

/**
 * 해외입찰 요건 체크리스트 생성
 */
async function generateGlobalTenderChecklist(
  workbook: ExcelJS.Workbook,
  request: GenerateDocumentRequest
): Promise<void> {
  const sheet = workbook.addWorksheet('Compliance Checklist')
  const companyName = request.metadata?.companyName || 'QETTA Inc.'

  setTitleCell(sheet, 'Tender Compliance Checklist', 1)
  sheet.getCell('A2').value = `Company: ${companyName}`
  sheet.addRow([])

  const headers = ['#', 'Requirement', 'Category', 'Status', 'Evidence', 'Notes']
  const headerRow = sheet.addRow(headers)
  setHeaderStyle(headerRow)

  const checklistData = [
    ['1', 'SAM.gov Registration', 'Eligibility', 'Completed', 'Registration #', 'Valid until 2027'],
    ['2', 'DUNS Number', 'Eligibility', 'Completed', 'DUNS-XXXXX', '-'],
    ['3', 'Past Performance (3 refs)', 'Experience', 'Completed', 'Attached', 'TIPS, SNACK, AIFC'],
    ['4', 'Technical Capability', 'Technical', 'Completed', 'Proposal Sec 2', `${DISPLAY_METRICS.timeSaved.value} time reduction`],
    ['5', 'Security Clearance', 'Compliance', 'Not Required', '-', 'Commercial only'],
    ['6', 'Insurance Certificate', 'Financial', 'Pending', '-', 'Due: 2026-02-01'],
    ['7', 'Financial Statements', 'Financial', 'Completed', 'Attached', 'Audited 2025'],
    ['8', 'Pricing Schedule', 'Commercial', 'Completed', 'Proposal Sec 4', 'Tiered pricing'],
  ]

  checklistData.forEach((data, i) => {
    const row = sheet.addRow(data)
    setDataRowStyle(row, i % 2 === 1)

    // 상태에 따른 색상
    const status = data[3]
    const statusCell = row.getCell(4)
    if (status === 'Completed') {
      statusCell.font = { color: { argb: 'FF10B981' }, bold: true }
    } else if (status === 'Pending') {
      statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true }
    } else if (status === 'Not Required') {
      statusCell.font = { color: { argb: 'FF6B7280' } }
    }
  })

  sheet.columns = [
    { width: 5 },
    { width: 25 },
    { width: 12 },
    { width: 14 },
    { width: 15 },
    { width: 25 },
  ]
}

// ============================================
// 메인 생성 함수
// ============================================

/**
 * XLSX 문서 생성
 */
export async function generateXlsx(request: GenerateDocumentRequest): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const { enginePreset, documentType } = request

  // 메타데이터 설정
  workbook.creator = 'QETTA Domain Engine'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.company = request.metadata?.companyName || 'QETTA'

  // 도메인 및 문서 유형에 따른 분기
  switch (enginePreset) {
    case 'ENVIRONMENT':
      await generateTMSMeasurementRecord(workbook, request)
      break

    case 'MANUFACTURING':
      if (documentType === 'oee_report') {
        await generateSmartFactoryEquipmentHistory(workbook, request)
      } else {
        await generateSmartFactoryEquipmentHistory(workbook, request)
      }
      break

    case 'DIGITAL':
      await generateAIVoucherSettlement(workbook, request)
      break

    case 'EXPORT':
      await generateGlobalTenderChecklist(workbook, request)
      break

    default:
      await generateTMSMeasurementRecord(workbook, request)
  }

  // Buffer로 변환
  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
