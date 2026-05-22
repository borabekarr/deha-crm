import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base — shared across all variants
  [
    'inline-flex items-center justify-center gap-2 font-bold transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        /**
         * Primary — emerald fill, white text, glass shadow.
         * Maps to the CTA / action button in the design bundle.
         */
        primary: [
          'bg-emerald-500 text-white rounded-2xl',
          '[box-shadow:0_4px_16px_-4px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]',
          'hover:bg-emerald-600',
        ],
        /**
         * Secondary — frosted glass, slate text, hairline border.
         */
        secondary: [
          'bg-white/70 text-slate-600 rounded-2xl',
          'border border-white/60',
          '[box-shadow:0_2px_6px_-2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)]',
          'backdrop-blur-sm',
          'hover:bg-white/90',
        ],
        /**
         * Ghost — no fill, slate text, subtle hover.
         */
        ghost: [
          'bg-transparent text-slate-500 rounded-xl',
          'hover:bg-slate-100 hover:text-slate-700',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * Button — design-system primitive.
 *
 * Variants: `primary` (emerald fill + glass shadow), `secondary` (glass surface),
 * `ghost` (transparent + hover tint).
 *
 * Sizes: `sm` (h-8), `md` (h-10, default), `lg` (h-12).
 *
 * Extends native `<button>` — pass any HTMLButtonElement attribute.
 */
export function Button({ className, variant, size, ref, type, ...rest }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    />
  )
}
