'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

interface SearchBarProps {
  onSearch: (keyword: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  onSearch,
  placeholder = '장소, 콘텐츠 검색...',
  className,
}: SearchBarProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onSearch(newValue.trim())
      }, 400)
    },
    [onSearch],
  )

  const handleClear = useCallback(() => {
    setValue('')
    onSearch('')
    inputRef.current?.focus()
  }, [onSearch])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      onSearch(value.trim())
    },
    [onSearch, value],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className={clsx('relative', className)}>
      {/* Search icon */}
      <svg
        className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={clsx(
          'w-full rounded-xl border bg-gray-50 py-2.5 pr-9 pl-9 text-sm outline-none transition-all',
          'dark:bg-gray-800 dark:text-white dark:placeholder-gray-500',
          isFocused
            ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/30'
            : 'border-gray-200 dark:border-gray-700',
        )}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  )
}
