# QETTA Block 정의 v2.1

> **버전**: v2.1 (2026-01-30)
> **이전 버전**: v2.0 (12개 Industry Block)

---

## 개요

QETTA의 3가지 Block 유형을 정의합니다:

| Block 유형 | 기술 Layer | 설명 |
|-----------|-----------|------|
| **Company Block** | Layer 2 | 공급기업 역량 및 메모리 |
| **Industry Block** | Layer 1 | 수요기업 업종별 도메인 지식 |
| **Program Block** | Layer 1 | 정부사업 규정 및 규칙 |

```
비즈니스 관점              기술 관점
┌─────────────┐          ┌─────────────────────┐
│ Company     │ ←──────→ │ Layer 2: CompanyBlock│
│ Block       │          │ (Mem0 패턴 압축)     │
├─────────────┤          ├─────────────────────┤
│ Industry    │ ←──────→ │ Layer 1: DomainEngine│
│ Block       │          │ (IndustryBlockType)  │
├─────────────┤          ├─────────────────────┤
│ Program     │ ←──────→ │ Layer 1: DomainEngine│
│ Block       │          │ (ComplianceRule)     │
└─────────────┘          └─────────────────────┘
```

---

## Industry Block 10개 정의

### v2.0 → v2.1 변경 사항

| v2.0 (12개) | v2.1 (10개) | 변경 사유 |
|-------------|-------------|-----------|
| AUTOMOTIVE | AUTOMOTIVE | 유지 |
| SEMICONDUCTOR | → ELECTRONICS | 전자/반도체 통합 |
| ELECTRONICS | ELECTRONICS | 반도체 흡수 |
| MACHINERY | MACHINERY | 유지 |
| ENERGY | → ENVIRONMENT | 환경/에너지 통합 |
| CHEMICAL | CHEMICAL | 유지 |
| ENVIRONMENT | ENVIRONMENT | 에너지 흡수 |
| AUTONOMOUS | (삭제) | IT 중심 타겟 아님 |
| HEALTHCARE | → BIO_PHARMA | 바이오/의료 통합 |
| BIO_PHARMA | BIO_PHARMA | 헬스케어 흡수 |
| LOGISTICS | (삭제) | 제조업 중심 타겟 |
| CONSTRUCTION | (삭제) | 제조업 중심 타겟 |
| (신규) | FOOD | AI바우처 15% 비중 |
| (신규) | TEXTILE | AI바우처 8% 비중 |
| (신규) | METAL | AI바우처 12% 비중 |
| (신규) | GENERAL | 일반제조 커버리지 |

### Industry Block 상세 정의

#### 1. FOOD (식품/음료)

| 항목 | 값 |
|------|-----|
| **ID** | `FOOD` |
| **한글명** | 식품/음료 |
| **영문명** | Food & Beverage |
| **KSIC 코드** | 10 (식료품 제조업), 11 (음료 제조업) |
| **AI바우처 비중** | 15% |
| **핵심 용어** | HACCP, GMP, 콜드체인, 식품안전, 유통기한, 살균 |
| **Color** | `orange` |

**주요 정부사업**:
- 식품산업 스마트공장
- 식품안전관리인증 (HACCP) 지원
- 로컬푸드 가공시설

---

#### 2. TEXTILE (섬유/의류)

| 항목 | 값 |
|------|-----|
| **ID** | `TEXTILE` |
| **한글명** | 섬유/의류 |
| **영문명** | Textile & Apparel |
| **KSIC 코드** | 13 (섬유제품 제조업), 14 (의복 제조업) |
| **AI바우처 비중** | 8% |
| **핵심 용어** | 원단 LOT, 염색 레시피, 봉제, 패턴, 재단, 원사 |
| **Color** | `pink` |

**주요 정부사업**:
- 섬유산업 스마트공장
- 친환경 염색 기술개발
- 패션 디지털 전환

---

#### 3. METAL (금속/철강)

| 항목 | 값 |
|------|-----|
| **ID** | `METAL` |
| **한글명** | 금속/철강 |
| **영문명** | Metal & Steel |
| **KSIC 코드** | 24 (1차 금속 제조업), 25 (금속가공제품 제조업) |
| **AI바우처 비중** | 12% |
| **핵심 용어** | 열처리, 도금, 금형, 프레스, 용접, 절삭 |
| **Color** | `slate` |

**주요 정부사업**:
- 뿌리산업 스마트공장
- 금형기술 고도화
- 주조/단조 자동화

---

#### 4. CHEMICAL (화학/소재)

| 항목 | 값 |
|------|-----|
| **ID** | `CHEMICAL` |
| **한글명** | 화학/소재 |
| **영문명** | Chemical & Materials |
| **KSIC 코드** | 20 (화학물질 제조업), 22 (고무/플라스틱 제조업) |
| **AI바우처 비중** | 10% |
| **핵심 용어** | 배합비, MSDS, PSM, VOC, 촉매, 중합 |
| **Color** | `amber` |

**주요 정부사업**:
- 화학물질 안전관리
- 소재부품장비 (소부장)
- 친환경 화학공정

---

#### 5. ELECTRONICS (전자/반도체)

| 항목 | 값 |
|------|-----|
| **ID** | `ELECTRONICS` |
| **한글명** | 전자/반도체 |
| **영문명** | Electronics & Semiconductor |
| **KSIC 코드** | 26 (전자부품 제조업), 27 (의료/측정장비 제조업) |
| **AI바우처 비중** | 18% |
| **핵심 용어** | PCB, SMT, 클린룸, Wafer, 수율, FAB |
| **Color** | `cyan` |

**주요 정부사업**:
- 시스템반도체 설계지원
- 전자부품 스마트공장
- 반도체 장비 국산화

---

#### 6. MACHINERY (기계/장비)

| 항목 | 값 |
|------|-----|
| **ID** | `MACHINERY` |
| **한글명** | 기계/장비 |
| **영문명** | Machinery & Equipment |
| **KSIC 코드** | 28 (기계/장비 제조업), 29 (자동차/트레일러 제조업) |
| **AI바우처 비중** | 14% |
| **핵심 용어** | CNC, PLC, 공차, 4M1E, OEE, 예방정비 |
| **Color** | `blue` |

**주요 정부사업**:
- 스마트공장 보급·확산
- 로봇 활용 제조혁신
- 공작기계 고도화

---

#### 7. AUTOMOTIVE (자동차/부품)

| 항목 | 값 |
|------|-----|
| **ID** | `AUTOMOTIVE` |
| **한글명** | 자동차/부품 |
| **영문명** | Automotive & Parts |
| **KSIC 코드** | 30 (자동차 제조업) |
| **AI바우처 비중** | 8% |
| **핵심 용어** | IATF 16949, PPAP, JIT, Tier, MES, 품질관리 |
| **Color** | `indigo` |

**주요 정부사업**:
- 자동차부품 스마트공장
- 미래차 전환 지원
- 전기차 부품 생태계

---

#### 8. BIO_PHARMA (바이오/제약)

| 항목 | 값 |
|------|-----|
| **ID** | `BIO_PHARMA` |
| **한글명** | 바이오/제약 |
| **영문명** | Bio & Pharma |
| **KSIC 코드** | 21 (의약품 제조업) |
| **AI바우처 비중** | 7% |
| **핵심 용어** | GMP, 밸리데이션, 임상, cGMP, KFDA, 바이오시밀러 |
| **Color** | `rose` |

**주요 정부사업**:
- 바이오헬스 육성
- 신약개발 지원
- 의료기기 혁신

---

#### 9. ENVIRONMENT (환경/에너지)

| 항목 | 값 |
|------|-----|
| **ID** | `ENVIRONMENT` |
| **한글명** | 환경/에너지 |
| **영문명** | Environment & Energy |
| **KSIC 코드** | 35 (전기/가스 공급업), 38 (폐기물 처리업) |
| **AI바우처 비중** | 5% |
| **핵심 용어** | TMS, 탄소중립, NOx, SOx, ESS, 재생에너지 |
| **Color** | `emerald` |

**주요 정부사업**:
- 탄소중립 스마트공장
- 굴뚝TMS 연계
- 재생에너지 설비

---

#### 10. GENERAL (일반제조)

| 항목 | 값 |
|------|-----|
| **ID** | `GENERAL` |
| **한글명** | 일반제조 |
| **영문명** | General Manufacturing |
| **KSIC 코드** | (기타 제조업) |
| **AI바우처 비중** | 3% |
| **핵심 용어** | 4M1E, 생산성, OEE, 품질관리, 납기, 재고 |
| **Color** | `gray` |

**주요 정부사업**:
- 일반 스마트공장
- 제조혁신 바우처
- 생산성 향상 지원

---

## Company Block 구조

### Mem0 패턴 압축

Company Block은 **Mem0 패턴**을 적용하여 80% 토큰 압축을 달성합니다.

**압축 전 (200 tokens)**:
```json
{
  "name": "ABC Corp",
  "foundedDate": "2020-01-15",
  "employeeCount": 45,
  "annualRevenue": 32,
  "certifications": ["ISO 9001", "벤처기업", "이노비즈"],
  "applications": [
    { "program": "TIPS", "result": "rejected", "reason": "기술성 미달", "date": "2024-06" },
    { "program": "스마트공장", "result": "selected", "amount": 5000, "date": "2025-03" }
  ]
}
```

**압축 후 (40 tokens)**:
```
ABC Corp(2020년 설립, 4년차). 직원 45명, 매출 32억.
인증: ISO 9001/벤처/이노비즈.
신청 2건 (선정 1, 탈락 1, 선정률 50%).
• TIPS 탈락: 기술성 미달 (2024.06)
• 스마트공장 선정: 5,000만원 (2025.03)
```

### Company Fact 유형

| 유형 | 설명 | 우선순위 |
|------|------|---------|
| `rejection_pattern` | 탈락 패턴 | 5 (최고) |
| `success_pattern` | 성공 패턴 | 4 |
| `capability` | 기술 역량 | 3 |
| `application` | 신청 이력 | 2 |
| `certification` | 보유 인증 | 1 |
| `preference` | 학습된 선호 | 1 |
| `profile` | 기본 정보 | 0 |

---

## Program Block 구조

Program Block은 정부사업 규정을 `ComplianceRule`로 표현합니다.

### 규칙 예시

```typescript
const aiVoucherRule: ComplianceRule = {
  id: 'av-supply-reg-001',
  name: 'AI바우처 공급기업 자격',
  description: '공급기업 등록 필수, 정산서류 양식 준수',
  condition: '공급기업 등록번호 보유',
  action: '등록번호 확인 및 정산서류 양식 검증',
  severity: 'error',
  regulatoryRef: 'NIPA 공급기업 관리지침 제3조',
}
```

### 규칙 심각도

| 심각도 | 설명 | 처리 |
|--------|------|------|
| `error` | 필수 요건 미충족 | 문서 생성 차단 |
| `warning` | 권장 사항 미준수 | 경고 표시 |
| `info` | 참고 정보 | 알림만 |

---

## 기술 구현 참조

### TypeScript 타입

```typescript
// lib/block-engine/types.ts
type IndustryBlockTypeV21 =
  | 'FOOD'
  | 'TEXTILE'
  | 'METAL'
  | 'CHEMICAL'
  | 'ELECTRONICS'
  | 'MACHINERY'
  | 'AUTOMOTIVE'
  | 'BIO_PHARMA'
  | 'ENVIRONMENT'
  | 'GENERAL'

interface IndustryBlockDefinition {
  id: IndustryBlockTypeV21
  nameKo: string
  nameEn: string
  ksicCodes: string[]
  coreTerms: string[]
  aiVoucherPercent: number
  color: string
}
```

### 사용 예시

```typescript
import { INDUSTRY_BLOCKS_V21 } from '@/lib/block-engine'

// 특정 Industry Block 조회
const food = INDUSTRY_BLOCKS_V21.find(b => b.id === 'FOOD')
console.log(food?.coreTerms) // ['HACCP', 'GMP', '콜드체인', ...]

// AI바우처 비중순 정렬
const sorted = INDUSTRY_BLOCKS_V21.sort(
  (a, b) => b.aiVoucherPercent - a.aiVoucherPercent
)
```

---

*Last updated: 2026-01-30*
