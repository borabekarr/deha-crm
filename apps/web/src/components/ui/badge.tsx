import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { BadgeProps as BadgeContractProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Variant map using class-variance-authority
// Variants follow prototype .badge classes — success, tag (neutral), danger/time
// ---------------------------------------------------------------------------
const badgeVariants = cva(
  // base: .badge — display:inline-flex; align-items:center; gap:3px; padding:2px 10px;
  // border-radius:9999px; font-size:12px; font-weight:800; font-family:'Montserrat'
  [
    'inline-flex items-center gap-[3px] rounded-full px-[10px] py-[2px]',
    'text-[12px] font-extrabold leading-none',
  ],
  {
    variants: {
      variant: {
        // .badge.success — bg:#10B981; color:#fff; box-shadow inset
        success: [
          'bg-emerald-500 text-white',
          'shadow-[inset_0_-2px_5px_rgba(0,0,0,0.14),inset_0_-1px_0_rgba(255,255,255,0.15)]',
        ],
        // default — neutral light pill matching .badge.tag
        default: [
          'bg-neutral-100 text-neutral-600 border border-neutral-200',
          'shadow-[inset_0_-2px_5px_rgba(0,0,0,0.07),inset_0_-1px_0_rgba(255,255,255,0.8)]',
          'px-3 py-[6px]',
        ],
        // warning — yellow semantic token
        warning: [
          'bg-semantic-warning text-white',
          'shadow-[inset_0_-2px_5px_rgba(0,0,0,0.14),inset_0_-1px_0_rgba(255,255,255,0.15)]',
        ],
        // danger — red semantic token (NEW variant)
        danger: [
          'bg-semantic-danger text-white',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(15,23,42,0.18),inset_0_0_0_1px_rgba(15,23,42,0.10)]',
          'px-[10px] py-1',
        ],
        // neutral — matches .badge.tag exactly
        neutral: [
          'bg-neutral-100 text-neutral-500 border border-neutral-300 px-3 py-[6px]',
          'shadow-[inset_0_-2px_5px_rgba(0,0,0,0.07),inset_0_-1px_0_rgba(255,255,255,0.8)]',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

// ---------------------------------------------------------------------------
// BadgeProps — extends contract + CVA variant props
// The contract's variant union is more limited; we override with our richer set.
// ---------------------------------------------------------------------------
export type BadgeProps = Omit<BadgeContractProps, 'variant' | 'children'> &
  VariantProps<typeof badgeVariants> &
  React.HTMLAttributes<HTMLSpanElement>

function Badge({ ref, className, variant, reducedMotion: _reducedMotion, children, ...props }: BadgeProps & { ref?: React.Ref<HTMLSpanElement> }) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  )
}
Badge.displayName = 'Badge'

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants }
