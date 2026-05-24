// Compound namespace pattern: all sub-components are collected into MotionTabs
// and only the namespace is exported — fast-refresh still works on the namespace.
/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion, LayoutGroup, useReducedMotion } from 'framer-motion'
import { tabMorph } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Internal context — tracks which tab value is currently active so Trigger
// can conditionally render the shared layoutId indicator without useEffect.
// ---------------------------------------------------------------------------
const MotionTabsContext = React.createContext<{
  activeValue: string
  setActiveValue: (v: string) => void
}>({ activeValue: '', setActiveValue: () => undefined })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MotionTabsRootProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  /** Layout ID scope — must be unique per page if multiple MotionTabs exist */
  scopeId?: string
}

// ---------------------------------------------------------------------------
// Root — LayoutGroup scopes the layoutId; context bridges active value down
// ---------------------------------------------------------------------------
function MotionTabsRoot({
  ref,
  className,
  scopeId = 'motion-tabs',
  defaultValue,
  value: controlledValue,
  onValueChange,
  ...props
}: MotionTabsRootProps & { ref?: React.Ref<HTMLDivElement> }) {
  const [internalValue, setInternalValue] = React.useState(
    () => controlledValue ?? defaultValue ?? '',
  )

  const activeValue = controlledValue ?? internalValue

  const handleValueChange = React.useCallback(
    (v: string) => {
      setInternalValue(v)
      onValueChange?.(v)
    },
    [onValueChange],
  )

  return (
    <MotionTabsContext.Provider value={{ activeValue, setActiveValue: handleValueChange }}>
      <LayoutGroup id={scopeId}>
        <TabsPrimitive.Root
          ref={ref}
          className={cn('flex flex-col gap-4', className)}
          value={activeValue}
          onValueChange={handleValueChange}
          defaultValue={controlledValue !== undefined ? undefined : defaultValue}
          {...props}
        />
      </LayoutGroup>
    </MotionTabsContext.Provider>
  )
}
MotionTabsRoot.displayName = 'MotionTabs.Root'

// ---------------------------------------------------------------------------
// List — pill container (same geometry as TabsList)
// ---------------------------------------------------------------------------
function MotionTabsList({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'relative inline-flex items-center gap-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 p-1',
        className,
      )}
      {...props}
    />
  )
}
MotionTabsList.displayName = 'MotionTabs.List'

// ---------------------------------------------------------------------------
// Trigger — active state gets a morphing indicator behind the label
//
// The layoutId trick: only the active trigger renders the shared layoutId span.
// Framer Motion animates it from the previous position → new position (morph).
// This is pure derived state — no useEffect needed.
// ---------------------------------------------------------------------------
function MotionTabsTrigger({
  ref,
  className,
  children,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { ref?: React.Ref<HTMLButtonElement> }) {
  const { activeValue } = React.useContext(MotionTabsContext)
  const isActive = activeValue === value

  const prefersReducedMotion = useReducedMotion() ?? false
  const morphConfig = tabMorph({ reducedMotion: prefersReducedMotion })

  // Convert TweenConfig (duration in ms) → framer-motion transition (duration in s)
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
        'relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0',
        'bg-transparent px-4 py-2 font-sans text-[13px] font-semibold text-neutral-500 dark:text-neutral-400',
        'transition-colors duration-150 ease-out',
        'data-[state=active]:font-bold data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {/* Morphing background indicator — only rendered in active trigger so
          framer-motion's shared-layout animation moves it to the new position */}
      {isActive && (
        <motion.span
          layoutId="motion-tabs-indicator"
          className="absolute inset-0 -z-[1] rounded-full bg-neutral-900 dark:bg-neutral-100 shadow-[0_4px_12px_-2px_rgb(15_23_42_/_0.2)]"
          transition={transition}
          aria-hidden
        />
      )}
      {children}
    </TabsPrimitive.Trigger>
  )
}
MotionTabsTrigger.displayName = 'MotionTabs.Trigger'

// ---------------------------------------------------------------------------
// Content — panel (hidden when not active)
// ---------------------------------------------------------------------------
function MotionTabsContent({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & { ref?: React.Ref<HTMLDivElement> }) {
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
MotionTabsContent.displayName = 'MotionTabs.Content'

// ---------------------------------------------------------------------------
// Compound namespace export
// ---------------------------------------------------------------------------
export const MotionTabs = {
  Root: MotionTabsRoot,
  List: MotionTabsList,
  Trigger: MotionTabsTrigger,
  Content: MotionTabsContent,
}
