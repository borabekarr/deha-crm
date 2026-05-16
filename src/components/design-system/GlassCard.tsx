import * as React from 'react'
import { cn } from '@/lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Inner padding scale */
  padding?: 'sm' | 'md' | 'lg'
  /** Border-radius scale */
  radius?: 'md' | 'lg'
  children?: React.ReactNode
}

const paddingMap: Record<NonNullable<GlassCardProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

const radiusMap: Record<NonNullable<GlassCardProps['radius']>, string> = {
  md: 'rounded-[20px]',
  lg: 'rounded-[24px]',
}

/**
 * GlassCard — neutral frosted-glass surface.
 *
 * Composes: white/70 fill · 40px backdrop blur · hairline white border ·
 * layered box-shadow (glass shadow + inner highlight).
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, padding = 'md', radius = 'lg', children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Fill + blur
          'bg-white/70 backdrop-blur-[40px]',
          // Border
          'border border-white/60',
          // Shadow: outer glass shadow + inner top highlight
          '[box-shadow:0_4px_6px_-1px_rgba(0,0,0,0.10),0_2px_4px_-1px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.4)]',
          // Overflow clip so children respect radius
          'overflow-hidden',
          radiusMap[radius],
          paddingMap[padding],
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    )
  },
)

GlassCard.displayName = 'GlassCard'
