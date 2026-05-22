import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { DialogProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root — strips reducedMotion before forwarding to Radix Root
// ---------------------------------------------------------------------------
const Dialog = ({
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: DialogProps & React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root {...props} />
)
Dialog.displayName = 'Dialog'

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
function DialogTrigger({ ref, ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger ref={ref} {...props} />
}
DialogTrigger.displayName = 'DialogTrigger'

// ---------------------------------------------------------------------------
// Portal
// ---------------------------------------------------------------------------
const DialogPortal = DialogPrimitive.Portal
DialogPortal.displayName = 'DialogPortal'

// ---------------------------------------------------------------------------
// Overlay — blur backdrop, matches prototype `.overlay`
// ---------------------------------------------------------------------------
function DialogOverlay({ ref, className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}
DialogOverlay.displayName = 'DialogOverlay'

// ---------------------------------------------------------------------------
// Content — white card, rounded-2xl, shadow-overlay-strong
// ---------------------------------------------------------------------------
function DialogContent({ ref, className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -tranneutral-x-1/2 -tranneutral-y-1/2',
          'w-full max-w-md rounded-2xl bg-white p-6',
          'shadow-[var(--shadow-overlay-strong)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}
DialogContent.displayName = 'DialogContent'

// ---------------------------------------------------------------------------
// Header — optional `icon` slot renders with red bg + white glyph (Pass 3)
// ---------------------------------------------------------------------------
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
}

const DialogHeader = ({ className, icon, children, ...props }: DialogHeaderProps) => (
  <div className={cn('mb-4', className)} {...props}>
    {icon && (
      <div
        className={cn(
          'mb-4 grid h-12 w-12 place-items-center rounded-full',
          'bg-red-600 text-white',
          'shadow-[var(--shadow-overlay-strong)]',
        )}
      >
        {icon}
      </div>
    )}
    {children}
  </div>
)
DialogHeader.displayName = 'DialogHeader'

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-6 flex items-center justify-end gap-2.5', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
function DialogTitle({ ref, className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-[length:var(--text-20)] font-semibold text-[var(--foreground)]', className)}
      {...props}
    />
  )
}
DialogTitle.displayName = 'DialogTitle'

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------
function DialogDescription({ ref, className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('mt-1.5 mb-6 text-[length:var(--text-14)] text-[var(--muted-foreground)]', className)}
      {...props}
    />
  )
}
DialogDescription.displayName = 'DialogDescription'

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------
function DialogClose({ ref, ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close ref={ref} {...props} />
}
DialogClose.displayName = 'DialogClose'

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}
