import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ToastProps as ToastContractProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Provider + Viewport
// ---------------------------------------------------------------------------
const ToastProvider = ToastPrimitive.Provider

function ToastViewport({ ref, className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      ref={ref}
      className={cn(
        'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]',
        className,
      )}
      {...props}
    />
  )
}
ToastViewport.displayName = 'ToastViewport'

// ---------------------------------------------------------------------------
// Toast root — variant styles
// ---------------------------------------------------------------------------
const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-start justify-between gap-3',
    'overflow-hidden rounded-lg border p-4 shadow-md',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
    'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
    'data-[state=open]:sm:slide-in-from-bottom-full',
  ],
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
        danger: 'border-red-200 bg-red-50 text-red-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type ToastVariant = VariantProps<typeof toastVariants>['variant']

export type ToastRootProps = Omit<ToastContractProps, 'variant'> &
  VariantProps<typeof toastVariants> &
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>

function Toast({ ref, className, variant, reducedMotion: _reducedMotion, ...props }: ToastRootProps & { ref?: React.Ref<React.ElementRef<typeof ToastPrimitive.Root>> }) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
}
Toast.displayName = 'Toast'

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
function ToastTitle({ ref, className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      ref={ref}
      className={cn('text-sm font-semibold leading-none', className)}
      {...props}
    />
  )
}
ToastTitle.displayName = 'ToastTitle'

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------
function ToastDescription({ ref, className, ...props }: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      ref={ref}
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  )
}
ToastDescription.displayName = 'ToastDescription'

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------
function ToastAction({ ref, className, ...props }: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent',
        'px-3 text-sm font-medium transition-colors',
        'hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
ToastAction.displayName = 'ToastAction'

// ---------------------------------------------------------------------------
// Close
// ---------------------------------------------------------------------------
function ToastClose({ ref, className, ...props }: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      ref={ref}
      toast-close=""
      className={cn(
        'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity',
        'hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring',
        'group-hover:opacity-100',
        className,
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </ToastPrimitive.Close>
  )
}
ToastClose.displayName = 'ToastClose'

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
}
