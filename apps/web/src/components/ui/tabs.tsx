import * as React from 'react'
import { use } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { m, LayoutGroup, useReducedMotion } from 'framer-motion'
import { tabMorph } from '@deha/motion-tokens'
import type { TabsProps } from '@deha/ui-contracts'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context — tracks active value for shared-element indicator (no useEffect)
// ---------------------------------------------------------------------------
const TabsContext = React.createContext<{
  activeValue: string
  scopeId: string
}>({ activeValue: '', scopeId: 'tabs' })

// ---------------------------------------------------------------------------
// Root — thin wrapper that passes through TabsProps + strips reducedMotion
// Wraps in LayoutGroup so layoutId is scoped per root instance.
// ---------------------------------------------------------------------------
function Tabs({
  ref,
  className,
  reducedMotion: _reducedMotion, // eslint-disable-line @typescript-eslint/no-unused-vars
  defaultValue,
  value: controlledValue,
  onValueChange,
  ...props
}: TabsProps & React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [internalValue, setInternalValue] = React.useState(() => controlledValue ?? defaultValue ?? '')
  const activeValue = controlledValue ?? internalValue

  // Stable unique scope per mount
  const scopeId = React.useId()

  const handleValueChange = React.useCallback(
    (v: string) => {
      setInternalValue(v)
      onValueChange?.(v)
    },
    [onValueChange],
  )

  const ctx = React.useMemo(() => ({ activeValue, scopeId }), [activeValue, scopeId])

  return (
    <TabsContext.Provider value={ctx}>
      <LayoutGroup id={`tabs-indicator-${scopeId}`}>
        <TabsPrimitive.Root
          ref={ref}
          className={cn('flex flex-col gap-4', className)}
          value={activeValue}
          onValueChange={handleValueChange}
          defaultValue={controlledValue !== undefined ? undefined : defaultValue}
          {...props}
        />
      </LayoutGroup>
    </TabsContext.Provider>
  )
}
Tabs.displayName = 'Tabs'

// ---------------------------------------------------------------------------
// List — segmented pill container (matches .tabs-list in prototype)
// ---------------------------------------------------------------------------
function TabsList({ ref, className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        // prototype: display:inline-flex; padding:.25rem; background:var(--neutral-100);
        // border-radius:9999px; gap:.125rem; position:relative
        'relative inline-flex items-center gap-0.5 rounded-full bg-neutral-100 p-1',
        className,
      )}
      {...props}
    />
  )
}
TabsList.displayName = 'TabsList'

// ---------------------------------------------------------------------------
// Trigger — pill button; morphing shared-element indicator behind active tab
// Active background is rendered as a layoutId m.span (derived state only,
// no useEffect). Static bg classes removed from active state — indicator handles it.
// ---------------------------------------------------------------------------
function TabsTrigger({
  ref,
  className,
  value,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { activeValue, scopeId } = use(TabsContext)
  const isActive = activeValue === value

  const prefersReducedMotion = useReducedMotion() ?? false
  const morphConfig = tabMorph({ reducedMotion: prefersReducedMotion })
  const transition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        // base: .tabs-trigger — inline-flex; align-items:center; gap:.3rem;
        // padding:.5rem 1rem; font-size:var(--text-13); font-weight:600; color:neutral-500
        // border-radius:9999px; cursor:pointer; border:0; background:transparent
        'relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0',
        'bg-transparent px-4 py-2 font-sans text-[13px] font-semibold text-neutral-500',
        'transition-colors duration-150 ease-out',
        // active text + weight only — bg handled by motion indicator
        'data-[state=active]:font-bold data-[state=active]:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {/* Morphing background indicator — only rendered in active trigger.
          Framer Motion moves it to the new position via shared layoutId. */}
      {isActive && (
        <m.span
          layoutId={`tabs-indicator-${scopeId}`}
          data-motion-indicator="true"
          className="absolute inset-0 -z-[1] rounded-full bg-neutral-900 shadow-[0_4px_12px_-2px_rgb(15_23_42_/_0.2)]"
          transition={transition}
          aria-hidden
        />
      )}
      {children}
    </TabsPrimitive.Trigger>
  )
}
TabsTrigger.displayName = 'TabsTrigger'

// ---------------------------------------------------------------------------
// Content — panel (hidden when not active)
// ---------------------------------------------------------------------------
function TabsContent({ ref, className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        className,
      )}
      {...props}
    />
  )
}
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
