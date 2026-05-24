import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { progressiveBlur } from '@deha/motion-tokens'
import type { ScrollAreaProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root — scrollable container with custom scrollbar styling.
// Props from @deha/ui-contracts: type, scrollHideDelay, orientation, children.
// Optional progressiveHeader: ReactNode — renders a blur-on-scroll sticky header.
// ---------------------------------------------------------------------------
function ScrollArea({
  ref,
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
  children,
  type = 'hover',
  scrollHideDelay = 600,
  orientation = 'vertical',
  progressiveHeader,
  ...props
}: Omit<ScrollAreaProps, 'children'> &
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    ref?: React.Ref<React.ElementRef<typeof ScrollAreaPrimitive.Root>>
    progressiveHeader?: React.ReactNode
  }) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const isReducedMotion = useReducedMotion() ?? false
  const blurFn = progressiveBlur({ reducedMotion: isReducedMotion })

  const { scrollYProgress } = useScroll({ container: viewportRef })
  const blurPx = useTransform(scrollYProgress, [0, 0.08], [blurFn(0), blurFn(1)])

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      type={type}
      scrollHideDelay={scrollHideDelay}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {progressiveHeader != null && (
        <motion.div
          data-scroll-area-progressive-header=""
          style={{ '--blur-px': blurPx } as React.CSSProperties}
          className={cn(
            'sticky top-0 z-10',
            'bg-background/90',
            'supports-[backdrop-filter]:bg-background/70',
            'supports-[backdrop-filter]:[backdrop-filter:blur(var(--blur-px,0px))]',
            'transition-[background-color] duration-200',
          )}
        >
          {progressiveHeader}
        </motion.div>
      )}
      <ScrollAreaPrimitive.Viewport ref={viewportRef} tabIndex={0} className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>

      {(orientation === 'vertical' || orientation === 'both') && (
        <ScrollBar orientation="vertical" />
      )}
      {(orientation === 'horizontal' || orientation === 'both') && (
        <ScrollBar orientation="horizontal" />
      )}

      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}
ScrollArea.displayName = 'ScrollArea'

// ---------------------------------------------------------------------------
// ScrollBar — custom-styled scrollbar track + thumb.
// Thin neutral-200 track, neutral-300 thumb on hover, rounded pill shape.
// ---------------------------------------------------------------------------
function ScrollBar({ ref, className, orientation = 'vertical', ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-opacity duration-200',
        'data-[state=hidden]:opacity-0 data-[state=visible]:opacity-100',
        orientation === 'vertical' && 'h-full w-2 border-l border-l-transparent p-px',
        orientation === 'horizontal' && 'h-2 flex-col border-t border-t-transparent p-px',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className={cn(
          'relative flex-1 rounded-full bg-neutral-300/70',
          'transition-colors duration-150',
          'hover:bg-neutral-400/80',
          // inset shadow for depth
          'shadow-[inset_0_0_0_1px_rgb(0_0_0_/_0.04)]',
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}
ScrollBar.displayName = 'ScrollBar'

export { ScrollArea, ScrollBar }
