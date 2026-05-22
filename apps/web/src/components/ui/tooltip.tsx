import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { TooltipProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Provider — wrap once near the app root; exported for consumer convenience
// ---------------------------------------------------------------------------
const TooltipProvider = TooltipPrimitive.Provider
TooltipProvider.displayName = 'TooltipProvider'

// ---------------------------------------------------------------------------
// Root — strips reducedMotion + TooltipProps before forwarding to Radix Root
// Default delayDuration 300 ms per spec
// ---------------------------------------------------------------------------
const Tooltip = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  content: _content,             // eslint-disable-line @typescript-eslint/no-unused-vars
  delayDuration = 300,
  ...props
}: TooltipProps & Omit<React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>, 'children'> & { children: React.ReactNode }) => (
  <TooltipPrimitive.Root delayDuration={delayDuration} {...props} />
)
Tooltip.displayName = 'Tooltip'

// ---------------------------------------------------------------------------
// Trigger — wraps the element that receives hover / focus
// ---------------------------------------------------------------------------
const TooltipTrigger = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ ...props }, ref) => (
  <TooltipPrimitive.Trigger ref={ref} {...props} />
))
TooltipTrigger.displayName = 'TooltipTrigger'

// ---------------------------------------------------------------------------
// Portal — renders into document.body
// ---------------------------------------------------------------------------
const TooltipPortal = TooltipPrimitive.Portal
TooltipPortal.displayName = 'TooltipPortal'

// ---------------------------------------------------------------------------
// Content — floating label
// Prototype tooltip: dark slate bg, white text, rounded-lg, small font
// The kbd inside uses semi-transparent borders/bg (matching prototype .kbd)
// sideOffset default 6 px (comfortable for hover targets)
// ---------------------------------------------------------------------------
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // prototype: dark slate bg, white text — matches .tooltip span
        'z-50 max-w-xs rounded-lg',
        'bg-slate-900 px-3 py-1.5',
        'text-[13px] font-semibold text-white leading-snug',
        'shadow-[0_8px_20px_-4px_rgb(15_23_42_/_0.3)]',
        // Radix-driven animation
        'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=delayed-open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
        'data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = 'TooltipContent'

// ---------------------------------------------------------------------------
// Arrow — small dark caret
// ---------------------------------------------------------------------------
const TooltipArrow = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn('fill-slate-900', className)}
    {...props}
  />
))
TooltipArrow.displayName = 'TooltipArrow'

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
}
