/**
 * CircularBuffer Unit Tests
 *
 * Tests for the O(1) fixed-size circular buffer implementation.
 */

import { describe, it, expect } from 'vitest'
import { CircularBuffer, createCircularBuffer } from '../circular-buffer'

describe('CircularBuffer', () => {
  describe('constructor', () => {
    it('creates buffer with specified capacity', () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.capacity).toBe(5)
      expect(buffer.length).toBe(0)
      expect(buffer.isEmpty).toBe(true)
    })

    it('throws error for capacity less than 1', () => {
      expect(() => new CircularBuffer<number>(0)).toThrow(
        'CircularBuffer capacity must be at least 1'
      )
      expect(() => new CircularBuffer<number>(-1)).toThrow(
        'CircularBuffer capacity must be at least 1'
      )
    })

    it('allows capacity of 1', () => {
      const buffer = new CircularBuffer<number>(1)
      expect(buffer.capacity).toBe(1)
    })
  })

  describe('push', () => {
    it('adds items to buffer', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      expect(buffer.length).toBe(1)
      buffer.push(2)
      expect(buffer.length).toBe(2)
      buffer.push(3)
      expect(buffer.length).toBe(3)
    })

    it('overwrites oldest when full', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4) // Overwrites 1

      expect(buffer.length).toBe(3)
      expect(buffer.toArray()).toEqual([2, 3, 4])
    })

    it('continues overwriting on subsequent pushes', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4) // Overwrites 1
      buffer.push(5) // Overwrites 2
      buffer.push(6) // Overwrites 3

      expect(buffer.toArray()).toEqual([4, 5, 6])
    })

    it('works with capacity of 1', () => {
      const buffer = new CircularBuffer<number>(1)
      buffer.push(1)
      expect(buffer.peek()).toBe(1)
      buffer.push(2)
      expect(buffer.peek()).toBe(2)
      expect(buffer.length).toBe(1)
    })
  })

  describe('get', () => {
    it('returns item at index (0 = oldest)', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(10)
      buffer.push(20)
      buffer.push(30)

      expect(buffer.get(0)).toBe(10) // oldest
      expect(buffer.get(1)).toBe(20)
      expect(buffer.get(2)).toBe(30) // newest
    })

    it('returns undefined for out of bounds index', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)

      expect(buffer.get(-1)).toBeUndefined()
      expect(buffer.get(2)).toBeUndefined()
      expect(buffer.get(100)).toBeUndefined()
    })

    it('returns correct items after wraparound', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4) // [2, 3, 4]
      buffer.push(5) // [3, 4, 5]

      expect(buffer.get(0)).toBe(3) // oldest
      expect(buffer.get(1)).toBe(4)
      expect(buffer.get(2)).toBe(5) // newest
    })

    it('returns undefined for empty buffer', () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.get(0)).toBeUndefined()
    })
  })

  describe('peek', () => {
    it('returns newest item', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)

      expect(buffer.peek()).toBe(3)
    })

    it('returns undefined for empty buffer', () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.peek()).toBeUndefined()
    })

    it('returns correct item after wraparound', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4)

      expect(buffer.peek()).toBe(4)
    })
  })

  describe('peekOldest', () => {
    it('returns oldest item', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)

      expect(buffer.peekOldest()).toBe(1)
    })

    it('returns undefined for empty buffer', () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.peekOldest()).toBeUndefined()
    })

    it('returns correct item after wraparound', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4) // Overwrites 1

      expect(buffer.peekOldest()).toBe(2)
    })
  })

  describe('length and capacity', () => {
    it('tracks length correctly', () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.length).toBe(0)

      buffer.push(1)
      expect(buffer.length).toBe(1)

      buffer.push(2)
      buffer.push(3)
      expect(buffer.length).toBe(3)
    })

    it('length never exceeds capacity', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4)
      buffer.push(5)

      expect(buffer.length).toBe(3)
      expect(buffer.capacity).toBe(3)
    })
  })

  describe('isEmpty and isFull', () => {
    it('isEmpty returns true only when empty', () => {
      const buffer = new CircularBuffer<number>(3)
      expect(buffer.isEmpty).toBe(true)

      buffer.push(1)
      expect(buffer.isEmpty).toBe(false)
    })

    it('isFull returns true only when at capacity', () => {
      const buffer = new CircularBuffer<number>(3)
      expect(buffer.isFull).toBe(false)

      buffer.push(1)
      buffer.push(2)
      expect(buffer.isFull).toBe(false)

      buffer.push(3)
      expect(buffer.isFull).toBe(true)

      buffer.push(4) // Still full after overwrite
      expect(buffer.isFull).toBe(true)
    })
  })

  describe('clear', () => {
    it('resets buffer to empty state', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)

      buffer.clear()

      expect(buffer.length).toBe(0)
      expect(buffer.isEmpty).toBe(true)
      expect(buffer.peek()).toBeUndefined()
      expect(buffer.capacity).toBe(3) // Capacity unchanged
    })

    it('allows pushing after clear', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.clear()
      buffer.push(10)

      expect(buffer.length).toBe(1)
      expect(buffer.peek()).toBe(10)
    })
  })

  describe('toArray', () => {
    it('returns items in oldest to newest order', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)

      expect(buffer.toArray()).toEqual([1, 2, 3])
    })

    it('returns correct order after wraparound', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4)
      buffer.push(5)

      expect(buffer.toArray()).toEqual([3, 4, 5])
    })

    it('returns empty array for empty buffer', () => {
      const buffer = new CircularBuffer<number>(5)
      expect(buffer.toArray()).toEqual([])
    })

    it('returns a copy, not a reference', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)

      const arr = buffer.toArray()
      arr.push(999)

      expect(buffer.length).toBe(2)
      expect(buffer.toArray()).toEqual([1, 2])
    })
  })

  describe('slice', () => {
    it('returns last n elements', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4)
      buffer.push(5)

      expect(buffer.slice(3)).toEqual([3, 4, 5])
      expect(buffer.slice(2)).toEqual([4, 5])
      expect(buffer.slice(1)).toEqual([5])
    })

    it('returns all elements if n > length', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)

      expect(buffer.slice(10)).toEqual([1, 2])
    })

    it('returns empty array if n <= 0', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)

      expect(buffer.slice(0)).toEqual([])
    })

    it('works after wraparound', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4)
      buffer.push(5)

      expect(buffer.slice(2)).toEqual([4, 5])
    })
  })

  describe('iteration', () => {
    it('iterates from oldest to newest', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)

      const items: number[] = []
      for (const item of buffer) {
        items.push(item)
      }

      expect(items).toEqual([1, 2, 3])
    })

    it('works with spread operator', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4)

      expect([...buffer]).toEqual([2, 3, 4])
    })

    it('works with Array.from', () => {
      const buffer = new CircularBuffer<number>(3)
      buffer.push(10)
      buffer.push(20)

      expect(Array.from(buffer)).toEqual([10, 20])
    })
  })

  describe('forEach', () => {
    it('calls function for each item with correct index', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(10)
      buffer.push(20)
      buffer.push(30)

      const results: [number, number][] = []
      buffer.forEach((item, index) => {
        results.push([item, index])
      })

      expect(results).toEqual([
        [10, 0],
        [20, 1],
        [30, 2],
      ])
    })
  })

  describe('map', () => {
    it('maps items to new array', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)

      const doubled = buffer.map((x) => x * 2)
      expect(doubled).toEqual([2, 4, 6])
    })

    it('provides index to mapping function', () => {
      const buffer = new CircularBuffer<string>(3)
      buffer.push('a')
      buffer.push('b')

      const indexed = buffer.map((item, index) => `${index}:${item}`)
      expect(indexed).toEqual(['0:a', '1:b'])
    })
  })

  describe('find', () => {
    it('finds first matching item', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)
      buffer.push(3)
      buffer.push(4)

      expect(buffer.find((x) => x > 2)).toBe(3)
    })

    it('returns undefined if no match', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(1)
      buffer.push(2)

      expect(buffer.find((x) => x > 10)).toBeUndefined()
    })

    it('provides index to predicate', () => {
      const buffer = new CircularBuffer<number>(5)
      buffer.push(10)
      buffer.push(20)
      buffer.push(30)

      expect(buffer.find((_, index) => index === 1)).toBe(20)
    })
  })

  describe('createCircularBuffer helper', () => {
    it('creates empty buffer', () => {
      const buffer = createCircularBuffer<number>(5)
      expect(buffer.capacity).toBe(5)
      expect(buffer.length).toBe(0)
    })

    it('creates buffer with initial values', () => {
      const buffer = createCircularBuffer<number>(5, [1, 2, 3])
      expect(buffer.length).toBe(3)
      expect(buffer.toArray()).toEqual([1, 2, 3])
    })

    it('handles initial values exceeding capacity', () => {
      const buffer = createCircularBuffer<number>(3, [1, 2, 3, 4, 5])
      expect(buffer.length).toBe(3)
      expect(buffer.toArray()).toEqual([3, 4, 5])
    })
  })

  describe('with different types', () => {
    it('works with strings', () => {
      const buffer = new CircularBuffer<string>(3)
      buffer.push('hello')
      buffer.push('world')

      expect(buffer.toArray()).toEqual(['hello', 'world'])
    })

    it('works with objects', () => {
      interface Point {
        x: number
        y: number
      }
      const buffer = new CircularBuffer<Point>(3)
      buffer.push({ x: 1, y: 2 })
      buffer.push({ x: 3, y: 4 })

      expect(buffer.peek()).toEqual({ x: 3, y: 4 })
    })

    it('works with null values', () => {
      const buffer = new CircularBuffer<number | null>(3)
      buffer.push(1)
      buffer.push(null)
      buffer.push(2)

      expect(buffer.toArray()).toEqual([1, null, 2])
      expect(buffer.get(1)).toBeNull()
    })

    // Note: undefined values are NOT supported as actual data
    // because the buffer uses undefined to indicate "no value"
    // This is a documented design limitation
  })

  describe('performance characteristics', () => {
    it('handles large number of operations correctly', () => {
      // This test verifies correctness at scale, not timing
      // (micro-benchmarks are unreliable in test environments)
      const capacity = 100
      const buffer = new CircularBuffer<number>(capacity)

      // Push many more items than capacity
      const totalPushes = 10000
      for (let i = 0; i < totalPushes; i++) {
        buffer.push(i)
      }

      // Should maintain correct capacity
      expect(buffer.length).toBe(capacity)
      expect(buffer.isFull).toBe(true)

      // Should contain the most recent items
      const expectedFirst = totalPushes - capacity // 9900
      expect(buffer.get(0)).toBe(expectedFirst)
      expect(buffer.peek()).toBe(totalPushes - 1) // 9999

      // All items should be in order
      const arr = buffer.toArray()
      for (let i = 0; i < arr.length - 1; i++) {
        expect(arr[i + 1]).toBe(arr[i] + 1)
      }
    })

    it('maintains O(1) complexity (informational benchmark)', () => {
      // This is an informational test that logs performance comparison
      // It does NOT fail based on timing to avoid flaky tests
      const capacity = 1000
      const buffer = new CircularBuffer<number>(capacity)

      // Fill buffer
      for (let i = 0; i < capacity; i++) {
        buffer.push(i)
      }

      // Time CircularBuffer pushes
      const iterations = 5000
      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        buffer.push(i)
      }
      const circularTime = performance.now() - start

      // Time Array shift+push (O(n) per operation)
      const arr: number[] = new Array(capacity).fill(0)
      const arrStart = performance.now()
      for (let i = 0; i < iterations; i++) {
        arr.shift()
        arr.push(i)
      }
      const arrayTime = performance.now() - arrStart

      // Log results (informational only, no assertion)
      console.log(
        `[Performance] CircularBuffer: ${circularTime.toFixed(2)}ms, Array shift+push: ${arrayTime.toFixed(2)}ms, Ratio: ${(arrayTime / circularTime).toFixed(1)}x`
      )

      // Just verify both completed without error
      expect(buffer.length).toBe(capacity)
      expect(arr.length).toBe(capacity)
    })
  })
})
