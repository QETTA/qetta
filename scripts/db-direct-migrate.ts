#!/usr/bin/env npx tsx
/**
 * KidsMap Direct Database Migration
 *
 * 직접 PostgreSQL 연결로 마이그레이션 실행
 * Supabase CLI 없이 pg 패키지로 연결
 *
 * 사용법:
 *   npx tsx scripts/db-direct-migrate.ts
 *   npm run db:migrate:direct
 *
 * @module scripts/db-direct-migrate
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import pg from 'pg'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

// ============================================
// Configuration
// ============================================

const SUPABASE_PROJECT_ID = 'onetwihfvaoprqvdrfck'
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'Wowns21299!'

// Vercel Supabase integration auto-syncs these:
const POSTGRES_URL = process.env.POSTGRES_URL
const POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING

// Supabase connection string formats:
// Direct: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
// Pooler: postgresql://postgres.[project]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

const connectionConfigs = [
  // Vercel integration URLs (highest priority)
  ...(POSTGRES_URL_NON_POOLING ? [{
    name: 'Vercel Non-Pooling',
    connectionString: POSTGRES_URL_NON_POOLING,
  }] : []),
  ...(POSTGRES_URL ? [{
    name: 'Vercel Pooling',
    connectionString: POSTGRES_URL,
  }] : []),
  // Fallback to manual Supabase config
  {
    name: 'Direct Connection',
    connectionString: `postgresql://postgres:${DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`,
  },
  {
    name: 'Pooler (Transaction)',
    connectionString: `postgresql://postgres.${SUPABASE_PROJECT_ID}:${DB_PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`,
  },
  {
    name: 'Pooler (Session)',
    connectionString: `postgresql://postgres.${SUPABASE_PROJECT_ID}:${DB_PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`,
  },
]

// ============================================
// Migration Runner
// ============================================

async function tryConnect(config: { name: string; connectionString: string }): Promise<pg.Client | null> {
  console.log(`   Trying ${config.name}...`)

  const client = new pg.Client({
    connectionString: config.connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    await client.connect()
    const result = await client.query('SELECT 1 as test')
    if (result.rows[0].test === 1) {
      console.log(`   ✅ ${config.name} connected!`)
      return client
    }
  } catch (error: any) {
    console.log(`   ❌ ${config.name} failed: ${error.message}`)
  }

  try {
    await client.end()
  } catch {
    // Ignore cleanup errors
  }

  return null
}

async function runMigration(client: pg.Client, sql: string): Promise<{ success: number; skipped: number; errors: string[] }> {
  const results = { success: 0, skipped: 0, errors: [] as string[] }

  // Split by semicolon but be careful with function bodies
  const statements = splitSqlStatements(sql)

  for (const statement of statements) {
    const trimmed = statement.trim()
    if (!trimmed || trimmed.startsWith('--')) continue

    try {
      await client.query(trimmed)
      results.success++
    } catch (error: any) {
      // Check for "already exists" type errors
      if (
        error.code === '42710' || // duplicate_object
        error.code === '42P07' || // duplicate_table
        error.code === '42P16' || // duplicate_table (alternative)
        error.message?.includes('already exists') ||
        error.message?.includes('duplicate key')
      ) {
        results.skipped++
      } else {
        results.errors.push(`${error.message} (${trimmed.substring(0, 50)}...)`)
      }
    }
  }

  return results
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

    // If not in dollar quote and line ends with semicolon, it's a statement boundary
    if (!inDollarQuote && trimmedLine.endsWith(';')) {
      statements.push(current.trim())
      current = ''
    }
  }

  // Add any remaining content
  if (current.trim()) {
    statements.push(current.trim())
  }

  return statements
}

async function main() {
  console.log('🚀 KidsMap Direct Database Migration')
  console.log('====================================')
  console.log('')

  // Try to connect
  console.log('🔌 Connecting to Supabase PostgreSQL...')
  let client: pg.Client | null = null

  for (const config of connectionConfigs) {
    client = await tryConnect(config)
    if (client) break
  }

  if (!client) {
    console.error('')
    console.error('❌ Could not connect to database')
    console.error('')
    console.error('Please run the migration manually in Supabase SQL Editor:')
    console.error('https://supabase.com/dashboard/project/onetwihfvaoprqvdrfck/sql')
    console.error('')
    console.error('File: supabase/migrations/001_kidsmap_tables.sql')
    process.exit(1)
  }

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
    await client.end()
    process.exit(1)
  }

  if (files.length === 0) {
    console.log('✅ No migrations to run')
    await client.end()
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
      const result = await runMigration(client, sql)

      console.log(`   ✅ Success: ${result.success}, Skipped: ${result.skipped}`)

      if (result.errors.length > 0) {
        console.log(`   ⚠️  Errors:`)
        for (const err of result.errors.slice(0, 5)) {
          console.log(`      - ${err}`)
        }
        if (result.errors.length > 5) {
          console.log(`      ... and ${result.errors.length - 5} more`)
        }
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('')

  // Verify tables
  console.log('🔍 Verifying tables...')
  const tables = ['kidsmap_place_blocks', 'kidsmap_content_blocks', 'kidsmap_block_stats']

  for (const table of tables) {
    try {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
      console.log(`   ✅ ${table}: ${result.rows[0].count} rows`)
    } catch (error: any) {
      console.log(`   ❌ ${table}: ${error.message}`)
    }
  }

  console.log('')
  console.log('====================================')
  console.log('✅ Migration complete!')

  await client.end()
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
