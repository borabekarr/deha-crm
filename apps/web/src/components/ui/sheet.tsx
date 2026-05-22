import * as React from 'react'
import { Drawer } from 'vaul'
import type { SheetProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// Side context lets SheetContent inherit positioning from the root Sheet without re-prop-drilling.
const SheetContext = React.createContext<{ side: 'top' | 'right' | 'bottom' | 'left' }>({ side: 'right' })

// ---------------------------------------------------------------------------
// Root — wraps vaul Drawer with snapPoints for Apple Maps style peek/full
// ---------------------------------------------------------------------------
const Sheet = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  side = 'right',
  children,
  ...props
}: SheetProps & React.ComponentPropsWithoutRef<typeof Drawer.Root>) => (
  <SheetContext.Provider value={{ side }}>
    <Drawer.Root snapPoints={[0.4, 0.85]} direction={side} {...props}>
      {children}
    </Drawer.Root>
  </SheetContext.Provider>
)
Sheet.displayName = 'Sheet'

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
const SheetTrigger = React.forwardRef<
  React.ComponentRef<typeof Drawer.Trigger>,
  React.ComponentPropsWithoutRef<typeof Drawer.Trigger>
>((props, ref) => <Drawer.Trigger ref={ref} {...props} />)
SheetTrigger.displayName = 'SheetTrigger'

// ---------------------------------------------------------------------------
// Overlay — scrim behind the drawer
// ---------------------------------------------------------------------------
const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof Drawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof Drawer.Overlay>
>(({ className, ...props }, ref) => (
  <Drawer.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm', className)}
    {...props}
  />
))
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
const SheetContent = React.forwardRef<
  React.ComponentRef<typeof Drawer.Content>,
  React.ComponentPropsWithoutRef<typeof Drawer.Content>
>(({ className, children, ...props }, ref) => {
  const { side } = React.useContext(SheetContext)
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
})
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
const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof Drawer.Title>,
  React.ComponentPropsWithoutRef<typeof Drawer.Title>
>(({ className, ...props }, ref) => (
  <Drawer.Title
    ref={ref}
    className={cn('text-[length:var(--text-20)] font-semibold text-[var(--foreground)]', className)}
    {...props}
  />
))
SheetTitle.displayName = 'SheetTitle'

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------
const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof Drawer.Description>,
  React.ComponentPropsWithoutRef<typeof Drawer.Description>
>(({ className, ...props }, ref) => (
  <Drawer.Description
    ref={ref}
    className={cn('mt-1 text-[length:var(--text-14)] text-[var(--muted-foreground)]', className)}
    {...props}
  />
))
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
const SheetClose = React.forwardRef<
  React.ComponentRef<typeof Drawer.Close>,
  React.ComponentPropsWithoutRef<typeof Drawer.Close>
>((props, ref) => <Drawer.Close ref={ref} {...props} />)
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
