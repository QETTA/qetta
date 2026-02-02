#!/usr/bin/env tsx
/**
 * GitHub Student Pack 혜택 검증 스크립트
 *
 * 사용법:
 *   npm run pack:verify
 *
 * 기능:
 *   - AI 모델 설정 확인
 *   - DigitalOcean 크레딧 확인
 *   - MongoDB Atlas 크레딧 확인
 *   - JetBrains 라이선스 확인
 *   - Vercel Pro 상태 확인
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'pending' | 'unknown'
  message: string
  value?: string
  nextStep?: string
}

// ANSI 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function printHeader(text: string) {
  console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}${text}${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`)
}

function printResult(result: CheckResult) {
  const icon = {
    pass: '✅',
    fail: '❌',
    pending: '⏳',
    unknown: '❓',
  }[result.status]

  const color = {
    pass: colors.green,
    fail: colors.red,
    pending: colors.yellow,
    unknown: colors.yellow,
  }[result.status]

  console.log(`${icon} ${color}${result.name}${colors.reset}`)
  console.log(`   ${result.message}`)
  if (result.value) {
    console.log(`   ${colors.blue}현재값: ${result.value}${colors.reset}`)
  }
  if (result.nextStep) {
    console.log(`   ${colors.yellow}→ ${result.nextStep}${colors.reset}`)
  }
  console.log()
}

async function checkVSCodeSettings(): Promise<CheckResult> {
  const settingsPath = join(process.cwd(), '.vscode', 'settings.json')

  if (!existsSync(settingsPath)) {
    return {
      name: 'VS Code 설정',
      status: 'fail',
      message: '.vscode/settings.json 파일이 존재하지 않습니다',
      nextStep: 'VS Code 설정 파일을 생성하세요',
    }
  }

  try {
    const content = readFileSync(settingsPath, 'utf-8')

    // Claude Opus 4.5 확인
    const hasOpus45 = content.includes('claude-opus-4.5') || content.includes('claude-opus-4-5')

    // GPT-5.2-Codex 확인
    const hasCodex = content.includes('gpt-5.2-codex') || content.includes('gpt-5-2-codex')

    // 고급 설정 확인
    const hasMultiModel = content.includes('"multiModelEnabled": true')
    const hasExperimental = content.includes('"experimentalFeatures": true')
    const hasFiveInline = content.includes('"inlineSuggestCount": 5')

    if (hasOpus45 && hasCodex && hasMultiModel && hasExperimental && hasFiveInline) {
      return {
        name: 'AI 모델 설정',
        status: 'pass',
        message: 'Claude Opus 4.5 + GPT-5.2-Codex + 고급 기능 모두 활성화됨',
        value: '100% 최신화 완료',
      }
    } else {
      const missing = []
      if (!hasOpus45) missing.push('Claude Opus 4.5')
      if (!hasCodex) missing.push('GPT-5.2-Codex')
      if (!hasMultiModel) missing.push('멀티모델')
      if (!hasExperimental) missing.push('실험 기능')
      if (!hasFiveInline) missing.push('5개 인라인 제안')

      return {
        name: 'AI 모델 설정',
        status: 'fail',
        message: `일부 설정 누락: ${missing.join(', ')}`,
        nextStep: '.vscode/settings.json 파일을 다시 확인하세요',
      }
    }
  } catch (error) {
    return {
      name: 'AI 모델 설정',
      status: 'fail',
      message: `설정 파일 읽기 실패: ${error}`,
    }
  }
}

async function checkDigitalOcean(): Promise<CheckResult> {
  // DigitalOcean API 토큰이 환경 변수에 있는지 확인
  const token = process.env.DIGITALOCEAN_TOKEN

  if (!token) {
    return {
      name: 'DigitalOcean $200 크레딧',
      status: 'pending',
      message: '크레딧 신청 필요',
      nextStep: 'https://education.github.com/pack → DigitalOcean 신청',
    }
  }

  // API로 크레딧 확인 (토큰이 있을 경우)
  try {
    const response = await fetch('https://api.digitalocean.com/v2/account', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return {
        name: 'DigitalOcean $200 크레딧',
        status: 'unknown',
        message: 'API 인증 실패',
        nextStep: 'DIGITALOCEAN_TOKEN 환경 변수 확인',
      }
    }

    const data = await response.json()

    return {
      name: 'DigitalOcean $200 크레딧',
      status: 'pass',
      message: 'DigitalOcean 계정 연결됨',
      value: `Status: ${data.account.status}`,
    }
  } catch (error) {
    return {
      name: 'DigitalOcean $200 크레딧',
      status: 'pending',
      message: 'API 확인 불가 (토큰 미설정)',
      nextStep: '수동 확인: https://cloud.digitalocean.com/account/billing',
    }
  }
}

async function checkMongoDB(): Promise<CheckResult> {
  // MongoDB Atlas API 키 확인
  const publicKey = process.env.MONGODB_ATLAS_PUBLIC_KEY
  const privateKey = process.env.MONGODB_ATLAS_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    return {
      name: 'MongoDB Atlas $50 크레딧',
      status: 'pending',
      message: '크레딧 신청 필요',
      nextStep: 'https://education.github.com/pack → MongoDB 신청',
    }
  }

  return {
    name: 'MongoDB Atlas $50 크레딧',
    status: 'pending',
    message: 'API 키 설정됨 (수동 확인 필요)',
    nextStep: '수동 확인: https://cloud.mongodb.com/v2#/org/billing/overview',
  }
}

async function checkJetBrains(): Promise<CheckResult> {
  // JetBrains 라이선스는 로컬에서 자동 확인 불가
  return {
    name: 'JetBrains All Products Pack',
    status: 'pending',
    message: '라이선스 신청 상태 확인 필요',
    nextStep: '수동 확인: https://account.jetbrains.com/licenses',
  }
}

async function checkVercel(): Promise<CheckResult> {
  const vercelToken = process.env.VERCEL_TOKEN

  if (!vercelToken) {
    return {
      name: 'Vercel Pro 상태',
      status: 'unknown',
      message: 'Vercel 연결 미확인',
      nextStep: 'Vercel Dashboard에서 플랜 확인: https://vercel.com/account',
    }
  }

  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (!response.ok) {
      return {
        name: 'Vercel Pro 상태',
        status: 'unknown',
        message: 'API 인증 실패',
      }
    }

    const data = await response.json()
    const isPro = data.user?.billing?.plan === 'pro'

    return {
      name: 'Vercel Pro 상태',
      status: isPro ? 'pass' : 'pending',
      message: isPro ? 'Vercel Pro 활성화됨' : 'Vercel Hobby 사용 중',
      value: `Plan: ${data.user?.billing?.plan || 'hobby'}`,
      nextStep: isPro ? undefined : 'Vercel 지원팀 문의 (Student Pack 포함 여부)',
    }
  } catch (error) {
    return {
      name: 'Vercel Pro 상태',
      status: 'unknown',
      message: 'API 확인 불가',
      nextStep: '수동 확인: https://vercel.com/account',
    }
  }
}

async function checkGitHubCopilot(): Promise<CheckResult> {
  // GitHub Copilot은 VS Code 설정으로 확인
  const settingsPath = join(process.cwd(), '.vscode', 'settings.json')

  if (!existsSync(settingsPath)) {
    return {
      name: 'GitHub Copilot Pro',
      status: 'fail',
      message: 'VS Code 설정 없음',
    }
  }

  const content = readFileSync(settingsPath, 'utf-8')
  const hasCopilot = content.includes('github.copilot')

  return {
    name: 'GitHub Copilot Pro',
    status: hasCopilot ? 'pass' : 'fail',
    message: hasCopilot ? 'GitHub Copilot 설정 확인됨' : 'GitHub Copilot 설정 없음',
    nextStep: hasCopilot ? undefined : 'VS Code에서 GitHub Copilot 확장 설치',
  }
}

async function checkEnvironmentVariables(): Promise<CheckResult> {
  const required = ['DATABASE_URL', 'ANTHROPIC_API_KEY']

  const optional = [
    'DIGITALOCEAN_TOKEN',
    'MONGODB_ATLAS_PUBLIC_KEY',
    'MONGODB_ATLAS_PRIVATE_KEY',
    'VERCEL_TOKEN',
  ]

  const missing = required.filter((key) => !process.env[key])
  const optionalSet = optional.filter((key) => process.env[key])

  if (missing.length === 0) {
    return {
      name: '환경 변수',
      status: 'pass',
      message: `필수 환경 변수 ${required.length}개 모두 설정됨`,
      value: `선택 환경 변수: ${optionalSet.length}/${optional.length}`,
    }
  }

  return {
    name: '환경 변수',
    status: 'fail',
    message: `누락된 필수 환경 변수: ${missing.join(', ')}`,
    nextStep: '.env.local 파일 확인',
  }
}

async function generateSignupLinks(): Promise<void> {
  printHeader('🔗 Student Pack 신청 링크')

  const links = [
    {
      name: 'DigitalOcean $200',
      url: 'https://education.github.com/pack',
      value: '₩270,000',
      time: '5분',
    },
    {
      name: 'MongoDB Atlas $50',
      url: 'https://education.github.com/pack',
      value: '₩67,500',
      time: '5분',
    },
    {
      name: 'JetBrains DataGrip',
      url: 'https://www.jetbrains.com/academy/student-pack/',
      value: '₩800,000/년',
      time: '10분',
    },
    {
      name: 'Vercel Pro (확인)',
      url: 'https://vercel.com/support',
      value: '확인 필요',
      time: '5분',
    },
  ]

  links.forEach((link) => {
    console.log(`${colors.bold}${link.name}${colors.reset}`)
    console.log(`   ${colors.blue}${link.url}${colors.reset}`)
    console.log(`   가치: ${colors.green}${link.value}${colors.reset} | 소요: ${link.time}`)
    console.log()
  })

  console.log(`${colors.yellow}총 가치: ₩1,137,500 | 총 소요 시간: 25분${colors.reset}\n`)
}

async function main() {
  console.clear()
  printHeader('🎓 GitHub Student Pack 검증 시스템')

  console.log(`${colors.bold}검증 시작...${colors.reset}\n`)

  // 모든 검증 실행
  const results = await Promise.all([
    checkVSCodeSettings(),
    checkGitHubCopilot(),
    checkEnvironmentVariables(),
    checkDigitalOcean(),
    checkMongoDB(),
    checkJetBrains(),
    checkVercel(),
  ])

  // 결과 출력
  results.forEach(printResult)

  // 통계
  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const pending = results.filter((r) => r.status === 'pending').length
  const unknown = results.filter((r) => r.status === 'unknown').length
  const total = results.length

  printHeader('📊 검증 통계')
  console.log(`✅ 통과: ${colors.green}${passed}${colors.reset}/${total}`)
  console.log(`❌ 실패: ${colors.red}${failed}${colors.reset}/${total}`)
  console.log(`⏳ 대기: ${colors.yellow}${pending}${colors.reset}/${total}`)
  console.log(`❓ 불명: ${colors.yellow}${unknown}${colors.reset}/${total}`)
  console.log()

  const percentage = Math.round((passed / total) * 100)
  console.log(`전체 진행률: ${colors.bold}${percentage}%${colors.reset}`)
  console.log()

  // 신청 링크 표시
  if (pending > 0 || unknown > 0) {
    await generateSignupLinks()
  }

  // 다음 단계
  printHeader('⏭️  다음 단계')

  const nextSteps = results.filter((r) => r.nextStep).map((r) => `${r.name}: ${r.nextStep}`)

  if (nextSteps.length > 0) {
    nextSteps.forEach((step, i) => {
      console.log(`${i + 1}. ${step}`)
    })
  } else {
    console.log(`${colors.green}${colors.bold}모든 설정이 완료되었습니다! 🎉${colors.reset}`)
  }

  console.log()
}

main().catch(console.error)
