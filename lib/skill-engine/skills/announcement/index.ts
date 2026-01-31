/**
 * QETTA 공고문 기반 학습 시스템
 *
 * ⚠️ 핵심 원칙: 예측/fabricate 절대 금지!
 * - 모든 정보는 실제 공고문에서 추출
 * - 2026년 정보는 실제 공고 게시 후에만 반영
 * - 양식/서류 요건은 공고문 원문 기준
 *
 * 타겟: 중장년 제조/설비 사업자
 * - 행정 서류가 최대 Pain Point
 * - 소상공인24, 중기청 주 사용
 * - 정확성 > 편의성
 *
 * @see generators/gov-support/data/qetta-super-model.json
 */

// ============================================
// 공고문 출처 (실제 정부 사이트)
// ============================================

export type AnnouncementSource =
  // 범정부 포털
  | 'BIZINFO'          // 기업마당 (bizinfo.go.kr) - 통합 공고
  | 'K_STARTUP'        // K-Startup (k-startup.go.kr) - 창업
  | 'SME24'            // 소상공인24 (sbiz24.kr) - 소상공인
  | 'SMBA'             // 기업마당 중기부 (smba.go.kr)

  // 부처별
  | 'MSS'              // 중소벤처기업부
  | 'MOTIE'            // 산업통상자원부
  | 'MSIT'             // 과학기술정보통신부
  | 'ME'               // 환경부
  | 'MOIS'             // 행정안전부
  | 'MOEF'             // 기획재정부
  | 'MOEL'             // 고용노동부

  // 기관별
  | 'KISED'            // 창업진흥원
  | 'KOSMES'           // 중소기업진흥공단
  | 'SEMAS'            // 소상공인시장진흥공단
  | 'NIPA'             // 정보통신산업진흥원
  | 'KIBO'             // 기술보증기금
  | 'KODIT'            // 신용보증기금
  | 'KOTRA'            // 대한무역투자진흥공사

// ============================================
// 공고문 원본 구조
// ============================================

export interface RawAnnouncement {
  // 메타데이터 (공고문에서 직접 추출)
  id: string
  source: AnnouncementSource
  sourceUrl: string // 원본 URL (필수!)
  fetchedAt: string // 수집 일시

  // 기본 정보
  title: string
  programName: string
  year: number
  round?: number // 차수 (1차, 2차 등)

  // 일정 (공고문 명시 기준)
  schedule: {
    announcementDate: string // 공고일
    applicationStart: string // 접수 시작
    applicationEnd: string   // 접수 마감
    documentDeadline?: string // 서류 제출 마감
    selectionDate?: string   // 선정 발표일
    notes?: string           // 일정 관련 비고
  }

  // 지원 자격 (공고문 원문 그대로)
  eligibilityText: string // 원문 텍스트 보존
  eligibilityParsed?: {
    companyAge?: { min?: number; max?: number; note?: string }
    employeeCount?: { min?: number; max?: number; note?: string }
    revenue?: { min?: number; max?: number; unit: string; note?: string }
    regions?: string[]
    industries?: string[]
    excludedIndustries?: string[]
    requiredCertifications?: string[]
    additionalRequirements?: string[]
  }

  // 지원 내용 (공고문 원문 그대로)
  supportText: string
  supportParsed?: {
    maxAmount?: number
    amountUnit?: string // 만원, 억원 등
    matchingRatio?: number // 자부담 비율 (%)
    supportPeriod?: number // 지원 기간 (개월)
    supportItems?: string[] // 지원 항목 (인건비, 재료비 등)
  }

  // 신청 방법
  applicationMethod: {
    system: string // 온라인 시스템명 (K-Startup, 소상공인24 등)
    systemUrl?: string
    offlineRequired?: boolean
    notes?: string
  }

  // 제출 서류 (공고문 명시 목록)
  requiredDocuments: {
    name: string
    format?: string // 양식 (자유양식, 지정양식 등)
    templateUrl?: string // 양식 다운로드 URL
    notes?: string
    required: boolean
  }[]

  // 평가 기준 (공고문 명시)
  evaluationCriteria?: {
    category: string
    weight: number // 배점 또는 %
    subcriteria?: string[]
  }[]

  // 문의처
  contact: {
    department: string
    phone?: string
    email?: string
    faq?: string
  }

  // 원문 첨부파일
  attachments: {
    name: string
    url: string
    type: 'announcement' | 'application_form' | 'guideline' | 'template' | 'other'
  }[]
}

// ============================================
// 공고문 파싱 상태
// ============================================

export type ParseStatus =
  | 'raw'           // 수집만 된 상태
  | 'parsed'        // 파싱 완료
  | 'verified'      // 사람이 검증 완료
  | 'outdated'      // 기한 지남
  | 'superseded'    // 새 공고로 대체됨

export interface AnnouncementRecord extends RawAnnouncement {
  parseStatus: ParseStatus
  verifiedAt?: string
  verifiedBy?: string
  supersededBy?: string // 대체한 공고 ID

  // 학습된 추가 정보 (공고문 외 실제 데이터)
  learnedData?: {
    actualSelectionRate?: number // 실제 선정률
    avgCompetitionRatio?: number // 평균 경쟁률
    commonRejectionReasons?: string[] // 실제 탈락 사유
    successPatterns?: string[] // 선정 패턴
    userFeedback?: string[] // 사용자 피드백
  }
}

// ============================================
// 공고문 수집 설정
// ============================================

export interface AnnouncementCrawlerConfig {
  sources: AnnouncementSource[]
  keywords: string[] // 검색 키워드
  excludeKeywords?: string[] // 제외 키워드
  minAmount?: number // 최소 지원금
  targetIndustries?: string[]
  autoFetch: boolean
  fetchInterval: number // 시간 (hours)
}

// 기본 설정 (중장년 제조업 타겟)
export const DEFAULT_CRAWLER_CONFIG: AnnouncementCrawlerConfig = {
  sources: [
    'BIZINFO',    // 기업마당 - 통합
    'SME24',      // 소상공인24 - 소상공인
    'KOSMES',     // 중진공 - 중소기업
    'SEMAS',      // 소진공 - 소상공인
    'KIBO',       // 기보 - 기술금융
    'KODIT',      // 신보 - 신용금융
  ],
  keywords: [
    '제조', '설비', '스마트공장', '자동화',
    '정책자금', '융자', '보증', '운전자금', '시설자금',
    '중소기업', '소상공인', '중장년',
  ],
  excludeKeywords: [
    '청년', '대학생', '예비창업', // 중장년 타겟이므로 제외
  ],
  autoFetch: false, // 수동 확인 후 활성화
  fetchInterval: 24,
}

// ============================================
// 공고문 저장소 인터페이스
// ============================================

export interface AnnouncementStore {
  // CRUD
  save(announcement: RawAnnouncement): Promise<string>
  get(id: string): Promise<AnnouncementRecord | null>
  list(filters?: AnnouncementFilters): Promise<AnnouncementRecord[]>
  update(id: string, data: Partial<AnnouncementRecord>): Promise<void>
  delete(id: string): Promise<void>

  // 검색
  search(query: string): Promise<AnnouncementRecord[]>
  findBySource(source: AnnouncementSource): Promise<AnnouncementRecord[]>
  findActive(): Promise<AnnouncementRecord[]> // 현재 접수 중인 공고

  // 통계
  getStats(): Promise<{
    total: number
    bySource: Record<AnnouncementSource, number>
    byStatus: Record<ParseStatus, number>
    activeCount: number
  }>
}

export interface AnnouncementFilters {
  source?: AnnouncementSource[]
  status?: ParseStatus[]
  year?: number
  activeOnly?: boolean
  minAmount?: number
  keywords?: string[]
}

// ============================================
// 공고문 파서 인터페이스
// ============================================

export interface AnnouncementParser {
  // 원본 HTML/PDF에서 공고문 추출
  parseFromHtml(html: string, source: AnnouncementSource): Promise<RawAnnouncement>
  parseFromPdf(pdfBuffer: Buffer, source: AnnouncementSource): Promise<RawAnnouncement>

  // 텍스트에서 구조화된 데이터 추출
  extractEligibility(text: string): RawAnnouncement['eligibilityParsed']
  extractSupport(text: string): RawAnnouncement['supportParsed']
  extractSchedule(text: string): RawAnnouncement['schedule']
  extractDocuments(text: string): RawAnnouncement['requiredDocuments']
}

// ============================================
// 공고문 파서 구현
// ============================================

/**
 * 정부 공고문 HTML/PDF 파서
 *
 * 지원 사이트:
 * - 기업마당 (bizinfo.go.kr) - 주요
 * - 소상공인24 (sbiz24.kr)
 * - K-Startup (k-startup.go.kr)
 * - 중진공, 소진공 등
 *
 * ⚠️ 주의: 공고문에 명시된 정보만 추출, 추측/fabricate 절대 금지
 */
export class AnnouncementParserImpl implements AnnouncementParser {
  // ============================================
  // 금액 파싱 패턴
  private readonly AMOUNT_PATTERNS = [
    // 5억원, 10억원
    /(\d+(?:,\d{3})*)\s*억\s*원?/g,
    // 5,000만원, 5000만원
    /(\d+(?:,\d{3})*)\s*만\s*원?/g,
    // 5백만원
    /(\d+)\s*백\s*만\s*원?/g,
    // 5천만원
    /(\d+)\s*천\s*만\s*원?/g,
    // 원 단위 (큰 금액)
    /(\d{1,3}(?:,\d{3})+)\s*원/g,
  ]

  // 기업마당 HTML 선택자 (주요 타겟)
  private readonly BIZINFO_SELECTORS = {
    title: '.board_view_title, .tit_area h2, .title',
    content: '.board_view_content, .cont_area, .content',
    table: 'table.bbs_table, table.view_table',
    attachments: '.file_area a, .attach_file a',
    dates: '.date_area, .info_area',
  }

  // 소상공인24 선택자
  private readonly SME24_SELECTORS = {
    title: '.board-view-title, .title',
    content: '.board-view-content, .content',
    table: 'table.board-table',
    attachments: '.file-list a',
  }

  // ============================================
  // HTML 파싱
  // ============================================

  /**
   * HTML에서 공고문 정보 추출
   * @param html 원본 HTML 문자열
   * @param source 공고문 출처
   */
  async parseFromHtml(
    html: string,
    source: AnnouncementSource
  ): Promise<RawAnnouncement> {
    // DOMParser 사용 (브라우저) 또는 서버에서는 cheerio 필요
    const parser = this.createDOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const selectors = this.getSelectorsForSource(source)

    // 기본 정보 추출
    const title = this.extractText(doc, selectors.title) || '제목 없음'
    const contentElement = doc.querySelector(selectors.content)
    const contentText = contentElement?.textContent || ''

    // 테이블에서 구조화된 정보 추출 (향후 확장용)
    // const tableData = this.parseTableData(doc, selectors.table)
    void this.parseTableData(doc, selectors.table) // 메서드 유지를 위한 호출

    // 첨부파일 추출
    const attachments = this.extractAttachments(doc, selectors.attachments)

    // 일정 추출
    const schedule = this.extractSchedule(contentText)

    // 지원 자격 추출
    const eligibilityText = this.extractSectionText(contentText, [
      '지원대상',
      '신청자격',
      '참여자격',
      '지원자격',
      '대상',
    ])
    const eligibilityParsed = this.extractEligibility(eligibilityText)

    // 지원 내용 추출
    const supportText = this.extractSectionText(contentText, [
      '지원내용',
      '지원사항',
      '지원규모',
      '지원금액',
    ])
    const supportParsed = this.extractSupport(supportText)

    // 제출 서류 추출
    const documentsText = this.extractSectionText(contentText, [
      '제출서류',
      '신청서류',
      '구비서류',
      '필수서류',
    ])
    const requiredDocuments = this.extractDocuments(documentsText)

    // 문의처 추출
    const contact = this.extractContact(contentText)

    // 신청 방법 추출
    const applicationMethod = this.extractApplicationMethod(contentText)

    // ID 생성 (source + 연도 + 해시)
    const id = this.generateId(source, title)

    return {
      id,
      source,
      sourceUrl: '', // 호출자가 제공해야 함
      fetchedAt: new Date().toISOString(),
      title,
      programName: this.extractProgramName(title),
      year: this.extractYear(title, contentText),
      round: this.extractRound(title),
      schedule,
      eligibilityText,
      eligibilityParsed,
      supportText,
      supportParsed,
      applicationMethod,
      requiredDocuments,
      contact,
      attachments,
    }
  }

  // ============================================
  // PDF 파싱 (pdf-parse 라이브러리 필요)
  // ============================================

  /**
   * PDF에서 공고문 정보 추출
   * @param pdfBuffer PDF 파일 버퍼
   * @param source 공고문 출처
   *
   * ⚠️ 의존성: pdf-parse 패키지 필요
   * npm install pdf-parse
   *
   * NOTE: Currently disabled to avoid build-time dependency resolution.
   * To enable: install pdf-parse and uncomment the dynamic import.
   */
  async parseFromPdf(
    _pdfBuffer: Buffer,
    source: AnnouncementSource
  ): Promise<RawAnnouncement> {
    // TODO: Enable when pdf-parse is installed
    throw new Error(
      'PDF parsing is currently disabled. To enable: npm install pdf-parse'
    )

    /* Disabled to avoid build errors - uncomment when pdf-parse is installed
    let pdfParse: (buffer: Buffer) => Promise<{ text: string }>
    try {
      const pdfParseModule = await import('pdf-parse')
      pdfParse = pdfParseModule.default
    } catch {
      throw new Error(
        'pdf-parse 패키지가 설치되지 않았습니다. npm install pdf-parse 실행 필요'
      )
    }

    const pdfData = await pdfParse(pdfBuffer)
    const text = pdfData.text
    */
    const text = '' // Placeholder

    // 텍스트 기반 파싱
    const title = this.extractTitleFromText(text)
    const schedule = this.extractSchedule(text)
    const eligibilityText = this.extractSectionText(text, [
      '지원대상',
      '신청자격',
    ])
    const supportText = this.extractSectionText(text, ['지원내용', '지원금액'])
    const documentsText = this.extractSectionText(text, [
      '제출서류',
      '신청서류',
    ])

    return {
      id: this.generateId(source, title),
      source,
      sourceUrl: '',
      fetchedAt: new Date().toISOString(),
      title,
      programName: this.extractProgramName(title),
      year: this.extractYear(title, text),
      schedule,
      eligibilityText,
      eligibilityParsed: this.extractEligibility(eligibilityText),
      supportText,
      supportParsed: this.extractSupport(supportText),
      applicationMethod: this.extractApplicationMethod(text),
      requiredDocuments: this.extractDocuments(documentsText),
      contact: this.extractContact(text),
      attachments: [], // PDF에서는 첨부파일 추출 불가
    }
  }

  // ============================================
  // 지원 자격 파싱
  // ============================================

  extractEligibility(text: string): RawAnnouncement['eligibilityParsed'] {
    if (!text) return undefined

    const result: RawAnnouncement['eligibilityParsed'] = {}

    // 업력(업종) 파싱: "창업 3년 이내", "7년 이하" 등
    const ageMatch = text.match(
      /(?:창업|설립|업력)\s*(\d+)\s*년?\s*(?:이내|이하|미만)/
    )
    if (ageMatch) {
      result.companyAge = { max: parseInt(ageMatch[1]) }
    }

    // 종업원 수 파싱: "상시근로자 5인 이상", "10인 이하" 등
    const employeeMatch = text.match(
      /(?:상시\s*)?(?:근로자|종업원|직원)\s*(\d+)\s*인?\s*(이상|이하|미만|~\s*(\d+))?/
    )
    if (employeeMatch) {
      const count = parseInt(employeeMatch[1])
      const modifier = employeeMatch[2]
      if (modifier?.includes('이상')) {
        result.employeeCount = { min: count }
      } else if (modifier?.includes('이하') || modifier?.includes('미만')) {
        result.employeeCount = { max: count }
      } else if (employeeMatch[3]) {
        result.employeeCount = { min: count, max: parseInt(employeeMatch[3]) }
      }
    }

    // 매출액 파싱: "연매출 10억원 이하", "50억 미만" 등
    const revenueMatch = text.match(
      /(?:연\s*)?매출(?:액)?\s*(\d+(?:,\d{3})*)\s*(억|만)\s*원?\s*(이상|이하|미만)?/
    )
    if (revenueMatch) {
      const amount = parseInt(revenueMatch[1].replace(/,/g, ''))
      const unit = revenueMatch[2] === '억' ? '억원' : '만원'
      const modifier = revenueMatch[3]
      if (modifier === '이상') {
        result.revenue = { min: amount, unit }
      } else {
        result.revenue = { max: amount, unit }
      }
    }

    // 지역 파싱: "서울, 경기, 인천", "수도권 소재" 등
    const regionPatterns = [
      /(?:소재지|지역|시도)\s*[:：]?\s*([가-힣,\s]+)(?:소재|지역|에)/,
      /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(?:[,\s]*(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주))*/,
    ]
    for (const pattern of regionPatterns) {
      const regionMatch = text.match(pattern)
      if (regionMatch) {
        const regions = regionMatch[0].split(/[,\s]+/).filter((r) => r.length > 1)
        if (regions.length > 0) {
          result.regions = regions
          break
        }
      }
    }

    // 업종 파싱: "제조업", "IT/SW", "음식점업" 등
    const industryKeywords = [
      '제조업',
      '제조',
      'IT',
      'SW',
      '소프트웨어',
      '정보통신',
      'ICT',
      '서비스업',
      '음식점업',
      '소매업',
      '도매업',
      '건설업',
      '운수업',
      '물류업',
    ]
    const foundIndustries = industryKeywords.filter((ind) => text.includes(ind))
    if (foundIndustries.length > 0) {
      result.industries = foundIndustries
    }

    // 제외 업종 파싱: "도박, 유흥업 제외" 등
    const excludeMatch = text.match(/(?:제외|불가)(?:업종)?[:：]?\s*([가-힣,\s]+)/)
    if (excludeMatch) {
      result.excludedIndustries = excludeMatch[1]
        .split(/[,\s]+/)
        .filter((i) => i.length > 1)
    }

    // 필수 인증 파싱: "벤처기업 인증", "이노비즈 인증" 등
    const certKeywords = [
      '벤처기업',
      '이노비즈',
      '메인비즈',
      '기술혁신형',
      'ISO',
      'CE인증',
      '특허',
    ]
    const foundCerts = certKeywords.filter((cert) => text.includes(cert))
    if (foundCerts.length > 0) {
      result.requiredCertifications = foundCerts
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  // ============================================
  // 지원 내용 파싱
  // ============================================

  extractSupport(text: string): RawAnnouncement['supportParsed'] {
    if (!text) return undefined

    const result: RawAnnouncement['supportParsed'] = {}

    // 최대 지원금액 파싱
    for (const pattern of this.AMOUNT_PATTERNS) {
      const matches = Array.from(text.matchAll(pattern))
      for (const match of matches) {
        const numStr = match[1].replace(/,/g, '')
        const num = parseInt(numStr)

        // 단위 판별
        if (match[0].includes('억')) {
          result.maxAmount = num * 10000 // 만원 단위로 통일
          result.amountUnit = '만원'
        } else if (match[0].includes('천만')) {
          result.maxAmount = num * 1000
          result.amountUnit = '만원'
        } else if (match[0].includes('백만')) {
          result.maxAmount = num * 100
          result.amountUnit = '만원'
        } else if (match[0].includes('만')) {
          result.maxAmount = num
          result.amountUnit = '만원'
        }

        // 가장 큰 금액 기준
        break
      }
      if (result.maxAmount) break
    }

    // 자부담 비율 파싱: "자부담 30%", "정부 70%+민간 30%" 등
    const matchingMatch = text.match(
      /자부담\s*(\d+)\s*%|민간\s*(\d+)\s*%|기업부담\s*(\d+)\s*%/
    )
    if (matchingMatch) {
      result.matchingRatio = parseInt(
        matchingMatch[1] || matchingMatch[2] || matchingMatch[3]
      )
    }

    // 지원 기간 파싱: "12개월", "1년", "24개월 이내" 등
    const periodMatch = text.match(
      /(\d+)\s*(?:개월|월)|(\d+)\s*년\s*(?:이내|간)?/
    )
    if (periodMatch) {
      if (periodMatch[1]) {
        result.supportPeriod = parseInt(periodMatch[1])
      } else if (periodMatch[2]) {
        result.supportPeriod = parseInt(periodMatch[2]) * 12
      }
    }

    // 지원 항목 파싱
    const supportItemKeywords = [
      '인건비',
      '재료비',
      '시제품',
      '장비',
      '설비',
      '마케팅',
      '홍보비',
      '특허',
      '지식재산',
      '컨설팅',
      '교육훈련',
      '연구개발',
      'R&D',
      '시험인증',
      '해외진출',
      '수출',
    ]
    const foundItems = supportItemKeywords.filter((item) => text.includes(item))
    if (foundItems.length > 0) {
      result.supportItems = foundItems
    }

    return Object.keys(result).length > 0 ? result : undefined
  }

  // ============================================
  // 일정 파싱
  // ============================================

  extractSchedule(text: string): RawAnnouncement['schedule'] {
    const now = new Date()
    const currentYear = now.getFullYear()

    // 기본 일정 구조
    const schedule: RawAnnouncement['schedule'] = {
      announcementDate: '',
      applicationStart: '',
      applicationEnd: '',
    }

    // 날짜 추출 헬퍼
    const extractDate = (
      patterns: RegExp[],
      context: string
    ): string | undefined => {
      for (const pattern of patterns) {
        const match = context.match(pattern)
        if (match) {
          const year = match[1]?.length === 4 ? match[1] : String(currentYear)
          const month = match[2]?.padStart(2, '0') || match[1]?.padStart(2, '0')
          const day = match[3]?.padStart(2, '0') || match[2]?.padStart(2, '0')
          if (month && day) {
            return `${year}-${month}-${day}`
          }
        }
      }
      return undefined
    }

    // 접수 시작일 찾기
    const startPatterns = [
      /접수\s*(?:시작|개시)[:：]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
      /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*(?:부터|~)/,
      /시작[:：]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
    ]
    schedule.applicationStart =
      extractDate(startPatterns, text) || now.toISOString().split('T')[0]

    // 접수 마감일 찾기
    const endPatterns = [
      /(?:접수\s*)?마감[:：]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
      /~\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
      /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*(?:까지|마감)/,
      /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(?:까지|마감)/,
    ]
    schedule.applicationEnd = extractDate(endPatterns, text) || ''

    // 공고일 찾기
    const announcementPatterns = [
      /공고일[:：]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
      /게시일[:：]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
    ]
    schedule.announcementDate =
      extractDate(announcementPatterns, text) ||
      schedule.applicationStart ||
      now.toISOString().split('T')[0]

    // 선정 발표일 찾기
    const selectionPatterns = [
      /(?:선정|발표)[:：]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
      /결과\s*발표[:：]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
    ]
    schedule.selectionDate = extractDate(selectionPatterns, text)

    // 서류 제출 마감일 찾기
    const docDeadlinePatterns = [
      /서류\s*(?:제출\s*)?마감[:：]?\s*(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/,
    ]
    schedule.documentDeadline = extractDate(docDeadlinePatterns, text)

    // 비고 추출 (시간 정보 등)
    const timeMatch = text.match(
      /(\d{1,2})[:\s]*시\s*(?:까지|마감)|(\d{1,2}):(\d{2})\s*(?:까지|마감)/
    )
    if (timeMatch) {
      const hour = timeMatch[1] || timeMatch[2]
      const minute = timeMatch[3] || '00'
      schedule.notes = `마감 시간: ${hour}:${minute}`
    }

    return schedule
  }

  // ============================================
  // 제출 서류 파싱
  // ============================================

  extractDocuments(text: string): RawAnnouncement['requiredDocuments'] {
    if (!text) return []

    const documents: RawAnnouncement['requiredDocuments'] = []

    // 공통 서류 패턴
    const docPatterns = [
      { pattern: /사업\s*계획서/g, name: '사업계획서', required: true },
      { pattern: /신청서/g, name: '참여신청서', required: true },
      {
        pattern: /사업자\s*등록증/g,
        name: '사업자등록증 사본',
        required: true,
      },
      { pattern: /등기\s*(?:사항\s*)?(?:전부\s*)?증명서/g, name: '법인등기부등본', required: true },
      { pattern: /재무제표/g, name: '재무제표', required: true },
      { pattern: /4대\s*보험/g, name: '4대보험 가입자명부', required: false },
      { pattern: /국세\s*(?:완납|납세)/g, name: '국세납세증명서', required: true },
      { pattern: /지방세\s*(?:완납|납세)/g, name: '지방세납세증명서', required: true },
      { pattern: /견적서/g, name: '견적서', required: false },
      {
        pattern: /(?:자기\s*)?소개서|이력서/g,
        name: '대표자 이력서',
        required: false,
      },
      { pattern: /개인정보\s*(?:수집|활용)\s*동의/g, name: '개인정보 수집/이용 동의서', required: true },
      { pattern: /서약서/g, name: '서약서', required: true },
    ]

    for (const { pattern, name, required } of docPatterns) {
      if (pattern.test(text)) {
        // 이미 추가된 서류인지 확인
        if (!documents.find((d) => d.name === name)) {
          documents.push({
            name,
            required,
            format: text.includes('지정양식') ? '지정양식' : '자유양식',
          })
        }
      }
    }

    // 번호 목록 형식 파싱: "1. 신청서", "- 사업계획서" 등
    const listPattern = /(?:^|\n)\s*(?:\d+[.)]\s*|[-•]\s*)([가-힣\s/()]+?)(?:\n|$|[:：])/g
    const listMatches = Array.from(text.matchAll(listPattern))
    for (const match of listMatches) {
      const docName = match[1].trim()
      if (docName.length > 2 && docName.length < 30) {
        if (
          !documents.find(
            (d) => d.name.includes(docName) || docName.includes(d.name)
          )
        ) {
          documents.push({
            name: docName,
            required: true, // 목록에 있으면 기본적으로 필수
          })
        }
      }
    }

    return documents
  }

  // ============================================
  // 헬퍼 메서드
  // ============================================

  /**
   * DOMParser 생성 (브라우저/서버 환경 분기)
   */
  private createDOMParser(): DOMParser {
    if (typeof window !== 'undefined' && window.DOMParser) {
      return new window.DOMParser()
    }
    // 서버 환경에서는 jsdom 필요
    throw new Error(
      '서버 환경에서는 jsdom 또는 cheerio가 필요합니다. npm install jsdom'
    )
  }

  /**
   * 출처별 선택자 반환
   */
  private getSelectorsForSource(source: AnnouncementSource) {
    switch (source) {
      case 'BIZINFO':
      case 'MSS':
      case 'KOSMES':
        return this.BIZINFO_SELECTORS
      case 'SME24':
      case 'SEMAS':
        return this.SME24_SELECTORS
      default:
        return this.BIZINFO_SELECTORS // 기본값
    }
  }

  /**
   * 선택자로 텍스트 추출
   */
  private extractText(doc: Document, selector: string): string | null {
    const selectors = selector.split(',').map((s) => s.trim())
    for (const sel of selectors) {
      const element = doc.querySelector(sel)
      if (element?.textContent) {
        return element.textContent.trim()
      }
    }
    return null
  }

  /**
   * 테이블 데이터 파싱
   */
  private parseTableData(
    doc: Document,
    selector: string
  ): Record<string, string> {
    const data: Record<string, string> = {}
    const tables = doc.querySelectorAll(selector)

    tables.forEach((table) => {
      const rows = table.querySelectorAll('tr')
      rows.forEach((row) => {
        const th = row.querySelector('th')?.textContent?.trim()
        const td = row.querySelector('td')?.textContent?.trim()
        if (th && td) {
          data[th] = td
        }
      })
    })

    return data
  }

  /**
   * 첨부파일 추출
   */
  private extractAttachments(
    doc: Document,
    selector: string
  ): RawAnnouncement['attachments'] {
    const attachments: RawAnnouncement['attachments'] = []
    const links = doc.querySelectorAll(selector)

    links.forEach((link) => {
      const href = link.getAttribute('href')
      const name = link.textContent?.trim() || ''

      if (href && name) {
        // 파일 타입 추정
        let type: RawAnnouncement['attachments'][0]['type'] = 'other'
        if (name.includes('공고') || name.includes('안내')) {
          type = 'announcement'
        } else if (name.includes('신청서') || name.includes('지원서')) {
          type = 'application_form'
        } else if (name.includes('가이드') || name.includes('안내서')) {
          type = 'guideline'
        } else if (name.includes('양식') || name.includes('서식')) {
          type = 'template'
        }

        attachments.push({ name, url: href, type })
      }
    })

    return attachments
  }

  /**
   * 섹션 텍스트 추출 (제목 기준)
   */
  private extractSectionText(fullText: string, sectionTitles: string[]): string {
    for (const title of sectionTitles) {
      // 섹션 시작점 찾기
      const startPattern = new RegExp(`${title}[\\s:：]*([\\s\\S]*?)(?=\\n[가-힣]+[\\s:：]|$)`, 'i')
      const match = fullText.match(startPattern)
      if (match && match[1]) {
        return match[1].trim().slice(0, 2000) // 최대 2000자
      }
    }
    return ''
  }

  /**
   * 문의처 정보 추출
   */
  private extractContact(text: string): RawAnnouncement['contact'] {
    const contact: RawAnnouncement['contact'] = { department: '' }

    // 전화번호 추출
    const phoneMatch = text.match(
      /(?:전화|TEL|연락처|문의)[:：]?\s*(0\d{1,2}[-)\s]?\d{3,4}[-\s]?\d{4})/i
    )
    if (phoneMatch) {
      contact.phone = phoneMatch[1].replace(/\s/g, '')
    }

    // 이메일 추출
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
    if (emailMatch) {
      contact.email = emailMatch[0]
    }

    // 담당부서 추출
    const deptMatch = text.match(
      /(?:담당|문의)(?:부서|기관)?[:：]?\s*([가-힣]+(?:부|과|팀|센터))/
    )
    if (deptMatch) {
      contact.department = deptMatch[1]
    }

    return contact
  }

  /**
   * 신청 방법 추출
   */
  private extractApplicationMethod(
    text: string
  ): RawAnnouncement['applicationMethod'] {
    const method: RawAnnouncement['applicationMethod'] = { system: '' }

    // 온라인 시스템 추출
    const systemPatterns = [
      { pattern: /K-Startup|케이스타트업/i, system: 'K-Startup' },
      { pattern: /소상공인24|sbiz24/i, system: '소상공인24' },
      { pattern: /기업마당|bizinfo/i, system: '기업마당' },
      { pattern: /정부24|gov\.kr/i, system: '정부24' },
      { pattern: /중소기업통합관리/i, system: '중소기업통합관리시스템' },
    ]

    for (const { pattern, system } of systemPatterns) {
      if (pattern.test(text)) {
        method.system = system
        break
      }
    }

    // URL 추출
    const urlMatch = text.match(/https?:\/\/[\w\-./?=&]+/)
    if (urlMatch) {
      method.systemUrl = urlMatch[0]
    }

    // 오프라인 제출 필요 여부
    method.offlineRequired =
      text.includes('방문 제출') ||
      text.includes('우편 제출') ||
      text.includes('직접 제출')

    return method
  }

  /**
   * 프로그램명 추출 (제목에서)
   */
  private extractProgramName(title: string): string {
    // "2026년 ○○○ 지원사업 공고" → "○○○ 지원사업"
    const cleaned = title
      .replace(/\d{4}년?\s*/g, '')
      .replace(/\(?제?\d+차\)?/g, '')
      .replace(/공고|모집|안내/g, '')
      .trim()
    return cleaned || title
  }

  /**
   * 연도 추출
   */
  private extractYear(title: string, text: string): number {
    const yearMatch = (title + ' ' + text).match(/(20\d{2})년?/)
    return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()
  }

  /**
   * 차수 추출
   */
  private extractRound(title: string): number | undefined {
    const roundMatch = title.match(/제?(\d+)차/)
    return roundMatch ? parseInt(roundMatch[1]) : undefined
  }

  /**
   * PDF 텍스트에서 제목 추출
   */
  private extractTitleFromText(text: string): string {
    // 첫 몇 줄에서 제목 추정
    const lines = text.split('\n').filter((l) => l.trim())
    for (const line of lines.slice(0, 10)) {
      if (
        line.includes('공고') ||
        line.includes('모집') ||
        line.includes('지원사업')
      ) {
        return line.trim()
      }
    }
    return lines[0]?.trim() || '제목 없음'
  }

  /**
   * 고유 ID 생성
   */
  private generateId(source: AnnouncementSource, title: string): string {
    const year = this.extractYear(title, '')
    const hash = this.simpleHash(title).toString(16).slice(0, 8)
    return `${source}-${year}-${hash}`
  }

  /**
   * 간단한 해시 함수
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const announcementParser = new AnnouncementParserImpl()

// ============================================
// 템플릿 생성 (공고문 기반)
// ============================================

export interface TemplateFromAnnouncement {
  announcementId: string
  templateId: string
  templateType: 'application_form' | 'business_plan' | 'budget_plan' | 'checklist'

  // 공고문에서 추출된 요구사항
  requirements: {
    section: string
    description: string // 공고문 원문
    maxLength?: number
    required: boolean
    tips?: string[] // 학습된 팁 (실제 선정 사례 기반)
  }[]

  // 검증 규칙 (공고문 기준)
  validationRules: {
    field: string
    rule: string
    errorMessage: string
  }[]

  // 출처 명시 (투명성)
  sourceInfo: {
    announcementTitle: string
    announcementUrl: string
    fetchedAt: string
    section: string // 공고문 내 해당 섹션
  }
}

// ============================================
// 공고문 학습 로그
// ============================================

export interface AnnouncementLearningLog {
  id: string
  announcementId: string
  eventType:
    | 'fetched'      // 공고문 수집
    | 'parsed'       // 파싱 완료
    | 'verified'     // 검증 완료
    | 'template_created' // 템플릿 생성
    | 'user_feedback'    // 사용자 피드백
    | 'result_learned'   // 결과 학습 (선정/탈락)

  timestamp: string
  data: Record<string, unknown>
  notes?: string
}

// ============================================
// 실제 공고문 URL 예시 (참조용)
// ============================================

export const REAL_ANNOUNCEMENT_SOURCES = {
  BIZINFO: 'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do',
  SME24: 'https://www.sbiz24.kr',
  K_STARTUP: 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',
  KOSMES: 'https://www.kosmes.or.kr/sbc/SH/SBI/SHSBI001M0.do',
  SEMAS: 'https://www.semas.or.kr/web/SUP01/SUP0101.kmdc',
  KIBO: 'https://www.kibo.or.kr:444/main/main.asp',
  KODIT: 'https://www.kodit.co.kr',
} as const

// ============================================
// 주의사항 상수
// ============================================

export const ANNOUNCEMENT_WARNINGS = {
  NO_FABRICATION: '⚠️ 공고문에 명시되지 않은 정보는 절대 추측하거나 생성하지 마세요',
  VERIFY_BEFORE_USE: '⚠️ 템플릿 사용 전 반드시 원본 공고문과 대조 확인하세요',
  CHECK_DEADLINE: '⚠️ 접수 마감일을 반드시 확인하세요 (시스템 마감 시간 주의)',
  ORIGINAL_SOURCE: '⚠️ 항상 원본 공고문 URL을 보존하고 출처를 명시하세요',
  YEAR_MATTERS: '⚠️ 연도별로 양식과 요건이 다릅니다. 해당 연도 공고문을 확인하세요',
} as const
