import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const chipVariants = cva(
  // Base — shared across all variants
  [
    'inline-flex items-center gap-[6px] rounded-full text-xs font-bold',
    'px-[14px] py-[6px] transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
  ],
  {
    variants: {
      variant: {
        /** Neutral inactive chip — slate bg, slate text */
        default: 'bg-slate-100 text-slate-500 border border-transparent',
        /** Active / selected chip — slate-900 bg, white text */
        active: 'bg-slate-900 text-white border border-transparent',
        /** High priority — red dot indicator */
        'priority-high': 'bg-slate-100 text-slate-500 border border-transparent',
        /** Medium priority — yellow dot indicator */
        'priority-medium': 'bg-slate-100 text-slate-500 border border-transparent',
        /** Low priority — emerald dot indicator */
        'priority-low': 'bg-slate-100 text-slate-500 border border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/** Dot color per priority variant */
const dotColorMap = {
  'priority-high': 'bg-red-500',
  'priority-medium': 'bg-yellow-400',
  'priority-low': 'bg-emerald-500',
} as const

type PriorityVariant = keyof typeof dotColorMap

function hasDot(variant: string | null | undefined): variant is PriorityVariant {
  return variant != null && variant in dotColorMap
}

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {}

/**
 * Chip — small filter/tag element with optional priority dot.
 *
 * Variants:
 *  - `default`         — neutral (slate-100 bg)
 *  - `active`          — selected state (slate-900 bg, white text)
 *  - `priority-high`   — red dot
 *  - `priority-medium` — yellow dot
 *  - `priority-low`    — emerald dot
 *
 * Extends native `<button>` — pass any HTMLButtonElement attribute.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(chipVariants({ variant }), className)}
        {...rest}
      >
        {hasDot(variant) && (
          <span
            aria-hidden="true"
            className={cn('inline-block h-[6px] w-[6px] shrink-0 rounded-full', dotColorMap[variant])}
          />
        )}
        {children}
      </button>
    )
  },
)

Chip.displayName = 'Chip'
