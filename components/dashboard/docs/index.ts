/**
 * Dashboard Docs Components
 *
 * 문서 생성, 편집, 검증 관련 컴포넌트 모음
 *
 * @module dashboard/docs
 */

// 문서 생성 진행률 (KidsMap 패턴 적용)
export { GenerationProgress } from './generation-progress'
export { default as GenerationProgressDefault } from './generation-progress'

// 해시체인 검증 배지 (KidsMap 패턴 적용)
export { VerifyBadge, ExpiryBadge } from './verify-badge'
export { default as VerifyBadgeDefault } from './verify-badge'

// 문서 목록
export { default as DocumentList } from './document-list'

// 에디터 관련 (named exports)
export { QettaDocEditor } from './editor'
export { EditorSkeleton } from './editor-skeleton'
export { EditorToolbar } from './editor-toolbar'
export type * from './editor-types'

// 문서 프리뷰
export { QettaDocsPreview } from './preview'
