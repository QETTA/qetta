/**
 * CircularBuffer - O(1) Fixed-Size Buffer
 *
 * A circular (ring) buffer that maintains a fixed capacity and overwrites
 * the oldest entries when full. All operations are O(1).
 *
 * Performance advantages over Array:
 * - push(): O(1) vs Array.shift() + push() which is O(n)
 * - No memory reallocation when buffer is full
 * - Predictable memory usage
 *
 * @module lib/data-structures/circular-buffer
 *
 * @example
 * ```ts
 * const buffer = new CircularBuffer<number>(3)
 * buffer.push(1)
 * buffer.push(2)
 * buffer.push(3)
 * buffer.push(4) // Overwrites 1
 *
 * buffer.toArray() // [2, 3, 4]
 * buffer.peek()    // 4 (newest)
 * buffer.get(0)    // 2 (oldest)
 * ```
 */

export class CircularBuffer<T> implements Iterable<T> {
  private buffer: (T | undefined)[]
  private head: number = 0 // Points to next write position
  private count: number = 0
  private readonly maxCapacity: number

  /**
   * Create a new CircularBuffer
   *
   * @param capacity - Maximum number of elements to store
   * @throws Error if capacity is less than 1
   */
  constructor(capacity: number) {
    if (capacity < 1) {
      throw new Error('CircularBuffer capacity must be at least 1')
    }
    this.maxCapacity = capacity
    this.buffer = new Array(capacity)
  }

  /**
   * Add an element to the buffer
   *
   * If buffer is full, overwrites the oldest element.
   * Time complexity: O(1)
   *
   * @param item - Element to add
   */
  push(item: T): void {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.maxCapacity
    if (this.count < this.maxCapacity) {
      this.count++
    }
  }

  /**
   * Get element at index (0 = oldest, length-1 = newest)
   *
   * Time complexity: O(1)
   *
   * @param index - Index from oldest (0) to newest (length-1)
   * @returns Element at index or undefined if out of bounds
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) {
      return undefined
    }
    // Calculate actual position in circular buffer
    const actualIndex =
      (this.head - this.count + index + this.maxCapacity) % this.maxCapacity
    return this.buffer[actualIndex]
  }

  /**
   * Get the newest element
   *
   * Time complexity: O(1)
   *
   * @returns Newest element or undefined if empty
   */
  peek(): T | undefined {
    if (this.count === 0) return undefined
    const newestIndex = (this.head - 1 + this.maxCapacity) % this.maxCapacity
    return this.buffer[newestIndex]
  }

  /**
   * Get the oldest element
   *
   * Time complexity: O(1)
   *
   * @returns Oldest element or undefined if empty
   */
  peekOldest(): T | undefined {
    return this.get(0)
  }

  /**
   * Current number of elements in buffer
   */
  get length(): number {
    return this.count
  }

  /**
   * Maximum capacity of buffer
   */
  get capacity(): number {
    return this.maxCapacity
  }

  /**
   * Whether buffer is empty
   */
  get isEmpty(): boolean {
    return this.count === 0
  }

  /**
   * Whether buffer is at capacity
   */
  get isFull(): boolean {
    return this.count === this.maxCapacity
  }

  /**
   * Clear all elements from buffer
   *
   * Time complexity: O(1)
   */
  clear(): void {
    this.head = 0
    this.count = 0
    // Don't reallocate, just reset pointers
  }

  /**
   * Convert to array (oldest to newest order)
   *
   * Time complexity: O(n)
   *
   * @returns Array copy of buffer contents
   */
  toArray(): T[] {
    const result: T[] = []
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(item)
      }
    }
    return result
  }

  /**
   * Get the last n elements as an array
   *
   * Time complexity: O(n)
   *
   * @param n - Number of elements to get
   * @returns Array of last n elements (or fewer if buffer has less)
   */
  slice(n: number): T[] {
    const start = Math.max(0, this.count - n)
    const result: T[] = []
    for (let i = start; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(item)
      }
    }
    return result
  }

  /**
   * Iterate from oldest to newest
   */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        yield item
      }
    }
  }

  /**
   * Apply function to each element
   *
   * @param fn - Function to apply
   */
  forEach(fn: (item: T, index: number) => void): void {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        fn(item, i)
      }
    }
  }

  /**
   * Map buffer contents to new array
   *
   * @param fn - Mapping function
   * @returns New array with mapped values
   */
  map<U>(fn: (item: T, index: number) => U): U[] {
    const result: U[] = []
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(fn(item, i))
      }
    }
    return result
  }

  /**
   * Find element matching predicate
   *
   * @param predicate - Test function
   * @returns First matching element or undefined
   */
  find(predicate: (item: T, index: number) => boolean): T | undefined {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined && predicate(item, i)) {
        return item
      }
    }
    return undefined
  }
}

/**
 * Create a CircularBuffer with optional initial values
 *
 * @param capacity - Maximum buffer size
 * @param initial - Optional initial values to populate
 * @returns New CircularBuffer instance
 */
export function createCircularBuffer<T>(
  capacity: number,
  initial?: T[]
): CircularBuffer<T> {
  const buffer = new CircularBuffer<T>(capacity)
  if (initial) {
    for (const item of initial) {
      buffer.push(item)
    }
  }
  return buffer
}
