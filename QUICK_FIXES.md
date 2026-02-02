# QETTA Quick Fixes 🔧

> **즉시 적용 가능한 코드**  
> 복사-붙여넣기로 빠르게 수정

---

## 1️⃣ Tailwind 4 호환성 수정 (2분)

### CTASection.tsx
```tsx
// 파일: components/landing/blocks/CTASection.tsx
// 라인 25 변경

// ❌ Before
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 ...">

// ✅ After
<div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-950 ...">
```

### forgot-password-form.tsx
```tsx
// 파일: components/auth/forgot-password-form.tsx
// 라인 98 변경

// ❌ Before
<div className="flex-shrink-0">

// ✅ After
<div className="shrink-0">
```

---

## 2️⃣ MQTT 테스트 타임아웃 수정 (5분)

```typescript
// 파일: lib/monitor/sensors/__tests__/mqtt-client.test.ts
// 라인 255 근처

// ❌ Before
it('starts and stops correctly', async () => {

// ✅ After (타임아웃 증가)
it('starts and stops correctly', async () => {
  // 테스트 내용
}, 30000) // 30초 타임아웃

// 또는 전체 테스트 파일 상단에 추가
vi.setConfig({ testTimeout: 30000 })
```

---

## 3️⃣ Vercel 캐싱 최적화 (5분)

```json
// 파일: vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && next build",
  "installCommand": "npm install",
  "regions": ["icn1"],
  "build": {
    "env": {
      "SKIP_ENV_VALIDATION": "true"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## 4️⃣ CI 캐싱 최적화 (10분)

```yaml
# 파일: .github/workflows/ci.yml
# jobs.lint.steps 에 추가

- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Cache Next.js build
  uses: actions/cache@v4
  with:
    path: |
      .next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('package-lock.json') }}-
```

---

## 5️⃣ 마케팅 페이지 ISR 설정 (3분)

```typescript
// 파일: app/(marketing)/page.tsx (또는 landing page)

export const revalidate = 3600 // 1시간마다 재생성

// 또는 generateStaticParams 사용
export async function generateStaticParams() {
  return [] // 정적 생성
}
```

---

## 6️⃣ Bundle Analyzer 실행

```bash
# 번들 크기 분석
npm run build:analyze

# 결과 확인 후 큰 패키지 확인
# - @sentry/nextjs: 필요시만 로드
# - lucide-react: 개별 아이콘 import
# - @tiptap/*: dynamic import 고려
```

---

## 7️⃣ 미사용 패키지 정리

```bash
# 미사용 패키지 확인
npx depcheck

# 예시 제거 (확인 후)
npm uninstall <unused-package>
```

---

## 8️⃣ ESLint 자동 수정

```bash
# 자동 수정 가능한 에러 일괄 수정
npm run lint:fix

# 특정 규칙만 수정
npx eslint --fix --rule 'prefer-const: error' .
```

---

## 9️⃣ TypeScript any 타입 검색

```bash
# PowerShell에서 any 타입 검색
Get-ChildItem -Recurse -Include "*.ts","*.tsx" | 
  Where-Object { $_.FullName -notmatch "node_modules|\.d\.ts" } |
  Select-String -Pattern ": any\b|as any\b" |
  Select-Object -First 20
```

---

## 🔟 Sentry 설정 확인

```typescript
// 파일: sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% 샘플링 (비용 절감)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  // 환경 구분
  environment: process.env.NODE_ENV,
  
  // 무시할 에러
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
  ],
});
```

---

## ⏱️ 예상 소요 시간

| 작업 | 시간 |
|------|------|
| Tailwind 수정 | 2분 |
| MQTT 테스트 | 5분 |
| Vercel 캐싱 | 5분 |
| CI 캐싱 | 10분 |
| ISR 설정 | 3분 |
| Bundle 분석 | 15분 |
| ESLint 수정 | 10분 |
| **총계** | **~50분** |

---

## 🎯 우선순위 순서

1. **Tailwind 수정** (빌드 경고 제거)
2. **Vercel 캐싱** (성능 개선)
3. **CI 캐싱** (빌드 시간 단축)
4. **ESLint 수정** (코드 품질)
5. **Bundle 분석** (성능 최적화)

---

## 🤖 Copilot 명령어

```
@workspace QUICK_FIXES.md의 1번부터 순서대로 적용해줘.
각 수정 후 npm run validate로 검증해.
```
