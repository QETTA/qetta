/**
 * Setup Verification Test
 *
 * 테스트 인프라가 정상 작동하는지 확인하는 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMockUser,
  createMockSubscription,
  createMockCompanyBlock,
  createMockProposalJob,
  resetFixtureCounters,
} from '../test-utils'

describe('Test Infrastructure', () => {
  beforeEach(() => {
    resetFixtureCounters()
  })

  describe('Vitest Setup', () => {
    it('should have globals enabled', () => {
      expect(typeof describe).toBe('function')
      expect(typeof it).toBe('function')
      expect(typeof expect).toBe('function')
    })

    it('should have environment variables set', () => {
      expect(process.env.DATABASE_URL).toBeDefined()
      expect(process.env.NEXTAUTH_SECRET).toBe('test-secret-for-vitest')
    })

    it('should have global testUtils available', () => {
      expect(globalThis.testUtils).toBeDefined()
      expect(typeof globalThis.testUtils.createMockSession).toBe('function')
    })

    it('should create mock session correctly', () => {
      const session = globalThis.testUtils.createMockSession('custom-id')
      expect(session.user.id).toBe('custom-id')
      expect(session.user.email).toBe('test@example.com')
    })
  })

  describe('Fixtures', () => {
    it('should create mock user with defaults', () => {
      const user = createMockUser()
      expect(user.id).toBe('user-1')
      expect(user.email).toBe('user1@test.com')
    })

    it('should create mock user with overrides', () => {
      const user = createMockUser({ email: 'custom@test.com' })
      expect(user.email).toBe('custom@test.com')
    })

    it('should create mock subscription', () => {
      const sub = createMockSubscription({ plan: 'STARTER' })
      expect(sub.plan).toBe('STARTER')
      expect(sub.status).toBe('ACTIVE')
    })

    it('should create mock company block', () => {
      const block = createMockCompanyBlock()
      expect(block.industryBlock).toBe('GENERAL')
      expect(block.compressionRatio).toBe(0.8)
    })

    it('should create mock proposal job', () => {
      const job = createMockProposalJob({ status: 'COMPLETED' })
      expect(job.status).toBe('COMPLETED')
    })

    it('should increment counters for unique IDs', () => {
      const user1 = createMockUser()
      const user2 = createMockUser()
      expect(user1.id).not.toBe(user2.id)
    })

    it('should reset counters correctly', () => {
      createMockUser()
      createMockUser()
      resetFixtureCounters()
      const user = createMockUser()
      expect(user.id).toBe('user-1')
    })
  })

  describe('Mocking', () => {
    it('should support vi.fn()', () => {
      const mockFn = vi.fn().mockReturnValue(42)
      expect(mockFn()).toBe(42)
      expect(mockFn).toHaveBeenCalled()
    })

    it('should support vi.spyOn()', () => {
      const obj = { method: () => 'original' }
      const spy = vi.spyOn(obj, 'method').mockReturnValue('mocked')
      expect(obj.method()).toBe('mocked')
      spy.mockRestore()
    })
  })
})
