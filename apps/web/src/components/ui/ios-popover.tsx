/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { popoverScaleFromAnchor } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'
import { IOSPopoverOpenContext, useIOSPopoverOpen } from './ios-popover-context'

// ---------------------------------------------------------------------------
// Root — tracks open state and exposes via context
// ---------------------------------------------------------------------------
type IOSPopoverRootProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>

function IOSPopoverRoot({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: IOSPopoverRootProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isOpen = openProp ?? internalOpen
  const handleOpenChange = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  return (
    <IOSPopoverOpenContext.Provider value={isOpen}>
      <PopoverPrimitive.Root
        open={openProp}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </IOSPopoverOpenContext.Provider>
  )
}
IOSPopoverRoot.displayName = 'IOSPopover.Root'

// ---------------------------------------------------------------------------
// Trigger — unstyled pass-through
// ---------------------------------------------------------------------------
function IOSPopoverTrigger({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return (
    <PopoverPrimitive.Trigger
      className={cn('outline-none', className)}
      {...props}
    />
  )
}
IOSPopoverTrigger.displayName = 'IOSPopover.Trigger'

// ---------------------------------------------------------------------------
// Content — iOS-style glass panel with scale-from-anchor animation
// ---------------------------------------------------------------------------
interface IOSPopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  sideOffset?: number
}

function IOSPopoverContent({
  className,
  sideOffset = 10,
  children,
  ...props
}: IOSPopoverContentProps) {
  const isOpen = useIOSPopoverOpen()
  const reducedMotion = useReducedMotion() ?? false
  const scaleConfig = popoverScaleFromAnchor({ reducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: scaleConfig.duration / 1000,
    ease: scaleConfig.ease as [number, number, number, number],
  }

  return (
    <PopoverPrimitive.Portal>
      <AnimatePresence>
        {isOpen && (
          <PopoverPrimitive.Content
            forceMount
            sideOffset={sideOffset}
            className={cn(
              // iOS look — 14px radius, glass background
              'z-50 min-w-[180px] rounded-[14px]',
              'bg-background/80 backdrop-blur-[20px]',
              'border border-white/20 dark:border-white/10',
              'shadow-lg',
              // focus
              'focus-visible:outline-none',
              className,
            )}
            {...props}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={transition}
              style={{
                transformOrigin: 'var(--radix-popover-content-transform-origin)',
              }}
            >
              {children}
            </m.div>
          </PopoverPrimitive.Content>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Portal>
  )
}
IOSPopoverContent.displayName = 'IOSPopover.Content'

// ---------------------------------------------------------------------------
// Arrow — scales 0→1 alongside body, styled for iOS look
// ---------------------------------------------------------------------------
function IOSPopoverArrow({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Arrow>) {
  const isOpen = useIOSPopoverOpen()
  const reducedMotion = useReducedMotion() ?? false
  const scaleConfig = popoverScaleFromAnchor({ reducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: scaleConfig.duration / 1000,
    ease: scaleConfig.ease as [number, number, number, number],
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.span
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={transition}
          style={{ display: 'contents' }}
        >
          <PopoverPrimitive.Arrow
            className={cn(
              'fill-background/80 drop-shadow-sm',
              className,
            )}
            {...props}
          />
        </m.span>
      )}
    </AnimatePresence>
  )
}
IOSPopoverArrow.displayName = 'IOSPopover.Arrow'

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export { IOSPopoverRoot, IOSPopoverTrigger, IOSPopoverContent, IOSPopoverArrow }
export const IOSPopover = {
  Root: IOSPopoverRoot,
  Trigger: IOSPopoverTrigger,
  Content: IOSPopoverContent,
  Arrow: IOSPopoverArrow,
}
