#!/usr/bin/env node
/**
 * Claude Code Token Usage Monitor
 *
 * 실시간 토큰 사용량 추적 및 예산 관리
 * 매일 자동 실행하여 사용 패턴 분석
 */

import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface TokenUsage {
  date: string
  tokensUsed: number
  tokensRemaining: number
  percentUsed: number
  category: string
  description: string
}

interface DailyReport {
  date: string
  totalTokens: number
  usedTokens: number
  remainingTokens: number
  percentUsed: number
  dailyUsage: TokenUsage[]
  projectedEndDate: string
  status: 'healthy' | 'warning' | 'critical'
  recommendations: string[]
}

const MONTHLY_BUDGET = 20_000_000 // 20M tokens
const DATA_DIR = join(process.cwd(), '.claude-data')
const USAGE_FILE = join(DATA_DIR, 'token-usage.json')

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function loadUsageData(): Record<string, TokenUsage[]> {
  if (!existsSync(USAGE_FILE)) {
    return {}
  }
  return JSON.parse(readFileSync(USAGE_FILE, 'utf-8'))
}

function saveUsageData(data: Record<string, TokenUsage[]>): void {
  writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2))
}

function logTokenUsage(tokensUsed: number, category: string, description: string): void {
  const data = loadUsageData()
  const monthKey = getCurrentMonthKey()

  if (!data[monthKey]) {
    data[monthKey] = []
  }

  const totalUsed = data[monthKey].reduce((sum, entry) => sum + entry.tokensUsed, 0) + tokensUsed
  const remaining = MONTHLY_BUDGET - totalUsed
  const percentUsed = (totalUsed / MONTHLY_BUDGET) * 100

  const entry: TokenUsage = {
    date: new Date().toISOString(),
    tokensUsed,
    tokensRemaining: remaining,
    percentUsed,
    category,
    description,
  }

  data[monthKey].push(entry)
  saveUsageData(data)

  console.log(`✅ Logged ${tokensUsed.toLocaleString()} tokens (${category})`)
  console.log(
    `📊 Total used: ${totalUsed.toLocaleString()} / ${MONTHLY_BUDGET.toLocaleString()} (${percentUsed.toFixed(1)}%)`
  )
  console.log(`💰 Remaining: ${remaining.toLocaleString()} tokens`)
}

function generateDailyReport(): DailyReport {
  const data = loadUsageData()
  const monthKey = getCurrentMonthKey()
  const usage = data[monthKey] || []

  const totalUsed = usage.reduce((sum, entry) => sum + entry.tokensUsed, 0)
  const remaining = MONTHLY_BUDGET - totalUsed
  const percentUsed = (totalUsed / MONTHLY_BUDGET) * 100

  // Calculate projection
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const currentDay = new Date().getDate()
  const avgDailyUsage = totalUsed / currentDay
  const projectedTotal = avgDailyUsage * daysInMonth
  const projectedEndDay = Math.ceil(MONTHLY_BUDGET / avgDailyUsage)

  // Determine status
  let status: 'healthy' | 'warning' | 'critical'
  if (percentUsed < 80) {
    status = 'healthy'
  } else if (percentUsed < 95) {
    status = 'warning'
  } else {
    status = 'critical'
  }

  // Generate recommendations
  const recommendations: string[] = []
  if (projectedTotal > MONTHLY_BUDGET) {
    recommendations.push(
      `⚠️ Projected to exceed budget by ${((projectedTotal - MONTHLY_BUDGET) / 1000).toFixed(0)}K tokens`
    )
    recommendations.push('💡 Use MCP servers (Sequential Thinking, Serena, Context7) more')
    recommendations.push('💡 Delegate more tactical work to Copilot')
    recommendations.push('💡 Use /clear to reset context more frequently')
  }

  if (percentUsed > 90) {
    recommendations.push('🚨 Token budget >90% used')
    recommendations.push('💡 Switch to Haiku model for simple tasks')
    recommendations.push('💡 Batch similar operations together')
  }

  if (avgDailyUsage > 800_000) {
    recommendations.push('📈 High daily usage detected')
    recommendations.push('💡 Review recent prompts for optimization opportunities')
  }

  const projectedEndDate =
    projectedEndDay <= daysInMonth
      ? new Date(new Date().getFullYear(), new Date().getMonth(), projectedEndDay).toISOString()
      : 'End of month'

  return {
    date: new Date().toISOString(),
    totalTokens: MONTHLY_BUDGET,
    usedTokens: totalUsed,
    remainingTokens: remaining,
    percentUsed,
    dailyUsage: usage.slice(-10), // Last 10 entries
    projectedEndDate,
    status,
    recommendations,
  }
}

function printReport(report: DailyReport): void {
  console.log('\n' + '='.repeat(70))
  console.log('📊 CLAUDE CODE TOKEN USAGE REPORT')
  console.log('='.repeat(70))
  console.log(`\n📅 Date: ${new Date(report.date).toLocaleString('ko-KR')}`)
  console.log(`\n💰 Budget Overview:`)
  console.log(`   Total Budget: ${report.totalTokens.toLocaleString()} tokens`)
  console.log(
    `   Used:         ${report.usedTokens.toLocaleString()} tokens (${report.percentUsed.toFixed(1)}%)`
  )
  console.log(`   Remaining:    ${report.remainingTokens.toLocaleString()} tokens`)

  const statusEmoji = {
    healthy: '🟢',
    warning: '🟡',
    critical: '🔴',
  }
  console.log(`\n${statusEmoji[report.status]} Status: ${report.status.toUpperCase()}`)

  if (report.projectedEndDate !== 'End of month') {
    console.log(
      `\n⚠️  Projected token exhaustion: ${new Date(report.projectedEndDate).toLocaleDateString('ko-KR')}`
    )
  }

  if (report.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`)
    report.recommendations.forEach((rec) => console.log(`   ${rec}`))
  }

  console.log(`\n📈 Recent Usage (Last 10 entries):`)
  console.log('   ' + '-'.repeat(66))
  report.dailyUsage.forEach((entry) => {
    const date = new Date(entry.date).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    console.log(
      `   ${date} | ${entry.tokensUsed.toLocaleString().padStart(8)} tokens | ${entry.category.padEnd(15)} | ${entry.description.slice(0, 30)}`
    )
  })

  console.log('\n' + '='.repeat(70))
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'log') {
    // Log token usage
    const tokens = parseInt(args[1] || '0')
    const category = args[2] || 'general'
    const description = args.slice(3).join(' ') || 'Manual entry'

    if (tokens === 0) {
      console.error('❌ Usage: npm run tokens:log <tokens> <category> <description>')
      console.error('   Example: npm run tokens:log 50000 architecture "Design FOOD BLOCK"')
      process.exit(1)
    }

    logTokenUsage(tokens, category, description)
  } else if (command === 'report' || !command) {
    // Generate and print daily report
    const report = generateDailyReport()
    printReport(report)

    // Save report to file
    const reportFile = join(DATA_DIR, `report-${getCurrentMonthKey()}.json`)
    writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`\n💾 Report saved to: ${reportFile}`)
  } else {
    console.error('❌ Unknown command:', command)
    console.error('   Available commands: log, report')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
