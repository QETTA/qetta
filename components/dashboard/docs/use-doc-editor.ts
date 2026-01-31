'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { EnginePresetType } from '@/types/inbox'
import type { PreviewDocument, DocumentFormat } from '@/lib/document-generator/types'
import type { ViewMode, EditorStatus, HashCertificate } from './editor-types'
import { API_BASE } from './editor-types'

interface UseDocEditorOptions {
  documentId: string | null
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  onClose: () => void
}

interface PipelineResult {
  documentId: string
  filename: string
  downloadUrl: string
  hashChain: string
}

export function useDocEditor({ documentId, showToast, onClose }: UseDocEditorOptions) {
  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('generate')
  const [status, setStatus] = useState<EditorStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Document state
  const [webWordUrl, setWebWordUrl] = useState<string | null>(null)
  const [hancomdocsUrl, setHancomdocsUrl] = useState<string | null>(null)
  const [generatedFilename, setGeneratedFilename] = useState<string | null>(null)
  const [isLocalMode, setIsLocalMode] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null)

  // Generation settings
  const [selectedPreset, setSelectedPreset] = useState<EnginePresetType>('ENVIRONMENT')
  const [selectedDocType, setSelectedDocType] = useState<string>('daily_report')
  const [selectedFormat, setSelectedFormat] = useState<DocumentFormat | 'auto'>('auto')
  const [hashCertificate, setHashCertificate] = useState<HashCertificate | null>(null)

  // Pipeline state
  const [pipelineStep, setPipelineStep] = useState<number>(0)
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Domain change resets doc type
  useEffect(() => {
    const docTypeMap: Record<EnginePresetType, string> = {
      ENVIRONMENT: 'daily_report',
      MANUFACTURING: 'settlement_report',
      DIGITAL: 'performance_report',
      EXPORT: 'proposal_draft',
      FINANCE: 'application',
      STARTUP: 'business_plan',
    }
    setSelectedDocType(docTypeMap[selectedPreset] || 'daily_report')
  }, [selectedPreset])

  // Document ID change resets state
  useEffect(() => {
    if (!documentId) {
      setWebWordUrl(null)
      setStatus('idle')
      setError(null)
    }
  }, [documentId])

  // Generate document
  const handleGenerateDocument = useCallback(async () => {
    setStatus('generating')
    setError(null)

    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enginePreset: selectedPreset,
          documentType: selectedDocType,
          metadata: {
            companyName: 'QETTA',
            reportDate: new Date().toISOString().split('T')[0],
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '문서 생성 실패')
      }

      const result = await response.json()
      setGeneratedFilename(result.filename)
      showToast(`${result.filename} 생성 완료`, 'success')

      if (result.viewerUrl) {
        setHancomdocsUrl(result.viewerUrl)
        setIsLocalMode(false)
        setViewMode('hancomdocs')
        showToast('한컴독스 웹 뷰어 준비 완료', 'success')
      } else {
        setIsLocalMode(true)
        setViewMode('hancomdocs')
        showToast('API 심사 중 - 로컬 모드로 전환', 'info')
      }

      setStatus('ready')
    } catch (err) {
      const message = err instanceof Error ? err.message : '문서 생성 실패'
      setError(message)
      setStatus('error')
      showToast(`오류: ${message}`, 'error')
    }
  }, [selectedPreset, selectedDocType, showToast])

  // Generate preview
  const handleGeneratePreview = useCallback(async () => {
    setStatus('generating')
    setError(null)

    try {
      const response = await fetch('/api/generate-document/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: selectedDocType,
          domain: selectedPreset.toLowerCase(),
          data: {
            companyName: 'QETTA',
            reportDate: new Date().toISOString().split('T')[0],
          },
          metadata: { version: '1.0' },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '미리보기 생성 실패')
      }

      const preview = await response.json()
      setPreviewDocument(preview)
      setViewMode('preview')
      setStatus('ready')
      showToast(`미리보기 생성 완료 (${selectedDocType})`, 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : '미리보기 생성 실패'
      setError(message)
      setStatus('error')
      showToast(`오류: ${message}`, 'error')
    }
  }, [selectedPreset, selectedDocType, showToast])

  // Download document
  const handleDownloadDocument = useCallback(async () => {
    setStatus('generating')
    setError(null)

    try {
      const response = await fetch('/api/generate-document/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enginePreset: selectedPreset,
          documentType: selectedDocType,
          format: selectedFormat !== 'auto' ? selectedFormat : undefined,
          metadata: {
            companyName: 'QETTA',
            reportDate: new Date().toISOString().split('T')[0],
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '다운로드 실패')
      }

      // Extract filename from header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${selectedPreset}_${selectedDocType}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.docx`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/)
        if (match) {
          filename = decodeURIComponent(match[1])
        }
      }

      // Extract hash certificate info
      const hashChain = response.headers.get('X-QETTA-Hash-Chain')
      const respDocumentId = response.headers.get('X-QETTA-Document-Id')
      const enginePreset = response.headers.get('X-QETTA-Domain-Engine') as EnginePresetType
      const documentType = response.headers.get('X-QETTA-Document-Type')
      const generationTime = response.headers.get('X-QETTA-Generation-Time-Ms')

      if (hashChain && respDocumentId) {
        setHashCertificate({
          documentId: respDocumentId,
          hashChain,
          enginePreset: enginePreset || selectedPreset,
          documentType: documentType || selectedDocType,
          generationTimeMs: parseInt(generationTime || '0', 10),
          generatedAt: new Date().toISOString(),
          filename,
          algorithm: 'SHA-256',
        })
      }

      // Download blob
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setGeneratedFilename(filename)
      setStatus('ready')
      showToast(
        `${filename} 다운로드 완료 (${generationTime}ms, Hash: ${hashChain?.slice(0, 12)}...)`,
        'success'
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : '다운로드 실패'
      setError(message)
      setStatus('error')
      showToast(`오류: ${message}`, 'error')
    }
  }, [selectedPreset, selectedDocType, selectedFormat, showToast])

  // Download certificate
  const handleDownloadCertificate = useCallback(() => {
    if (!hashCertificate) {
      showToast('다운로드할 인증서가 없습니다', 'error')
      return
    }

    const certificateContent = {
      version: '1.0',
      type: 'QETTA Hash Certificate',
      document: {
        id: hashCertificate.documentId,
        filename: hashCertificate.filename,
        enginePreset: hashCertificate.enginePreset,
        documentType: hashCertificate.documentType,
      },
      integrity: {
        algorithm: hashCertificate.algorithm,
        hashChain: hashCertificate.hashChain,
        generatedAt: hashCertificate.generatedAt,
        generationTimeMs: hashCertificate.generationTimeMs,
      },
      verification: {
        method: 'SHA-256 해시체인 검증',
        description: '이 인증서는 문서의 무결성을 검증하기 위한 해시값을 포함합니다.',
        howToVerify: '원본 문서의 SHA-256 해시를 계산하여 hashChain 값과 비교하세요.',
      },
      issuer: {
        name: 'QETTA',
        platform: 'QETTA DOCS Engine',
        website: 'https://qetta.io',
      },
    }

    const blob = new Blob([JSON.stringify(certificateContent, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${hashCertificate.filename.replace(/\.[^/.]+$/, '')}_certificate.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    showToast('무결성 인증서 다운로드 완료', 'success')
  }, [hashCertificate, showToast])

  // Upload document
  const uploadDocument = useCallback(async (file: File) => {
    setStatus('loading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', viewMode)

      const response = await fetch(`${API_BASE}/api/v1/viewer/hancom/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || '업로드 실패')
      }

      setWebWordUrl(data.data.webWordUrl)
      setStatus('ready')
      showToast('문서가 로드되었습니다', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류'
      setError(message)
      setStatus('error')
      showToast(`문서 로드 실패: ${message}`, 'error')
    }
  }, [viewMode, showToast])

  // File select handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadDocument(file)
    }
  }, [uploadDocument])

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadDocument(file)
    }
  }, [uploadDocument])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'view' ? 'edit' : 'view')
    showToast(viewMode === 'view' ? '편집 모드로 전환' : '보기 모드로 전환', 'info')
  }, [viewMode, showToast])

  // Save document
  const handleSave = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SAVE_DOCUMENT' }, '*')
      setStatus('saving')
      showToast('저장 중...', 'info')

      const timer = setTimeout(() => {
        setStatus('ready')
        showToast('저장되었습니다', 'success')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // Pipeline generation
  const handlePipelineGenerate = useCallback(async () => {
    setStatus('generating')
    setError(null)
    setPipelineError(null)
    setPipelineStep(0)
    setPipelineResult(null)

    try {
      const res = await fetch('/api/skill-engine/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: `auto-${Date.now()}`,
          enginePreset: selectedPreset,
        }),
      })
      const json = await res.json()

      if (json.success && json.data) {
        const steps = json.data.steps || []
        setPipelineStep(steps.length)
        setGeneratedFilename(json.data.filename)
        setPipelineResult({
          documentId: json.data.documentId,
          filename: json.data.filename,
          downloadUrl: json.data.downloadUrl,
          hashChain: json.data.hashChain,
        })
        setStatus('ready')
        showToast(
          `${json.data.filename} 생성 완료 (${json.data.totalDurationMs}ms)`,
          'success'
        )
      } else {
        throw new Error(json.error?.message || 'Pipeline failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pipeline failed'
      setPipelineError(message)
      setError(message)
      setStatus('error')
      showToast(`파이프라인 오류: ${message}`, 'error')
    }
  }, [selectedPreset, showToast])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        toggleViewMode()
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, toggleViewMode, onClose])

  return {
    // State
    viewMode,
    setViewMode,
    status,
    setStatus,
    error,
    setError,
    webWordUrl,
    hancomdocsUrl,
    generatedFilename,
    isLocalMode,
    previewDocument,
    selectedPreset,
    setSelectedPreset,
    selectedDocType,
    setSelectedDocType,
    selectedFormat,
    setSelectedFormat,
    hashCertificate,
    pipelineStep,
    pipelineError,
    pipelineResult,

    // Refs
    fileInputRef,
    iframeRef,

    // Handlers
    handleGenerateDocument,
    handleGeneratePreview,
    handleDownloadDocument,
    handleDownloadCertificate,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleSave,
    handlePipelineGenerate,
    toggleViewMode,
    resetError: () => {
      setStatus('idle')
      setError(null)
      setViewMode('generate')
    },
  }
}
