'use client'

import { useState, useCallback } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useWizardStore } from '../store'
import { WIDGET_TEMPLATES, type FieldDefinition } from '../types'

interface StepValidationProps {
  onNext: () => void
  onPrev: () => void
}

export function StepValidation({ onNext, onPrev }: StepValidationProps) {
  const { documentType, inputData, updateInputField } = useWizardStore()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const template = WIDGET_TEMPLATES.find((t) => t.documentType === documentType)
  const fields = template?.fields || []

  const validateField = useCallback(
    (field: FieldDefinition, value: unknown): string | null => {
      if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
        return `${field.label}은(는) 필수 입력 항목입니다`
      }

      if (field.validation) {
        const { min, max, pattern, message } = field.validation

        if (field.type === 'number' && typeof value === 'number') {
          if (min !== undefined && value < min) {
            return message || `${field.label}은(는) ${min} 이상이어야 합니다`
          }
          if (max !== undefined && value > max) {
            return message || `${field.label}은(는) ${max} 이하여야 합니다`
          }
        }

        if (pattern && typeof value === 'string') {
          const regex = new RegExp(pattern)
          if (!regex.test(value)) {
            return message || `${field.label} 형식이 올바르지 않습니다`
          }
        }
      }

      return null
    },
    []
  )

  const handleChange = (field: FieldDefinition, value: unknown) => {
    updateInputField(field.name, value)

    // Clear error on change
    if (errors[field.name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field.name]
        return next
      })
    }
  }

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {}

    for (const field of fields) {
      const error = validateField(field, inputData[field.name])
      if (error) {
        newErrors[field.name] = error
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onNext()
  }

  const renderField = (field: FieldDefinition) => {
    const value = inputData[field.name] || ''
    const error = errors[field.name]

    const baseClasses = cn(
      'w-full px-4 py-3 rounded-lg transition-colors',
      'bg-zinc-800 border',
      'text-white placeholder-zinc-500',
      'focus:outline-none focus:ring-2 focus:ring-zinc-500',
      error ? 'border-red-500' : 'border-zinc-700 focus:border-zinc-500'
    )

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={cn(baseClasses, 'resize-none')}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value as number}
            onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleChange(field, e.target.value)}
            className={baseClasses}
          >
            <option value="">선택하세요</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )

      case 'date':
        return (
          <input
            type="date"
            value={value as string}
            onChange={(e) => handleChange(field, e.target.value)}
            className={baseClasses}
          />
        )

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(field, e.target.checked)}
              className="w-5 h-5 rounded border-zinc-700 text-zinc-500 focus:ring-zinc-500"
            />
            <span className="text-zinc-300">{field.label}</span>
          </label>
        )

      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )
    }
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">문서 유형을 먼저 선택해주세요</p>
        <button
          onClick={onPrev}
          className="mt-4 px-4 py-2 text-white hover:text-zinc-300"
        >
          이전 단계로
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">{template.icon}</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {template.name} 정보 입력
        </h2>
        <p className="text-zinc-400">
          문서 생성에 필요한 정보를 입력해주세요
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {fields.map((field) => (
          <div key={field.name}>
            {field.type !== 'checkbox' && (
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
            )}
            {field.description && (
              <p className="text-xs text-zinc-500 mb-2">{field.description}</p>
            )}
            {renderField(field)}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-400">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t border-zinc-800">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          이전
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-500 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
        >
          문서 생성
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
