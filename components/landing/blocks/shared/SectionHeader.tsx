import { memo } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  titleHighlight?: string // 그라디언트 적용될 부분
  description?: string
  id?: string
  descriptionId?: string
  className?: string
}

/**
 * SectionHeader - 랜딩 페이지 섹션 헤더 공유 컴포넌트
 *
 * @example
 * <SectionHeader
 *   title="6 domain engines."
 *   titleHighlight="600+ industry terms."
 *   description="Purpose-built for Korean government compliance."
 * />
 */
export const SectionHeader = memo(function SectionHeader({
  title,
  titleHighlight,
  description,
  id,
  descriptionId,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mx-auto max-w-2xl text-center', className)}>
      <h2
        id={id}
        className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
      >
        {title}
        {titleHighlight && (
          <>
            <br />
            <span className="bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 bg-clip-text text-transparent">
              {titleHighlight}
            </span>
          </>
        )}
      </h2>
      {description && (
        <p id={descriptionId} className="mt-6 text-lg text-zinc-400">
          {description}
        </p>
      )}
    </div>
  )
})
