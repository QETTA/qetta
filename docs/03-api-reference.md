# QETTA API Reference v2.1

> **Base URL**: `https://api.qetta.io/v1`
> **인증**: Bearer Token (JWT)
> **버전**: v2.1 (2026-01-30)

---

## 인증 (Authentication)

### POST /auth/login

사용자 로그인 및 JWT 토큰 발급

**Request**:
```json
{
  "email": "user@company.com",
  "password": "********"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-123",
      "email": "user@company.com",
      "companyId": "company-456",
      "tier": "GROWTH"
    }
  }
}
```

### POST /auth/refresh

토큰 갱신

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Company Block API

### GET /blocks/company

현재 로그인한 사용자의 Company Block 조회

**Headers**:
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "companyId": "company-456",
    "profile": {
      "id": "company-456",
      "name": "ABC Corp",
      "businessNumber": "123-45-67890",
      "basic": {
        "foundedDate": "2020-01-15",
        "employeeCount": 45,
        "annualRevenue": 32,
        "region": "서울 강남구",
        "industry": "소프트웨어 개발",
        "mainProducts": ["AI 솔루션", "SaaS"]
      },
      "qualifications": {
        "certifications": ["ISO 9001", "벤처기업", "이노비즈"],
        "registrations": ["AI 공급기업", "조달 등록"],
        "patents": 5,
        "trademarks": 2
      },
      "history": {
        "totalApplications": 8,
        "selectionCount": 3,
        "rejectionCount": 5,
        "qettaCreditScore": 720
      }
    },
    "facts": [
      {
        "id": "fact-001",
        "type": "rejection_pattern",
        "content": "TIPS 탈락: 기술성 미달 (2024.06)",
        "confidence": 0.95,
        "source": "document_parsed",
        "createdAt": "2024-06-15T09:00:00Z"
      }
    ],
    "compression": {
      "originalTokens": 450,
      "compressedTokens": 120,
      "ratio": 73
    },
    "updatedAt": "2026-01-30T10:00:00Z"
  }
}
```

### PUT /blocks/company

Company Block 업데이트

**Request**:
```json
{
  "profile": {
    "basic": {
      "employeeCount": 50,
      "annualRevenue": 40
    }
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "companyId": "company-456",
    "updatedAt": "2026-01-30T11:00:00Z"
  }
}
```

### POST /blocks/company/facts

새 Fact 추가

**Request**:
```json
{
  "type": "capability",
  "content": "컴퓨터 비전 AI 기술 보유, 제조업 불량검사 3건 구축",
  "confidence": 0.9,
  "source": "user_input"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "fact-002",
    "type": "capability",
    "content": "컴퓨터 비전 AI 기술 보유, 제조업 불량검사 3건 구축",
    "confidence": 0.9,
    "source": "user_input",
    "createdAt": "2026-01-30T11:30:00Z"
  }
}
```

### POST /blocks/company/compress

Company Block 재압축 요청

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "originalTokens": 480,
    "compressedTokens": 110,
    "ratio": 77,
    "compressedContext": "ABC Corp(2020년 설립, 6년차). 직원 50명, 매출 40억. 인증: ISO 9001/벤처/이노비즈. 신청 8건(선정 3, 탈락 5). • TIPS 탈락: 기술성 미달"
  }
}
```

---

## Industry Block API

### GET /blocks/industry

전체 Industry Block 목록 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "FOOD",
      "nameKo": "식품/음료",
      "nameEn": "Food & Beverage",
      "ksicCodes": ["10", "11"],
      "coreTerms": ["HACCP", "GMP", "콜드체인", "식품안전"],
      "aiVoucherPercent": 15,
      "color": "orange"
    },
    {
      "id": "ELECTRONICS",
      "nameKo": "전자/반도체",
      "nameEn": "Electronics & Semiconductor",
      "ksicCodes": ["26", "27"],
      "coreTerms": ["PCB", "SMT", "클린룸", "Wafer"],
      "aiVoucherPercent": 18,
      "color": "cyan"
    }
    // ... 총 10개
  ],
  "meta": {
    "total": 10,
    "version": "v2.1"
  }
}
```

### GET /blocks/industry/{id}

특정 Industry Block 상세 조회

**Path Parameters**:
- `id`: Industry Block ID (예: `FOOD`, `ELECTRONICS`)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "ELECTRONICS",
    "nameKo": "전자/반도체",
    "nameEn": "Electronics & Semiconductor",
    "ksicCodes": ["26", "27"],
    "coreTerms": ["PCB", "SMT", "클린룸", "Wafer", "수율", "FAB"],
    "aiVoucherPercent": 18,
    "color": "cyan",
    "terminology": [
      {
        "id": "pcb",
        "korean": "인쇄회로기판",
        "english": "PCB",
        "category": "component",
        "description": "전자부품을 연결하는 기판"
      }
      // ... 상세 용어 목록
    ],
    "templates": [
      {
        "id": "smt-report",
        "name": "SMT 실적 보고서",
        "format": "DOCX",
        "sections": ["개요", "생산실적", "불량분석", "개선계획"]
      }
    ],
    "rules": [
      {
        "id": "elec-001",
        "name": "클린룸 등급 명시",
        "severity": "warning"
      }
    ]
  }
}
```

---

## Program Block API

### GET /blocks/program

정부사업 프로그램 목록 조회

**Query Parameters**:
- `source`: 재원 출처 필터 (예: `MSS`, `NIPA`)
- `type`: 사업 유형 필터 (예: `voucher`, `grant`)
- `status`: 상태 필터 (`open`, `closed`, `upcoming`)
- `limit`: 반환 개수 (기본: 20, 최대: 100)
- `offset`: 페이지네이션 오프셋

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "prog-ai-voucher-2026",
      "name": "2026년 AI바우처 지원사업",
      "source": "NIPA",
      "type": "voucher",
      "domain": "DIGITAL",
      "eligibility": {
        "companyAge": { "min": 1 },
        "employeeCount": { "min": 5, "max": 300 },
        "certifications": ["AI 공급기업"]
      },
      "support": {
        "maxAmount": 30000,
        "matchingRatio": 20,
        "duration": 12
      },
      "schedule": {
        "applicationStart": "2026-02-01",
        "applicationEnd": "2026-03-31",
        "selectionDate": "2026-05-01"
      },
      "metadata": {
        "url": "https://k-startup.go.kr/...",
        "selectionRate": 25
      }
    }
  ],
  "meta": {
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 제안서 생성 API

### POST /proposals/generate

AI 기반 제안서 생성 요청

**Request**:
```json
{
  "programId": "prog-ai-voucher-2026",
  "presetId": "DIGITAL",
  "templateId": "ai-voucher-proposal",
  "format": "DOCX",
  "options": {
    "locale": "ko",
    "includeChecklist": true
  }
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "proposalId": "prop-123",
    "status": "generating",
    "estimatedTime": 45,
    "webhookUrl": "/proposals/prop-123/status"
  }
}
```

### GET /proposals/{id}

제안서 상태 및 상세 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "prop-123",
    "status": "completed",
    "title": "ABC Corp AI바우처 공급기업 제안서",
    "format": "DOCX",
    "downloadUrl": "https://storage.qetta.io/proposals/prop-123.docx",
    "expiresAt": "2026-02-01T00:00:00Z",
    "metadata": {
      "programId": "prog-ai-voucher-2026",
      "presetId": "DIGITAL",
      "templateId": "ai-voucher-proposal",
      "tokensUsed": 4500,
      "generatedAt": "2026-01-30T12:00:00Z",
      "generationTime": 42
    },
    "verification": {
      "hash": "sha256:abc123...",
      "rules": {
        "passed": 15,
        "warnings": 2,
        "errors": 0
      }
    }
  }
}
```

---

## 세션 API

### POST /sessions

새 세션 생성

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "sessionId": "session-789",
    "createdAt": "2026-01-30T12:30:00Z",
    "expiresAt": "2026-01-30T13:00:00Z"
  }
}
```

### POST /sessions/{id}/messages

세션에 메시지 추가

**Request**:
```json
{
  "role": "user",
  "content": "AI바우처 공급기업 제안서 작성해줘"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "messageId": "msg-001",
    "role": "user",
    "content": "AI바우처 공급기업 제안서 작성해줘",
    "timestamp": "2026-01-30T12:31:00Z",
    "intent": {
      "type": "document_generation",
      "confidence": 0.85,
      "entities": {
        "program": "AI바우처",
        "documentType": "제안서"
      }
    }
  }
}
```

### GET /sessions/{id}/context

조립된 3-Layer 컨텍스트 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "domain": {
      "presetId": "DIGITAL",
      "loadedBlocks": ["ELECTRONICS", "MACHINERY"],
      "tokenBudget": {
        "current": 1850,
        "max": 2000,
        "level": "full"
      }
    },
    "company": {
      "companyId": "company-456",
      "compression": {
        "compressedTokens": 120,
        "ratio": 73
      }
    },
    "session": {
      "sessionId": "session-789",
      "intent": {
        "type": "document_generation",
        "confidence": 0.85
      },
      "messageCount": 3
    },
    "assembly": {
      "totalTokens": 2470,
      "tokenBreakdown": {
        "domain": 1850,
        "company": 120,
        "session": 500
      },
      "withinBudget": true
    }
  }
}
```

---

## Rate Limit

### 티어별 요청 제한

| 티어 | 분당 요청 | 일일 요청 | 동시 세션 |
|------|----------|----------|----------|
| TRIAL | 20 | 200 | 1 |
| STARTER | 100 | 3,000 | 3 |
| GROWTH | 300 | 10,000 | 10 |
| SCALE | 1,000 | 50,000 | 50 |
| UNLIMITED | 무제한 | 무제한 | 무제한 |

### Rate Limit 응답 헤더

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 295
X-RateLimit-Reset: 1706608800
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "분당 요청 한도를 초과했습니다. 60초 후 재시도하세요.",
    "retryAfter": 60
  }
}
```

---

## 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `AUTH_INVALID` | 401 | 인증 실패 |
| `AUTH_EXPIRED` | 401 | 토큰 만료 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 입력값 오류 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `QUOTA_EXCEEDED` | 429 | 월간 문서 한도 초과 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

### 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "presetId는 필수 필드입니다.",
    "details": {
      "field": "presetId",
      "constraint": "required"
    }
  }
}
```

---

## Webhook

### 제안서 생성 완료 Webhook

**POST** (등록된 URL로 전송)

```json
{
  "event": "proposal.completed",
  "data": {
    "proposalId": "prop-123",
    "status": "completed",
    "downloadUrl": "https://storage.qetta.io/proposals/prop-123.docx"
  },
  "timestamp": "2026-01-30T12:01:00Z",
  "signature": "sha256=abc123..."
}
```

---

## SDK 예시

### Node.js / TypeScript

```typescript
import { QettaClient } from '@qetta/sdk'

const client = new QettaClient({
  apiKey: process.env.QETTA_API_KEY,
})

// Company Block 조회
const company = await client.blocks.company.get()

// 제안서 생성
const proposal = await client.proposals.generate({
  programId: 'prog-ai-voucher-2026',
  presetId: 'DIGITAL',
  format: 'DOCX',
})

// 상태 폴링
const result = await client.proposals.waitForCompletion(proposal.proposalId)
console.log(result.downloadUrl)
```

### Python

```python
from qetta import QettaClient

client = QettaClient(api_key=os.environ["QETTA_API_KEY"])

# Company Block 조회
company = client.blocks.company.get()

# 제안서 생성
proposal = client.proposals.generate(
    program_id="prog-ai-voucher-2026",
    preset_id="DIGITAL",
    format="DOCX"
)

# 상태 폴링
result = client.proposals.wait_for_completion(proposal.proposal_id)
print(result.download_url)
```

---

*Last updated: 2026-01-30*
