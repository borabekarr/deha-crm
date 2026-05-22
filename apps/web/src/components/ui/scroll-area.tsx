import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import type { ScrollAreaProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root — scrollable container with custom scrollbar styling.
// Props from @deha/ui-contracts: type, scrollHideDelay, orientation, children.
// No progressive blur — that comes in a later pass.
// ---------------------------------------------------------------------------
function ScrollArea({
  ref,
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
  children,
  type = 'hover',
  scrollHideDelay = 600,
  orientation = 'vertical',
  ...props
}: Omit<ScrollAreaProps, 'children'> &
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & { ref?: React.Ref<React.ElementRef<typeof ScrollAreaPrimitive.Root>> }) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      type={type}
      scrollHideDelay={scrollHideDelay}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
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
