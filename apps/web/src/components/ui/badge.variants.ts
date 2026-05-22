import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  [
    'inline-flex items-center gap-[3px] rounded-full px-[10px] py-[2px]',
    'text-[12px] font-extrabold leading-none',
  ],
  {
    variants: {
      variant: {
        success: [
          'bg-emerald-500 text-white',
          'shadow-[inset_0_-2px_5px_rgba(0,0,0,0.14),inset_0_-1px_0_rgba(255,255,255,0.15)]',
        ],
        default: [
          'bg-neutral-100 text-neutral-600 border border-neutral-200',
          'shadow-[inset_0_-2px_5px_rgba(0,0,0,0.07),inset_0_-1px_0_rgba(255,255,255,0.8)]',
          'px-3 py-[6px]',
        ],
        warning: [
          'bg-semantic-warning text-white',
          'shadow-[inset_0_-2px_5px_rgba(0,0,0,0.14),inset_0_-1px_0_rgba(255,255,255,0.15)]',
        ],
        danger: [
          'bg-semantic-danger text-white',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(15,23,42,0.18),inset_0_0_0_1px_rgba(15,23,42,0.10)]',
          'px-[10px] py-1',
        ],
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
