import * as React from 'react'
import { type VariantProps } from 'class-variance-authority'
import type { BadgeProps as BadgeContractProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'
import { badgeVariants } from './badge.variants'

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

export { Badge }
