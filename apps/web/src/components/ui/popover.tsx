import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { PopoverProps } from '@deha/ui-contracts'
import { windowMorph } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Internal context — tracks open state so PopoverContent can drive AnimatePresence
// ---------------------------------------------------------------------------
const PopoverOpenContext = React.createContext(false)

// ---------------------------------------------------------------------------
// Root — strips reducedMotion before forwarding to Radix Root; tracks open state
// ---------------------------------------------------------------------------
const Popover = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: PopoverProps & React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isOpen = openProp ?? internalOpen
  const handleOpenChange = (next: boolean) => {
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  return (
    <PopoverOpenContext.Provider value={isOpen}>
      <PopoverPrimitive.Root open={openProp} defaultOpen={defaultOpen} onOpenChange={handleOpenChange} {...props} />
    </PopoverOpenContext.Provider>
  )
}
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

function PopoverContent({ ref, className, sideOffset = 8, children, ...props }: PopoverContentProps & { ref?: React.Ref<React.ElementRef<typeof PopoverPrimitive.Content>> }) {
  const isOpen = React.useContext(PopoverOpenContext)
  const reducedMotion = useReducedMotion() ?? false
  const morphConfig = windowMorph({ reducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  return (
    <PopoverPrimitive.Portal>
      <AnimatePresence>
        {isOpen && (
          <PopoverPrimitive.Content
            ref={ref}
            forceMount
            sideOffset={sideOffset}
            className={cn(
              // base shape — rounded-2xl, white bg with glass edge
              'z-50 w-72 rounded-2xl',
              'bg-white border border-white/60',
              'shadow-[0_8px_32px_-4px_rgb(15_23_42_/_0.14),0_2px_8px_-2px_rgb(15_23_42_/_0.08)]',
              // generous padding to match the prototype quick-action popover
              'px-5 pt-5 pb-6 min-h-[6rem]',
              // focus ring
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
              className,
            )}
            {...props}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={transition}
              style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
            >
              {children}
            </motion.div>
          </PopoverPrimitive.Content>
        )}
      </AnimatePresence>
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
