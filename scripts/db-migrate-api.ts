#!/usr/bin/env npx tsx
/**
 * KidsMap Database Migration via Supabase Management API
 *
 * Supabase Management API를 통한 SQL 실행
 *
 * 사용법:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx npx tsx scripts/db-migrate-api.ts
 *
 * Access Token 발급:
 *   https://app.supabase.com/account/tokens
 *
 * @module scripts/db-migrate-api
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

// ============================================
// Configuration
// ============================================

const SUPABASE_PROJECT_ID = 'onetwihfvaoprqvdrfck'
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is required')
  console.error('')
  console.error('Get your access token from:')
  console.error('https://app.supabase.com/account/tokens')
  console.error('')
  console.error('Usage:')
  console.error('  SUPABASE_ACCESS_TOKEN=sbp_xxx npm run db:migrate:api')
  process.exit(1)
}

// ============================================
// Management API
// ============================================

async function executeSQL(sql: string): Promise<{ success: boolean; error?: string; data?: any }> {
  const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/query`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        return { success: false, error: errorJson.message || errorText }
      } catch {
        return { success: false, error: errorText }
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================
// Migration Runner
// ============================================

async function runMigrations() {
  console.log('🚀 KidsMap Database Migration (Management API)')
  console.log('==============================================')
  console.log(`📍 Project: ${SUPABASE_PROJECT_ID}`)
  console.log('')

  // Test connection
  console.log('🔌 Testing connection...')
  const testResult = await executeSQL('SELECT 1 as test')
  if (!testResult.success) {
    console.error(`❌ Connection failed: ${testResult.error}`)
    process.exit(1)
  }
  console.log('   ✅ Connected!')
  console.log('')

  // Find migration files
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  let files: string[]

  try {
    files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
  } catch {
    console.error(`❌ Migrations directory not found: ${migrationsDir}`)
    process.exit(1)
  }

  if (files.length === 0) {
    console.log('✅ No migrations to run')
    return
  }

  console.log(`📁 Found ${files.length} migration(s)`)
  console.log('')

  // Run each migration
  for (const file of files) {
    const filePath = join(migrationsDir, file)
    console.log(`📄 Running: ${file}`)

    try {
      const sql = readFileSync(filePath, 'utf-8')

      // Split by semicolon (simple approach for now)
      const statements = splitSqlStatements(sql)

      let successCount = 0
      let skipCount = 0
      let errorCount = 0

      for (const statement of statements) {
        const trimmed = statement.trim()
        if (!trimmed) continue

        const result = await executeSQL(trimmed)

        if (result.success) {
          successCount++
        } else if (
          result.error?.includes('already exists') ||
          result.error?.includes('duplicate key') ||
          result.error?.includes('42710') ||
          result.error?.includes('42P07')
        ) {
          skipCount++
        } else {
          errorCount++
          console.log(`   ⚠️  ${result.error?.substring(0, 80)}...`)
        }
      }

      console.log(`   ✅ Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`)
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('')

  // Verify tables
  console.log('🔍 Verifying tables...')
  const tables = ['kidsmap_place_blocks', 'kidsmap_content_blocks', 'kidsmap_block_stats']

  for (const table of tables) {
    const result = await executeSQL(`SELECT COUNT(*) FROM ${table}`)
    if (result.success) {
      console.log(`   ✅ ${table}: ${result.data?.[0]?.count || 0} rows`)
    } else {
      console.log(`   ❌ ${table}: ${result.error}`)
    }
  }

  console.log('')
  console.log('==============================================')
  console.log('✅ Migration complete!')
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''

  const lines = sql.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip pure comments
    if (trimmedLine.startsWith('--') && !inDollarQuote) {
      continue
    }

    // Check for dollar quote start/end
    const dollarMatch = line.match(/\$([a-zA-Z_]*)\$/g)
    if (dollarMatch) {
      for (const match of dollarMatch) {
        if (!inDollarQuote) {
          inDollarQuote = true
          dollarTag = match
        } else if (match === dollarTag) {
          inDollarQuote = false
          dollarTag = ''
        }
      }
    }

    current += line + '\n'

    // If not in dollar quote and line ends with semicolon
    if (!inDollarQuote && trimmedLine.endsWith(';')) {
      statements.push(current.trim())
      current = ''
    }
  }

  if (current.trim()) {
    statements.push(current.trim())
  }

  return statements
}

runMigrations().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
