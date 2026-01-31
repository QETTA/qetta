import type { EnginePresetType } from '@/types/inbox'

export interface QettaDocEditorProps {
  documentId: string | null
  onClose: () => void
}

export type ViewMode = 'view' | 'edit' | 'generate' | 'preview' | 'hancomdocs'
export type EditorStatus = 'idle' | 'loading' | 'ready' | 'error' | 'saving' | 'generating'

// BATCH 5-4: Hash Certificate (무결성 인증서)
export interface HashCertificate {
  documentId: string
  hashChain: string
  enginePreset: EnginePresetType
  documentType: string
  generationTimeMs: number
  generatedAt: string
  filename: string
  algorithm: 'SHA-256'
}

// API base URL (backend)
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// NOTE: document-generator는 서버 전용입니다.
// 클라이언트에서는 /api/generate-document/* API를 사용하세요.
