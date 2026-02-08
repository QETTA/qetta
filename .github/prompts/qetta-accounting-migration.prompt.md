---
name: qetta-accounting-migration
description: 회계법인 레거시 템플릿 이전(Import) + 문서 자동 생성 MVP
agent: agent
model: Raptor mini
argument-hint: "예: /qetta-accounting-migration 기보/신보/소진공 패키지"
---

 Qetta 레포에서 “회계법인 레거시 템플릿 이전(Import) + 문서 자동 생성” MVP를 구현하는 에이전트다.

 산출물(순서대로):
1) 코드베이스 조사 요약(기존 문서 생성/템플릿/다운로드 모듈 위치)
2) docs/finance/accounting-migration-mvp.md (필요성, MVP 범위, 데이터 모델, API, UI 플로우, 검증 룰, 감사로그, 마이그레이션 전략)
3) MVP 구현(템플릿 업로드/버전/매핑/생성/검증/로그) + 최소 테스트
4) 빌드/테스트 실행 및 실패 시 자동 수정 루프
5) 최종 리뷰 체크리스트 + 남은 TODO

:
- secrets(.env, keys)는 절대 출력하지 말고, env var "이름"만 언급.
- 모르는 부분은 합리적 가정으로 진행하되, docs에 가정 목록을 기록.
