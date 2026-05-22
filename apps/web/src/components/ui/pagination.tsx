import * as React from 'react'
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
const Pagination = React.forwardRef<
  HTMLElement,
  PaginationProps & React.HTMLAttributes<HTMLElement>
>(
  (
    {
      page,
      totalPages,
      onPageChange,
      siblingCount = 1,
      disabled = false,
      reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
      className,
      ...props
    },
    ref,
  ) => {
    const pages = buildPageRange(page, totalPages, siblingCount)

    const buttonBase = cn(
      // prototype: .pager button — min-width:2.5rem; height:2.5rem; padding:0 .5rem
      // border:1px solid var(--slate-200); background:rgb(255 255 255 / .7);
      // backdrop-filter:blur(20px); border-radius:12px; font-size:var(--text-13);
      // font-weight:600; color:var(--slate-700); cursor:pointer
      'inline-flex min-w-10 h-10 items-center justify-center gap-1 rounded-xl',
      'border border-slate-200 bg-white/70 px-2 backdrop-blur-[20px]',
      'text-[13px] font-semibold text-slate-700',
      'transition-colors duration-150 ease-out',
      'hover:bg-white/95',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
      'disabled:pointer-events-none disabled:opacity-40',
    )

    const activeButton = cn(
      // prototype: .pager button[aria-current="page"] — bg:slate-900; color:#fff
      'bg-slate-900 text-white border-slate-900 font-bold',
      'hover:bg-slate-900',
    )

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination"
        className={cn('inline-flex gap-1', className)}
        {...props}
      >
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
              key={`ellipsis-${idx}`}
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
              className={cn(buttonBase, p === page && activeButton)}
            >
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
      </nav>
    )
  },
)
Pagination.displayName = 'Pagination'

export { Pagination }
