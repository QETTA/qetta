/**
 * DOCX Document Generator
 *
 * Microsoft Word 문서 생성기
 *
 * 지원 문서 유형:
 * - TMS: 일일보고서, 월간보고서
 * - Smart Factory: 정산보고서
 * - AI Voucher: 실적보고서, 포트폴리오
 * - Global Tender: 제안서 초안
 *
 * @module document-generator/docx-generator
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
} from 'docx'
import { DISPLAY_METRICS } from '@/constants/metrics'
import type { GenerateDocumentRequest } from './types'
import type { AdaptedDocumentRequest, TemplateSectionData } from './domain-engine-adapter'

// ============================================
// 스타일 상수
// ============================================

const QETTA_VIOLET = '7C3AED'
const QETTA_GRAY = '525252'

const STYLES = {
  title: {
    size: 48,
    bold: true,
    color: QETTA_GRAY,
  },
  heading1: {
    size: 32,
    bold: true,
    color: QETTA_VIOLET,
  },
  heading2: {
    size: 28,
    bold: true,
    color: QETTA_GRAY,
  },
  body: {
    size: 24,
    color: QETTA_GRAY,
  },
  caption: {
    size: 20,
    italics: true,
    color: QETTA_GRAY,
  },
}

// ============================================
// 헬퍼 함수
// ============================================

function createTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        ...STYLES.title,
      }),
    ],
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  })
}

function createHeading1(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        ...STYLES.heading1,
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  })
}

function createHeading2(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        ...STYLES.heading2,
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  })
}

function createParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        ...STYLES.body,
      }),
    ],
    spacing: { after: 200 },
  })
}

function createBulletPoint(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${text}`,
        ...STYLES.body,
      }),
    ],
    indent: { left: 720 },
    spacing: { after: 100 },
  })
}

function createTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                  size: 22,
                  color: 'FFFFFF',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: QETTA_VIOLET },
        })
    ),
  })

  const dataRows = rows.map(
    (row, rowIndex) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, size: 22 })],
                  alignment: AlignmentType.LEFT,
                }),
              ],
              shading: { fill: rowIndex % 2 === 0 ? 'F3F4F6' : 'FFFFFF' },
            })
        ),
      })
  )

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
  })
}

function createHeader(companyName: string): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: companyName,
            size: 18,
            color: QETTA_GRAY,
          }),
          new TextRun({
            text: ' | QETTA 도메인 엔진',
            size: 18,
            color: QETTA_VIOLET,
          }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    ],
  })
}

function createFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: '© 2026 QETTA. Your Industry, Your Intelligence. | 페이지 ',
            size: 18,
            color: QETTA_GRAY,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18,
            color: QETTA_GRAY,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
  })
}

// ============================================
// 도메인별 문서 생성
// ============================================

/**
 * TMS 일일보고서 생성
 */
function generateTMSDailyReport(request: GenerateDocumentRequest): Document {
  const companyName = request.metadata?.companyName || '주식회사 샘플'
  const reportDate = request.metadata?.reportDate || new Date().toISOString().split('T')[0]

  return new Document({
    sections: [
      {
        headers: { default: createHeader(companyName) },
        footers: { default: createFooter() },
        children: [
          createTitle('TMS 일일 배출량 보고서'),
          createParagraph(`보고일자: ${reportDate}`),
          createParagraph(`사업장명: ${companyName}`),

          createHeading1('1. 배출량 현황'),
          createTable(
            ['구분', 'NOx (ppm)', 'SOx (ppm)', 'PM (mg/㎥)', '상태'],
            [
              ['굴뚝 A', '24.5', '12.3', '8.7', '정상'],
              ['굴뚝 B', '28.1', '15.7', '9.2', '정상'],
              ['굴뚝 C', '22.8', '11.9', '7.5', '정상'],
              ['평균', '25.1', '13.3', '8.5', '-'],
            ]
          ),

          createHeading1('2. CleanSYS 연동 상태'),
          createBulletPoint('실시간 전송 주기: 5분'),
          createBulletPoint('금일 전송 성공률: 99.8%'),
          createBulletPoint('이상 감지 건수: 0건'),

          createHeading1('3. 특이사항'),
          createParagraph('금일 특이사항 없음. 모든 배출 시설 정상 가동 중.'),

          createHeading1('4. 담당자 의견'),
          createParagraph(
            '배출량이 법적 기준치 이내에서 안정적으로 유지되고 있습니다. ' +
              '다음 주 정기 점검 예정.'
          ),
        ],
      },
    ],
  })
}

/**
 * 스마트공장 정산보고서 생성
 */
function generateSmartFactorySettlement(request: GenerateDocumentRequest): Document {
  const companyName = request.metadata?.companyName || '주식회사 샘플'
  const period = request.metadata?.period || { start: '2026-01-01', end: '2026-01-31' }

  return new Document({
    sections: [
      {
        headers: { default: createHeader(companyName) },
        footers: { default: createFooter() },
        children: [
          createTitle('스마트공장 구축사업 정산보고서'),
          createParagraph(`사업장: ${companyName}`),
          createParagraph(`정산기간: ${period.start} ~ ${period.end}`),

          createHeading1('1. 사업 개요'),
          createTable(
            ['항목', '내용'],
            [
              ['사업명', '스마트공장 고도화 사업'],
              ['총 사업비', '100,000,000원'],
              ['정부지원금', '50,000,000원 (50%)'],
              ['자부담금', '50,000,000원 (50%)'],
            ]
          ),

          createHeading1('2. 집행 내역'),
          createTable(
            ['비목', '예산', '집행', '집행률'],
            [
              ['장비구입비', '60,000,000원', '58,500,000원', '97.5%'],
              ['소프트웨어', '25,000,000원', '24,800,000원', '99.2%'],
              ['컨설팅비', '10,000,000원', '10,000,000원', '100%'],
              ['기타', '5,000,000원', '4,200,000원', '84%'],
              ['합계', '100,000,000원', '97,500,000원', '97.5%'],
            ]
          ),

          createHeading1('3. 도입 효과'),
          createBulletPoint('설비종합효율(OEE): 65% → 82% (17%p 향상)'),
          createBulletPoint('불량률: 3.2% → 0.8% (75% 감소)'),
          createBulletPoint('납기 준수율: 88% → 97% (9%p 향상)'),

          createHeading1('4. 첨부 서류'),
          createBulletPoint('세금계산서 사본 (12건)'),
          createBulletPoint('설비 도입 사진 (8매)'),
          createBulletPoint('교육 수료증 (5부)'),
        ],
      },
    ],
  })
}

/**
 * AI 바우처 실적보고서 생성
 */
function generateAIVoucherPerformance(request: GenerateDocumentRequest): Document {
  const companyName = request.metadata?.companyName || '주식회사 샘플'
  const period = request.metadata?.period || { start: '2026-01-01', end: '2026-03-31' }

  return new Document({
    sections: [
      {
        headers: { default: createHeader(companyName) },
        footers: { default: createFooter() },
        children: [
          createTitle('AI 바우처 사업 실적보고서'),
          createParagraph(`공급기업: QETTA`),
          createParagraph(`수요기업: ${companyName}`),
          createParagraph(`사업기간: ${period.start} ~ ${period.end}`),

          createHeading1('1. 사업 개요'),
          createTable(
            ['항목', '내용'],
            [
              ['사업명', 'AI 기반 품질 예측 시스템 구축'],
              ['지원금액', '100,000,000원'],
              ['수행기간', '3개월'],
              ['진행률', '100%'],
            ]
          ),

          createHeading1('2. 수행 내용'),
          createHeading2('2.1 1단계: 데이터 수집 및 분석'),
          createBulletPoint('생산 데이터 3개월분 수집 (2,500,000건)'),
          createBulletPoint('불량 패턴 분석 및 특성 추출'),

          createHeading2('2.2 2단계: AI 모델 개발'),
          createBulletPoint('머신러닝 모델 학습 (정확도 93.8%)'),
          createBulletPoint('실시간 예측 API 개발'),

          createHeading2('2.3 3단계: 시스템 구축 및 교육'),
          createBulletPoint('대시보드 구축 및 배포'),
          createBulletPoint('사용자 교육 5회 실시'),

          createHeading1('3. 도입 효과'),
          createTable(
            ['지표', '도입 전', '도입 후', '개선율'],
            [
              ['불량 예측 정확도', '-', '93.8%', '-'],
              ['불량률', '4.2%', '1.1%', '74% 감소'],
              ['검사 시간', '15분/건', '2분/건', '87% 단축'],
              ['연간 품질 비용', '5억원', '1.3억원', '74% 절감'],
            ]
          ),

          createHeading1('4. 증빙 자료'),
          createBulletPoint('시스템 스크린샷 (10매)'),
          createBulletPoint('교육 참석 명부 (25명)'),
          createBulletPoint('만족도 조사 결과 (NPS 45)'),
        ],
      },
    ],
  })
}

/**
 * 해외입찰 제안서 초안 생성
 */
function generateGlobalTenderProposal(request: GenerateDocumentRequest): Document {
  const companyName = request.metadata?.companyName || 'QETTA Inc.'

  return new Document({
    sections: [
      {
        headers: { default: createHeader(companyName) },
        footers: { default: createFooter() },
        children: [
          createTitle('Technical Proposal'),
          createParagraph('QETTA Domain Engine Solution'),
          createParagraph(`Submitted by: ${companyName}`),

          createHeading1('1. Executive Summary'),
          createParagraph(
            `QETTA provides an AI-powered domain engine solution that automates ` +
              `industrial documentation with ${DISPLAY_METRICS.timeSaved.value} time reduction and ${DISPLAY_METRICS.termAccuracy.value} accuracy. ` +
              `Our solution has been validated through TIPS selection and serves 50+ partners.`
          ),

          createHeading1('2. Technical Approach'),
          createHeading2('2.1 Core Technology'),
          createBulletPoint('Domain Engine: Industry-specific terminology mapping'),
          createBulletPoint('Hash Chain Verification: SHA-256 based integrity check'),
          createBulletPoint('AI Integration: Claude Opus 4.5 with Extended Thinking'),

          createHeading2('2.2 Key Metrics'),
          createTable(
            ['Metric', 'Value'],
            [
              ['Document Generation Time', DISPLAY_METRICS.docSpeed.valueEn],
              ['Terminology Accuracy', DISPLAY_METRICS.termAccuracy.value],
              ['API Uptime', DISPLAY_METRICS.apiUptime.value],
              ['Time Reduction', `${DISPLAY_METRICS.timeSaved.value} (${DISPLAY_METRICS.timeSaved.detailEn})`],
            ]
          ),

          createHeading1('3. Past Performance'),
          createBulletPoint('TIPS Selection: Welcome to Southeast Korea TIPS'),
          createBulletPoint('SNU SNACK: Top 3 out of 300 teams'),
          createBulletPoint('AIFC Fintech: Astana International Financial Centre'),
          createBulletPoint(`Global Tender Database: ${DISPLAY_METRICS.globalTenders.value} records`),

          createHeading1('4. Pricing'),
          createTable(
            ['Tier', 'Monthly Fee', 'Features'],
            [
              ['Starter', '$990', '5 clients, Basic reports'],
              ['Growth', '$2,900', '20 clients, Advanced analytics'],
              ['Enterprise', 'Custom', 'Unlimited, Full integration'],
            ]
          ),
        ],
      },
    ],
  })
}

// ============================================
// 메인 생성 함수
// ============================================

/**
 * DOCX 문서 생성
 */
export async function generateDocx(request: GenerateDocumentRequest): Promise<Buffer> {
  const { enginePreset, documentType } = request

  let doc: Document

  // 템플릿 기반 생성 (AdaptedDocumentRequest인 경우)
  const adapted = request as AdaptedDocumentRequest
  if (adapted.templateSections?.length > 0) {
    doc = generateFromTemplateSections(adapted)
    return await Packer.toBuffer(doc)
  }

  // 도메인 및 문서 유형에 따른 분기
  switch (enginePreset) {
    case 'ENVIRONMENT':
      if (documentType === 'daily_report' || documentType === 'monthly_report') {
        doc = generateTMSDailyReport(request)
      } else {
        doc = generateTMSDailyReport(request) // fallback
      }
      break

    case 'MANUFACTURING':
      if (documentType === 'settlement_report') {
        doc = generateSmartFactorySettlement(request)
      } else {
        doc = generateSmartFactorySettlement(request) // fallback
      }
      break

    case 'DIGITAL':
      if (documentType === 'performance_report' || documentType === 'supplier_portfolio') {
        doc = generateAIVoucherPerformance(request)
      } else {
        doc = generateAIVoucherPerformance(request) // fallback
      }
      break

    case 'EXPORT':
      if (documentType === 'proposal_draft') {
        doc = generateGlobalTenderProposal(request)
      } else {
        doc = generateGlobalTenderProposal(request) // fallback
      }
      break

    case 'FINANCE':
      doc = generateFinanceApplication(request)
      break

    case 'STARTUP':
      doc = generateStartupBusinessPlan(request)
      break

    default:
      doc = generateTMSDailyReport(request)
  }

  // Buffer로 변환
  return await Packer.toBuffer(doc)
}

/**
 * 융자/보증 신청서 생성
 */
function generateFinanceApplication(request: GenerateDocumentRequest): Document {
  const companyName = request.metadata?.companyName || '주식회사 샘플'

  return new Document({
    sections: [
      {
        headers: { default: createHeader(companyName) },
        footers: { default: createFooter() },
        children: [
          createTitle('융자/보증 신청서'),
          createParagraph(`신청기업: ${companyName}`),
          createParagraph(`신청일자: ${new Date().toISOString().split('T')[0]}`),

          createHeading1('1. 기업 개요'),
          createTable(
            ['항목', '내용'],
            [
              ['기업명', companyName],
              ['사업자등록번호', '000-00-00000'],
              ['업종', '소프트웨어 개발'],
              ['대표자', '대표'],
              ['설립일', '2024-01-01'],
            ]
          ),

          createHeading1('2. 신청 내역'),
          createTable(
            ['구분', '내용'],
            [
              ['신청 유형', '정책자금 융자'],
              ['신청 금액', '100,000,000원'],
              ['상환 기간', '5년 (거치 1년 포함)'],
              ['자금 용도', '운영자금 및 시설자금'],
            ]
          ),

          createHeading1('3. 사업 현황'),
          createBulletPoint('최근 3년 매출 추이 및 수익성 분석'),
          createBulletPoint('주요 거래처 및 수주 현황'),
          createBulletPoint('기술 경쟁력 및 특허 보유 현황'),

          createHeading1('4. 자금 운용 계획'),
          createBulletPoint('운영자금: 인건비, 재료비, 외주비'),
          createBulletPoint('시설자금: 설비 구입, 사무실 임차'),

          createHeading1('5. 첨부 서류'),
          createBulletPoint('사업자등록증 사본'),
          createBulletPoint('재무제표 (최근 3개년)'),
          createBulletPoint('사업계획서'),
          createBulletPoint('기술평가서 (해당 시)'),
        ],
      },
    ],
  })
}

/**
 * TIPS 사업계획서 생성
 */
function generateStartupBusinessPlan(request: GenerateDocumentRequest): Document {
  const companyName = request.metadata?.companyName || '주식회사 샘플'

  return new Document({
    sections: [
      {
        headers: { default: createHeader(companyName) },
        footers: { default: createFooter() },
        children: [
          createTitle('사업계획서'),
          createParagraph(`기업명: ${companyName}`),
          createParagraph(`작성일: ${new Date().toISOString().split('T')[0]}`),

          createHeading1('1. 경영자 요약'),
          createParagraph(
            'QETTA는 산업 특화 도메인 엔진 기반으로 정부지원사업 문서를 자동 생성하는 ' +
            `B2B2B SaaS 플랫폼입니다. 문서 작성 시간을 ${DISPLAY_METRICS.timeSaved.value} 단축하고, ` +
            `${DISPLAY_METRICS.termAccuracy.value} 용어 매핑 정확도를 제공합니다.`
          ),

          createHeading1('2. 문제 정의'),
          createBulletPoint('정부지원사업 문서 작성에 평균 8시간 소요'),
          createBulletPoint('산업 전문용어 혼동으로 인한 높은 반려율'),
          createBulletPoint('문서 무결성 검증 수단 부재'),

          createHeading1('3. 해결책: DOCS-VERIFY-APPLY'),
          createTable(
            ['기능', '가치', '핵심 지표'],
            [
              ['DOCS', '문서 자동 생성', `${DISPLAY_METRICS.timeSaved.value} 시간 단축`],
              ['VERIFY', '해시체인 무결성 검증', `${DISPLAY_METRICS.apiUptime.value} 가용성`],
              ['APPLY', '글로벌 입찰 매칭', `${DISPLAY_METRICS.globalTenders.value} DB`],
            ]
          ),

          createHeading1('4. 시장 분석'),
          createBulletPoint('TAM: $2B (국내 정부지원사업 시장)'),
          createBulletPoint('SAM: $200M (문서 자동화 니즈 기업)'),
          createBulletPoint('SOM: $20M (초기 타겟 - 제조/환경 분야)'),

          createHeading1('5. 비즈니스 모델'),
          createBulletPoint('B2B2B 화이트라벨: 파트너 브랜드로 제공'),
          createBulletPoint('SaaS → SDK → 도메인 마켓플레이스 진화'),

          createHeading1('6. 팀'),
          createBulletPoint('CEO: 물류→제조 도메인 전환 경험'),
          createBulletPoint('CTO: AI/ML 엔지니어링'),
          createBulletPoint('COO: 정부사업 운영 전문'),

          createHeading1('7. 증빙'),
          createBulletPoint('웰컴투 동남권 TIPS 선정'),
          createBulletPoint('SNU SNACK 챌린지 3위'),
          createBulletPoint('정부지원사업 3건 선정'),
        ],
      },
    ],
  })
}

// ============================================
// 템플릿 기반 문서 생성
// ============================================

/**
 * AdaptedDocumentRequest의 templateSections로 DOCX 생성
 * 템플릿 엔진 출력 → 구조화된 Word 문서
 */
function generateFromTemplateSections(request: AdaptedDocumentRequest): Document {
  const companyName = request.metadata?.companyName || '주식회사 샘플'
  const dateStr = request.metadata?.reportDate || new Date().toISOString().split('T')[0]
  const templateName = (request.data as Record<string, unknown>)?.template
    ? ((request.data as Record<string, unknown>).template as Record<string, string>).name
    : request.documentType

  const sectionChildren = request.templateSections.map((section: TemplateSectionData) => ({
    properties: {},
    children: [
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      }),
      ...section.content.split('\n').filter(Boolean).map(
        (line: string) =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 100 },
          })
      ),
    ],
  }))

  return new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'QETTA', ...STYLES.caption, color: QETTA_VIOLET }),
                  new TextRun({ text: ` | ${companyName}`, ...STYLES.caption }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Generated by QETTA Domain Engine', size: 18, color: QETTA_GRAY }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            text: String(templateName),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `회사: ${companyName}`, ...STYLES.caption }),
              new TextRun({ text: `  |  작성일: ${dateStr}`, ...STYLES.caption }),
            ],
            spacing: { after: 400 },
          }),
        ],
      },
      ...sectionChildren,
    ],
  })
}

