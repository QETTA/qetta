# QETTA BLOCK 시스템 v2.0

## BLOCK 개념 정의

### BLOCK이란?

BLOCK은 **산업별 전문 지식 데이터셋 + 문서 생성 규칙의 패키지**입니다. 단순한 템플릿이 아니라, 해당 산업의 규정, 용어, 문서 양식, 성공 패턴을 학습한 "산업 전문가 AI"입니다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BLOCK의 구성 요소                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BLOCK = Knowledge Base + Templates + Rules + Memory                │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Knowledge Base  │  │    Templates    │  │      Rules      │     │
│  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │     │
│  │ • 산업 규정     │  │ • 문서 양식    │  │ • 작성 규칙     │     │
│  │ • 전문 용어     │  │ • 섹션 구조    │  │ • 검증 로직     │     │
│  │ • 벤치마크 데이터│  │ • 샘플 문서    │  │ • 품질 기준     │     │
│  │ • 성공 사례     │  │ • 레이아웃     │  │ • 제출 요건     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                              │                                      │
│                              ▼                                      │
│                    ┌─────────────────┐                             │
│                    │  Company Memory │                             │
│                    │ ─────────────── │                             │
│                    │ • 회사 정보     │                             │
│                    │ • 과거 문서     │                             │
│                    │ • 선호 스타일   │                             │
│                    │ • 수정 이력     │                             │
│                    └─────────────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3-Layer 아키텍처

QETTA BLOCK은 **3-Layer 구조**로 설계되어 있습니다. 이는 Mem0, Zep, OpenAI Memory 등 업계 표준과 일치합니다.

```typescript
interface QettaBlockArchitecture {
  // Layer 1: Domain BLOCK (산업별 지식)
  // - 모든 고객이 공유
  // - QETTA가 관리/업데이트
  // - 12개 산업별로 존재
  domainBlock: {
    type: "shared";
    updatedBy: "QETTA";
    industries: 12;
  };
  
  // Layer 2: Company BLOCK (기업별 메모리)
  // - 각 기업만 접근 가능
  // - 매일 자동 최적화
  // - 쓸수록 똑똑해짐
  companyBlock: {
    type: "private";
    updatedBy: "daily_optimization";
    customizable: true;
  };
  
  // Layer 3: Session Context (세션별 컨텍스트)
  // - 현재 대화/작업 컨텍스트
  // - 24시간 후 만료
  // - 중요한 정보는 Company BLOCK으로 승격
  sessionContext: {
    type: "ephemeral";
    expiry: "24h";
    promotionEnabled: true;
  };
}
```

---

## 12개 산업 BLOCK 정의

### BLOCK 목록 개요

```typescript
const INDUSTRY_BLOCKS = {
  // 제조/하드웨어 (4개)
  AUTOMOTIVE: "자동차/자율주행",
  SEMICONDUCTOR: "반도체",
  ELECTRONICS: "전자부품",
  MACHINERY: "산업기계",
  
  // 바이오/헬스케어 (2개)
  BIO_PHARMA: "바이오/제약",
  HEALTHCARE: "의료기기/디지털헬스",
  
  // 에너지/환경 (2개)
  ENERGY: "에너지/신재생",
  ENVIRONMENT: "환경",
  
  // 화학/소재 (1개)
  CHEMICAL: "화학/소재",
  
  // IT/디지털 (2개)
  DIGITAL: "SW/AI/클라우드",
  AUTONOMOUS: "로봇/드론/자율시스템",
  
  // 일반 제조 (1개)
  MANUFACTURING: "일반 제조/품질관리"
};
```

### BLOCK별 상세 정의

#### 1. AUTOMOTIVE (자동차/자율주행)

```typescript
interface AutomotiveBlock {
  id: "AUTOMOTIVE";
  name: "Automotive";
  nameKo: "자동차/자율주행";
  category: "manufacturing";
  
  // 지식 베이스
  knowledgeBase: {
    regulations: [
      "자동차관리법",
      "자동차 및 자동차부품의 성능과 기준에 관한 규칙",
      "자율주행자동차 상용화 촉진 및 지원에 관한 법률",
      "UN ECE R79 (조향장치)",
      "ISO 26262 (기능안전)",
      "ISO/SAE 21434 (사이버보안)"
    ];
    
    terminology: {
      "ADAS": "첨단 운전자 지원 시스템",
      "ODD": "운행설계영역 (Operational Design Domain)",
      "V2X": "차량-사물 통신",
      "SOTIF": "의도된 기능의 안전성",
      "MaaS": "서비스로서의 모빌리티"
    };
    
    certifications: [
      "KATRI 자동차안전연구원 인증",
      "자율주행 임시운행허가",
      "자동차부품 품질인증 (IATF 16949)"
    ];
    
    benchmarks: {
      avgRnDCost: "매출의 8-12%",
      typicalProjectDuration: "24-36개월",
      mainCustomers: ["현대자동차", "기아", "글로벌 OEM"]
    };
  };
  
  // 지원사업 매핑
  supportedPrograms: {
    aiVoucher: true,
    smartFactory: true,
    tips: true,
    export: true,
    
    specificPrograms: [
      "미래차 부품기업 혁신성장 지원",
      "자율주행 기술개발 혁신사업",
      "자동차부품 스마트공장 구축"
    ]
  };
  
  // 문서 템플릿
  templates: [
    "자율주행 기술개발 사업계획서",
    "ADAS 솔루션 기술 제안서",
    "자동차부품 품질관리 보고서",
    "기능안전 분석 보고서 (ISO 26262)"
  ];
  
  // 가격
  pricing: {
    includedInTiers: ["pro", "team", "enterprise"],
    standalonePrice: null
  };
}
```

#### 2. SEMICONDUCTOR (반도체)

```typescript
interface SemiconductorBlock {
  id: "SEMICONDUCTOR";
  name: "Semiconductor";
  nameKo: "반도체";
  category: "manufacturing";
  
  knowledgeBase: {
    regulations: [
      "반도체 산업 특별법",
      "국가첨단전략산업 특별조치법",
      "반도체 클린룸 규격 (ISO 14644)",
      "ESD 방지 규격 (ANSI/ESD S20.20)"
    ];
    
    terminology: {
      "Fab": "반도체 제조 공장",
      "Fabless": "설계 전문 기업",
      "Foundry": "위탁생산 기업",
      "NPU": "신경망처리장치",
      "HBM": "고대역폭 메모리",
      "EUV": "극자외선 리소그래피",
      "TSV": "실리콘관통전극"
    };
    
    processNodes: [
      "7nm", "5nm", "3nm", "2nm GAA"
    ];
    
    benchmarks: {
      avgRnDCost: "매출의 15-20%",
      fabConstructionCost: "20-30조원 (첨단 Fab)",
      leadTime: "제품 개발 18-24개월"
    };
  };
  
  supportedPrograms: {
    aiVoucher: true,
    smartFactory: true,
    tips: true,
    export: true,
    
    specificPrograms: [
      "반도체 특성화대학원 연계 지원",
      "시스템반도체 설계 지원",
      "AI 반도체 혁신 생태계 조성"
    ]
  };
  
  templates: [
    "AI 반도체 기술개발 사업계획서",
    "팹리스 창업 지원 신청서",
    "반도체 장비 국산화 제안서",
    "클린룸 구축 계획서"
  ];
  
  pricing: {
    includedInTiers: ["pro", "team", "enterprise"],
    standalonePrice: null
  };
}
```

#### 3. BIO_PHARMA (바이오/제약)

```typescript
interface BioPharmaBlock {
  id: "BIO_PHARMA";
  name: "Bio/Pharma";
  nameKo: "바이오/제약";
  category: "bio";
  
  knowledgeBase: {
    regulations: [
      "약사법",
      "의약품 등의 안전에 관한 규칙",
      "생물학적제제 등의 품목허가·심사 규정",
      "GMP (제조 및 품질관리 기준)",
      "GLP (비임상시험관리기준)",
      "GCP (임상시험관리기준)",
      "ICH 가이드라인"
    ];
    
    terminology: {
      "IND": "임상시험계획 승인",
      "NDA": "신약허가신청",
      "BLA": "생물학적제제 허가신청",
      "CMC": "화학, 제조 및 관리",
      "PK/PD": "약동학/약력학",
      "CAPA": "시정 및 예방 조치",
      "DMF": "의약품 마스터파일"
    };
    
    clinicalPhases: [
      "전임상 (Preclinical)",
      "Phase I (안전성)",
      "Phase II (유효성 탐색)",
      "Phase III (확증)",
      "허가 신청 (NDA/BLA)"
    ];
    
    benchmarks: {
      avgDevelopmentTime: "10-15년",
      avgDevelopmentCost: "1-2조원",
      successRate: "전임상→허가 약 10%"
    };
  };
  
  supportedPrograms: {
    aiVoucher: true,
    smartFactory: false,  // 제조업 특화 아님
    tips: true,
    export: true,
    
    specificPrograms: [
      "바이오 빅데이터 구축 사업",
      "신약개발 지원센터",
      "바이오 규제과학 지원"
    ]
  };
  
  templates: [
    "신약 후보물질 개발 사업계획서",
    "임상시험 계획서 (IND)",
    "GMP 인증 신청서",
    "바이오시밀러 개발 제안서"
  ];
  
  pricing: {
    includedInTiers: ["pro", "team", "enterprise"],
    standalonePrice: null
  };
}
```

#### 4. ENVIRONMENT (환경)

```typescript
interface EnvironmentBlock {
  id: "ENVIRONMENT";
  name: "Environment";
  nameKo: "환경";
  category: "energy";
  
  knowledgeBase: {
    regulations: [
      "환경정책기본법",
      "대기환경보전법",
      "물환경보전법",
      "폐기물관리법",
      "온실가스 배출권의 할당 및 거래에 관한 법률",
      "환경영향평가법",
      "굴뚝 자동측정기기 관리 등에 관한 규정 (TMS)"
    ];
    
    terminology: {
      "TMS": "굴뚝자동측정시스템 (Tele-Monitoring System)",
      "NOx": "질소산화물",
      "SOx": "황산화물",
      "PM": "미세먼지 (Particulate Matter)",
      "VOC": "휘발성유기화합물",
      "COD": "화학적산소요구량",
      "BOD": "생물학적산소요구량",
      "ETS": "배출권거래제"
    };
    
    emissionStandards: {
      "NOx": "40ppm (일반 사업장)",
      "SOx": "35ppm",
      "PM": "20mg/m³",
      "VOC": "시설별 상이"
    };
    
    benchmarks: {
      tmsDataFrequency: "30분 단위",
      reportingPeriod: "월간/분기/연간",
      penaltyForViolation: "과징금 + 개선명령"
    };
  };
  
  supportedPrograms: {
    aiVoucher: true,
    smartFactory: true,
    tips: true,
    export: true,
    
    specificPrograms: [
      "환경오염방지시설 설치 지원",
      "탄소중립 기업 전환 지원",
      "환경산업 수출지원"
    ]
  };
  
  templates: [
    "TMS 월간 보고서",
    "대기배출시설 설치허가 신청서",
    "환경영향평가서",
    "온실가스 감축 실적 보고서"
  ];
  
  pricing: {
    includedInTiers: ["pro", "team", "enterprise"],
    standalonePrice: null
  };
}
```

#### 5. DIGITAL (SW/AI/클라우드)

```typescript
interface DigitalBlock {
  id: "DIGITAL";
  name: "Digital";
  nameKo: "SW/AI/클라우드";
  category: "tech";
  
  knowledgeBase: {
    regulations: [
      "소프트웨어 진흥법",
      "인공지능 산업 육성 및 신뢰 기반 조성 등에 관한 법률",
      "클라우드컴퓨팅 발전 및 이용자 보호에 관한 법률",
      "개인정보 보호법",
      "정보통신망법"
    ];
    
    terminology: {
      "LLM": "대규모 언어모델",
      "RAG": "검색 증강 생성",
      "MLOps": "머신러닝 운영",
      "SaaS": "서비스형 소프트웨어",
      "IaaS": "서비스형 인프라",
      "CI/CD": "지속적 통합/배포"
    };
    
    certifications: [
      "클라우드 서비스 보안인증 (CSAP)",
      "ISO 27001 (정보보안)",
      "ISO 27701 (개인정보)",
      "AI 품질인증"
    ];
    
    benchmarks: {
      avgProjectDuration: "6-12개월",
      typicalTeamSize: "5-15명",
      techStack: ["Python", "TypeScript", "React", "AWS/GCP/Azure"]
    };
  };
  
  supportedPrograms: {
    aiVoucher: true,
    smartFactory: false,
    tips: true,
    export: true,
    
    specificPrograms: [
      "AI 바우처 지원사업",
      "클라우드 컴퓨팅 서비스 활용 지원",
      "SW 마에스트로",
      "AI 학습용 데이터 구축"
    ]
  };
  
  templates: [
    "AI 솔루션 개발 사업계획서",
    "클라우드 전환 제안서",
    "SW개발 과제 신청서",
    "AI 서비스 기술 제안서"
  ];
  
  pricing: {
    includedInTiers: ["free", "pro", "team", "enterprise"],  // FREE에서도 제공
    standalonePrice: null
  };
}
```

#### 6-12. 나머지 BLOCK (요약)

```typescript
const REMAINING_BLOCKS = {
  ELECTRONICS: {
    nameKo: "전자부품",
    focus: "PCB, 디스플레이, 센서, EMC 인증",
    keyPrograms: ["전자부품 산업기술개발", "스마트센서 개발"]
  },
  
  MACHINERY: {
    nameKo: "산업기계",
    focus: "공작기계, 로봇, 자동화 설비",
    keyPrograms: ["스마트공장 구축", "뿌리산업 고도화"]
  },
  
  HEALTHCARE: {
    nameKo: "의료기기/디지털헬스",
    focus: "의료기기 인허가, 디지털치료제, SaMD",
    keyPrograms: ["의료기기 산업지원", "디지털헬스 실증"]
  },
  
  ENERGY: {
    nameKo: "에너지/신재생",
    focus: "태양광, 풍력, ESS, 수소",
    keyPrograms: ["신재생에너지 기술개발", "에너지 신산업 창업"]
  },
  
  CHEMICAL: {
    nameKo: "화학/소재",
    focus: "화학물질 규제, MSDS, 소재 인증",
    keyPrograms: ["소재부품장비 기술개발", "화학산업 혁신"]
  },
  
  AUTONOMOUS: {
    nameKo: "로봇/드론/자율시스템",
    focus: "로봇 인증, 드론 비행허가, 자율시스템",
    keyPrograms: ["로봇산업 혁신", "드론산업 육성"]
  },
  
  MANUFACTURING: {
    nameKo: "일반 제조/품질관리",
    focus: "ISO 9001, 품질관리, 공정개선",
    keyPrograms: ["제조혁신 바우처", "생산성향상 지원"]
  }
};
```

---

## BLOCK 데이터 모델

### 전체 BLOCK 인터페이스

```typescript
interface IndustryBlock {
  // 식별자
  id: string;                           // "AUTOMOTIVE"
  name: string;                         // "Automotive"
  nameKo: string;                       // "자동차/자율주행"
  category: BlockCategory;              // "manufacturing" | "bio" | "energy" | "tech"
  
  // 메타데이터
  metadata: {
    version: string;                    // "2.1.0"
    lastUpdated: Date;
    totalDocumentsGenerated: number;    // 이 BLOCK으로 생성된 문서 수
    avgAccuracyScore: number;           // 0-100
    avgTimeSavedMinutes: number;        // 평균 절약 시간
    activeUsers: number;                // 활성 사용자 수
  };
  
  // 지식 베이스
  knowledgeBase: {
    regulations: Regulation[];          // 관련 규정/법률
    terminology: Map<string, string>;   // 전문 용어 사전
    certifications: Certification[];    // 필요 인증 목록
    benchmarks: IndustryBenchmark;      // 산업 벤치마크 데이터
    examples: SuccessExample[];         // 성공 사례
    faqs: FAQ[];                        // 자주 묻는 질문
  };
  
  // 문서 템플릿
  templates: {
    list: DocumentTemplate[];           // 템플릿 목록
    categories: TemplateCategory[];     // 템플릿 카테고리
  };
  
  // 지원사업 매핑
  supportedPrograms: {
    aiVoucher: boolean;
    smartFactory: boolean;
    tips: boolean;
    export: boolean;
    specificPrograms: ProgramMapping[]; // 산업 특화 지원사업
  };
  
  // 품질 규칙
  qualityRules: {
    requiredSections: string[];         // 필수 포함 섹션
    prohibitedTerms: string[];          // 금지 용어
    formatRules: FormatRule[];          // 포맷 규칙
    validationChecks: ValidationCheck[];// 검증 체크
  };
  
  // 가격 정책
  pricing: {
    includedInTiers: PricingTier[];
    standalonePrice: number | null;
  };
}
```

### Company BLOCK (기업별 메모리)

```typescript
interface CompanyBlock {
  // 식별자
  companyId: string;
  blockId: string;                      // 연결된 산업 BLOCK
  
  // 기본 정보 (명시적 입력)
  profile: {
    name: string;                       // "(주)ABC"
    businessNumber: string;             // "123-45-67890"
    industry: string;                   // "반도체 설계"
    size: CompanySize;                  // "startup" | "small" | "medium" | "large"
    foundedYear: number;
    employees: number;
    annualRevenue: number;              // 억원 단위
    location: string;
    
    // 핵심 역량
    coreCompetencies: string[];         // ["AI 반도체 설계", "저전력 NPU"]
    mainProducts: string[];             // ["DX-1 NPU", "DX-2 NPU"]
    targetMarkets: string[];            // ["에지 디바이스", "스마트홈"]
  };
  
  // 학습된 정보 (AI가 추출)
  learnedData: {
    // 문서 스타일
    writingStyle: {
      tone: "formal" | "semi-formal" | "casual";
      avgSentenceLength: number;
      preferredTerms: Map<string, string>;  // 선호 용어
      avoidedTerms: string[];               // 기피 용어
    };
    
    // 성공 패턴
    successPatterns: {
      programs: ProgramSuccess[];           // 지원사업별 성공률
      winningDocTraits: {
        avgLength: number;
        keyPhrases: string[];
        structurePattern: string;
      };
    };
    
    // 자주 쓰는 데이터
    frequentlyUsed: {
      techStack: string[];
      certifications: string[];
      patents: Patent[];
      keyPersonnel: KeyPerson[];
      facilities: Facility[];
      financials: FinancialSummary;
    };
    
    // 과거 문서 요약
    documentHistory: {
      totalGenerated: number;
      byProgram: Map<string, number>;
      recentDocs: DocumentSummary[];
    };
  };
  
  // 메모리 압축 (Mem0 패턴)
  compressedMemory: {
    summary: string;                    // 압축된 회사 요약 (500자 이내)
    keyFacts: CompressedFact[];         // 핵심 팩트 (최대 50개)
    lastCompressed: Date;
    compressionRatio: number;           // 압축률
    originalTokenCount: number;
    compressedTokenCount: number;
  };
  
  // 신뢰도 점수
  confidence: {
    profile: number;                    // 0-100
    learnedData: number;                // 0-100
    lastValidated: Date;
    validationHistory: ValidationRecord[];
  };
  
  // 최적화 설정
  optimization: {
    mode: "batch" | "realtime" | "hybrid";
    lastOptimizedAt: Date;
    schedule: "daily" | "weekly";
    nextScheduledAt: Date;
  };
}
```

---

## BLOCK 연동 로직

### BLOCK 선택 로직

```typescript
async function selectBlocks(
  companyProfile: CompanyProfile,
  subscriptionTier: PricingTier
): Promise<IndustryBlock[]> {
  
  // 1. 티어별 BLOCK 개수 제한
  const blockLimit = {
    free: 1,
    pro: 3,
    team: 12,      // 전체
    enterprise: 12 // 전체 + 커스텀
  }[subscriptionTier];
  
  // 2. 회사 산업 기반 추천
  const recommendedBlocks = await recommendBlocksForCompany(companyProfile);
  
  // 3. 사용자가 선택한 BLOCK 반환
  return recommendedBlocks.slice(0, blockLimit);
}

async function recommendBlocksForCompany(
  profile: CompanyProfile
): Promise<IndustryBlock[]> {
  
  // 회사 산업 분석
  const industryKeywords = extractKeywords(profile.industry);
  
  // 키워드 매칭으로 관련 BLOCK 찾기
  const matchedBlocks = INDUSTRY_BLOCKS.map(block => ({
    block,
    relevanceScore: calculateRelevance(block, industryKeywords)
  }));
  
  // 관련도 순 정렬
  return matchedBlocks
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map(m => m.block);
}
```

### BLOCK 기반 문서 생성

```typescript
async function generateDocument(
  request: DocumentRequest,
  companyBlock: CompanyBlock,
  industryBlock: IndustryBlock
): Promise<GeneratedDocument> {
  
  // 1. 컨텍스트 구성
  const context = buildContext(companyBlock, industryBlock, request);
  
  // 2. 템플릿 선택
  const template = selectTemplate(industryBlock, request.programType);
  
  // 3. 프롬프트 구성
  const prompt = buildPrompt({
    companyInfo: companyBlock.compressedMemory.summary,
    keyFacts: companyBlock.compressedMemory.keyFacts,
    regulations: industryBlock.knowledgeBase.regulations,
    template: template,
    userRequest: request.content
  });
  
  // 4. AI 생성
  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8000,
    system: buildSystemPrompt(industryBlock),
    messages: [{ role: "user", content: prompt }]
  });
  
  // 5. 품질 검증
  const validation = await validateDocument(
    response.content,
    industryBlock.qualityRules
  );
  
  // 6. 결과 반환
  return {
    content: response.content,
    validation,
    metadata: {
      blocksUsed: [industryBlock.id],
      tokensUsed: response.usage.total_tokens,
      generatedAt: new Date()
    }
  };
}
```

---

## 메모리 압축 엔진

### Mem0 패턴 적용

QETTA는 Mem0의 메모리 압축 패턴을 적용하여 토큰 효율을 80% 개선합니다.

```typescript
interface MemoryCompressor {
  // 압축 실행
  async compress(memories: Memory[]): Promise<CompressedMemory> {
    // 1. 중복 제거 (Deduplication)
    const deduplicated = this.removeDuplicates(memories);
    
    // 2. 요약 (Summarization)
    const summarized = await this.summarize(deduplicated);
    
    // 3. 관련성 점수화 (Relevance Scoring)
    const scored = this.scoreByRelevance(summarized);
    
    // 4. 망각 곡선 적용 (Forgetting Curve)
    const pruned = this.applyForgettingCurve(scored);
    
    return {
      summary: pruned.summary,
      keyFacts: pruned.facts,
      compressionRatio: memories.length / pruned.facts.length
    };
  };
  
  // 압축 전략
  strategies: {
    deduplication: {
      enabled: true,
      similarityThreshold: 0.85  // 85% 이상 유사하면 중복
    };
    
    summarization: {
      enabled: true,
      maxSummaryLength: 500,     // 500자 이내
      preserveKeyFacts: true
    };
    
    relevanceScoring: {
      enabled: true,
      factors: ["recency", "frequency", "importance"],
      weights: [0.3, 0.3, 0.4]
    };
    
    forgettingCurve: {
      enabled: true,
      halfLifeDays: 30,          // 30일 반감기
      minRetentionScore: 0.2
    };
  };
}

// 압축 예시
const compressionExample = {
  before: {
    content: [
      "2026-01-15 TMS 보고서 생성, NOx 45ppm, SOx 32ppm, PM 15mg/m³",
      "2026-01-16 TMS 보고서 생성, NOx 42ppm, SOx 30ppm, PM 14mg/m³",
      "2026-01-17 TMS 보고서 생성, NOx 48ppm, SOx 35ppm, PM 16mg/m³",
      // ... (100건)
    ],
    tokenCount: 4000
  },
  
  after: {
    content: "환경팀 TMS 현황: 일평균 NOx 45ppm(기준 40ppm 초과 주의), SOx 32ppm(적합), PM 15mg/m³(적합). 최근 추세 안정적이나 NOx 모니터링 필요.",
    tokenCount: 800,
    compressionRatio: 0.80  // 80% 절감
  }
};
```

---

## 일일 최적화 엔진

### Daily BLOCK Optimization

```typescript
interface DailyOptimizationEngine {
  schedule: "01:00";  // 매일 새벽 1시 실행
  
  tasks: OptimizationTask[];
}

const OPTIMIZATION_TASKS: OptimizationTask[] = [
  {
    name: "analyzeNewDocuments",
    description: "오늘 생성된 문서 분석",
    action: async (companyBlock) => {
      const todayDocs = await getDocumentsCreatedToday(companyBlock.companyId);
      const patterns = extractPatterns(todayDocs);
      return patterns;
    }
  },
  
  {
    name: "learnFromCorrections",
    description: "사용자 수정 사항 학습",
    action: async (companyBlock) => {
      const corrections = await getCorrectionsToday(companyBlock.companyId);
      const learnings = analyzeLearnings(corrections);
      return learnings;
    }
  },
  
  {
    name: "discoverNewPatterns",
    description: "새로운 패턴 발견",
    action: async (companyBlock, newData) => {
      const existingPatterns = companyBlock.learnedData.successPatterns;
      const newPatterns = findNewPatterns(newData, existingPatterns);
      return newPatterns;
    }
  },
  
  {
    name: "compressMemory",
    description: "메모리 압축",
    action: async (companyBlock) => {
      const compressor = new MemoryCompressor();
      const compressed = await compressor.compress(companyBlock.learnedData);
      return compressed;
    }
  },
  
  {
    name: "pruneStaleData",
    description: "오래된 정보 정리",
    action: async (companyBlock) => {
      const staleData = findStaleData(companyBlock, { maxAge: 90 }); // 90일
      const pruned = removeStaleData(companyBlock, staleData);
      return pruned;
    }
  },
  
  {
    name: "updateConfidenceScores",
    description: "신뢰도 점수 업데이트",
    action: async (companyBlock) => {
      const newScores = recalculateConfidence(companyBlock);
      return newScores;
    }
  }
];
```

### 하이브리드 최적화 (실시간 + 배치)

```typescript
interface HybridOptimizationConfig {
  mode: "hybrid";
  
  // 실시간 업데이트 트리거
  realtimeTriggers: {
    // 사용자가 직접 수정한 경우
    userExplicitCorrection: {
      enabled: true,
      action: "immediate_learn"
    };
    
    // 심각한 오류 발견
    criticalError: {
      enabled: true,
      action: "immediate_alert_and_learn"
    };
    
    // 규정 변경
    regulationChange: {
      enabled: true,
      action: "immediate_update_knowledge"
    };
  };
  
  // 배치 업데이트 (기본)
  batchUpdates: {
    schedule: "daily",
    time: "01:00",
    tasks: OPTIMIZATION_TASKS
  };
}
```

---

## BLOCK 마켓플레이스

### UI 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│  BLOCK 마켓플레이스                                    [검색...]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  내 BLOCK (3/3)                                      [관리하기]     │
│  ─────────────────────────────────────────────────────────────────  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │SEMICONDUCTOR│  │ENVIRONMENT│  │ DIGITAL │                        │
│  │   반도체   │  │   환경    │  │SW/AI/클라우드│                       │
│  │  ✓ 활성   │  │  ✓ 활성   │  │  ✓ 활성   │                        │
│  └──────────┘  └──────────┘  └──────────┘                          │
│                                                                     │
│  추가 가능한 BLOCK                                   [TEAM 업그레이드]│
│  ─────────────────────────────────────────────────────────────────  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │AUTOMOTIVE │  │BIO_PHARMA │  │ ENERGY   │  │ CHEMICAL │           │
│  │자동차/자율│  │바이오/제약│  │에너지/신재생│  │ 화학/소재 │           │
│  │  🔒 TEAM │  │  🔒 TEAM │  │  🔒 TEAM │  │  🔒 TEAM │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ...      │
│  │ELECTRONICS│  │ MACHINERY │  │HEALTHCARE │  │AUTONOMOUS │           │
│  │  전자부품 │  │ 산업기계  │  │의료기기/DH│  │로봇/드론  │           │
│  │  🔒 TEAM │  │  🔒 TEAM │  │  🔒 TEAM │  │  🔒 TEAM │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
