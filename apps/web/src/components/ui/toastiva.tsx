// Toastiva — animated, position-aware, swipe-to-dismiss toast primitive.
// Composes on top of the existing use-toast queue; no useEffect anywhere.
/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useDrag } from '@use-gesture/react'
import { windowMorph } from '@deha/motion-tokens'
import { cn } from '@/lib/utils'
import { useSyncExternalStore } from 'react'
import {
  type ToastivaPosition,
  type ToastivaVariant,
  type ToastivaItem,
  toastiva,
  useToastiva,
  _subscribe,
  _getSnapshot,
  _dismissToastiva,
} from './toastiva-context'

export type { ToastivaPosition, ToastivaVariant, ToastivaItem }
export { toastiva, useToastiva }

// ---------------------------------------------------------------------------
// Position helpers
// ---------------------------------------------------------------------------
const POSITION_CLASSES: Record<ToastivaPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
}

function isTopPosition(pos: ToastivaPosition): boolean {
  return pos.startsWith('top')
}

// ---------------------------------------------------------------------------
// Variant styles (surface + border)
// ---------------------------------------------------------------------------
const VARIANT_CLASSES: Record<ToastivaVariant, string> = {
  default:
    'border-neutral-200/60 dark:border-neutral-700/60 text-neutral-900 dark:text-neutral-100',
  success:
    'border-emerald-200/60 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100',
  warning:
    'border-yellow-200/60 dark:border-yellow-800/60 text-yellow-900 dark:text-yellow-100',
  danger:
    'border-red-200/60 dark:border-red-800/60 text-red-900 dark:text-red-100',
}

const HEADER_VARIANT_CLASSES: Record<ToastivaVariant, string> = {
  default:
    'bg-neutral-900/70 dark:bg-neutral-100/10',
  success:
    'bg-emerald-600/70 dark:bg-emerald-500/20',
  warning:
    'bg-yellow-500/70 dark:bg-yellow-400/20',
  danger:
    'bg-red-600/70 dark:bg-red-500/20',
}

// ---------------------------------------------------------------------------
// Single toast card — swipe-to-dismiss via useDrag
// ---------------------------------------------------------------------------
interface ToastivaCardProps {
  item: ToastivaItem
  position: ToastivaPosition
  reducedMotion: boolean
}

function ToastivaCard({ item, position, reducedMotion }: ToastivaCardProps) {
  const { variant = 'default', title, description, id } = item

  // Drag state — derive everything from callback, no useEffect.
  const [dragX, setDragX] = React.useState(0)
  const [dismissed, setDismissed] = React.useState(false)

  const isTop = isTopPosition(position)

  const bindDrag = useDrag(
    ({ offset: [ox], velocity: [vx], last, active }) => {
      if (dismissed) return
      if (active) {
        setDragX(ox)
      }
      if (last) {
        const absX = Math.abs(ox)
        const absVx = Math.abs(vx)
        if (absX > 80 || absVx > 0.5) {
          // Commit dismiss
          setDismissed(true)
          setDragX(ox > 0 ? 300 : -300)
          setTimeout(() => { _dismissToastiva(id) }, reducedMotion ? 0 : 220)
        } else {
          setDragX(0)
        }
      }
    },
    { axis: 'x', filterTaps: true },
  )

  const morphConfig = windowMorph({ reducedMotion })
  const fmTransition = {
    type: 'tween' as const,
    duration: morphConfig.duration / 1000,
    ease: morphConfig.ease as [number, number, number, number],
  }

  const slideInitial = isTop
    ? { y: -32, opacity: 0, scale: 0.96 }
    : { y: 32, opacity: 0, scale: 0.96 }

  return (
    <m.div
      layout
      initial={reducedMotion ? { opacity: 0 } : slideInitial}
      animate={{
        y: 0,
        opacity: dismissed ? 0 : 1,
        scale: 1,
        x: dismissed ? dragX : reducedMotion ? 0 : dragX,
      }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: isTop ? -8 : 8 }}
      transition={fmTransition}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
    {/* Gesture wrapper — keeps DOM drag events away from framer-motion's onDrag prop */}
    <div
      {...bindDrag()}
      className={cn(
        'relative w-[min(340px,calc(100vw-2rem))] touch-pan-y cursor-grab active:cursor-grabbing',
        'select-none rounded-xl border shadow-lg overflow-hidden',
        VARIANT_CLASSES[variant],
      )}
    >
      {/* Blurred header bar */}
      <div
        className={cn(
          'h-1.5 w-full backdrop-blur-md',
          HEADER_VARIANT_CLASSES[variant],
        )}
        aria-hidden
      />

      {/* Body — translucent surface */}
      <div className="backdrop-blur-md bg-background/70 dark:bg-neutral-900/70 px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          {title && (
            <p className="text-sm font-semibold leading-snug truncate">{title}</p>
          )}
          {description && (
            <p className="text-xs opacity-80 leading-snug">{description}</p>
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => _dismissToastiva(id)}
          className={cn(
            'mt-0.5 shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
    </m.div>
  )
}

// ---------------------------------------------------------------------------
// ToastivaContainer — renders one fixed portal per position bucket
// ---------------------------------------------------------------------------
interface ToastivaContainerProps {
  position: ToastivaPosition
  items: ToastivaItem[]
  reducedMotion: boolean
}

function ToastivaContainer({ position, items, reducedMotion }: ToastivaContainerProps) {
  if (items.length === 0) return null

  return (
    <div
      className={cn(
        'fixed z-[200] flex flex-col gap-2 pointer-events-none',
        POSITION_CLASSES[position],
      )}
      aria-label={`Notifications at ${position}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastivaCard
              item={item}
              position={position}
              reducedMotion={reducedMotion}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toastiva — main renderer; mount once in __root.tsx (or alongside Toaster)
// Props:
//   defaultPosition — fallback when a toast omits position (default: bottom-right)
// ---------------------------------------------------------------------------
interface ToastivaProps {
  defaultPosition?: ToastivaPosition
}

const ALL_POSITIONS: ToastivaPosition[] = [
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

export function Toastiva({ defaultPosition = 'bottom-right' }: ToastivaProps) {
  const toasts = useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot)
  const prefersReducedMotion = useReducedMotion() ?? false

  // Group toasts by resolved position — pure derivation, no state needed
  const byPosition = React.useMemo((): Record<ToastivaPosition, ToastivaItem[]> => {
    const map = Object.fromEntries(
      ALL_POSITIONS.map((p) => [p, [] as ToastivaItem[]]),
    ) as unknown as Record<ToastivaPosition, ToastivaItem[]>
    for (const t of toasts) {
      const pos = t.position ?? defaultPosition
      map[pos].push(t)
    }
    return map
  }, [toasts, defaultPosition])

  return (
    <>
      {ALL_POSITIONS.map((pos) => (
        <ToastivaContainer
          key={pos}
          position={pos}
          items={byPosition[pos]}
          reducedMotion={prefersReducedMotion}
        />
      ))}
    </>
  )
}

export { ToastivaCard, ToastivaContainer }
