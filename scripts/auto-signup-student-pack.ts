#!/usr/bin/env tsx
/**
 * GitHub Student Pack 자동 신청 가이드
 *
 * 사용법:
 *   npm run pack:signup
 *
 * 기능:
 *   - 브라우저에서 필요한 페이지 자동 열기
 *   - 단계별 신청 가이드 제공
 *   - 진행 상황 추적
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as readline from 'readline'

const execAsync = promisify(exec)

// ANSI 색상
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

interface SignupStep {
  id: string
  name: string
  url: string
  value: string
  time: string
  steps: string[]
  verification: string
}

const signupSteps: SignupStep[] = [
  {
    id: 'digitalocean',
    name: 'DigitalOcean $200 크레딧',
    url: 'https://education.github.com/pack',
    value: '₩270,000',
    time: '5분',
    steps: [
      '1. GitHub Education Pack 페이지에서 "DigitalOcean" 검색',
      '2. "Get access by connecting your GitHub account" 클릭',
      '3. DigitalOcean 계정 생성 또는 로그인',
      '4. GitHub 계정 연동',
      '5. $200 크레딧 자동 적용 확인',
    ],
    verification: 'https://cloud.digitalocean.com/account/billing',
  },
  {
    id: 'mongodb',
    name: 'MongoDB Atlas $50 크레딧',
    url: 'https://education.github.com/pack',
    value: '₩67,500 + ₩200,000 인증서',
    time: '5분',
    steps: [
      '1. GitHub Education Pack 페이지에서 "MongoDB" 검색',
      '2. "Get MongoDB Atlas credits and certifications" 클릭',
      '3. "Redeem offer" 버튼 클릭',
      '4. MongoDB 계정 생성 (Sign Up with GitHub)',
      '5. 프로모션 코드 적용 (이메일 확인)',
      '6. Atlas Console → Billing → Credits 확인',
    ],
    verification: 'https://cloud.mongodb.com/v2#/org/billing/overview',
  },
  {
    id: 'jetbrains',
    name: 'JetBrains All Products Pack',
    url: 'https://www.jetbrains.com/academy/student-pack/',
    value: '₩800,000/년',
    time: '10분',
    steps: [
      '1. JetBrains Student Pack 페이지 접속',
      '2. "Apply now" 버튼 클릭',
      '3. "I am a STUDENT" 선택',
      '4. "Authorize with GitHub" 클릭 (가장 빠름)',
      '5. GitHub Student Pack 자동 인증',
      '6. 이메일로 라이선스 확인',
      '7. DataGrip 다운로드 및 설치',
      '8. 라이선스 활성화',
    ],
    verification: 'https://account.jetbrains.com/licenses',
  },
  {
    id: 'vercel',
    name: 'Vercel Pro 확인',
    url: 'https://vercel.com/support',
    value: '확인 필요',
    time: '5분',
    steps: [
      '1. Vercel Dashboard 접속',
      '2. Settings → Support',
      '3. "New Support Ticket" 클릭',
      '4. Subject: "GitHub Student Pack - Pro Plan Eligibility"',
      '5. Message 작성:',
      '   "I\'m a verified GitHub Student Developer Pack member.',
      '   Does Vercel Pro include in the Student Pack?',
      '   If yes, how can I activate it?"',
      '6. Submit 후 답변 대기',
    ],
    verification: 'https://vercel.com/account',
  },
]

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform

  try {
    if (platform === 'win32') {
      await execAsync(`start ${url}`)
    } else if (platform === 'darwin') {
      await execAsync(`open ${url}`)
    } else {
      await execAsync(`xdg-open ${url}`)
    }
  } catch (error) {
    console.log(`${colors.yellow}브라우저 자동 열기 실패. 수동으로 열어주세요:${colors.reset}`)
    console.log(`${colors.blue}${url}${colors.reset}\n`)
  }
}

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function processSignupStep(step: SignupStep, index: number): Promise<boolean> {
  console.clear()
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}`)
  console.log(
    `${colors.bold}${colors.cyan}Step ${index + 1}/${signupSteps.length}: ${step.name}${colors.reset}`
  )
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}\n`)

  console.log(`${colors.bold}가치:${colors.reset} ${colors.green}${step.value}${colors.reset}`)
  console.log(`${colors.bold}소요 시간:${colors.reset} ${step.time}`)
  console.log(`${colors.bold}URL:${colors.reset} ${colors.blue}${step.url}${colors.reset}\n`)

  console.log(`${colors.bold}${colors.yellow}신청 단계:${colors.reset}`)
  step.steps.forEach((s) => console.log(`  ${s}`))
  console.log()

  const answer = await askQuestion(
    `${colors.bold}브라우저에서 이 페이지를 열까요? (y/n):${colors.reset} `
  )

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log(`\n${colors.cyan}브라우저에서 페이지를 여는 중...${colors.reset}\n`)
    await openBrowser(step.url)
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  console.log(`\n${colors.yellow}위 단계를 따라 신청을 완료하세요.${colors.reset}`)
  console.log(`${colors.yellow}완료 후 엔터를 눌러 다음 단계로 진행하세요.${colors.reset}\n`)

  await askQuestion(`${colors.bold}완료했으면 엔터를 누르세요...${colors.reset}`)

  // 검증 페이지 열기
  const verifyAnswer = await askQuestion(
    `\n${colors.bold}검증 페이지를 열어 확인하시겠습니까? (y/n):${colors.reset} `
  )

  if (verifyAnswer.toLowerCase() === 'y' || verifyAnswer.toLowerCase() === 'yes') {
    console.log(`\n${colors.cyan}검증 페이지를 여는 중...${colors.reset}\n`)
    await openBrowser(step.verification)
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  const confirmAnswer = await askQuestion(
    `\n${colors.bold}${step.name} 신청이 완료되었습니까? (y/n/skip):${colors.reset} `
  )

  return confirmAnswer.toLowerCase() === 'y' || confirmAnswer.toLowerCase() === 'yes'
}

async function showSummary(completed: boolean[]): Promise<void> {
  console.clear()
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}신청 완료 요약${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}\n`)

  signupSteps.forEach((step, i) => {
    const status = completed[i]
      ? `${colors.green}✅ 완료${colors.reset}`
      : `${colors.yellow}⏳ 대기${colors.reset}`

    console.log(`${status} ${step.name} (${step.value})`)
  })

  const completedCount = completed.filter(Boolean).length
  const totalValue = completedCount === 4 ? '₩1,137,500' : '일부 완료'

  console.log()
  console.log(`${colors.bold}완료:${colors.reset} ${completedCount}/${signupSteps.length}`)
  console.log(`${colors.bold}총 가치:${colors.reset} ${colors.green}${totalValue}${colors.reset}`)
  console.log()

  if (completedCount === signupSteps.length) {
    console.log(
      `${colors.bold}${colors.green}축하합니다! 모든 신청이 완료되었습니다! 🎉${colors.reset}`
    )
  } else {
    console.log(`${colors.yellow}나머지 항목은 나중에 신청할 수 있습니다.${colors.reset}`)
  }
  console.log()
}

async function generateVerificationScript(): Promise<void> {
  console.log(`${colors.bold}${colors.cyan}다음 단계: 검증 스크립트 실행${colors.reset}\n`)
  console.log(`신청이 완료되면 다음 명령어로 검증하세요:\n`)
  console.log(`${colors.bold}${colors.blue}npm run pack:verify${colors.reset}\n`)
}

async function createEnvTemplate(): Promise<void> {
  const answer = await askQuestion(
    `\n${colors.bold}.env.local 템플릿을 생성하시겠습니까? (y/n):${colors.reset} `
  )

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    return
  }

  console.log(`\n${colors.cyan}.env.local 파일에 다음 환경 변수를 추가하세요:${colors.reset}\n`)

  const envTemplate = `
# DigitalOcean (선택적 - API 검증용)
DIGITALOCEAN_TOKEN=

# MongoDB Atlas (선택적 - API 검증용)
MONGODB_ATLAS_PUBLIC_KEY=
MONGODB_ATLAS_PRIVATE_KEY=

# Vercel (선택적 - API 검증용)
VERCEL_TOKEN=

# DigitalOcean PostgreSQL (신청 후)
# DATABASE_URL=postgresql://doadmin:PASSWORD@db-xxxx.ondigitalocean.com:25060/qetta?sslmode=require

# MongoDB Atlas (신청 후)
# MONGODB_URI=mongodb+srv://username:password@qetta-cluster.xxxxx.mongodb.net/qetta
`

  console.log(`${colors.blue}${envTemplate}${colors.reset}`)
}

async function main() {
  console.clear()
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}🎓 GitHub Student Pack 자동 신청 가이드${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}\n`)

  console.log(`${colors.bold}총 가치:${colors.reset} ${colors.green}₩1,137,500${colors.reset}`)
  console.log(`${colors.bold}총 소요 시간:${colors.reset} 약 25분`)
  console.log(`${colors.bold}신청 항목:${colors.reset} ${signupSteps.length}개\n`)

  const startAnswer = await askQuestion(
    `${colors.bold}신청을 시작하시겠습니까? (y/n):${colors.reset} `
  )

  if (startAnswer.toLowerCase() !== 'y' && startAnswer.toLowerCase() !== 'yes') {
    console.log(`\n${colors.yellow}신청이 취소되었습니다.${colors.reset}`)
    console.log(
      `${colors.yellow}나중에 \`npm run pack:signup\`으로 다시 시작할 수 있습니다.${colors.reset}\n`
    )
    return
  }

  const completed: boolean[] = []

  // 각 단계 실행
  for (let i = 0; i < signupSteps.length; i++) {
    const result = await processSignupStep(signupSteps[i], i)
    completed.push(result)

    if (i < signupSteps.length - 1) {
      const continueAnswer = await askQuestion(
        `\n${colors.bold}다음 단계로 진행하시겠습니까? (y/n/quit):${colors.reset} `
      )

      if (continueAnswer.toLowerCase() === 'quit' || continueAnswer.toLowerCase() === 'q') {
        console.log(`\n${colors.yellow}신청이 중단되었습니다.${colors.reset}`)
        break
      }

      if (continueAnswer.toLowerCase() !== 'y' && continueAnswer.toLowerCase() !== 'yes') {
        console.log(`\n${colors.yellow}나머지 항목은 건너뜁니다.${colors.reset}`)
        // 나머지를 false로 채움
        for (let j = i + 1; j < signupSteps.length; j++) {
          completed.push(false)
        }
        break
      }
    }
  }

  // 요약 표시
  await showSummary(completed)

  // 검증 스크립트 안내
  await generateVerificationScript()

  // 환경 변수 템플릿 생성
  await createEnvTemplate()

  console.log(`${colors.bold}${colors.green}신청 프로세스가 완료되었습니다!${colors.reset}\n`)
}

main().catch(console.error)
