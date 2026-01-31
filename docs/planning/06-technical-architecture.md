# QETTA 기술 아키텍처 v2.0

## 개요

이 문서는 QETTA의 핵심 기술 아키텍처를 정의합니다. 특히 **Mem0, Zep, OpenAI Memory** 등 글로벌 AI Memory 솔루션을 벤치마킹하여, QETTA만의 도메인 특화 강점과 결합한 최고 수준의 시스템을 설계합니다.

### 벤치마킹 결과 요약

| 솔루션 | 핵심 접근 방식 | GitHub Stars | 주요 특징 |
|-------|--------------|-------------|----------|
| Mem0 | Memory Compression Engine | 46.3K ⭐ | 토큰 80% 절감, 자동 메모리 추출 |
| Zep | Context Engineering | 22.4K ⭐ | Knowledge Graph, 200ms 검색 |
| OpenAI Memory | 저장 메모리 + 채팅 기록 | N/A | 장기 + 단기 메모리 이원화 |
| LangChain | Agent Memory Abstraction | 95K+ ⭐ | LangGraph 기반, 영속성 |

### QETTA 기술 우선순위

| 항목 | 원래 설계 | 교차검수 후 | 우선순위 |
|-----|----------|-----------|---------|
| 3-Layer 구조 | ✅ | ✅ | - |
| 일일 최적화 | ✅ | ✅ + 실시간 옵션 | P1 |
| 도메인 엔진 | ✅ | ✅ | - |
| **메모리 압축** | ❌ | ✅ 추가 필요 | **P0 (필수)** |
| **Knowledge Graph** | ❌ | ✅ 추가 필요 | **P1** |
| Short-term 이원화 | ⚠️ | ✅ 개선 필요 | P2 |
| **Privacy/Forgetting** | ⚠️ | ✅ 강화 필요 | **P1** |
| Confidence Score | ❌ | ✅ 추가 필요 | P2 |
| Proactive Suggestions | ❌ | ✅ 추가 필요 | P3 |
| Conflict Resolution | ❌ | ✅ 추가 필요 | P2 |

---

## 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                     QETTA System Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Client Layer                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │  │   Web   │  │ Mobile  │  │   API   │  │  Embed  │        │   │
│  │  │Dashboard│  │   App   │  │ Client  │  │ Widget  │        │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway                             │   │
│  │  • Rate Limiting  • Auth  • Request Routing  • Logging      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│           ┌──────────────────┼──────────────────┐                  │
│           ▼                  ▼                  ▼                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │  Document   │    │    BLOCK    │    │    Agent    │            │
│  │   Service   │    │   Service   │    │   Service   │            │
│  └─────────────┘    └─────────────┘    └─────────────┘            │
│           │                  │                  │                  │
│           └──────────────────┼──────────────────┘                  │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Core Engine Layer                         │   │
│  │                                                             │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │   │
│  │  │   Memory      │  │   Knowledge   │  │   Generation  │   │   │
│  │  │   Engine      │  │   Graph       │  │   Pipeline    │   │   │
│  │  │  (Mem0 패턴)  │  │  (Zep 패턴)   │  │  (Claude API) │   │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘   │   │
│  │                                                             │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │   │
│  │  │  Optimization │  │   Privacy     │  │   Validation  │   │   │
│  │  │    Engine     │  │   Engine      │  │    Engine     │   │   │
│  │  │ (Daily Batch) │  │ (GDPR Ready)  │  │ (Quality QA)  │   │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Data Layer                              │   │
│  │                                                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │   │
│  │  │PostgreSQL│  │  Redis  │  │ Pinecone│  │   S3    │        │   │
│  │  │(Primary) │  │ (Cache) │  │(Vectors)│  │(Storage)│        │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## P0: Memory Compression Engine

### 필요성

Mem0의 핵심 기술인 **메모리 압축**은 QETTA에 반드시 필요합니다. 현재 설계의 문제점은 다음과 같습니다.

**Before (현재 문제점):**
```
과거 문서 100건 요약 저장 → 4,000+ tokens
→ 매 API 호출마다 비용 증가
→ 응답 지연 발생
```

**After (압축 적용 후):**
```
과거 문서 100건 → 압축 → 800 tokens
= 80% 토큰 절감
= 비용 80% 절감
= 응답 속도 향상
```

### 압축 엔진 설계

```typescript
interface MemoryCompressor {
  // 메인 압축 함수
  compress(memories: Memory[]): Promise<CompressedMemory>;
  
  // 압축 전략
  strategies: CompressionStrategies;
  
  // 압축 설정
  config: CompressionConfig;
}

interface CompressionStrategies {
  // 1. 중복 제거 (Deduplication)
  deduplication: {
    enabled: boolean;
    similarityThreshold: number;  // 0.85 = 85% 유사도 이상이면 중복
    algorithm: "cosine" | "jaccard" | "levenshtein";
  };
  
  // 2. 요약 (Summarization)
  summarization: {
    enabled: boolean;
    maxLength: number;            // 압축 후 최대 길이
    preserveKeyFacts: boolean;    // 핵심 팩트 보존
    model: "claude-haiku" | "gpt-4-mini";  // 저비용 모델 사용
  };
  
  // 3. 관련성 점수화 (Relevance Scoring)
  relevanceScoring: {
    enabled: boolean;
    factors: RelevanceFactor[];
    weights: number[];
    minScore: number;             // 이 점수 이하는 제거
  };
  
  // 4. 망각 곡선 적용 (Forgetting Curve)
  forgettingCurve: {
    enabled: boolean;
    halfLifeDays: number;         // 반감기 (일)
    minRetentionScore: number;    // 최소 보존 점수
  };
}

type RelevanceFactor = "recency" | "frequency" | "importance" | "userFeedback";

interface CompressionConfig {
  // 압축 타이밍
  timing: "realtime" | "batch" | "hybrid";
  
  // 배치 스케줄
  batchSchedule: {
    time: string;        // "01:00"
    timezone: string;    // "Asia/Seoul"
    frequency: "daily" | "weekly";
  };
  
  // 토큰 제한
  tokenLimits: {
    maxInputTokens: number;     // 압축 전 최대
    targetOutputTokens: number; // 압축 후 목표
    hardLimit: number;          // 절대 초과 불가
  };
}
```

### 압축 알고리즘 구현

```typescript
class QettaMemoryCompressor implements MemoryCompressor {
  
  async compress(memories: Memory[]): Promise<CompressedMemory> {
    let processed = memories;
    
    // Step 1: 중복 제거
    if (this.strategies.deduplication.enabled) {
      processed = await this.deduplicate(processed);
    }
    
    // Step 2: 관련성 점수 계산 및 필터링
    if (this.strategies.relevanceScoring.enabled) {
      processed = await this.filterByRelevance(processed);
    }
    
    // Step 3: 망각 곡선 적용
    if (this.strategies.forgettingCurve.enabled) {
      processed = await this.applyForgettingCurve(processed);
    }
    
    // Step 4: 요약 생성
    if (this.strategies.summarization.enabled) {
      processed = await this.summarize(processed);
    }
    
    // 최종 결과 반환
    return {
      summary: this.generateFinalSummary(processed),
      keyFacts: this.extractKeyFacts(processed),
      metadata: {
        originalCount: memories.length,
        compressedCount: processed.length,
        originalTokens: this.countTokens(memories),
        compressedTokens: this.countTokens(processed),
        compressionRatio: this.calculateRatio(memories, processed),
        compressedAt: new Date()
      }
    };
  }
  
  private async deduplicate(memories: Memory[]): Promise<Memory[]> {
    const embeddings = await this.getEmbeddings(memories);
    const unique: Memory[] = [];
    
    for (let i = 0; i < memories.length; i++) {
      let isDuplicate = false;
      
      for (const existing of unique) {
        const similarity = this.cosineSimilarity(
          embeddings[i],
          embeddings[unique.indexOf(existing)]
        );
        
        if (similarity >= this.strategies.deduplication.similarityThreshold) {
          // 더 최신 것으로 교체
          if (memories[i].timestamp > existing.timestamp) {
            unique[unique.indexOf(existing)] = memories[i];
          }
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        unique.push(memories[i]);
      }
    }
    
    return unique;
  }
  
  private async applyForgettingCurve(memories: Memory[]): Promise<Memory[]> {
    const now = Date.now();
    const halfLife = this.strategies.forgettingCurve.halfLifeDays * 24 * 60 * 60 * 1000;
    
    return memories.filter(memory => {
      const age = now - memory.timestamp.getTime();
      const retentionScore = Math.pow(0.5, age / halfLife);
      
      // 사용 빈도로 보정
      const adjustedScore = retentionScore * (1 + memory.usageCount * 0.1);
      
      return adjustedScore >= this.strategies.forgettingCurve.minRetentionScore;
    });
  }
  
  private async summarize(memories: Memory[]): Promise<Memory[]> {
    // 카테고리별 그룹화
    const grouped = this.groupByCategory(memories);
    
    const summaries: Memory[] = [];
    
    for (const [category, items] of Object.entries(grouped)) {
      // 각 카테고리별 요약 생성
      const summary = await this.generateCategorySummary(category, items);
      summaries.push(summary);
    }
    
    return summaries;
  }
  
  private async generateCategorySummary(
    category: string,
    memories: Memory[]
  ): Promise<Memory> {
    
    const prompt = `
다음 ${category} 관련 정보들을 핵심만 남겨 요약해주세요.
중복 정보는 제거하고, 가장 최신 정보를 우선시하세요.

정보 목록:
${memories.map(m => `- ${m.content}`).join('\n')}

요약 형식:
- 핵심 사실만 bullet point로
- 수치가 있으면 최신 값만
- 최대 ${this.strategies.summarization.maxLength}자
`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",  // 저비용 모델
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    });
    
    return {
      id: `summary_${category}_${Date.now()}`,
      category,
      content: response.content[0].text,
      type: "summary",
      timestamp: new Date(),
      sourceCount: memories.length
    };
  }
}
```

### 압축 예시

```typescript
// Before: 100건의 TMS 보고서 메모리
const beforeCompression = [
  { content: "2026-01-15 TMS: NOx 45ppm, SOx 32ppm, PM 15mg/m³", timestamp: "2026-01-15" },
  { content: "2026-01-16 TMS: NOx 42ppm, SOx 30ppm, PM 14mg/m³", timestamp: "2026-01-16" },
  { content: "2026-01-17 TMS: NOx 48ppm, SOx 35ppm, PM 16mg/m³", timestamp: "2026-01-17" },
  // ... (97건 더)
];
// Total: ~4,000 tokens

// After: 압축된 요약
const afterCompression = {
  summary: "환경팀 TMS 현황 (2026년 1월)",
  keyFacts: [
    "NOx: 일평균 45ppm (기준 40ppm 초과 주의, 최근 상승 추세)",
    "SOx: 일평균 32ppm (기준 35ppm 이내, 안정적)",
    "PM: 일평균 15mg/m³ (기준 20mg/m³ 이내, 양호)",
    "특이사항: 1/17 NOx 48ppm 피크 발생, 원인 조사 필요"
  ],
  metadata: {
    originalCount: 100,
    compressedCount: 4,
    originalTokens: 4000,
    compressedTokens: 800,
    compressionRatio: 0.80  // 80% 절감
  }
};
```

---

## P1: Knowledge Graph

### 필요성

Zep의 핵심 기능인 **Knowledge Graph**는 관계 기반 컨텍스트 검색을 가능하게 합니다. 현재 QETTA의 플랫 구조 메모리로는 복잡한 쿼리를 처리할 수 없습니다.

**Before (플랫 구조):**
```
"김민수가 담당하는 시설의 최근 배출량은?"
→ 모든 메모리 순차 검색
→ 관계 파악 불가
→ 느린 응답, 부정확한 결과
```

**After (Knowledge Graph):**
```
"김민수가 담당하는 시설의 최근 배출량은?"
→ Graph: 김민수 -[담당]-> 환경팀 -[관리]-> A공장 -[배출]-> NOx
→ 관계 기반 빠른 검색
→ 정확한 결과: "A공장 NOx 45ppm (1/17 기준)"
```

### Knowledge Graph 설계

```typescript
interface KnowledgeGraph {
  // 노드
  nodes: {
    entities: Entity[];     // 회사, 사람, 시설, 문서
    concepts: Concept[];    // 도메인 개념
  };
  
  // 엣지 (관계)
  edges: {
    relationships: Relationship[];
  };
  
  // 쿼리
  query(question: string): Promise<RelevantContext>;
  
  // 그래프 조작
  addNode(node: Node): Promise<void>;
  addEdge(edge: Relationship): Promise<void>;
  updateNode(nodeId: string, updates: Partial<Node>): Promise<void>;
  deleteNode(nodeId: string): Promise<void>;
}

interface Entity {
  id: string;
  type: EntityType;
  name: string;
  properties: Record<string, any>;
  embeddings: number[];     // 벡터 임베딩
  createdAt: Date;
  updatedAt: Date;
}

type EntityType = 
  | "company"      // 회사
  | "person"       // 사람
  | "facility"     // 시설
  | "document"     // 문서
  | "project"      // 프로젝트
  | "program"      // 지원사업
  | "equipment"    // 장비
  | "regulation";  // 규정

interface Concept {
  id: string;
  name: string;
  domain: string;           // "environment", "semiconductor", etc.
  definition: string;
  relatedTerms: string[];
  embeddings: number[];
}

interface Relationship {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: RelationshipType;
  properties: Record<string, any>;
  weight: number;           // 관계 강도 (0-1)
  createdAt: Date;
}

type RelationshipType =
  | "belongs_to"     // 소속
  | "manages"        // 관리
  | "owns"           // 소유
  | "produces"       // 생산
  | "emits"          // 배출
  | "regulates"      // 규제
  | "applies_to"     // 적용
  | "references"     // 참조
  | "created_by"     // 작성자
  | "approved_by";   // 승인자
```

### Graph 쿼리 엔진

```typescript
class QettaKnowledgeGraph implements KnowledgeGraph {
  private neo4j: Neo4jDriver;
  private pinecone: PineconeClient;
  
  async query(question: string): Promise<RelevantContext> {
    // 1. 질문에서 엔티티 추출
    const entities = await this.extractEntities(question);
    
    // 2. 의도 파악
    const intent = await this.classifyIntent(question);
    
    // 3. 그래프 탐색 쿼리 생성
    const cypherQuery = this.buildCypherQuery(entities, intent);
    
    // 4. 그래프 검색 실행
    const graphResults = await this.neo4j.run(cypherQuery);
    
    // 5. 벡터 검색으로 보완
    const vectorResults = await this.pinecone.query({
      vector: await this.embed(question),
      topK: 5,
      filter: { entityIds: entities.map(e => e.id) }
    });
    
    // 6. 결과 병합 및 정렬
    const merged = this.mergeResults(graphResults, vectorResults);
    
    // 7. 컨텍스트 구성
    return {
      entities: merged.entities,
      relationships: merged.relationships,
      facts: merged.facts,
      confidence: this.calculateConfidence(merged)
    };
  }
  
  private async extractEntities(text: string): Promise<Entity[]> {
    const prompt = `
다음 텍스트에서 엔티티를 추출하세요:
"${text}"

JSON 형식으로 반환:
[
  { "name": "엔티티명", "type": "person|company|facility|..." }
]
`;
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    });
    
    return JSON.parse(response.content[0].text);
  }
  
  private buildCypherQuery(
    entities: Entity[],
    intent: QueryIntent
  ): string {
    // 엔티티 기반 Cypher 쿼리 생성
    const entityNames = entities.map(e => `"${e.name}"`).join(", ");
    
    switch (intent) {
      case "find_relationship":
        return `
          MATCH (e1)-[r]-(e2)
          WHERE e1.name IN [${entityNames}] OR e2.name IN [${entityNames}]
          RETURN e1, r, e2
          LIMIT 20
        `;
      
      case "find_properties":
        return `
          MATCH (e)
          WHERE e.name IN [${entityNames}]
          RETURN e
        `;
      
      case "traverse_path":
        return `
          MATCH path = (e1)-[*1..3]-(e2)
          WHERE e1.name IN [${entityNames}]
          RETURN path
          LIMIT 10
        `;
      
      default:
        return `
          MATCH (e)
          WHERE e.name IN [${entityNames}]
          OPTIONAL MATCH (e)-[r]-(related)
          RETURN e, r, related
          LIMIT 20
        `;
    }
  }
}
```

### Graph 사용 예시

```typescript
// 예시: 회사 정보 그래프
const companyGraph = {
  nodes: [
    { id: "company_abc", type: "company", name: "(주)ABC", properties: { industry: "반도체" } },
    { id: "person_kim", type: "person", name: "김민수", properties: { role: "환경팀장" } },
    { id: "facility_a", type: "facility", name: "A공장", properties: { location: "경기도" } },
    { id: "emission_nox", type: "concept", name: "NOx", properties: { limit: "40ppm" } }
  ],
  edges: [
    { from: "person_kim", to: "company_abc", type: "belongs_to" },
    { from: "person_kim", to: "facility_a", type: "manages" },
    { from: "facility_a", to: "company_abc", type: "belongs_to" },
    { from: "facility_a", to: "emission_nox", type: "emits", properties: { value: "45ppm" } }
  ]
};

// 쿼리: "김민수가 담당하는 시설의 배출량"
const result = await graph.query("김민수가 담당하는 시설의 배출량");

// 결과
{
  entities: [
    { name: "김민수", type: "person" },
    { name: "A공장", type: "facility" }
  ],
  relationships: [
    { from: "김민수", to: "A공장", type: "manages" },
    { from: "A공장", to: "NOx", type: "emits", value: "45ppm" }
  ],
  facts: [
    "김민수는 A공장을 관리합니다",
    "A공장의 NOx 배출량은 45ppm입니다 (기준: 40ppm)"
  ],
  confidence: 0.95
}
```

---

## P1: Privacy/Forgetting Engine

### 필요성

OpenAI ChatGPT의 "기억하지 않길 원하면 잊으라고 말하기만 하면 됩니다" 기능을 QETTA에도 구현해야 합니다. B2B 환경에서는 **GDPR 삭제권**과 **민감 정보 보호**가 필수입니다.

### Privacy Engine 설계

```typescript
interface PrivacyEngine {
  // 망각 요청
  forget(params: ForgetParams): Promise<ForgetResult>;
  
  // 민감 정보 필터링
  filterSensitive(content: string): Promise<FilteredContent>;
  
  // 데이터 보관 정책
  retention: RetentionPolicy;
  
  // GDPR 삭제권 행사
  exerciseRightToErasure(userId: string): Promise<ErasureResult>;
  
  // 감사 로그
  getAuditLog(params: AuditLogParams): Promise<AuditLog[]>;
}

interface ForgetParams {
  type: "pattern" | "entity" | "timeRange" | "all";
  
  // 패턴 기반 삭제
  pattern?: string;  // "이 프로젝트에 대해 잊어줘"
  
  // 엔티티 기반 삭제
  entityId?: string;
  entityType?: EntityType;
  
  // 시간 범위 삭제
  timeRange?: {
    start: Date;
    end: Date;
  };
  
  // 범위
  scope: "session" | "company" | "all";
}

interface RetentionPolicy {
  // 세션 컨텍스트
  sessionContext: {
    duration: "24h";
    autoDelete: true;
  };
  
  // Company BLOCK
  companyBlock: {
    duration: "1year" | "indefinite";
    requiresUserConsent: true;
  };
  
  // 감사 로그
  auditLog: {
    duration: "3years";
    immutable: true;  // 삭제 불가
  };
  
  // 문서
  documents: {
    duration: "userDefined" | "indefinite";
    defaultRetention: "1year";
  };
}

interface SensitiveFilter {
  // 민감 정보 패턴
  patterns: SensitivePattern[];
  
  // 처리 방식
  action: "mask" | "exclude" | "encrypt";
}

interface SensitivePattern {
  name: string;
  regex: RegExp;
  severity: "low" | "medium" | "high" | "critical";
}
```

### 구현

```typescript
class QettaPrivacyEngine implements PrivacyEngine {
  
  // 민감 정보 패턴 정의
  private readonly SENSITIVE_PATTERNS: SensitivePattern[] = [
    {
      name: "주민등록번호",
      regex: /\d{6}-[1-4]\d{6}/g,
      severity: "critical"
    },
    {
      name: "여권번호",
      regex: /[A-Z]{1,2}\d{7,8}/g,
      severity: "critical"
    },
    {
      name: "신용카드번호",
      regex: /\d{4}-?\d{4}-?\d{4}-?\d{4}/g,
      severity: "critical"
    },
    {
      name: "계좌번호",
      regex: /\d{2,3}-\d{2,6}-\d{2,6}/g,
      severity: "high"
    },
    {
      name: "전화번호",
      regex: /01[0-9]-?\d{3,4}-?\d{4}/g,
      severity: "medium"
    },
    {
      name: "이메일",
      regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      severity: "low"
    }
  ];
  
  async forget(params: ForgetParams): Promise<ForgetResult> {
    const { type, scope } = params;
    let deletedCount = 0;
    
    switch (type) {
      case "pattern":
        // 자연어 패턴 해석
        const matchingMemories = await this.findByPattern(params.pattern!, scope);
        deletedCount = await this.deleteMemories(matchingMemories);
        break;
        
      case "entity":
        // 특정 엔티티 관련 모든 정보 삭제
        const entityMemories = await this.findByEntity(params.entityId!, scope);
        deletedCount = await this.deleteMemories(entityMemories);
        
        // Knowledge Graph에서도 삭제
        await this.graph.deleteNode(params.entityId!);
        break;
        
      case "timeRange":
        // 시간 범위 내 모든 정보 삭제
        const timeRangeMemories = await this.findByTimeRange(
          params.timeRange!.start,
          params.timeRange!.end,
          scope
        );
        deletedCount = await this.deleteMemories(timeRangeMemories);
        break;
        
      case "all":
        // 전체 삭제 (주의!)
        if (scope === "session") {
          deletedCount = await this.deleteSessionContext();
        } else {
          throw new Error("전체 삭제는 세션 범위에서만 가능합니다");
        }
        break;
    }
    
    // 감사 로그 기록
    await this.logAudit({
      action: "forget",
      params,
      deletedCount,
      performedAt: new Date(),
      performedBy: getCurrentUser()
    });
    
    return { success: true, deletedCount };
  }
  
  async filterSensitive(content: string): Promise<FilteredContent> {
    let filtered = content;
    const detectedPatterns: DetectedPattern[] = [];
    
    for (const pattern of this.SENSITIVE_PATTERNS) {
      const matches = content.match(pattern.regex);
      
      if (matches) {
        for (const match of matches) {
          detectedPatterns.push({
            name: pattern.name,
            value: match,
            severity: pattern.severity
          });
          
          // 마스킹 처리
          const masked = this.maskValue(match, pattern.severity);
          filtered = filtered.replace(match, masked);
        }
      }
    }
    
    return {
      original: content,
      filtered,
      detectedPatterns,
      hasSensitiveData: detectedPatterns.length > 0
    };
  }
  
  private maskValue(value: string, severity: string): string {
    switch (severity) {
      case "critical":
        return "[민감정보 제거됨]";
      case "high":
        return value.slice(0, 3) + "*".repeat(value.length - 6) + value.slice(-3);
      case "medium":
        return value.slice(0, 3) + "****" + value.slice(-2);
      case "low":
        return value;  // 낮은 심각도는 마스킹하지 않음
      default:
        return "[***]";
    }
  }
  
  async exerciseRightToErasure(userId: string): Promise<ErasureResult> {
    // GDPR 삭제권 행사
    
    // 1. 사용자 관련 모든 데이터 조회
    const userData = await this.findAllUserData(userId);
    
    // 2. 삭제 불가 항목 확인 (법적 보관 의무)
    const cannotDelete = userData.filter(d => d.legalRetentionRequired);
    
    // 3. 삭제 가능 항목 삭제
    const toDelete = userData.filter(d => !d.legalRetentionRequired);
    await this.deleteMemories(toDelete);
    
    // 4. Knowledge Graph에서 사용자 노드 익명화
    await this.graph.anonymizeNode(userId);
    
    // 5. 감사 로그 (삭제 기록은 유지해야 함)
    await this.logAudit({
      action: "gdpr_erasure",
      userId,
      deletedCount: toDelete.length,
      retainedCount: cannotDelete.length,
      retainedReasons: cannotDelete.map(d => d.retentionReason),
      performedAt: new Date()
    });
    
    return {
      success: true,
      deletedCount: toDelete.length,
      retainedCount: cannotDelete.length,
      retainedItems: cannotDelete.map(d => ({
        type: d.type,
        reason: d.retentionReason
      }))
    };
  }
}
```

---

## P1: Hybrid Optimization Mode

### 배치 vs 실시간 최적화

현재 QETTA는 **일일 배치 최적화**만 지원합니다. 그러나 일부 상황에서는 **실시간 업데이트**가 필요합니다.

```typescript
interface OptimizationConfig {
  mode: "batch" | "realtime" | "hybrid";
  
  // 배치 모드 설정
  batch: {
    schedule: "daily" | "weekly";
    time: string;        // "01:00"
    timezone: string;    // "Asia/Seoul"
  };
  
  // 실시간 모드 설정
  realtime: {
    triggerThreshold: number;    // N회 수정 시 즉시 학습
    maxUpdatesPerHour: number;   // 시간당 최대 업데이트
    cooldownMinutes: number;     // 연속 업데이트 방지
  };
  
  // 하이브리드 모드 설정 (권장)
  hybrid: {
    // 실시간 트리거 (즉시 반영)
    realtimeTriggers: RealtimeTrigger[];
    
    // 배치 처리 (매일 자정)
    batchTasks: BatchTask[];
  };
}

interface RealtimeTrigger {
  name: string;
  condition: TriggerCondition;
  action: "immediate_learn" | "immediate_update" | "immediate_alert";
}

type TriggerCondition = 
  | "user_explicit_correction"    // 사용자가 직접 수정
  | "critical_error"              // 심각한 오류 발견
  | "regulation_change"           // 규정 변경
  | "high_confidence_learning"    // 높은 신뢰도 학습
  | "user_explicit_memory";       // "이거 기억해" 요청
```

### 하이브리드 최적화 엔진

```typescript
class HybridOptimizationEngine {
  
  private readonly REALTIME_TRIGGERS: RealtimeTrigger[] = [
    {
      name: "사용자 명시적 수정",
      condition: "user_explicit_correction",
      action: "immediate_learn"
    },
    {
      name: "심각한 오류",
      condition: "critical_error",
      action: "immediate_alert"
    },
    {
      name: "규정 변경",
      condition: "regulation_change",
      action: "immediate_update"
    },
    {
      name: "명시적 기억 요청",
      condition: "user_explicit_memory",
      action: "immediate_learn"
    }
  ];
  
  private readonly BATCH_TASKS: BatchTask[] = [
    { name: "analyzeNewDocuments", priority: 1 },
    { name: "learnFromCorrections", priority: 2 },
    { name: "discoverNewPatterns", priority: 3 },
    { name: "compressMemory", priority: 4 },
    { name: "pruneStaleData", priority: 5 },
    { name: "updateConfidenceScores", priority: 6 },
    { name: "rebuildKnowledgeGraph", priority: 7 }
  ];
  
  // 실시간 이벤트 처리
  async handleRealtimeEvent(event: OptimizationEvent): Promise<void> {
    const trigger = this.REALTIME_TRIGGERS.find(t => 
      t.condition === event.condition
    );
    
    if (!trigger) {
      // 실시간 트리거에 해당하지 않으면 배치 큐에 추가
      await this.addToBatchQueue(event);
      return;
    }
    
    // 쿨다운 체크
    if (await this.isInCooldown(event.companyId)) {
      await this.addToBatchQueue(event);
      return;
    }
    
    // 실시간 처리
    switch (trigger.action) {
      case "immediate_learn":
        await this.immediateLearn(event);
        break;
      case "immediate_update":
        await this.immediateUpdate(event);
        break;
      case "immediate_alert":
        await this.immediateAlert(event);
        break;
    }
    
    // 쿨다운 설정
    await this.setCooldown(event.companyId);
  }
  
  // 매일 자정 배치 처리
  async runDailyBatch(): Promise<BatchResult> {
    const results: TaskResult[] = [];
    
    for (const task of this.BATCH_TASKS) {
      try {
        const result = await this.runTask(task);
        results.push(result);
      } catch (error) {
        results.push({
          task: task.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      completedAt: new Date(),
      tasks: results,
      success: results.every(r => r.success)
    };
  }
}
```

---

## P2: Confidence Score System

### Memory Confidence Score

모든 메모리에 **신뢰도 점수**를 부여하여, AI가 불확실한 정보를 사용할 때 사용자에게 확인을 요청합니다.

```typescript
interface MemoryWithConfidence {
  id: string;
  content: string;
  
  // 신뢰도
  confidence: {
    score: number;              // 0-100
    source: ConfidenceSource;
    lastValidated: Date;
    validationHistory: ValidationRecord[];
  };
  
  // 사용 통계
  usage: {
    count: number;
    lastUsedAt: Date;
    successRate: number;        // 사용 후 수정 안 된 비율
  };
}

type ConfidenceSource = 
  | "explicit"      // 사용자가 명시적으로 입력 → 높은 신뢰도
  | "inferred"      // AI가 추론 → 중간 신뢰도
  | "learned"       // 패턴에서 학습 → 검증 필요
  | "imported";     // 외부에서 가져옴 → 검증 필요

// 신뢰도 기반 동작
interface ConfidenceBasedBehavior {
  // 높은 신뢰도 (80+): 바로 사용
  high: {
    threshold: 80;
    action: "use_directly";
  };
  
  // 중간 신뢰도 (50-79): 사용하되 표시
  medium: {
    threshold: 50;
    action: "use_with_indicator";
    indicator: "ℹ️ 이 정보는 검증이 필요할 수 있습니다";
  };
  
  // 낮은 신뢰도 (<50): 확인 요청
  low: {
    threshold: 0;
    action: "ask_user";
    prompt: "이전에 {content}라고 하셨는데 맞나요?";
  };
}
```

---

## P2: Short-term Memory 이원화

OpenAI의 **저장 메모리 + 채팅 기록** 이원화 패턴을 적용합니다.

```typescript
interface SessionContext {
  // 현재 문서 작업
  currentDocument: Document;
  
  // 대화 히스토리
  conversationHistory: Message[];
  
  // Short-term Memory (신규)
  shortTermMemory: {
    // AI가 이번 세션에서 추출한 정보
    extractedFacts: ExtractedFact[];
    
    // 사용자가 "기억해"라고 명시한 것
    explicitMemories: ExplicitMemory[];
    
    // Company BLOCK 승격 후보
    promotionCandidates: PromotionCandidate[];
  };
  
  // 세션 만료
  expiresAt: Date;  // 24시간 후
}

interface ExtractedFact {
  content: string;
  extractedFrom: "conversation" | "document" | "action";
  confidence: number;
  timestamp: Date;
}

interface ExplicitMemory {
  content: string;
  userRequest: string;  // "이거 기억해"
  timestamp: Date;
  promoted: boolean;    // Company BLOCK으로 승격됨
}

interface PromotionCandidate {
  memory: ExtractedFact | ExplicitMemory;
  promotionScore: number;  // 승격 점수
  reasons: string[];       // "자주 사용됨", "명시적 요청" 등
}
```

---

## P3: Proactive Memory Suggestions

Mem0 방식처럼 AI가 먼저 메모리 저장을 제안합니다.

```typescript
interface ProactiveMemorySystem {
  // AI 응답 후 메모리 제안 생성
  generateSuggestions(
    response: AIResponse,
    context: SessionContext
  ): Promise<MemorySuggestion[]>;
  
  // 제안 표시
  displaySuggestion(suggestion: MemorySuggestion): SuggestionUI;
  
  // 사용자 응답 처리
  handleUserResponse(
    suggestion: MemorySuggestion,
    response: "save" | "skip" | "modify"
  ): Promise<void>;
}

interface MemorySuggestion {
  id: string;
  suggestedMemory: string;
  reason: string;
  importance: "low" | "medium" | "high";
  targetBlock: "company" | "session";
}

// 예시 플로우
// AI: "TMS 보고서를 생성했습니다."
// 
// 💡 제안: "이 양식을 기본 TMS 양식으로 저장할까요?"
//    이유: "이 양식으로 3회 이상 보고서를 생성했습니다"
//    [저장] [건너뛰기] [수정]
```

---

## 기술 스택 요약

```typescript
const TECH_STACK = {
  // Frontend
  frontend: {
    framework: "Next.js 15",
    language: "TypeScript",
    styling: "Tailwind CSS",
    stateManagement: "Zustand",
    dataFetching: "TanStack Query"
  },
  
  // Backend
  backend: {
    runtime: "Node.js 20",
    framework: "Next.js API Routes",
    database: "PostgreSQL (Supabase)",
    cache: "Redis (Upstash)",
    vectorDB: "Pinecone",
    graphDB: "Neo4j Aura"
  },
  
  // AI
  ai: {
    primary: "Claude Sonnet 4.5",
    secondary: "Claude Haiku 4.5 (압축용)",
    embeddings: "text-embedding-3-small"
  },
  
  // Infrastructure
  infrastructure: {
    hosting: "Vercel",
    storage: "AWS S3",
    auth: "Supabase Auth",
    monitoring: "Sentry",
    analytics: "PostHog"
  }
};
```

---

## 데이터베이스 스키마

```sql
-- Company BLOCK
CREATE TABLE company_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  -- 기본 정보
  profile JSONB NOT NULL,
  
  -- 학습된 데이터
  learned_data JSONB,
  
  -- 압축된 메모리
  compressed_memory JSONB,
  
  -- 신뢰도
  confidence JSONB,
  
  -- 최적화 설정
  optimization_config JSONB,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_optimized_at TIMESTAMPTZ
);

-- Knowledge Graph Nodes
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  properties JSONB,
  embeddings vector(1536),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Graph Edges
CREATE TABLE knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  from_node_id UUID REFERENCES knowledge_nodes(id),
  to_node_id UUID REFERENCES knowledge_nodes(id),
  
  type VARCHAR(50) NOT NULL,
  properties JSONB,
  weight DECIMAL(3, 2) DEFAULT 1.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory (with Confidence)
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  
  content TEXT NOT NULL,
  category VARCHAR(100),
  
  -- 신뢰도
  confidence_score INTEGER DEFAULT 50,
  confidence_source VARCHAR(20),
  last_validated_at TIMESTAMPTZ,
  
  -- 사용 통계
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  success_rate DECIMAL(3, 2),
  
  -- 프라이버시
  sensitive_filtered BOOLEAN DEFAULT FALSE,
  retention_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (불변)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL,
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_memories_company ON memories(company_id);
CREATE INDEX idx_memories_confidence ON memories(confidence_score);
CREATE INDEX idx_knowledge_nodes_company ON knowledge_nodes(company_id);
CREATE INDEX idx_knowledge_nodes_type ON knowledge_nodes(type);
CREATE INDEX idx_knowledge_edges_from ON knowledge_edges(from_node_id);
CREATE INDEX idx_knowledge_edges_to ON knowledge_edges(to_node_id);
```
