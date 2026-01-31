# QETTA 기술 명세 v2.1

> **버전**: v2.1 (2026-01-30)
> **대상**: 백엔드 개발자, 시스템 아키텍트
> **기술 스택**: Next.js 15, TypeScript, PostgreSQL, Claude API

---

## 개요

QETTA의 핵심 기술 아키텍처인 **3-Layer Block Engine**을 상세히 정의합니다.

---

## 1. 시스템 아키텍처

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        QETTA Platform                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   Next.js App   │    │   API Routes    │    │  Block Engine   │  │
│  │   (Frontend)    │───▶│   (Backend)     │───▶│  (Core Logic)   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│           │                     │                       │           │
│           ▼                     ▼                       ▼           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   Zustand/RQ    │    │   PostgreSQL    │    │   Claude API    │  │
│  │   (State)       │    │   (Database)    │    │   (AI Core)     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 디렉토리 구조

```
lib/
├── block-engine/           # 3-Layer Block Engine (v2.1 신규)
│   ├── types.ts            # 3-Layer 타입 정의
│   ├── domain-engine.ts    # Layer 1: Domain Engine 래핑
│   ├── company-block.ts    # Layer 2: Mem0 패턴 압축
│   ├── session-context.ts  # Layer 3: 세션 관리
│   ├── assembler.ts        # 컨텍스트 조립기
│   └── index.ts            # Barrel exports
│
├── skill-engine/           # 기존 Domain Engine (v4.0)
│   ├── core/
│   │   └── domain-engine.ts  # EnginePreset 클래스
│   ├── blocks/             # 10 Industry BLOCKs
│   │   ├── types.ts        # Block 공통 타입
│   │   ├── food.ts
│   │   ├── textile.ts
│   │   ├── metal.ts
│   │   ├── chemical.ts
│   │   ├── electronics.ts
│   │   ├── machinery.ts
│   │   ├── automotive.ts
│   │   ├── bio-pharma.ts
│   │   ├── environment.ts
│   │   ├── general.ts
│   │   └── index.ts
│   └── presets.ts          # 6 Preset 조합
│
├── super-model/            # 타입 정의 및 로더
│   └── loader.ts           # IndustryBlockType 정의
│
└── api/                    # API 클라이언트
    └── client.ts
```

---

## 2. 3-Layer Block Engine

### 2.1 레이어 개요

| Layer | 명칭 | 토큰 예산 | 역할 |
|-------|------|----------|------|
| **Layer 1** | Domain Engine | ~2,000 | 업종/사업 도메인 지식 |
| **Layer 2** | Company Block | ~1,500 | 기업 프로필 및 학습 데이터 |
| **Layer 3** | Session Context | ~500 | 현재 대화 및 의도 |

### 2.2 토큰 예산 분배

```
┌────────────────────────────────────────────────────────────────┐
│                 Total: ~8,000 tokens                           │
├────────────────────────────────────────────────────────────────┤
│  System Prompt        │  ~500   │ ████░░░░░░░░░░░░░░░░░ (6%)  │
│  Layer 1 (Domain)     │  ~2,000 │ ████████████░░░░░░░░░ (25%) │
│  Layer 2 (Company)    │  ~1,500 │ █████████░░░░░░░░░░░░ (19%) │
│  Layer 3 (Session)    │  ~500   │ ████░░░░░░░░░░░░░░░░░ (6%)  │
│  ─────────────────────┼─────────┼──────────────────────────── │
│  Base Total           │  ~4,500 │ (56%)                       │
│  Headroom (I/O)       │  ~3,500 │ ████████████████████ (44%)  │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer 1: Domain Engine

### 3.1 타입 정의

```typescript
// lib/block-engine/types.ts

/**
 * 10 Industry Blocks (v2.1 KSIC 기반)
 */
export type IndustryBlockTypeV21 =
  | 'FOOD'        // 식품/음료 (KSIC 10, 11)
  | 'TEXTILE'     // 섬유/의류 (KSIC 13, 14)
  | 'METAL'       // 금속/철강 (KSIC 24, 25)
  | 'CHEMICAL'    // 화학/소재 (KSIC 20, 22)
  | 'ELECTRONICS' // 전자/반도체 (KSIC 26, 27)
  | 'MACHINERY'   // 기계/장비 (KSIC 28, 29)
  | 'AUTOMOTIVE'  // 자동차/부품 (KSIC 30)
  | 'BIO_PHARMA'  // 바이오/제약 (KSIC 21)
  | 'ENVIRONMENT' // 환경/에너지 (KSIC 35, 38)
  | 'GENERAL'     // 일반제조 (기타)

/**
 * 6 Engine Presets
 */
export type EnginePresetTypeV21 =
  | 'MANUFACTURING'  // 제조/스마트공장
  | 'ENVIRONMENT'    // 환경/에너지
  | 'DIGITAL'        // AI/SW 바우처
  | 'FINANCE'        // 융자/보증
  | 'STARTUP'        // 창업지원
  | 'EXPORT'         // 수출/글로벌
```

### 3.2 Domain Engine Wrapper

```typescript
// lib/block-engine/domain-engine.ts

import { EnginePreset as SkillEnginePreset } from '@/lib/skill-engine/core/domain-engine'
import type { IndustryBlockTypeV21, EnginePresetTypeV21 } from './types'

/**
 * Layer 1: Domain Engine
 *
 * 기존 skill-engine을 래핑하여 3-Layer 아키텍처와 통합
 */
export class DomainEngineLayer {
  private engine: SkillEnginePreset

  constructor() {
    this.engine = new SkillEnginePreset()
  }

  /**
   * Industry Block 로드
   */
  loadBlocks(blockIds: IndustryBlockTypeV21[]): this {
    this.engine.load(blockIds)
    return this
  }

  /**
   * Preset으로 로드
   */
  loadPreset(presetId: EnginePresetTypeV21, blockIds: IndustryBlockTypeV21[]): this {
    this.engine.loadPreset(presetId, blockIds)
    return this
  }

  /**
   * Progressive Disclosure: 토큰 레벨별 컨텍스트 반환
   */
  getContext(level: 'metadata' | 'terminology' | 'full'): DomainContext {
    const blocks = this.engine.getLoadedBlockIds()

    switch (level) {
      case 'metadata':
        return {
          level,
          blocks: blocks.map(id => ({ id })),
          tokenCount: blocks.length * 10,
        }
      case 'terminology':
        return {
          level,
          blocks: blocks.map(id => ({
            id,
            terms: this.engine.getAllTerminology()
              .filter(t => t.blockId === id)
              .slice(0, 10),
          })),
          tokenCount: this.engine.getAllTerminology().length * 15,
        }
      case 'full':
        return {
          level,
          terminology: this.engine.getAllTerminology(),
          templates: this.engine.getAllTemplates(),
          rules: this.engine.getAllRules(),
          tokenCount: this.calculateFullTokens(),
        }
    }
  }

  private calculateFullTokens(): number {
    const termTokens = this.engine.getAllTerminology().length * 20
    const templateTokens = this.engine.getAllTemplates().length * 50
    const ruleTokens = this.engine.getAllRules().length * 30
    return termTokens + templateTokens + ruleTokens
  }
}

export interface DomainContext {
  level: 'metadata' | 'terminology' | 'full'
  blocks?: Array<{ id: IndustryBlockTypeV21; terms?: unknown[] }>
  terminology?: unknown[]
  templates?: unknown[]
  rules?: unknown[]
  tokenCount: number
}
```

### 3.3 Preset 매핑

```typescript
// lib/skill-engine/presets.ts

export const PRESETS: Record<EnginePresetTypeV21, IndustryBlockTypeV21[]> = {
  /** 제조/스마트공장 */
  MANUFACTURING: ['AUTOMOTIVE', 'ELECTRONICS', 'MACHINERY', 'METAL'],

  /** 환경/에너지/탄소중립 */
  ENVIRONMENT: ['ENVIRONMENT', 'CHEMICAL'],

  /** AI/SW 바우처 */
  DIGITAL: ['ELECTRONICS', 'BIO_PHARMA', 'FOOD', 'TEXTILE'],

  /** 융자/보증 (전 산업) */
  FINANCE: [
    'FOOD', 'TEXTILE', 'METAL', 'CHEMICAL', 'ELECTRONICS',
    'MACHINERY', 'AUTOMOTIVE', 'BIO_PHARMA', 'ENVIRONMENT', 'GENERAL',
  ],

  /** 창업지원 (전 산업) */
  STARTUP: [
    'FOOD', 'TEXTILE', 'METAL', 'CHEMICAL', 'ELECTRONICS',
    'MACHINERY', 'AUTOMOTIVE', 'BIO_PHARMA', 'ENVIRONMENT', 'GENERAL',
  ],

  /** 수출/글로벌 (전 산업) */
  EXPORT: [
    'FOOD', 'TEXTILE', 'METAL', 'CHEMICAL', 'ELECTRONICS',
    'MACHINERY', 'AUTOMOTIVE', 'BIO_PHARMA', 'ENVIRONMENT', 'GENERAL',
  ],
}
```

---

## 4. Layer 2: Company Block

### 4.1 Mem0 패턴 압축

```typescript
// lib/block-engine/company-block.ts

/**
 * Layer 2: Company Block
 *
 * Mem0 패턴을 적용하여 기업 정보를 80% 압축
 */
export class CompanyBlockLayer {
  private profile: CompanyProfile | null = null
  private facts: CompanyFact[] = []

  /**
   * 기업 프로필 로드
   */
  loadProfile(profile: CompanyProfile): this {
    this.profile = profile
    return this
  }

  /**
   * Fact 추가
   */
  addFact(fact: CompanyFact): this {
    this.facts.push(fact)
    return this
  }

  /**
   * Mem0 패턴 압축
   *
   * 원본 JSON → 압축된 자연어 텍스트
   * 토큰: 200+ → ~40 (80% 절감)
   */
  compress(): CompressedCompanyBlock {
    if (!this.profile) {
      throw new Error('Profile not loaded')
    }

    const { name, basic, qualifications, history } = this.profile
    const age = new Date().getFullYear() - new Date(basic.foundedDate).getFullYear()

    // 기본 정보 압축
    const header = `${name}(${new Date(basic.foundedDate).getFullYear()}년 설립, ${age}년차). ` +
      `직원 ${basic.employeeCount}명, 매출 ${basic.annualRevenue}억.`

    // 인증 압축
    const certs = qualifications.certifications.join('/')
    const certLine = `인증: ${certs}.`

    // 신청 이력 압축
    const total = history.totalApplications
    const selected = history.selectionCount
    const rejected = history.rejectionCount
    const rate = total > 0 ? Math.round((selected / total) * 100) : 0
    const historyLine = `신청 ${total}건 (선정 ${selected}, 탈락 ${rejected}, 선정률 ${rate}%).`

    // Fact 압축 (우선순위순)
    const sortedFacts = [...this.facts].sort((a, b) =>
      FACT_PRIORITY[b.type] - FACT_PRIORITY[a.type]
    )
    const factLines = sortedFacts.slice(0, 5).map(f => `• ${f.content}`)

    const compressedText = [
      header,
      certLine,
      historyLine,
      ...factLines,
    ].join('\n')

    return {
      compressedText,
      originalTokens: this.estimateOriginalTokens(),
      compressedTokens: this.estimateTokens(compressedText),
      compressionRatio: this.calculateRatio(compressedText),
    }
  }

  private estimateOriginalTokens(): number {
    const profileTokens = JSON.stringify(this.profile).length / 4
    const factsTokens = this.facts.reduce((sum, f) =>
      sum + JSON.stringify(f).length / 4, 0
    )
    return Math.ceil(profileTokens + factsTokens)
  }

  private estimateTokens(text: string): number {
    // 한글 기준 대략적 추정 (실제로는 tiktoken 사용)
    return Math.ceil(text.length / 2)
  }

  private calculateRatio(compressedText: string): number {
    const original = this.estimateOriginalTokens()
    const compressed = this.estimateTokens(compressedText)
    return Math.round((1 - compressed / original) * 100)
  }
}

const FACT_PRIORITY: Record<CompanyFactType, number> = {
  rejection_pattern: 5,
  success_pattern: 4,
  capability: 3,
  application: 2,
  certification: 1,
  preference: 1,
  profile: 0,
}
```

### 4.2 타입 정의

```typescript
// lib/block-engine/types.ts

export interface CompanyProfile {
  id: string
  name: string
  businessNumber: string
  basic: {
    foundedDate: string
    employeeCount: number
    annualRevenue: number  // 억원 단위
    region: string
    industry: string
    mainProducts: string[]
  }
  qualifications: {
    certifications: string[]
    registrations: string[]
    patents: number
    trademarks: number
  }
  history: {
    totalApplications: number
    selectionCount: number
    rejectionCount: number
    qettaCreditScore: number  // 0-1000
  }
}

export type CompanyFactType =
  | 'rejection_pattern'  // 탈락 패턴
  | 'success_pattern'    // 성공 패턴
  | 'capability'         // 기술 역량
  | 'application'        // 신청 이력
  | 'certification'      // 보유 인증
  | 'preference'         // 학습된 선호
  | 'profile'            // 기본 정보

export interface CompanyFact {
  id: string
  type: CompanyFactType
  content: string
  confidence: number      // 0-1
  source: 'document_parsed' | 'user_input' | 'ai_inferred'
  createdAt: string
  expiresAt?: string      // 유효기간
}

export interface CompressedCompanyBlock {
  compressedText: string
  originalTokens: number
  compressedTokens: number
  compressionRatio: number  // 0-100 (percentage)
}
```

---

## 5. Layer 3: Session Context

### 5.1 세션 관리

```typescript
// lib/block-engine/session-context.ts

/**
 * Layer 3: Session Context
 *
 * 현재 대화 세션의 컨텍스트 관리
 */
export class SessionContextLayer {
  private sessionId: string
  private messages: SessionMessage[] = []
  private intent: SessionIntent | null = null
  private metadata: Record<string, unknown> = {}

  constructor(sessionId?: string) {
    this.sessionId = sessionId ?? `session-${Date.now()}`
  }

  /**
   * 메시지 추가
   */
  addMessage(message: Omit<SessionMessage, 'id' | 'timestamp'>): this {
    this.messages.push({
      ...message,
      id: `msg-${this.messages.length + 1}`,
      timestamp: new Date().toISOString(),
    })
    this.analyzeIntent()
    return this
  }

  /**
   * 의도 분석 (간소화 버전)
   */
  private analyzeIntent(): void {
    const lastMessage = this.messages[this.messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') return

    const content = lastMessage.content.toLowerCase()

    // 간단한 규칙 기반 의도 분석
    if (content.includes('제안서') || content.includes('작성')) {
      this.intent = {
        type: 'document_generation',
        confidence: 0.85,
        entities: this.extractEntities(content),
      }
    } else if (content.includes('자격') || content.includes('요건')) {
      this.intent = {
        type: 'eligibility_check',
        confidence: 0.8,
        entities: this.extractEntities(content),
      }
    } else if (content.includes('검색') || content.includes('찾아')) {
      this.intent = {
        type: 'program_search',
        confidence: 0.75,
        entities: this.extractEntities(content),
      }
    }
  }

  private extractEntities(content: string): Record<string, string> {
    const entities: Record<string, string> = {}

    // 프로그램 추출
    const programs = ['AI바우처', '스마트공장', 'TIPS', '데이터바우처']
    for (const p of programs) {
      if (content.includes(p.toLowerCase()) || content.includes(p)) {
        entities.program = p
        break
      }
    }

    // 문서 유형 추출
    const docTypes = ['제안서', '사업계획서', '정산서', '결과보고서']
    for (const d of docTypes) {
      if (content.includes(d)) {
        entities.documentType = d
        break
      }
    }

    return entities
  }

  /**
   * 세션 컨텍스트 반환
   */
  getContext(): SessionContext {
    return {
      sessionId: this.sessionId,
      intent: this.intent,
      recentMessages: this.messages.slice(-5),
      messageCount: this.messages.length,
      tokenEstimate: this.estimateTokens(),
    }
  }

  private estimateTokens(): number {
    return this.messages.reduce((sum, m) =>
      sum + Math.ceil(m.content.length / 2), 0
    )
  }
}

export interface SessionMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface SessionIntent {
  type: 'document_generation' | 'eligibility_check' | 'program_search' | 'general'
  confidence: number
  entities: Record<string, string>
}

export interface SessionContext {
  sessionId: string
  intent: SessionIntent | null
  recentMessages: SessionMessage[]
  messageCount: number
  tokenEstimate: number
}
```

---

## 6. Context Assembler

### 6.1 조립 로직

```typescript
// lib/block-engine/assembler.ts

import { DomainEngineLayer, DomainContext } from './domain-engine'
import { CompanyBlockLayer, CompressedCompanyBlock } from './company-block'
import { SessionContextLayer, SessionContext } from './session-context'

/**
 * 3-Layer Context Assembler
 *
 * 세 레이어의 컨텍스트를 조립하여 최종 프롬프트 생성
 */
export class ContextAssembler {
  private domain: DomainEngineLayer
  private company: CompanyBlockLayer
  private session: SessionContextLayer

  private tokenBudget = {
    total: 8000,
    system: 500,
    domain: 2000,
    company: 1500,
    session: 500,
    headroom: 3500,
  }

  constructor(sessionId?: string) {
    this.domain = new DomainEngineLayer()
    this.company = new CompanyBlockLayer()
    this.session = new SessionContextLayer(sessionId)
  }

  /**
   * Domain Layer 설정
   */
  withDomain(blockIds: IndustryBlockTypeV21[]): this {
    this.domain.loadBlocks(blockIds)
    return this
  }

  /**
   * Company Layer 설정
   */
  withCompany(profile: CompanyProfile, facts: CompanyFact[]): this {
    this.company.loadProfile(profile)
    facts.forEach(f => this.company.addFact(f))
    return this
  }

  /**
   * Session Layer에 메시지 추가
   */
  addMessage(role: 'user' | 'assistant', content: string): this {
    this.session.addMessage({ role, content })
    return this
  }

  /**
   * 최종 컨텍스트 조립
   */
  assemble(): AssembledContext {
    // 각 레이어 컨텍스트 수집
    const domainContext = this.domain.getContext('full')
    const companyBlock = this.company.compress()
    const sessionContext = this.session.getContext()

    // 토큰 계산
    const totalTokens =
      this.tokenBudget.system +
      domainContext.tokenCount +
      companyBlock.compressedTokens +
      sessionContext.tokenEstimate

    const withinBudget = totalTokens <= (this.tokenBudget.total - this.tokenBudget.headroom)

    // 조립된 컨텍스트
    return {
      domain: {
        context: domainContext,
        tokenCount: domainContext.tokenCount,
      },
      company: {
        compressedText: companyBlock.compressedText,
        compression: {
          original: companyBlock.originalTokens,
          compressed: companyBlock.compressedTokens,
          ratio: companyBlock.compressionRatio,
        },
      },
      session: sessionContext,
      assembly: {
        totalTokens,
        breakdown: {
          system: this.tokenBudget.system,
          domain: domainContext.tokenCount,
          company: companyBlock.compressedTokens,
          session: sessionContext.tokenEstimate,
        },
        budget: this.tokenBudget.total - this.tokenBudget.headroom,
        withinBudget,
      },
    }
  }

  /**
   * 최종 프롬프트 생성
   */
  buildPrompt(): string {
    const assembled = this.assemble()

    const parts = [
      `[DOMAIN CONTEXT]`,
      `Loaded Blocks: ${JSON.stringify(assembled.domain.context.blocks?.map(b => b.id))}`,
      `Terminology: ${assembled.domain.context.terminology?.length ?? 0} terms`,
      ``,
      `[COMPANY CONTEXT]`,
      assembled.company.compressedText,
      ``,
      `[SESSION CONTEXT]`,
      `Intent: ${assembled.session.intent?.type ?? 'unknown'} (${assembled.session.intent?.confidence ?? 0})`,
      `Messages: ${assembled.session.messageCount}`,
    ]

    return parts.join('\n')
  }
}

export interface AssembledContext {
  domain: {
    context: DomainContext
    tokenCount: number
  }
  company: {
    compressedText: string
    compression: {
      original: number
      compressed: number
      ratio: number
    }
  }
  session: SessionContext
  assembly: {
    totalTokens: number
    breakdown: {
      system: number
      domain: number
      company: number
      session: number
    }
    budget: number
    withinBudget: boolean
  }
}
```

---

## 7. 데이터베이스 스키마

### 7.1 Core Tables

```sql
-- Companies (Company Block 저장)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  business_number VARCHAR(12) UNIQUE,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Facts (Mem0 패턴)
CREATE TABLE company_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3, 2) DEFAULT 1.0,
  source VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_facts_type ON company_facts(company_id, type);
CREATE INDEX idx_company_facts_expires ON company_facts(expires_at) WHERE expires_at IS NOT NULL;

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  preset_id VARCHAR(50),
  intent JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Session Messages
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_messages ON session_messages(session_id, created_at);

-- Proposals (생성된 문서)
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  session_id UUID REFERENCES sessions(id),
  program_id VARCHAR(100),
  preset_id VARCHAR(50),
  template_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'generating',
  title VARCHAR(255),
  format VARCHAR(10),
  storage_url TEXT,
  hash VARCHAR(64),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_proposals_company ON proposals(company_id, created_at DESC);
CREATE INDEX idx_proposals_status ON proposals(status) WHERE status = 'generating';
```

### 7.2 Industry Block Cache

```sql
-- Industry Blocks (캐시용)
CREATE TABLE industry_blocks (
  id VARCHAR(50) PRIMARY KEY,
  name_ko VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  ksic_codes VARCHAR(50)[] NOT NULL,
  core_terms VARCHAR(100)[] NOT NULL,
  ai_voucher_percent DECIMAL(4, 1),
  color VARCHAR(20),
  terminology JSONB,
  templates JSONB,
  rules JSONB,
  version VARCHAR(10) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 버전 v2.1 초기 데이터
INSERT INTO industry_blocks (id, name_ko, name_en, ksic_codes, core_terms, ai_voucher_percent, color, version)
VALUES
  ('FOOD', '식품/음료', 'Food & Beverage', ARRAY['10', '11'], ARRAY['HACCP', 'GMP', '콜드체인'], 15.0, 'orange', 'v2.1'),
  ('TEXTILE', '섬유/의류', 'Textile & Apparel', ARRAY['13', '14'], ARRAY['원단', '염색', '봉제'], 8.0, 'pink', 'v2.1'),
  ('METAL', '금속/철강', 'Metal & Steel', ARRAY['24', '25'], ARRAY['열처리', '도금', '금형'], 12.0, 'slate', 'v2.1'),
  ('CHEMICAL', '화학/소재', 'Chemical & Materials', ARRAY['20', '22'], ARRAY['배합비', 'MSDS', 'PSM'], 10.0, 'amber', 'v2.1'),
  ('ELECTRONICS', '전자/반도체', 'Electronics & Semiconductor', ARRAY['26', '27'], ARRAY['PCB', 'SMT', 'Wafer'], 18.0, 'cyan', 'v2.1'),
  ('MACHINERY', '기계/장비', 'Machinery & Equipment', ARRAY['28', '29'], ARRAY['CNC', 'PLC', 'OEE'], 14.0, 'blue', 'v2.1'),
  ('AUTOMOTIVE', '자동차/부품', 'Automotive & Parts', ARRAY['30'], ARRAY['IATF', 'PPAP', 'JIT'], 8.0, 'indigo', 'v2.1'),
  ('BIO_PHARMA', '바이오/제약', 'Bio & Pharma', ARRAY['21'], ARRAY['GMP', '밸리데이션', '임상'], 7.0, 'rose', 'v2.1'),
  ('ENVIRONMENT', '환경/에너지', 'Environment & Energy', ARRAY['35', '38'], ARRAY['TMS', '탄소중립', 'NOx'], 5.0, 'emerald', 'v2.1'),
  ('GENERAL', '일반제조', 'General Manufacturing', ARRAY['99'], ARRAY['4M1E', 'OEE', '품질관리'], 3.0, 'gray', 'v2.1');
```

---

## 8. API 엔드포인트

상세 API 명세는 [03-api-reference.md](./03-api-reference.md) 참조.

### 8.1 주요 엔드포인트 요약

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | /blocks/industry | Industry Block 목록 |
| GET | /blocks/company | Company Block 조회 |
| POST | /blocks/company/compress | Mem0 압축 |
| POST | /sessions | 세션 생성 |
| GET | /sessions/{id}/context | 조립된 컨텍스트 |
| POST | /proposals/generate | 제안서 생성 |

---

## 9. 성능 최적화

### 9.1 캐싱 전략

```typescript
// Industry Block: 1시간 캐시
const industryBlocksQuery = useQuery({
  queryKey: ['industryBlocks'],
  queryFn: fetchIndustryBlocks,
  staleTime: 1000 * 60 * 60, // 1시간
})

// Company Block: 사용자별 5분 캐시
const companyBlockQuery = useQuery({
  queryKey: ['companyBlock', userId],
  queryFn: () => fetchCompanyBlock(userId),
  staleTime: 1000 * 60 * 5, // 5분
})
```

### 9.2 토큰 최적화

| 기법 | 절감율 | 적용 대상 |
|------|--------|----------|
| Mem0 압축 | 80% | Company Block |
| Progressive Disclosure | 50% | Domain Context |
| 최근 5개 메시지만 | 70% | Session Context |

---

## 10. 테스트 전략

### 10.1 단위 테스트

```typescript
// lib/block-engine/__tests__/company-block.test.ts

describe('CompanyBlockLayer', () => {
  it('compresses profile with 80% ratio', () => {
    const layer = new CompanyBlockLayer()
    layer.loadProfile(mockProfile)
    layer.addFact(mockFact)

    const result = layer.compress()

    expect(result.compressionRatio).toBeGreaterThanOrEqual(70)
    expect(result.compressedText).toContain(mockProfile.name)
  })
})
```

### 10.2 통합 테스트

```typescript
// lib/block-engine/__tests__/assembler.test.ts

describe('ContextAssembler', () => {
  it('assembles 3-layer context within budget', () => {
    const assembler = new ContextAssembler()
      .withDomain(['ELECTRONICS', 'MACHINERY'])
      .withCompany(mockProfile, mockFacts)
      .addMessage('user', 'AI바우처 제안서 작성해줘')

    const result = assembler.assemble()

    expect(result.assembly.withinBudget).toBe(true)
    expect(result.assembly.totalTokens).toBeLessThan(4500)
  })
})
```

---

## 11. 보안 고려사항

### 11.1 데이터 보호

| 데이터 | 보호 방식 |
|--------|----------|
| 사업자등록번호 | AES-256 암호화 |
| API 키 | 환경변수 + Vault |
| 생성 문서 | 서명된 URL (24시간) |

### 11.2 접근 제어

```typescript
// Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_access ON companies
  FOR ALL
  USING (user_id = auth.uid());
```

---

## 12. 참고 문서

- [00-version-control.md](./00-version-control.md) - 버전 관리
- [03-api-reference.md](./03-api-reference.md) - API 명세
- [04-block-definitions.md](./04-block-definitions.md) - Block 정의
- [05-frontend-guide.md](./05-frontend-guide.md) - 프론트엔드 가이드

---

*Last updated: 2026-01-30*
