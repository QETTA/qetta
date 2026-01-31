# QETTA 문서 버전 관리

> **현재 버전: v2.1** (확정일: 2026-01-30)

## 버전 히스토리

| 버전 | 날짜 | 주요 변경 사항 |
|------|------|---------------|
| v2.1 | 2026-01-30 | 3-Layer Block Engine 도입, Industry Block 10개로 재정의, API 명세 추가 |
| v2.0 | 2026-01-15 | skill-engine 통합, Industry Block 12개 정의, BLOCK 3.0 아키텍처 |
| v1.0 | 2025-12-01 | 초기 버전, 단일 Domain Engine |

---

## 문서 구조

### 현재 문서 (v2.1)

| 파일 | 설명 | 최종 수정 |
|------|------|----------|
| `00-version-control.md` | 버전 관리 (본 문서) | 2026-01-30 |
| `01-master-document-v2.1.md` | 비즈니스 마스터 문서 | 예정 |
| `02-technical-spec.md` | 기술 명세 (3-Layer 포함) | 예정 |
| `03-api-reference.md` | API 명세 | 2026-01-30 |
| `04-block-definitions.md` | Block 정의 (10개) | 2026-01-30 |
| `05-frontend-guide.md` | Claude Code 지시서 | 예정 |
| `06-design-system.md` | Linear 디자인 시스템 | 예정 |

### 아카이브

```
docs/archived/
├── v2.0/               # v2.0 문서 (참고용)
│   ├── 08-master-document.md
│   └── 03-block-system.md
└── v1.0/               # v1.0 문서 (참고용)
```

---

## 변경 관리 규칙

### 1. 버전 번호 규칙

- **Major (X.0)**: 아키텍처 변경, 호환성 파괴
- **Minor (X.Y)**: 기능 추가, 하위 호환 유지
- **Patch (X.Y.Z)**: 버그 수정, 문서 오류 정정

### 2. 문서 수정 절차

1. 변경 사항 검토
2. 본 문서(`00-version-control.md`)에 기록
3. 해당 문서 수정
4. Git 커밋 (메시지 형식: `docs: [문서명] v2.1 업데이트`)

### 3. 폐기 문서 처리

- 이전 버전 문서는 `archived/vX.X/`로 이동
- 완전 삭제하지 않고 참고용으로 보관
- 아카이브된 문서 상단에 `⚠️ DEPRECATED` 경고 추가

---

## v2.1 변경 상세

### 기술적 변경

#### 1. 3-Layer Block Engine 도입

```
lib/block-engine/
├── types.ts           # 3-Layer 타입 정의
├── domain-engine.ts   # Layer 1: 기존 skill-engine 래핑
├── company-block.ts   # Layer 2: Mem0 패턴 압축
├── session-context.ts # Layer 3: 세션 관리
├── assembler.ts       # 컨텍스트 조립기
└── index.ts           # Barrel exports
```

#### 2. Industry Block 재정의 (12개 → 10개)

| v2.0 (12개) | v2.1 (10개) | 변경 사유 |
|-------------|-------------|-----------|
| AUTOMOTIVE, SEMICONDUCTOR, ELECTRONICS | ELECTRONICS, AUTOMOTIVE | 통합 |
| BIO_PHARMA, HEALTHCARE | BIO_PHARMA | 통합 |
| ENERGY, ENVIRONMENT | ENVIRONMENT | 통합 |
| (신규) | FOOD, TEXTILE, METAL, GENERAL | AI바우처 실적 기반 추가 |

#### 3. Token Budget Allocation

| Layer | Tokens | 비고 |
|-------|--------|------|
| System Prompt | ~500 | 고정 |
| Layer 1 (Domain) | ~2000 | Industry + Program Block |
| Layer 2 (Company) | ~1500 | Mem0 압축 |
| Layer 3 (Session) | ~500 | 최근 대화 |
| **Total Base** | **~4500** | |
| **Headroom** | **~3500** | 사용자 입력 + AI 응답 |

### 비즈니스 변경

#### 1. 가격 티어 조정

| 티어 | v2.0 | v2.1 | 변경 |
|------|------|------|------|
| TRIAL | 10건/14일 | 15건/14일 | +5건 |
| STARTER | 30건/₩9.9만 | 50건/₩9.9만 | +20건 |
| GROWTH | 100건/₩19.9만 | 150건/₩19.9만 | +50건 |

#### 2. 핵심 지표 현실화

| 지표 | v2.0 | v2.1 | 비고 |
|------|------|------|------|
| 시간 단축 | 95% | 93.8% | 현실적 조정 |
| 반려율 감소 | 95% | 측정 예정 | Pilot 후 확정 |

---

## 관련 코드베이스

### 영향받는 파일

```
lib/block-engine/          # 신규 생성
lib/skill-engine/          # 기존 유지 (래핑됨)
lib/super-model/loader.ts  # IndustryBlockType 참조
types/inbox.ts             # 타입 re-export
```

### 호환성

- **하위 호환**: 기존 `skill-engine` API 그대로 사용 가능
- **신규 기능**: `block-engine`으로 3-Layer 접근

---

## 연락처

- **문서 관리자**: Claude Code Automation
- **최종 승인**: QETTA Tech Lead
- **문의**: support@qetta.io

---

*Last updated: 2026-01-30*
