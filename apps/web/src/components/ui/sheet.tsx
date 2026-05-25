import * as React from 'react'
import { Drawer } from 'vaul'
import { useReducedMotion } from 'framer-motion'
import type { SheetProps } from '@deha/ui-contracts'
import { sheetDetent, swipeReveal } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'

// Side context lets SheetContent inherit positioning from the root Sheet without re-prop-drilling.
const SheetContext = React.createContext<{ side: 'top' | 'right' | 'bottom' | 'left' }>({ side: 'right' })

// ---------------------------------------------------------------------------
// Root — wraps vaul Drawer with snapPoints for Apple Maps style peek/full
// ---------------------------------------------------------------------------
function Sheet({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  side = 'right',
  children,
  ...props
}: SheetProps & React.ComponentPropsWithoutRef<typeof Drawer.Root>) {
  const ctxValue = React.useMemo(() => ({ side }), [side])
  return (
    <SheetContext.Provider value={ctxValue}>
      <Drawer.Root snapPoints={[0.4, 0.85]} direction={side} {...props}>
        {children}
      </Drawer.Root>
    </SheetContext.Provider>
  )
}
Sheet.displayName = 'Sheet'

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
function SheetTrigger({ ref, ...props }: React.ComponentProps<typeof Drawer.Trigger>) {
  return <Drawer.Trigger ref={ref} {...props} />
}
SheetTrigger.displayName = 'SheetTrigger'

// ---------------------------------------------------------------------------
// Overlay — scrim behind the drawer
// ---------------------------------------------------------------------------
function SheetOverlay({ ref, className, ...props }: React.ComponentProps<typeof Drawer.Overlay>) {
  return (
    <Drawer.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm', className)}
      {...props}
    />
  )
}
SheetOverlay.displayName = 'SheetOverlay'

const sidePositionClasses: Record<'top' | 'right' | 'bottom' | 'left', string> = {
  right: 'right-0 top-0 h-full max-w-[440px] w-full border-l',
  left:  'left-0 top-0 h-full max-w-[440px] w-full border-r',
  top:   'top-0 left-0 w-full max-h-[80vh] border-b',
  bottom:'bottom-0 left-0 w-full max-h-[80vh] border-t',
}

// ---------------------------------------------------------------------------
// Content — slide-over panel, positioned based on parent Sheet's `side` prop
// ---------------------------------------------------------------------------
function SheetContent({ ref, className, children, ...props }: React.ComponentProps<typeof Drawer.Content>) {
  const { side } = React.use(SheetContext)
  const prefersReduced = useReducedMotion() ?? false
  const detentConfig = sheetDetent({ reducedMotion: prefersReduced })
  const swipeSpring = swipeReveal({ reducedMotion: prefersReduced })

  return (
    <Drawer.Portal>
      <SheetOverlay />
      <Drawer.Content
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col',
          sidePositionClasses[side],
          'bg-white',
          'shadow-[var(--shadow-overlay-strong)]',
          'outline-none',
          className,
        )}
        style={{
          transitionTimingFunction: `cubic-bezier(${detentConfig.ease.join(',')})`,
        }}
        data-swipe-spring={swipeSpring.type === 'spring' ? String(swipeSpring.stiffness) : '0'}
        {...props}
      >
        {/* Drag handle indicator */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-[var(--border)]" />
        <div className="flex flex-1 flex-col overflow-auto p-6">
          {children}
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  )
}
SheetContent.displayName = 'SheetContent'

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
function SheetTitle({ ref, className, ...props }: React.ComponentProps<typeof Drawer.Title>) {
  return (
    <Drawer.Title
      ref={ref}
      className={cn('text-[length:var(--text-20)] font-semibold text-[var(--foreground)]', className)}
      {...props}
    />
  )
}
SheetTitle.displayName = 'SheetTitle'

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------
function SheetDescription({ ref, className, ...props }: React.ComponentProps<typeof Drawer.Description>) {
  return (
    <Drawer.Description
      ref={ref}
      className={cn('mt-1 text-[length:var(--text-14)] text-[var(--muted-foreground)]', className)}
      {...props}
    />
  )
}
SheetDescription.displayName = 'SheetDescription'

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-auto flex items-center gap-2.5 pt-4', className)}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------
function SheetClose({ ref, ...props }: React.ComponentProps<typeof Drawer.Close>) {
  return <Drawer.Close ref={ref} {...props} />
}
SheetClose.displayName = 'SheetClose'

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetOverlay,
}
