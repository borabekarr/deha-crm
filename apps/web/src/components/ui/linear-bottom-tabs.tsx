// Compound namespace pattern — fast-refresh-safe
/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { motion, LayoutGroup, useReducedMotion } from 'framer-motion'
import { tabPillSlide } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Context — active tab value + hover tab value + scope id
// ---------------------------------------------------------------------------
interface LinearBottomTabsContextValue {
  activeValue: string
  setActiveValue: (v: string) => void
  hoveredValue: string | null
  setHoveredValue: (v: string | null) => void
  scopeId: string
  prefersReducedMotion: boolean
}

const LinearBottomTabsContext = React.createContext<LinearBottomTabsContextValue>({
  activeValue: '',
  setActiveValue: () => undefined,
  hoveredValue: null,
  setHoveredValue: () => undefined,
  scopeId: 'linear-bottom-tabs',
  prefersReducedMotion: false,
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LinearBottomTabsRootProps {
  /** Controlled active tab value */
  value?: string
  /** Uncontrolled default active tab value */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Unique scope — must be unique per page when multiple instances exist */
  scopeId?: string
  className?: string
  children: React.ReactNode
}

// ---------------------------------------------------------------------------
// Root — floating pill bar; LayoutGroup scopes shared layoutId per instance
// ---------------------------------------------------------------------------
function LinearBottomTabsRoot({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  scopeId: scopeIdProp,
  className,
  children,
}: LinearBottomTabsRootProps) {
  const autoId = React.useId()
  const scopeId = scopeIdProp ?? `linear-tabs-${autoId}`

  const [internalValue, setInternalValue] = React.useState(() => controlledValue ?? defaultValue)
  const activeValue = controlledValue ?? internalValue

  const [hoveredValue, setHoveredValue] = React.useState<string | null>(null)

  const prefersReducedMotion = useReducedMotion() ?? false

  const handleSetActive = React.useCallback(
    (v: string) => {
      if (controlledValue === undefined) setInternalValue(v)
      onValueChange?.(v)
    },
    [controlledValue, onValueChange],
  )

  const ctx = React.useMemo(
    () => ({ activeValue, setActiveValue: handleSetActive, hoveredValue, setHoveredValue, scopeId, prefersReducedMotion }),
    [activeValue, handleSetActive, hoveredValue, setHoveredValue, scopeId, prefersReducedMotion],
  )

  const pillConfig = tabPillSlide({ reducedMotion: prefersReducedMotion })

  return (
    <LinearBottomTabsContext.Provider value={ctx}>
      <LayoutGroup id={`linear-btabs-${scopeId}`}>
        <div
          role="tablist"
          aria-label="Bottom navigation"
          className={cn(
            'relative inline-flex items-end gap-1',
            'rounded-2xl bg-neutral-900/90 dark:bg-neutral-800/90',
            'backdrop-blur-md border border-white/10',
            'px-2 py-2',
            'shadow-[0_8px_32px_-8px_rgb(0_0_0_/_0.4),0_2px_8px_-2px_rgb(0_0_0_/_0.2)]',
            className,
          )}
          data-testid="linear-bottom-tabs"
          data-pill-transition-ms={pillConfig.duration}
        >
          {children}
        </div>
      </LayoutGroup>
    </LinearBottomTabsContext.Provider>
  )
}
LinearBottomTabsRoot.displayName = 'LinearBottomTabs.Root'

// ---------------------------------------------------------------------------
// Tab — individual tab button
// ---------------------------------------------------------------------------
interface LinearBottomTabsTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  /** Icon to display above label */
  icon?: React.ReactNode
}

function LinearBottomTabsTab({
  value,
  icon,
  className,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: LinearBottomTabsTabProps) {
  const { activeValue, setActiveValue, setHoveredValue, hoveredValue, scopeId, prefersReducedMotion } =
    React.useContext(LinearBottomTabsContext)

  const isActive = activeValue === value
  const isHovered = hoveredValue === value

  const pillConfig = tabPillSlide({ reducedMotion: prefersReducedMotion })
  const pillTransition = {
    type: 'tween' as const,
    duration: pillConfig.duration / 1000,
    ease: pillConfig.ease as [number, number, number, number],
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      data-value={value}
      className={cn(
        'relative z-10 flex flex-col items-center justify-center gap-0.5',
        'min-w-[52px] px-3 py-1.5 rounded-xl',
        'cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        'transition-colors duration-100',
        className,
      )}
      onClick={(e) => {
        setActiveValue(value)
        onClick?.(e)
      }}
      onMouseEnter={(e) => {
        setHoveredValue(value)
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        setHoveredValue(null)
        onMouseLeave?.(e)
      }}
      onFocus={(e) => {
        setHoveredValue(value)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setHoveredValue(null)
        onBlur?.(e)
      }}
      {...props}
    >
      {/* Per-tab active indicator — always present when active */}
      {isActive && (
        <motion.span
          layoutId={`linear-tab-active-${scopeId}`}
          data-motion-indicator="true"
          className="absolute inset-0 -z-[1] rounded-xl bg-white/20 ring-1 ring-white/20"
          transition={pillTransition}
          aria-hidden
        />
      )}

      {/* Hover pill — slides between tabs via shared layoutId; rendered inside
          the hovered tab so it inherits a real bounding box. */}
      {isHovered && (
        <motion.span
          layoutId={`linear-tab-pill-${scopeId}`}
          data-motion-pill="linear-tab-pill"
          className="absolute inset-0 -z-[1] rounded-xl bg-white/15"
          transition={pillTransition}
          aria-hidden
        />
      )}

      {icon && (
        <span
          className={cn(
            'text-[20px] leading-none transition-colors duration-150',
            isActive || isHovered ? 'text-white' : 'text-neutral-400',
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}

      {children && (
        <span
          className={cn(
            'text-[10px] font-semibold tracking-wide transition-colors duration-150',
            isActive ? 'text-white' : 'text-neutral-400',
          )}
        >
          {children}
        </span>
      )}
    </button>
  )
}
LinearBottomTabsTab.displayName = 'LinearBottomTabs.Tab'

// ---------------------------------------------------------------------------
// Compound namespace export
// ---------------------------------------------------------------------------
export const LinearBottomTabs = {
  Root: LinearBottomTabsRoot,
  Tab: LinearBottomTabsTab,
}
