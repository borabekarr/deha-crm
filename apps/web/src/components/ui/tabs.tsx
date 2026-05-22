import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { TabsProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root — thin wrapper that passes through TabsProps + strips reducedMotion
// ---------------------------------------------------------------------------
const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  TabsProps & React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, reducedMotion: _reducedMotion, ...props }, ref) => (  // eslint-disable-line @typescript-eslint/no-unused-vars
  <TabsPrimitive.Root
    ref={ref}
    className={cn('flex flex-col gap-4', className)}
    {...props}
  />
))
Tabs.displayName = 'Tabs'

// ---------------------------------------------------------------------------
// List — segmented pill container (matches .tabs-list in prototype)
// ---------------------------------------------------------------------------
const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // prototype: display:inline-flex; padding:.25rem; background:var(--slate-100);
      // border-radius:9999px; gap:.125rem; position:relative
      'relative inline-flex items-center gap-0.5 rounded-full bg-slate-100 p-1',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

// ---------------------------------------------------------------------------
// Trigger — pill button; active state uses dark bg to match prototype
// ---------------------------------------------------------------------------
const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // base: .tabs-trigger — inline-flex; align-items:center; gap:.3rem;
      // padding:.5rem 1rem; font-size:var(--text-13); font-weight:600; color:slate-500
      // border-radius:9999px; cursor:pointer; border:0; background:transparent
      'relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0',
      'bg-transparent px-4 py-2 font-sans text-[13px] font-semibold text-slate-500',
      'transition-colors duration-150 ease-out',
      // active: .tabs-trigger[aria-selected="true"] — bg:slate-900; color:#fff;
      // box-shadow:0 4px 12px -2px rgb(15 23 42 / .2); font-weight:700
      'data-[state=active]:bg-slate-900 data-[state=active]:font-bold data-[state=active]:text-white',
      'data-[state=active]:shadow-[0_4px_12px_-2px_rgb(15_23_42_/_0.2)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

// ---------------------------------------------------------------------------
// Content — panel (hidden when not active)
// ---------------------------------------------------------------------------
const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
