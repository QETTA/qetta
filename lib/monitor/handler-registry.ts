/**
 * Handler Registry
 *
 * A type-safe registry for managing event handlers with automatic cleanup.
 * Prevents memory leaks by providing explicit unsubscribe functions.
 *
 * @module lib/monitor/handler-registry
 *
 * @example
 * ```ts
 * const messageHandlers = createHandlerRegistry<MessageHandler>()
 *
 * // Register handlers with automatic cleanup
 * const unsubscribe = messageHandlers.add((topic, payload) => {
 *   console.log(topic, payload)
 * })
 *
 * // Emit to all handlers
 * messageHandlers.emit('sensors/temp', { value: 65 })
 *
 * // Clean up when done
 * unsubscribe()
 * // or
 * messageHandlers.clear()
 * ```
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Function to unsubscribe a handler
 */
export type UnsubscribeFn = () => void

/**
 * Handler registry interface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface HandlerRegistry<T extends (...args: any[]) => void> {
  /** Add a handler and get an unsubscribe function */
  add: (handler: T) => UnsubscribeFn
  /** Emit event to all handlers */
  emit: (...args: Parameters<T>) => void
  /** Get all registered handlers */
  getAll: () => T[]
  /** Remove all handlers */
  clear: () => void
  /** Get current handler count */
  readonly size: number
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a handler registry for managing event callbacks
 *
 * Uses a Set internally for O(1) add/remove operations.
 * Returns unsubscribe functions to prevent memory leaks.
 *
 * @returns HandlerRegistry instance
 *
 * @example
 * ```ts
 * type DataHandler = (data: SensorData) => void
 * const handlers = createHandlerRegistry<DataHandler>()
 *
 * // Add handler
 * const unsub = handlers.add((data) => console.log(data))
 *
 * // Emit
 * handlers.emit({ value: 42 })
 *
 * // Cleanup
 * unsub() // or handlers.clear()
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createHandlerRegistry<T extends (...args: any[]) => void>(): HandlerRegistry<T> {
  const handlers = new Set<T>()

  return {
    add(handler: T): UnsubscribeFn {
      handlers.add(handler)
      return () => {
        handlers.delete(handler)
      }
    },

    emit(...args: Parameters<T>) {
      handlers.forEach((handler) => {
        try {
          handler(...args)
        } catch (error) {
          // Log but don't let one handler break others
          console.error('[HandlerRegistry] Handler threw error:', error)
        }
      })
    },

    getAll(): T[] {
      return Array.from(handlers)
    },

    clear() {
      handlers.clear()
    },

    get size() {
      return handlers.size
    },
  }
}
