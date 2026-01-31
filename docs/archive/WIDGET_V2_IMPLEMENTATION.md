# 🚀 QETTA Widget v2.0 구현 메모리

**Created:** 2026-01-31
**Project Path:** `/home/sihu2/qetta`
**Status:** ✅ 100% 완료

---

## 📱 프로젝트 개요

**QETTA Widget v2.0**은 정부지원사업 문서를 AI로 자동 생성하는 B2B 임베드 위젯입니다.
- **타겟:** B2B (파트너사 웹사이트 임베드)
- **핵심 가치:** 문서 작성 시간 93.8% 단축 (8시간 → 30분)
- **차별화:** 챗봇이 아닌 4단계 위자드 + 대시보드 UI

---

## 📁 파일 구조

```
components/widget/              # 위젯 코어 (12개 파일)
├── types.ts                    # 타입 정의 + 5개 템플릿
├── store.ts                    # Zustand 스토어 (3개)
├── index.ts                    # 모듈 exports
├── embed.ts                    # 임베드 스크립트
├── wizard/
│   ├── WizardContainer.tsx     # 메인 컨테이너 + 모달
│   ├── StepIndicator.tsx       # 스텝 인디케이터
│   ├── StepDataSource.tsx      # Step 1: 문서 유형 선택
│   ├── StepValidation.tsx      # Step 2: 폼 입력 + 검증
│   ├── StepGeneration.tsx      # Step 3: AI 생성
│   └── StepComplete.tsx        # Step 4: 완료 + 다운로드
└── progress/
    ├── ProgressTimeline.tsx    # 5단계 타임라인
    └── TimeSavedCounter.tsx    # 시간 절감 카운터

app/(dashboard)/generate/       # 데모 페이지
└── page.tsx                    # 위젯 통합 페이지

app/api/generate-document/      # API 라우트
├── route.ts                    # POST/GET 엔드포인트
├── download/[id]/route.ts      # 다운로드
└── preview/route.ts            # 미리보기
```

---

## 🗃️ 타입 정의

### 문서 타입 (5개)
```typescript
type WidgetDocumentType =
  | 'result_report'       // 결과보고서 (8시간 절감)
  | 'performance_report'  // 실적보고서 (4시간 절감)
  | 'sustainability_plan' // 자활계획서 (12시간 절감)
  | 'settlement_report'   // 정산보고서 (6시간 절감)
  | 'business_plan'       // 사업계획서 (16시간 절감)
```

### 진행 단계
```typescript
type ProgressPhase =
  | 'validating'   // 데이터 검증
  | 'analyzing'    // AI 분석
  | 'generating'   // 문서 생성
  | 'rendering'    // 렌더링
  | 'complete'     // 완료
```

### 핵심 인터페이스
```typescript
interface GeneratedWidgetDocument {
  id: string
  title: string
  format: DocumentFormat
  url: string
  previewUrl?: string
  createdAt: Date
  processingTimeMs: number
  timeSavedMinutes: number
  pageCount?: number
}

interface EmbedConfig {
  partnerId?: string
  theme: 'light' | 'dark'
  locale: 'ko' | 'en'
  allowedDocTypes?: WidgetDocumentType[]
  onComplete?: (document: GeneratedWidgetDocument) => void
  onError?: (error: Error) => void
  onStepChange?: (step: number) => void
}

interface PartnerConfig {
  partnerId: string
  partnerName: string
  logoUrl?: string
  brandColor: string
  secondaryColor?: string
  allowedDocTypes: WidgetDocumentType[]
}
```

---

## 🧩 Zustand 스토어 (3개)

### 1. useWizardStore
```typescript
interface WizardStore {
  currentStep: number
  totalSteps: number
  documentType: WidgetDocumentType | null
  enginePreset: EnginePresetType | null
  inputData: Record<string, unknown>
  document: GeneratedWidgetDocument | null
  error: string | null

  setDocumentType: (type, preset) => void
  setInputData: (data) => void
  updateInputField: (field, value) => void
  nextStep: () => void
  prevStep: () => void
  setDocument: (doc) => void
  reset: () => void
}
```

### 2. useProgressStore
```typescript
interface ProgressStore {
  phase: ProgressPhase
  progress: number // 0-100
  message: string
  estimatedTimeRemaining: number
  startedAt: number

  startProgress: () => void
  setPhase: (phase, message) => void
  complete: () => void
  reset: () => void
}
```

### 3. useThemeStore (화이트라벨)
```typescript
interface ThemeStore {
  partnerId: string | null
  partnerName: string
  logoUrl: string | null
  colors: { primary, secondary, accent }

  setPartnerConfig: (config: PartnerConfig) => void
  reset: () => void
}
```

---

## 🎨 핵심 컴포넌트

### WizardContainer
- 4단계 위자드 컨테이너
- 모달 모드 지원 (`WizardModal`)
- CSS 변수로 파트너 브랜딩 적용

### StepDataSource
- 5개 문서 유형 그리드 선택
- 예상 시간 + 절감 시간 표시
- 호버 애니메이션

### StepValidation
- 템플릿 스키마 기반 동적 폼
- 필드 타입: text, textarea, number, date, select, checkbox
- 실시간 유효성 검증

### StepGeneration
- `/api/generate-document` API 호출
- 5단계 진행률 트래킹
- TimeSavedCounter 통합

### StepComplete
- 성공 UI + 컨페티 애니메이션
- 다운로드/미리보기/링크 복사
- 다른 문서 생성 버튼

### ProgressTimeline
- 5단계 타임라인 시각화
- 그라데이션 커넥터 애니메이션
- 현재 단계 펄스 효과

### TimeSavedCounter ⭐ (핵심 차별화)
- ease-out-expo 애니메이션
- 실시간 시간 절감 카운터
- 93.8% 절감 강조

---

## 🔌 임베드 스크립트

### API
```typescript
interface QettaWidgetAPI {
  init: (config: EmbedConfig) => void
  open: (containerId?: string) => void  // 모달 또는 인라인
  close: () => void
  reset: () => void
  getConfig: () => EmbedConfig | null
  isOpen: () => boolean
}
```

### 사용법
```html
<!-- 외부 사이트 임베드 -->
<script src="https://qetta.ai/v2/embed.js"></script>
<script>
  QettaWidget.init({
    partnerId: 'YOUR_PARTNER_ID',
    theme: 'dark',
    allowedDocTypes: ['result_report', 'performance_report'],
    onComplete: (doc) => console.log('생성 완료:', doc),
  });
</script>
<button onclick="QettaWidget.open()">📄 AI 문서 생성</button>
```

### 내부 앱 사용
```tsx
import { WizardContainer, WizardModal } from '@/components/widget'

// 인라인
<WizardContainer config={{ theme: 'dark', locale: 'ko' }} />

// 모달
<WizardModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

---

## 🔗 API 라우트

### POST /api/generate-document
```typescript
// Request
{
  enginePreset: 'DIGITAL' | 'MANUFACTURING' | 'STARTUP',
  documentType: string,
  data?: Record<string, unknown>,
  metadata?: Record<string, unknown>
}

// Response
{
  success: true,
  artifact: {
    id: string,
    type: 'document' | 'report' | 'analysis',
    title: string,
    format: 'DOCX' | 'XLSX' | 'PDF' | 'HWP',
    previewUrl: string,
    downloadUrl: string,
    hashChain: string,
    verified: boolean,
    createdAt: number,
    sizeBytes: number,
    metadata: { enginePreset, documentType, generationTimeMs }
  },
  message: string
}
```

### GET /api/generate-document?domain={domain}
- 도메인별 사용 가능한 문서 유형 조회

### GET /api/generate-document/download/[id]
- 생성된 문서 다운로드

### GET /api/generate-document/preview
- 문서 미리보기

---

## 📊 핵심 지표

| 지표 | 값 | 설명 |
|------|-----|------|
| 시간 절감 | 93.8% | 8시간 → 30분 |
| 탈락률 감소 | 91% | AI 검증으로 오류 사전 방지 |
| 공고 데이터 | 630K+ | 학습된 정부지원사업 공고 |
| 평균 생성 시간 | 45초 | 문서당 처리 시간 |

---

## ✅ 구현 완료 체크리스트

### 타입 & 스토어
- [x] WidgetDocumentType (5개 문서 타입)
- [x] WizardState, ProgressState, PartnerConfig
- [x] WIDGET_TEMPLATES (필드 정의 포함)
- [x] useWizardStore (위자드 상태)
- [x] useProgressStore (진행률)
- [x] useThemeStore (화이트라벨)

### 위자드 컴포넌트
- [x] WizardContainer + WizardModal
- [x] StepIndicator
- [x] StepDataSource (문서 선택)
- [x] StepValidation (폼 입력)
- [x] StepGeneration (AI 생성)
- [x] StepComplete (완료/다운로드)

### 진행률 컴포넌트
- [x] ProgressTimeline (5단계)
- [x] TimeSavedCounter (시간 절감)
- [x] TimeComparison (수동 vs AI)

### API & 임베드
- [x] POST /api/generate-document
- [x] GET /api/generate-document/download/[id]
- [x] embed.ts (QettaWidget 전역 객체)

### 데모 페이지
- [x] /generate 페이지
- [x] 문서 히스토리 그리드
- [x] 총 절감 시간 표시

---

## 🚀 실행 방법

```bash
# 개발 서버
npm run dev

# 위젯 데모 페이지 접속
http://localhost:3000/generate

# 빌드
npm run build
```

---

## 📝 참고

- **widgets-demo 페이지**: 대시보드 위젯 시스템 (drag-and-drop 그리드) - 별개 기능
- **Hash Chain**: 문서 무결성 검증용 해시 체인 자동 생성
- **optionalAuth**: 비인증 사용자도 문서 생성 가능 (B2B 임베드 시나리오)

---

*Last Updated: 2026-01-31*
