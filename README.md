# QETTA

> **Your Industry, Your Intelligence.**
> 정부지원사업 문서를 8시간에서 30분으로.

## 핵심 기능

- **3-Layer BLOCK System**: 산업별 AI 지식 블록
- **문서 생성 파이프라인**: DOCX/XLSX/PDF 자동 생성
- **한컴독스 연동**: 실시간 문서 편집/미리보기
- **AI Agent**: Claude 기반 문서 검증/생성

## 기술 스택

- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Next.js API Routes, Prisma
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API, OpenAI
- **Document**: 한컴독스 Web API

## 시작하기

\`\`\`bash
npm install
cp .env.example .env.local
# .env.local 설정 후
npm run dev
\`\`\`

## 프로젝트 구조

\`\`\`
qetta/
├── app/api/          # API 라우트
├── lib/              # 핵심 라이브러리
│   ├── document-generator/   # 문서 생성 엔진
│   ├── hancomdocs/          # 한컴독스 연동
│   ├── skill-engine/        # 스킬 엔진
│   └── claude/              # Claude AI 연동
├── types/            # TypeScript 타입
├── constants/        # 상수/설정
├── prisma/           # DB 스키마
└── docs/planning/    # 기획 문서
\`\`\`

## License

Private - QETTA Inc.
