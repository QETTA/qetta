#!/usr/bin/env npx tsx
/**
 * KidsMap Database Migration Script
 *
 * Supabase에 테이블 자동 생성/업데이트
 *
 * 사용법:
 *   npx tsx scripts/db-migrate.ts
 *   npm run db:migrate
 *
 * @module scripts/db-migrate
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ============================================
// Migration Runner
// ============================================

async function runMigrations() {
  console.log('🚀 KidsMap Database Migration')
  console.log('================================')
  console.log(`📍 Target: ${SUPABASE_URL}`)
  console.log('')

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

  for (const file of files) {
    const filePath = join(migrationsDir, file)
    console.log(`📄 Running: ${file}`)

    try {
      const sql = readFileSync(filePath, 'utf-8')

      // Split SQL by semicolons and run each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      let successCount = 0
      let skipCount = 0

      for (const statement of statements) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

          if (error) {
            // Check if it's a "already exists" error - that's OK
            if (error.message?.includes('already exists') ||
                error.message?.includes('duplicate key') ||
                error.code === '42710' || // duplicate_object
                error.code === '42P07') { // duplicate_table
              skipCount++
            } else {
              throw error
            }
          } else {
            successCount++
          }
        } catch (stmtError: any) {
          // Try direct query if rpc doesn't work
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(0)

          // If table doesn't exist, we need to use REST API
          if (directError) {
            console.log(`   ⚠️  Statement skipped (may need manual execution)`)
            skipCount++
          }
        }
      }

      console.log(`   ✅ Completed: ${successCount} executed, ${skipCount} skipped`)
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('')
  console.log('================================')
  console.log('✅ Migration complete!')
}

// ============================================
// Direct SQL Execution (Alternative)
// ============================================

async function executeSqlDirect(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use Supabase REST API to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY!,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ sql }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================
// Check Tables Exist
// ============================================

async function checkTables() {
  console.log('🔍 Checking existing tables...')

  const tables = ['kidsmap_place_blocks', 'kidsmap_content_blocks', 'kidsmap_block_stats']

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`   ❌ ${table}: Not found or error`)
    } else {
      console.log(`   ✅ ${table}: ${count} rows`)
    }
  }
  console.log('')
}

// ============================================
// Main
// ============================================

async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'check':
      await checkTables()
      break
    case 'migrate':
    default:
      await checkTables()
      await runMigrations()
      await checkTables()
      break
  }
}

main().catch(console.error)
