import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { TooltipProps } from '@deha/ui-contracts'
import { windowMorph } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'

// Default Tooltip export = contract-level (Tooltip content="..."); named exports (TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent) = manual composition.

// ---------------------------------------------------------------------------
// Internal context — tracks open state so TooltipContent can drive AnimatePresence
// ---------------------------------------------------------------------------
const TooltipOpenContext = React.createContext(false)

// ---------------------------------------------------------------------------
// Provider — wrap once near the app root; exported for consumer convenience
// ---------------------------------------------------------------------------
const TooltipProvider = TooltipPrimitive.Provider
TooltipProvider.displayName = 'TooltipProvider'

// ---------------------------------------------------------------------------
// Root — contract-level entry point: wraps Provider + Root + Trigger + Content
// Usage: <Tooltip content="Label"><Button /></Tooltip>
// Default delayDuration 300 ms per spec
// ---------------------------------------------------------------------------
const Tooltip = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  content,
  open: openProp,
  defaultOpen,
  onOpenChange,
  delayDuration = 300,
  children,
}: TooltipProps & { children: React.ReactNode }) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isOpen = openProp ?? internalOpen
  const handleOpenChange = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  return (
    <TooltipOpenContext.Provider value={isOpen}>
      <TooltipPrimitive.Provider>
        <TooltipPrimitive.Root
          open={openProp}
          defaultOpen={defaultOpen}
          onOpenChange={handleOpenChange}
          delayDuration={delayDuration}
        >
          <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
          <TooltipContent>{content}</TooltipContent>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    </TooltipOpenContext.Provider>
  )
}
Tooltip.displayName = 'Tooltip'

// ---------------------------------------------------------------------------
// TooltipRoot — manual-composition entry point; tracks open state for AnimatePresence
// ---------------------------------------------------------------------------
function TooltipRoot({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isOpen = openProp ?? internalOpen
  const handleOpenChange = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  return (
    <TooltipOpenContext.Provider value={isOpen}>
      <TooltipPrimitive.Root open={openProp} defaultOpen={defaultOpen} onOpenChange={handleOpenChange} {...props} />
    </TooltipOpenContext.Provider>
  )
}
TooltipRoot.displayName = 'TooltipRoot'

// ---------------------------------------------------------------------------
// Trigger — wraps the element that receives hover / focus
// ---------------------------------------------------------------------------
function TooltipTrigger({ ref, ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger ref={ref} {...props} />
}
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
function TooltipContent({ ref, className, sideOffset = 6, children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const isOpen = React.useContext(TooltipOpenContext)
  const reducedMotion = useReducedMotion() ?? false
  const morphConfig = windowMorph({ reducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  return (
    <TooltipPrimitive.Portal>
      <AnimatePresence>
        {isOpen && (
          <TooltipPrimitive.Content
            ref={ref}
            forceMount
            sideOffset={sideOffset}
            className={cn(
              // prototype: dark slate bg, white text — matches .tooltip span
              'z-50 max-w-xs rounded-lg',
              'bg-neutral-900 px-3 py-1.5',
              'text-[13px] font-semibold text-white leading-snug',
              'shadow-[0_8px_20px_-4px_rgb(15_23_42_/_0.3)]',
              className,
            )}
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={transition}
              style={{ transformOrigin: 'var(--radix-tooltip-content-transform-origin)' }}
            >
              {children}
            </motion.div>
          </TooltipPrimitive.Content>
        )}
      </AnimatePresence>
    </TooltipPrimitive.Portal>
  )
}
TooltipContent.displayName = 'TooltipContent'

// ---------------------------------------------------------------------------
// Arrow — small dark caret
// ---------------------------------------------------------------------------
function TooltipArrow({ ref, className, ...props }: React.ComponentProps<typeof TooltipPrimitive.Arrow>) {
  return (
    <TooltipPrimitive.Arrow
      ref={ref}
      className={cn('fill-neutral-900', className)}
      {...props}
    />
  )
}
TooltipArrow.displayName = 'TooltipArrow'

export {
  TooltipProvider,
  Tooltip,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
}
