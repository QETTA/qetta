'use client'

import { useState, useCallback, useRef } from 'react'

// ============================================
// Types
// ============================================

interface FileUploadProps {
  onHashCalculated?: (result: HashResult) => void
  onVerificationComplete?: (result: VerificationResult) => void
  className?: string
}

interface HashResult {
  hash: string
  filename: string
  fileSize: number
  mimeType: string
  calculatedAt: string
}

interface VerificationResult {
  isValid: boolean
  documentHash: string
  chainIntegrity: boolean
  verifiedAt: string
  message: string
  documentFound: boolean
  matchedEntryId?: string
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'calculating' | 'verifying' | 'success' | 'error'

// ============================================
// Component
// ============================================

export function QettaVerifyFileUpload({
  onHashCalculated,
  onVerificationComplete,
  className = '',
}: FileUploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [hashResult, setHashResult] = useState<HashResult | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state
  const reset = useCallback(() => {
    setState('idle')
    setFile(null)
    setHashResult(null)
    setVerificationResult(null)
    setError(null)
  }, [])

  // Handle file selection
  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setState('calculating')

    try {
      // Step 1: Calculate hash
      const formData = new FormData()
      formData.append('file', selectedFile)

      const hashResponse = await fetch('/api/verify/hash', {
        method: 'POST',
        body: formData,
      })

      if (!hashResponse.ok) {
        const errorData = await hashResponse.json()
        throw new Error(errorData.error?.message || 'Failed to calculate hash')
      }

      const hashData = await hashResponse.json()
      if (!hashData.success) {
        throw new Error(hashData.error?.message || 'Hash calculation failed')
      }

      // Transform API response to HashResult format
      const transformedHashResult: HashResult = {
        hash: hashData.hash,
        filename: hashData.file.name,
        fileSize: hashData.file.size,
        mimeType: hashData.file.type,
        calculatedAt: hashData.timestamp,
      }

      setHashResult(transformedHashResult)
      onHashCalculated?.(transformedHashResult)

      // Step 2: Verify against chain
      setState('verifying')

      const verifyFormData = new FormData()
      verifyFormData.append('file', selectedFile)

      const verifyResponse = await fetch('/api/verify/chain', {
        method: 'POST',
        body: verifyFormData,
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw new Error(errorData.error?.message || 'Verification failed')
      }

      const verifyData = await verifyResponse.json()
      if (!verifyData.success) {
        throw new Error(verifyData.error?.message || 'Chain verification failed')
      }

      const result: VerificationResult = {
        ...verifyData.data.verification,
        documentFound: verifyData.data.documentFound,
        matchedEntryId: verifyData.data.matchedEntryId,
      }

      setVerificationResult(result)
      onVerificationComplete?.(result)
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('error')
    }
  }, [onHashCalculated, onVerificationComplete])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState((prev) => (prev === 'idle' ? 'dragging' : prev))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState((prev) => (prev === 'dragging' ? 'idle' : prev))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState('idle')
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }, [handleFile])

  // File input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }, [handleFile])

  // Click to open file dialog
  const handleClick = useCallback(() => {
    if (state === 'idle' || state === 'error' || state === 'success') {
      fileInputRef.current?.click()
    }
  }, [state])

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  // State-based styles
  const getStateStyles = () => {
    switch (state) {
      case 'dragging':
        return 'border-white/50 bg-white/10'
      case 'calculating':
      case 'verifying':
        return 'border-blue-500/50 bg-blue-500/5'
      case 'success':
        return verificationResult?.documentFound
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-amber-500/50 bg-amber-500/5'
      case 'error':
        return 'border-red-500/50 bg-red-500/5'
      default:
        return 'border-white/10 hover:border-white/20 hover:bg-white/5'
    }
  }

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleInputChange}
        accept=".pdf,.docx,.xlsx,.hwp"
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer
          ${getStateStyles()}
        `}
      >
        {/* Idle state */}
        {state === 'idle' && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-white mb-1">Drag a file or click to upload</p>
            <p className="text-xs text-zinc-500">PDF, DOCX, XLSX, HWP (max 50MB)</p>
          </div>
        )}

        {/* Dragging state */}
        {state === 'dragging' && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <p className="text-sm text-white">Drop the file here</p>
          </div>
        )}

        {/* Calculating/Verifying state */}
        {(state === 'calculating' || state === 'verifying') && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm text-blue-400 mb-1">
              {state === 'calculating' ? 'Calculating SHA-256 hash...' : 'Verifying hash chain...'}
            </p>
            {file && <p className="text-xs text-zinc-500">{file.name}</p>}
          </div>
        )}

        {/* Success state */}
        {state === 'success' && hashResult && (
          <div>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                verificationResult?.documentFound
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                {verificationResult?.documentFound ? '✓' : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate mb-1">{hashResult.filename}</p>
                <p className="text-xs text-zinc-500 mb-2">
                  {formatFileSize(hashResult.fileSize)} • {hashResult.mimeType}
                </p>

                {/* Hash display */}
                <div className="p-2 bg-zinc-800/50 rounded-lg mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-500">SHA-256 Hash</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(hashResult.hash)
                      }}
                      className="text-[10px] text-zinc-400 hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-[10px] text-emerald-400 font-mono break-all">
                    {hashResult.hash}
                  </code>
                </div>

                {/* Verification result */}
                {verificationResult && (
                  <div className={`p-2 rounded-lg ${
                    verificationResult.documentFound
                      ? 'bg-emerald-500/10'
                      : 'bg-amber-500/10'
                  }`}>
                    <p className={`text-xs ${
                      verificationResult.documentFound
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}>
                      {verificationResult.message}
                    </p>
                    {verificationResult.matchedEntryId && (
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Chain ID: {verificationResult.matchedEntryId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                reset()
              }}
              className="mt-3 w-full py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Verify another file
            </button>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-red-400 mb-1">Verification Failed</p>
            <p className="text-xs text-zinc-500 mb-3">{error}</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                reset()
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
