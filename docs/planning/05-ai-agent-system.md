# QETTA AI Agent 시스템 v2.0

## 개요

QETTA AI Agent는 Linear의 AI Agent 철학을 적용한 **"팀원처럼 협업하는 AI"**입니다. 단순한 도구가 아니라, 문서 작성 과정에서 실제 동료처럼 작업을 위임받고, 피드백을 주고받으며, 최종 결과물을 함께 만들어갑니다.

### Linear AI 철학 적용

Linear의 AI 핵심 철학 네 가지를 QETTA에 적용합니다.

첫째, **AI는 도구가 아닌 팀원**입니다. @QETTA_AI로 멘션하면 응답하고, 문서를 할당하면 작업을 수행합니다.

둘째, **투명성**입니다. AI가 왜 그런 결정을 했는지 항상 설명합니다. "이 섹션에 특허 목록을 추가했습니다. 이유: AI바우처 심사에서 기술력 입증 항목에 가점이 있기 때문입니다."

셋째, **제어권 유지**입니다. 사람이 항상 최종 결정권을 가집니다. AI가 작성해도 승인 전까지 반영되지 않습니다.

넷째, **점진적 자동화**입니다. 처음에는 추천만 하고, 신뢰가 쌓이면 자동 적용으로 전환합니다.

---

## Agent 아키텍처

### Agent 정의

```typescript
interface QettaAgent {
  id: "agent_qetta_ai";
  name: "QETTA_AI";
  displayName: "QETTA AI";
  avatar: "/assets/qetta-ai-avatar.svg";
  
  // Agent 유형
  types: AgentType[];
  
  // 상태
  status: "active" | "suspended" | "maintenance";
  
  // 능력
  capabilities: AgentCapability[];
  
  // 지침 (Agent Guidance)
  guidance: AgentGuidance;
}

type AgentType = 
  | "document_generator"    // 문서 생성
  | "validator"             // 검증
  | "translator"            // 번역
  | "analyzer"              // 분석
  | "triage_intelligence";  // 자동 분류

interface AgentCapability {
  name: string;
  description: string;
  triggerMethod: "assignment" | "mention" | "auto";
  requiredBlock: IndustryBlock | null;
  creditCost: number;
}
```

### Agent 능력 목록

```typescript
const AGENT_CAPABILITIES: AgentCapability[] = [
  // 문서 생성 관련
  {
    name: "document_generation",
    description: "지원사업 문서 자동 생성",
    triggerMethod: "assignment",
    requiredBlock: null,  // 모든 BLOCK에서 사용 가능
    creditCost: 0
  },
  {
    name: "section_writing",
    description: "특정 섹션만 작성",
    triggerMethod: "mention",  // @QETTA_AI 사업개요 작성해줘
    requiredBlock: null,
    creditCost: 0
  },
  {
    name: "content_expansion",
    description: "기존 내용 확장/상세화",
    triggerMethod: "mention",
    requiredBlock: null,
    creditCost: 0
  },
  
  // 검증 관련
  {
    name: "hash_verification",
    description: "SHA-256 해시 검증",
    triggerMethod: "auto",
    requiredBlock: null,
    creditCost: 0
  },
  {
    name: "compliance_check",
    description: "규정 준수 여부 검사",
    triggerMethod: "auto",
    requiredBlock: null,
    creditCost: 0
  },
  {
    name: "quality_review",
    description: "문서 품질 검토",
    triggerMethod: "assignment",
    requiredBlock: null,
    creditCost: 0
  },
  
  // 분류 관련 (Triage Intelligence)
  {
    name: "category_suggestion",
    description: "카테고리/BLOCK 자동 추천",
    triggerMethod: "auto",
    requiredBlock: null,
    creditCost: 0
  },
  {
    name: "duplicate_detection",
    description: "중복 문서 감지",
    triggerMethod: "auto",
    requiredBlock: null,
    creditCost: 0
  },
  {
    name: "priority_suggestion",
    description: "우선순위 추천",
    triggerMethod: "auto",
    requiredBlock: null,
    creditCost: 0
  },
  
  // EXPORT 관련 (크레딧 소모)
  {
    name: "export_translation",
    description: "영문 번역",
    triggerMethod: "assignment",
    requiredBlock: null,
    creditCost: 2  // 페이지당
  },
  {
    name: "export_localization",
    description: "현지화 (SAM.gov/UNGM 형식)",
    triggerMethod: "assignment",
    requiredBlock: null,
    creditCost: 5  // 기본
  }
];
```

---

## Agent Guidance (지침 시스템)

### 지침 구조

Agent는 워크스페이스 및 팀 레벨의 지침을 따릅니다.

```typescript
interface AgentGuidance {
  level: "workspace" | "team" | "project";
  teamId?: string;
  projectId?: string;
  
  // 지침 내용 (Markdown)
  instructions: string;
  
  // 메타데이터
  metadata: {
    updatedAt: Date;
    updatedBy: User;
    version: number;
  };
}

// 기본 워크스페이스 지침 예시
const DEFAULT_WORKSPACE_GUIDANCE = `
## QETTA AI 지침

### 문서 생성 규칙
- 모든 문서는 공식적인 어조로 작성
- 수치 데이터는 출처 명시
- 약어 첫 등장 시 풀네임 병기

### BLOCK별 규칙
- ENVIRONMENT: TMS 데이터는 30분 단위, 환경부 양식 준수
- SEMICONDUCTOR: 반도체 공정 용어는 영문 병기
- DIGITAL: 기술 스택은 구체적으로 명시

### 검증 규칙
- 모든 문서는 SHA-256 해시 생성
- 제출 전 필수 항목 체크리스트 확인
- 외부 데이터 인용 시 출처 URL 포함

### 금지 사항
- 확인되지 않은 실적 기재 금지
- 경쟁사 비방 내용 금지
- 민감한 기술 정보 무단 공개 금지
`;
```

### 지침 적용 로직

```typescript
async function applyGuidance(
  agentAction: AgentAction,
  context: ActionContext
): Promise<GuidedAction> {
  
  // 1. 지침 수집 (우선순위: 프로젝트 > 팀 > 워크스페이스)
  const guidance = await collectGuidance(context);
  
  // 2. 지침 파싱
  const parsedRules = parseGuidanceRules(guidance);
  
  // 3. 액션에 규칙 적용
  const guidedAction = {
    ...agentAction,
    rules: parsedRules,
    constraints: extractConstraints(parsedRules),
    examples: extractExamples(parsedRules)
  };
  
  return guidedAction;
}

function collectGuidance(context: ActionContext): AgentGuidance[] {
  const guidances: AgentGuidance[] = [];
  
  // 워크스페이스 레벨
  if (context.workspaceGuidance) {
    guidances.push(context.workspaceGuidance);
  }
  
  // 팀 레벨 (있으면 오버라이드)
  if (context.teamGuidance) {
    guidances.push(context.teamGuidance);
  }
  
  // 프로젝트 레벨 (있으면 오버라이드)
  if (context.projectGuidance) {
    guidances.push(context.projectGuidance);
  }
  
  return guidances;
}
```

---

## 문서 생성 파이프라인

### 전체 파이프라인

```
┌─────────────────────────────────────────────────────────────────────┐
│                    문서 생성 파이프라인                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 요청 수신                                                       │
│     └─ 사용자가 문서 생성 요청 또는 @QETTA_AI 멘션                   │
│                │                                                    │
│                ▼                                                    │
│  2. 컨텍스트 수집                                                   │
│     ├─ Company BLOCK (회사 정보, 과거 문서)                         │
│     ├─ Industry BLOCK (산업 지식, 규정)                             │
│     ├─ Program Info (지원사업 정보)                                 │
│     └─ Agent Guidance (지침)                                        │
│                │                                                    │
│                ▼                                                    │
│  3. 메모리 압축                                                     │
│     └─ Mem0 패턴으로 토큰 80% 절감                                  │
│                │                                                    │
│                ▼                                                    │
│  4. 템플릿 선택                                                     │
│     └─ 지원사업 유형에 맞는 템플릿 매칭                             │
│                │                                                    │
│                ▼                                                    │
│  5. 프롬프트 구성                                                   │
│     ├─ System Prompt (역할, 규칙)                                   │
│     ├─ Context Prompt (회사 정보, 산업 지식)                        │
│     └─ Task Prompt (구체적 작업 지시)                               │
│                │                                                    │
│                ▼                                                    │
│  6. AI 생성                                                         │
│     └─ Claude Sonnet 4.5로 문서 생성                                │
│                │                                                    │
│                ▼                                                    │
│  7. 품질 검증                                                       │
│     ├─ 완성도 체크 (필수 섹션)                                      │
│     ├─ 정확도 체크 (팩트 검증)                                      │
│     ├─ 규정 준수 체크                                               │
│     └─ 포맷 체크                                                    │
│                │                                                    │
│                ▼                                                    │
│  8. 사용자 리뷰 요청                                                │
│     └─ 신뢰도 점수와 함께 결과 전달                                 │
│                │                                                    │
│                ▼                                                    │
│  9. 피드백 학습                                                     │
│     └─ 수정 사항을 Company BLOCK에 저장                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 단계별 상세 구현

#### 1단계: 요청 수신

```typescript
interface DocumentGenerationRequest {
  // 요청 유형
  type: "full_document" | "section" | "expansion" | "revision";
  
  // 요청 내용
  content: {
    programType: string;           // "ai_voucher"
    documentType: string;          // "business_plan"
    specificInstructions?: string; // "수상 이력 포함해줘"
  };
  
  // 컨텍스트
  context: {
    companyId: string;
    blockIds: string[];
    projectId?: string;
  };
  
  // 트리거 방식
  trigger: {
    method: "assignment" | "mention" | "button_click";
    actor: User;
    timestamp: Date;
  };
}
```

#### 2단계: 컨텍스트 수집

```typescript
async function gatherContext(
  request: DocumentGenerationRequest
): Promise<GenerationContext> {
  
  // Company BLOCK 로드
  const companyBlock = await loadCompanyBlock(request.context.companyId);
  
  // Industry BLOCK(s) 로드
  const industryBlocks = await Promise.all(
    request.context.blockIds.map(id => loadIndustryBlock(id))
  );
  
  // 지원사업 정보 로드
  const programInfo = await loadProgramInfo(request.content.programType);
  
  // 관련 과거 문서 로드
  const relevantDocs = await findRelevantPastDocuments(
    request.context.companyId,
    request.content.documentType,
    { limit: 5 }
  );
  
  // Agent Guidance 로드
  const guidance = await loadGuidance(request.context);
  
  return {
    company: companyBlock,
    industries: industryBlocks,
    program: programInfo,
    pastDocuments: relevantDocs,
    guidance
  };
}
```

#### 3단계: 메모리 압축

```typescript
async function compressContext(
  context: GenerationContext
): Promise<CompressedContext> {
  
  const compressor = new MemoryCompressor();
  
  // 회사 정보 압축
  const compressedCompany = await compressor.compress({
    source: context.company,
    strategy: "summarization",
    maxTokens: 500
  });
  
  // 과거 문서 압축
  const compressedDocs = await compressor.compress({
    source: context.pastDocuments,
    strategy: "extractKeyPatterns",
    maxTokens: 300
  });
  
  // 산업 지식 압축 (관련 부분만)
  const compressedIndustry = await compressor.compress({
    source: context.industries,
    strategy: "filterByRelevance",
    query: context.program.type,
    maxTokens: 400
  });
  
  // 압축 결과
  return {
    company: compressedCompany,
    pastDocs: compressedDocs,
    industry: compressedIndustry,
    totalTokens: compressedCompany.tokens + compressedDocs.tokens + compressedIndustry.tokens,
    compressionRatio: calculateRatio(context, {
      company: compressedCompany,
      pastDocs: compressedDocs,
      industry: compressedIndustry
    })
  };
}
```

#### 4단계: 템플릿 선택

```typescript
async function selectTemplate(
  programType: string,
  documentType: string,
  industryBlocks: IndustryBlock[]
): Promise<DocumentTemplate> {
  
  // 프로그램 유형에 맞는 템플릿 필터
  const programTemplates = await getTemplatesForProgram(programType);
  
  // 문서 유형으로 필터
  const typeMatched = programTemplates.filter(t => 
    t.documentType === documentType
  );
  
  // 산업 BLOCK 호환성 체크
  const blockCompatible = typeMatched.filter(t =>
    t.compatibleBlocks.some(b => 
      industryBlocks.map(ib => ib.id).includes(b)
    )
  );
  
  // 가장 적합한 템플릿 선택
  const selected = blockCompatible[0] || typeMatched[0] || programTemplates[0];
  
  return selected;
}

interface DocumentTemplate {
  id: string;
  name: string;
  programType: string;
  documentType: string;
  compatibleBlocks: string[];
  
  // 구조
  structure: {
    sections: TemplateSection[];
    requiredFields: string[];
    optionalFields: string[];
  };
  
  // 스타일 가이드
  styleGuide: {
    tone: "formal" | "semi-formal";
    maxLength: number;
    formatting: FormattingRules;
  };
}
```

#### 5단계: 프롬프트 구성

```typescript
function buildPrompt(
  template: DocumentTemplate,
  compressedContext: CompressedContext,
  guidance: AgentGuidance,
  specificInstructions?: string
): PromptSet {
  
  // System Prompt
  const systemPrompt = `
당신은 QETTA AI입니다. 정부지원사업 문서 작성 전문 AI로서, 
기업의 사업계획서, 기술제안서 등을 작성합니다.

## 역할
- ${template.programType} 지원사업 ${template.documentType} 작성
- 기업 정보를 바탕으로 맞춤형 문서 생성
- 지원사업 심사 기준에 맞는 구조와 내용 구성

## 규칙
${guidance.instructions}

## 문서 구조
${JSON.stringify(template.structure.sections, null, 2)}

## 스타일
- 어조: ${template.styleGuide.tone}
- 최대 길이: ${template.styleGuide.maxLength}자
`;

  // Context Prompt
  const contextPrompt = `
## 기업 정보
${compressedContext.company.summary}

## 핵심 사실
${compressedContext.company.keyFacts.map(f => `- ${f}`).join('\n')}

## 과거 성공 패턴
${compressedContext.pastDocs.summary}

## 관련 산업 지식
${compressedContext.industry.summary}
`;

  // Task Prompt
  const taskPrompt = `
## 작성 요청
${template.name}을 작성해주세요.

${specificInstructions ? `## 추가 지시사항\n${specificInstructions}` : ''}

## 출력 형식
각 섹션별로 작성하고, 완료된 섹션은 [COMPLETE] 태그를 붙여주세요.
불확실한 정보는 [NEEDS_REVIEW] 태그를 붙여주세요.
`;

  return {
    system: systemPrompt,
    context: contextPrompt,
    task: taskPrompt
  };
}
```

#### 6단계: AI 생성

```typescript
async function generateDocument(
  promptSet: PromptSet
): Promise<GeneratedDocument> {
  
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8000,
    system: promptSet.system,
    messages: [
      { 
        role: "user", 
        content: promptSet.context + "\n\n" + promptSet.task 
      }
    ]
  });
  
  // 응답 파싱
  const parsed = parseDocumentResponse(response.content[0].text);
  
  return {
    sections: parsed.sections,
    metadata: {
      model: "claude-sonnet-4-5-20250929",
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      generatedAt: new Date()
    },
    tags: {
      complete: parsed.completeTags,
      needsReview: parsed.needsReviewTags
    }
  };
}
```

#### 7단계: 품질 검증

```typescript
async function validateDocument(
  document: GeneratedDocument,
  template: DocumentTemplate,
  industryBlocks: IndustryBlock[]
): Promise<ValidationResult> {
  
  const checks: ValidationCheck[] = [];
  
  // 1. 완성도 체크
  const completenessCheck = checkCompleteness(
    document,
    template.structure.requiredFields
  );
  checks.push(completenessCheck);
  
  // 2. 정확도 체크 (팩트 검증)
  const accuracyCheck = await checkAccuracy(
    document,
    industryBlocks
  );
  checks.push(accuracyCheck);
  
  // 3. 규정 준수 체크
  const complianceCheck = checkCompliance(
    document,
    industryBlocks.flatMap(b => b.knowledgeBase.regulations)
  );
  checks.push(complianceCheck);
  
  // 4. 포맷 체크
  const formatCheck = checkFormat(
    document,
    template.styleGuide
  );
  checks.push(formatCheck);
  
  // 종합 점수 계산
  const overallScore = calculateOverallScore(checks);
  
  return {
    passed: overallScore >= 70,
    score: overallScore,
    checks,
    suggestions: generateSuggestions(checks)
  };
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  score: number;
  issues: ValidationIssue[];
}

interface ValidationIssue {
  severity: "error" | "warning" | "info";
  location: string;  // 섹션 또는 라인
  message: string;
  suggestion?: string;
}
```

#### 8단계: 사용자 리뷰 요청

```typescript
async function requestUserReview(
  document: GeneratedDocument,
  validation: ValidationResult
): Promise<ReviewRequest> {
  
  // 신뢰도 점수 계산
  const confidence = calculateConfidence(document, validation);
  
  // 리뷰 요청 생성
  const reviewRequest: ReviewRequest = {
    documentId: document.id,
    status: "waiting_review",
    
    // 문서 내용
    content: document.sections,
    
    // 검증 결과 요약
    validation: {
      score: validation.score,
      passedChecks: validation.checks.filter(c => c.passed).length,
      totalChecks: validation.checks.length,
      issues: validation.checks.flatMap(c => c.issues)
    },
    
    // AI 신뢰도
    confidence: {
      overall: confidence,
      bySection: calculateSectionConfidence(document)
    },
    
    // 추천 액션
    suggestedActions: generateActions(validation, confidence),
    
    // 메시지
    message: generateReviewMessage(confidence, validation)
  };
  
  // 알림 전송
  await sendNotification(reviewRequest);
  
  return reviewRequest;
}

function generateReviewMessage(
  confidence: number,
  validation: ValidationResult
): string {
  
  if (confidence >= 90 && validation.passed) {
    return "문서 생성이 완료되었습니다. 높은 신뢰도로 작성되었으니 검토 후 승인해주세요.";
  } else if (confidence >= 70) {
    return `문서 생성이 완료되었습니다. 일부 섹션(${validation.checks.filter(c => !c.passed).length}건)에 검토가 필요합니다.`;
  } else {
    return "문서 초안이 생성되었습니다. 추가 정보가 필요한 부분이 있어 검토가 필요합니다.";
  }
}
```

#### 9단계: 피드백 학습

```typescript
async function learnFromFeedback(
  documentId: string,
  feedback: UserFeedback
): Promise<void> {
  
  // 1. 수정 사항 분석
  const corrections = analyzeCorrections(feedback.changes);
  
  // 2. Company BLOCK 업데이트 (중요 수정만)
  if (corrections.some(c => c.importance === "high")) {
    const highImportance = corrections.filter(c => c.importance === "high");
    
    await updateCompanyBlock(feedback.companyId, {
      type: "correction_learning",
      corrections: highImportance,
      source: documentId
    });
  }
  
  // 3. 일일 최적화 큐에 추가
  await addToOptimizationQueue({
    companyId: feedback.companyId,
    documentId,
    corrections,
    timestamp: new Date()
  });
  
  // 4. 메트릭 기록
  await recordMetrics({
    documentId,
    originalConfidence: feedback.originalConfidence,
    correctionCount: corrections.length,
    correctionTypes: corrections.map(c => c.type)
  });
}

interface UserFeedback {
  documentId: string;
  companyId: string;
  originalConfidence: number;
  
  // 변경 사항
  changes: DocumentChange[];
  
  // 사용자 평가
  rating: number;  // 1-5
  comment?: string;
}

interface DocumentChange {
  section: string;
  original: string;
  modified: string;
  changeType: "addition" | "deletion" | "modification" | "rewrite";
}
```

---

## Triage Intelligence

Linear의 Triage Intelligence를 QETTA에 적용합니다. 새로운 문서 요청이 들어오면 AI가 자동으로 분석하여 적절한 BLOCK, 템플릿, 우선순위를 추천합니다.

### Triage 프로세스

```typescript
interface TriageProcess {
  // 트리거
  trigger: "new_document_request" | "upload" | "import";
  
  // 분석 항목
  analyses: [
    "block_suggestion",      // BLOCK 추천
    "template_suggestion",   // 템플릿 추천
    "priority_suggestion",   // 우선순위 추천
    "duplicate_detection",   // 중복 감지
    "assignee_suggestion"    // 담당자 추천
  ];
  
  // 자동화 레벨
  automationLevel: "suggest_only" | "auto_apply" | "hidden";
}

async function runTriage(
  request: DocumentRequest
): Promise<TriageResult> {
  
  // 1. BLOCK 추천
  const blockSuggestion = await suggestBlock(request);
  
  // 2. 템플릿 추천
  const templateSuggestion = await suggestTemplate(request, blockSuggestion.block);
  
  // 3. 중복 감지
  const duplicates = await detectDuplicates(request);
  
  // 4. 우선순위 추천
  const priority = await suggestPriority(request);
  
  // 5. 담당자 추천 (팀 플랜 이상)
  const assignee = await suggestAssignee(request);
  
  return {
    suggestions: {
      block: blockSuggestion,
      template: templateSuggestion,
      priority,
      assignee
    },
    warnings: {
      duplicates: duplicates.length > 0 ? duplicates : null
    },
    confidence: calculateTriageConfidence({
      blockSuggestion,
      templateSuggestion,
      priority
    })
  };
}
```

### BLOCK 추천 로직

```typescript
async function suggestBlock(
  request: DocumentRequest
): Promise<BlockSuggestion> {
  
  // 요청 내용 분석
  const keywords = extractKeywords(request.title + " " + request.description);
  
  // 각 BLOCK과의 관련도 계산
  const blockScores = INDUSTRY_BLOCKS.map(block => {
    const score = calculateBlockRelevance(block, keywords);
    return { block, score };
  });
  
  // 상위 3개 추천
  const topBlocks = blockScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  return {
    primary: topBlocks[0].block,
    alternatives: topBlocks.slice(1).map(b => b.block),
    confidence: topBlocks[0].score,
    reasoning: generateBlockReasoning(topBlocks[0])
  };
}

function calculateBlockRelevance(
  block: IndustryBlock,
  keywords: string[]
): number {
  
  let score = 0;
  
  // 키워드 매칭
  keywords.forEach(keyword => {
    // 산업명 매칭
    if (block.nameKo.includes(keyword) || block.name.toLowerCase().includes(keyword.toLowerCase())) {
      score += 30;
    }
    
    // 용어 사전 매칭
    if (Object.keys(block.knowledgeBase.terminology).some(term => 
      term.toLowerCase().includes(keyword.toLowerCase())
    )) {
      score += 20;
    }
    
    // 규정 매칭
    if (block.knowledgeBase.regulations.some(reg => 
      reg.toLowerCase().includes(keyword.toLowerCase())
    )) {
      score += 15;
    }
  });
  
  // 정규화 (0-100)
  return Math.min(100, score);
}
```

---

## Agent Actions UI

### 문서 카드의 Agent Actions

```typescript
interface AgentActionsUI {
  // 문서 상태별 가능한 액션
  actionsByStatus: {
    triage: [
      { action: "approve_suggestions", label: "AI 추천 적용" },
      { action: "modify_suggestions", label: "수정" },
      { action: "ignore_suggestions", label: "무시" }
    ];
    
    in_progress: [
      { action: "view_progress", label: "진행 상황 보기" },
      { action: "pause", label: "일시 중지" },
      { action: "cancel", label: "취소" }
    ];
    
    waiting_review: [
      { action: "approve", label: "승인" },
      { action: "request_changes", label: "수정 요청" },
      { action: "reject", label: "거부" }
    ];
    
    done: [
      { action: "regenerate", label: "재생성" },
      { action: "duplicate", label: "복제" },
      { action: "export", label: "내보내기" }
    ];
  };
  
  // 컨텍스트 메뉴
  contextMenu: {
    common: [
      { action: "assign_to", label: "담당자 지정" },
      { action: "delegate_to_ai", label: "@QETTA_AI에게 위임" },
      { action: "add_to_project", label: "프로젝트에 추가" },
      { action: "set_priority", label: "우선순위 설정" }
    ];
  };
}
```

### @멘션 인터랙션

```typescript
interface MentionInteraction {
  // 지원되는 멘션 명령
  commands: {
    "@QETTA_AI": {
      description: "QETTA AI 호출",
      examples: [
        "@QETTA_AI 이 문서 검토해줘",
        "@QETTA_AI 사업개요 섹션 확장해줘",
        "@QETTA_AI 이 내용으로 TMS 보고서 만들어줘"
      ]
    }
  };
  
  // 멘션 처리 로직
  handleMention: async (mention: Mention) => {
    // 1. 명령 파싱
    const command = parseMentionCommand(mention.text);
    
    // 2. 해당 능력 찾기
    const capability = findCapability(command.action);
    
    // 3. 실행
    const result = await executeCapability(capability, command.params);
    
    // 4. 응답
    return createMentionResponse(result);
  };
}
```

---

## 메트릭 및 모니터링

### Agent 성능 메트릭

```typescript
interface AgentMetrics {
  // 생성 품질
  quality: {
    avgAccuracyScore: number;          // 평균 정확도
    avgUserSatisfaction: number;       // 평균 사용자 만족도 (1-5)
    correctionRate: number;            // 수정률 (낮을수록 좋음)
    rejectionRate: number;             // 거부율
  };
  
  // 효율성
  efficiency: {
    avgGenerationTime: number;         // 평균 생성 시간 (초)
    avgTokensPerDocument: number;      // 문서당 평균 토큰
    avgCostPerDocument: number;        // 문서당 평균 비용
  };
  
  // 사용량
  usage: {
    dailyDocuments: number;
    dailyTokens: number;
    activeUsers: number;
  };
  
  // Triage 성능
  triage: {
    suggestionAcceptRate: number;      // 추천 수락률
    avgTriageTime: number;             // 평균 분류 시간
  };
}
```
