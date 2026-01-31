'use client'

import { cn } from '@/lib/utils'
import { LINE_TYPES, type LineType } from '@/lib/design-tokens'

/**
 * Code diff line structure
 */
interface DiffLine {
  lineNumber: number
  content: string
  type: LineType
}

interface CodeBlockProps {
  lines: DiffLine[]
  variant: 'before' | 'after'
}

// Linear Reviews English style + QETTA comments
const qettaBeforeLines: DiffLine[] = [
  { lineNumber: 1, content: '/**', type: LINE_TYPES.COMMENT },
  { lineNumber: 2, content: ' * The legacy model of proposal writing', type: LINE_TYPES.COMMENT },
  { lineNumber: 3, content: ' * built around human-only workflows.', type: LINE_TYPES.COMMENT },
  { lineNumber: 4, content: ' */', type: LINE_TYPES.COMMENT },
  { lineNumber: 5, content: 'export const Proposal = () => {', type: LINE_TYPES.CONTEXT },
  { lineNumber: 6, content: '  <Manual.Process>', type: LINE_TYPES.CONTEXT },
  { lineNumber: 7, content: '    <Slow />', type: LINE_TYPES.REMOVED },
  { lineNumber: 8, content: '    <Inconsistent />', type: LINE_TYPES.REMOVED },
  { lineNumber: 9, content: '    <Exhausting />', type: LINE_TYPES.REMOVED },
  { lineNumber: 10, content: '  </Manual.Process>', type: LINE_TYPES.CONTEXT },
  { lineNumber: 11, content: '};', type: LINE_TYPES.CONTEXT },
]

const qettaAfterLines: DiffLine[] = [
  { lineNumber: 1, content: '/**', type: LINE_TYPES.COMMENT },
  { lineNumber: 2, content: ' * A new era of proposal writing,', type: LINE_TYPES.COMMENT },
  { lineNumber: 3, content: ' * where humans and AI co-create.', type: LINE_TYPES.COMMENT },
  { lineNumber: 4, content: ' */', type: LINE_TYPES.COMMENT },
  { lineNumber: 5, content: 'export const Proposal = () => {', type: LINE_TYPES.CONTEXT },
  { lineNumber: 6, content: '  <QETTA.Engine>', type: LINE_TYPES.CONTEXT },
  { lineNumber: 7, content: '    <Fast />', type: LINE_TYPES.ADDED },
  { lineNumber: 8, content: '    <Accurate />', type: LINE_TYPES.ADDED },
  { lineNumber: 9, content: '    <Effortless />', type: LINE_TYPES.ADDED },
  { lineNumber: 10, content: '  </QETTA.Engine>', type: LINE_TYPES.CONTEXT },
  { lineNumber: 11, content: '};', type: LINE_TYPES.CONTEXT },
]

/**
 * Get aria-label for accessibility based on line type
 */
function getLineAriaLabel(line: DiffLine): string {
  const typeLabels: Record<LineType, string> = {
    [LINE_TYPES.ADDED]: 'added',
    [LINE_TYPES.REMOVED]: 'removed',
    [LINE_TYPES.CONTEXT]: '',
    [LINE_TYPES.COMMENT]: 'comment',
  }
  const typeLabel = typeLabels[line.type]
  return typeLabel
    ? `Line ${line.lineNumber}: ${typeLabel}`
    : `Line ${line.lineNumber}`
}

// Linear style: distinguish comment delimiter from comment content
// Background color only applies to content lines (excludes delimiter)
function isCommentContent(content: string): boolean {
  // " * " 로 시작하는 라인만 주석 내용으로 취급 (/** 와 */ 제외)
  return content.trimStart().startsWith('*') &&
         !content.includes('/**') &&
         !content.trimEnd().endsWith('*/')
}

function CodeBlock({ lines, variant }: CodeBlockProps) {
  return (
    <div
      className="linear-code-block"
      role="region"
      aria-label={`${variant === 'before' ? 'Before' : 'After'} code`}
    >
      {lines.map((line) => {
        const isAdded = line.type === LINE_TYPES.ADDED
        const isRemoved = line.type === LINE_TYPES.REMOVED
        const isComment = line.type === LINE_TYPES.COMMENT
        // Linear style: background color only for comment content (excludes delimiter)
        const isCommentWithBg = isComment && isCommentContent(line.content)

        return (
          <div
            key={line.lineNumber}
            role="row"
            aria-label={getLineAriaLabel(line)}
            className={cn(
              'linear-code-line',
              isAdded && 'linear-code-line--added',
              isRemoved && 'linear-code-line--removed',
              // Linear style: variant-specific background color only for comment content
              isCommentWithBg && variant === 'before' && 'linear-code-line--comment-before',
              isCommentWithBg && variant === 'after' && 'linear-code-line--comment-after'
            )}
          >
            <span className="linear-line-number" aria-hidden="true">
              {String(line.lineNumber).padStart(2, '0')}
            </span>
            <code
              className={cn(
                'linear-line-content',
                // Comment color: applies to all comment lines (including delimiter)
                isComment && variant === 'before' && 'text-[var(--diff-comment-before)] italic',
                isComment && variant === 'after' && 'text-[var(--diff-comment-after)] italic',
                isAdded && 'text-[var(--diff-comment-after)]',
                isRemoved && 'text-[var(--diff-comment-before)]'
              )}
            >
              {line.content}
            </code>
          </div>
        )
      })}
    </div>
  )
}

/**
 * LinearCodeDiff - Linear Reviews 100% benchmarked code diff
 * No header, minimal design, colored comments
 */
export function LinearCodeDiff() {
  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-[1000px] mx-auto">
      <CodeBlock lines={qettaBeforeLines} variant="before" />
      <CodeBlock lines={qettaAfterLines} variant="after" />
    </div>
  )
}
