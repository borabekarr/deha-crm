import * as React from 'react'
import { cn } from '@/lib/utils'

export interface HeroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Inner padding scale */
  padding?: 'sm' | 'md' | 'lg'
  /** Border-radius scale */
  radius?: 'md' | 'lg'
  /** Render a subtle 20px white grid overlay on the card surface */
  withGrid?: boolean
  children?: React.ReactNode
}

const paddingMap: Record<NonNullable<HeroCardProps['padding']>, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

const radiusMap: Record<NonNullable<HeroCardProps['radius']>, string> = {
  md: 'rounded-[20px]',
  lg: 'rounded-[24px]',
}

/**
 * HeroCard — solid emerald accent surface.
 *
 * Composes: emerald-500 fill · diagonal white-to-transparent sheen ·
 * top-right blur orb · optional 20px white grid · emerald glow shadow.
 */
export function HeroCard({
  className,
  padding = 'md',
  radius = 'lg',
  withGrid = true,
  children,
  ref,
  ...rest
}: HeroCardProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn(
        // Emerald fill
        'relative overflow-hidden bg-emerald-500 text-white',
        // Emerald glow shadow
        '[box-shadow:0_10px_40px_-10px_rgba(16,185,129,0.5)]',
        radiusMap[radius],
        paddingMap[padding],
        className,
      )}
      {...rest}
    >
      {/* Diagonal sheen: linear-gradient 135deg white/20 → transparent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
      />

      {/* Blur orb — top-right corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-[28px]"
      />

      {/* Optional 20px grid overlay */}
      {withGrid && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundSize: '20px 20px',
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),' +
              'linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          }}
        />
      )}

      {/* Content sits above all overlays */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
