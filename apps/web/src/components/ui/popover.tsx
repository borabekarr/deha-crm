import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { PopoverProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root — strips reducedMotion before forwarding to Radix Root
// ---------------------------------------------------------------------------
const Popover = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: PopoverProps & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root {...props} />
)
Popover.displayName = 'Popover'

// ---------------------------------------------------------------------------
// Trigger — unstyled pass-through; consumers supply their own button
// ---------------------------------------------------------------------------
function PopoverTrigger({ ref, className, ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return (
    <PopoverPrimitive.Trigger
      ref={ref}
      className={cn('outline-none', className)}
      {...props}
    />
  )
}
PopoverTrigger.displayName = 'PopoverTrigger'

// ---------------------------------------------------------------------------
// Portal — renders into document.body to avoid stacking-context clipping
// ---------------------------------------------------------------------------
const PopoverPortal = PopoverPrimitive.Portal
PopoverPortal.displayName = 'PopoverPortal'

// ---------------------------------------------------------------------------
// Content — floating panel
// Prototype: white bg, subtle border + shadow, rounded-2xl, generous padding.
// sideOffset defaults to 8 px (per-spec).
// ---------------------------------------------------------------------------
interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  sideOffset?: number
}

function PopoverContent({ ref, className, sideOffset = 8, ...props }: PopoverContentProps & { ref?: React.Ref<React.ElementRef<typeof PopoverPrimitive.Content>> }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          // base shape — rounded-2xl, white bg with glass edge
          'z-50 w-72 rounded-2xl',
          'bg-white border border-white/60',
          'shadow-[0_8px_32px_-4px_rgb(15_23_42_/_0.14),0_2px_8px_-2px_rgb(15_23_42_/_0.08)]',
          // generous padding to match the prototype quick-action popover
          'px-5 pt-5 pb-6 min-h-[6rem]',
          // animation: fade + translate driven by Radix data attributes
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          // focus ring
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
PopoverContent.displayName = 'PopoverContent'

// ---------------------------------------------------------------------------
// Arrow — optional decorative arrow
// ---------------------------------------------------------------------------
function PopoverArrow({ ref, className, ...props }: React.ComponentProps<typeof PopoverPrimitive.Arrow>) {
  return (
    <PopoverPrimitive.Arrow
      ref={ref}
      className={cn('fill-white drop-shadow-sm', className)}
      {...props}
    />
  )
}
PopoverArrow.displayName = 'PopoverArrow'

// ---------------------------------------------------------------------------
// Close — convenience button inside content
// ---------------------------------------------------------------------------
function PopoverClose({ ref, className, ...props }: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return (
    <PopoverPrimitive.Close
      ref={ref}
      className={cn(
        'absolute right-3 top-3 rounded-md p-0.5 text-neutral-400',
        'hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        'transition-colors duration-150',
        className,
      )}
      {...props}
    />
  )
}
PopoverClose.displayName = 'PopoverClose'

export {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
}
