// Toastiva — animated, position-aware, swipe-to-dismiss toast primitive.
// Composes on top of the existing use-toast queue; no useEffect anywhere.
import * as React from 'react'
import { useReducedMotion } from 'framer-motion'
import { useSyncExternalStore } from 'react'
import {
  type ToastivaPosition,
  type ToastivaVariant,
  type ToastivaItem,
  toastiva,
  _subscribe,
  _getSnapshot,
} from './toastiva-context'
import { ToastivaContainer } from './toastiva-container'

export type { ToastivaPosition, ToastivaVariant, ToastivaItem }
export { toastiva }
export { ToastivaCard } from './toastiva-card'
export { ToastivaContainer } from './toastiva-container'

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
