import * as React from 'react'
import { m, useTransform } from 'framer-motion'
import { progressiveBlur } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'
import { useProgressiveBlur } from './progressive-blur-context'

interface HeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Show optional top gradient mask overlay */
  topGradient?: boolean
}

export function Header({ className, children, topGradient = false, ...props }: HeaderProps) {
  const { scrollProgress, reducedMotion } = useProgressiveBlur()
  const blurFn = progressiveBlur({ reducedMotion })

  // Map 0..0.08 scroll band to 0..16px blur (snap to max quickly on scroll start)
  const blurPx = useTransform(scrollProgress, [0, 0.08], [blurFn(0), blurFn(1)])

  return (
    <m.div
      data-progressive-blur-header=""
      style={{ '--blur-px': blurPx.get() !== undefined ? blurPx : undefined } as React.CSSProperties}
      className={cn(
        'sticky top-0 z-10',
        // Backdrop-filter blur with @supports fallback
        'bg-background/90',
        'supports-[backdrop-filter]:bg-background/70',
        'supports-[backdrop-filter]:[backdrop-filter:blur(var(--blur-px,0px))]',
        // Transition for non-reduced motion
        'transition-[background-color] duration-200',
        className,
      )}
      {...(props as React.ComponentPropsWithoutRef<typeof m.div>)}
    >
      {topGradient && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background/60 to-transparent"
        />
      )}
      {children}
    </m.div>
  )
}
Header.displayName = 'ProgressiveBlur.Header'
