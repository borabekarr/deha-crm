// ToastivaContainer — renders one fixed portal per position bucket.
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type ToastivaPosition, type ToastivaItem } from './toastiva-context'
import { ToastivaCard } from './toastiva-card'

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

// ---------------------------------------------------------------------------
// ToastivaContainer
// ---------------------------------------------------------------------------
export interface ToastivaContainerProps {
  position: ToastivaPosition
  items: ToastivaItem[]
  reducedMotion: boolean
}

export function ToastivaContainer({ position, items, reducedMotion }: ToastivaContainerProps) {
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
