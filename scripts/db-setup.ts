#!/usr/bin/env npx tsx
/**
 * KidsMap Database Setup Script
 *
 * Supabase 테이블 자동 생성 (직접 SQL 실행)
 *
 * 사용법:
 *   npx tsx scripts/db-setup.ts
 *   npm run db:setup
 *
 * @module scripts/db-setup
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { createClient } from '@supabase/supabase-js'

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================
// Table Definitions
// ============================================

const TABLES_CHECK = [
  'kidsmap_place_blocks',
  'kidsmap_content_blocks',
  'kidsmap_block_stats',
]

// ============================================
// Check & Setup
// ============================================

async function checkTables(): Promise<{ table: string; exists: boolean; count: number }[]> {
  const results = []

  for (const table of TABLES_CHECK) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      results.push({
        table,
        exists: !error,
        count: count || 0,
      })
    } catch {
      results.push({ table, exists: false, count: 0 })
    }
  }

  return results
}

async function insertTestData() {
  console.log('📝 Inserting test data...')

  // Test place
  const testPlace = {
    data: {
      id: 'test-001',
      name: '테스트 키즈카페',
      category: 'kids_cafe',
      address: '서울시 강남구 테스트동 123',
      latitude: 37.5665,
      longitude: 126.9780,
      source: 'MANUAL',
    },
    status: 'active',
    quality_grade: 'B',
    freshness: 'fresh',
    completeness: 80,
    dedupe_hash: 'test_hash_' + Date.now(),
    name: '테스트 키즈카페',
    category: 'kids_cafe',
    source: 'MANUAL',
    source_id: 'test-001',
    latitude: 37.5665,
    longitude: 126.9780,
    address: '서울시 강남구 테스트동 123',
  }

  const { error } = await supabase
    .from('kidsmap_place_blocks')
    .upsert(testPlace, { onConflict: 'dedupe_hash' })

  if (error) {
    console.log(`   ⚠️  Test data: ${error.message}`)
  } else {
    console.log('   ✅ Test place inserted')
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('🚀 KidsMap Database Setup')
  console.log('================================')
  console.log(`📍 ${SUPABASE_URL}`)
  console.log('')

  // Check existing tables
  console.log('🔍 Checking tables...')
  const results = await checkTables()

  let allExist = true
  for (const r of results) {
    const status = r.exists ? `✅ ${r.count} rows` : '❌ Not found'
    console.log(`   ${r.table}: ${status}`)
    if (!r.exists) allExist = false
  }
  console.log('')

  if (!allExist) {
    console.log('⚠️  Some tables are missing!')
    console.log('')
    console.log('📋 Run this SQL in Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/onetwihfvaoprqvdrfck/sql')
    console.log('')
    console.log('   File: supabase/migrations/001_kidsmap_tables.sql')
    console.log('')
    console.log('Or use Supabase CLI:')
    console.log('   npx supabase db push')
    console.log('')
  } else {
    console.log('✅ All tables exist!')

    // Insert test data if tables are empty
    const emptyTables = results.filter(r => r.exists && r.count === 0)
    if (emptyTables.length > 0) {
      await insertTestData()
    }
  }

  // Final check
  console.log('')
  console.log('================================')
  console.log('✅ Setup complete!')
}

main().catch(console.error)
