import * as React from 'react'
import { m, LayoutGroup, useReducedMotion } from 'framer-motion'
import { tabMorph } from '@deha/motion-tokens'
import type { PaginationProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Ellipsis range builder (no hooks, pure derived computation)
// ---------------------------------------------------------------------------
function buildPageRange(page: number, total: number, siblings = 1): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(page - siblings, 1)
  const rightSiblingIndex = Math.min(page + siblings, total)

  const showLeftEllipsis = leftSiblingIndex > 2
  const showRightEllipsis = rightSiblingIndex < total - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + 2 * siblings }, (_, i) => i + 1)
    return [...leftRange, '...', total]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: 3 + 2 * siblings },
      (_, i) => total - (3 + 2 * siblings) + 1 + i,
    )
    return [1, '...', ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  )
  return [1, '...', ...middleRange, '...', total]
}

// ---------------------------------------------------------------------------
// Chevron icons (inline SVG, no extra deps)
// ---------------------------------------------------------------------------
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-4', className)}
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-4', className)}
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
function Pagination({
  ref,
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  disabled = false,
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
  ...props
}: PaginationProps & React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }) {
  const pages = buildPageRange(page, totalPages, siblingCount)

  // Stable scope per mount for layoutId
  const scopeId = React.useId()

  const prefersReducedMotion = useReducedMotion() ?? false
  const morphConfig = tabMorph({ reducedMotion: prefersReducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  const buttonBase = cn(
    // prototype: .pager button — min-width:2.5rem; height:2.5rem; padding:0 .5rem
    // border:1px solid var(--neutral-200); background:rgb(255 255 255 / .7);
    // backdrop-filter:blur(20px); border-radius:12px; font-size:var(--text-13);
    // font-weight:600; color:var(--neutral-700); cursor:pointer
    'relative inline-flex min-w-10 h-10 items-center justify-center gap-1 rounded-xl',
    'border border-neutral-200 bg-white/70 px-2 backdrop-blur-[20px]',
    'text-[13px] font-semibold text-neutral-700',
    'transition-colors duration-150 ease-out',
    'hover:bg-white/95',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-40',
  )

  return (
    <nav
      ref={ref}
      aria-label="Pagination"
      className={cn('inline-flex gap-1', className)}
      {...props}
    >
      <LayoutGroup id={`pagination-indicator-${scopeId}`}>
        {/* Prev */}
        <button
          type="button"
          aria-label="Go to previous page"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className={buttonBase}
        >
          <ChevronLeft />
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === '...' ? (
            <span
              key={`ellipsis-after-${pages[idx - 1] ?? 'start'}`}
              className={cn(
                buttonBase,
                'cursor-default border-transparent bg-transparent hover:bg-transparent',
              )}
              aria-hidden
            >
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Go to page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              disabled={disabled}
              onClick={() => onPageChange?.(p as number)}
              className={cn(
                buttonBase,
                p === page
                  ? 'border-neutral-900 font-bold text-white hover:bg-neutral-900'
                  : '',
              )}
            >
              {/* Morphing active indicator — only rendered behind the current page */}
              {p === page && (
                <m.span
                  layoutId={`pagination-indicator-${scopeId}`}
                  data-motion-indicator="true"
                  className="absolute inset-0 -z-[1] rounded-xl bg-neutral-900"
                  transition={transition}
                  aria-hidden
                />
              )}
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          aria-label="Go to next page"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
          className={buttonBase}
        >
          <ChevronRight />
        </button>
      </LayoutGroup>
    </nav>
  )
}
Pagination.displayName = 'Pagination'

export { Pagination }
