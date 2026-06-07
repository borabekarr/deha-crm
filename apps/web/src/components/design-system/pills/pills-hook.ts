// pills-hook.ts — all effect/measurement logic lives here per the no-use-effect convention.
// Pills.tsx must have zero raw useEffect calls; import from this file instead.

import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import type { RefObject } from 'react'

export interface PillPos {
  left: number
  width: number
}

export function usePillIndicator(
  active: number,
  ref: RefObject<HTMLDivElement | null>
): PillPos {
  const [pos, setPos] = useState<PillPos>({ left: 3, width: 0 })
  // Previous measured left. null until first measure → squash skipped on initial mount.
  const prevLeftRef = useRef<number | null>(null)

  const measure = () => {
    const root = ref.current
    if (!root) return
    const btn = root.querySelector<HTMLElement>('button.active')
    if (!btn) return

    const nextLeft = btn.offsetLeft
    const nextWidth = btn.offsetWidth

    setPos(prev =>
      prev.left === nextLeft && prev.width === nextWidth
        ? prev
        : { left: nextLeft, width: nextWidth }
    )

    const prevLeft = prevLeftRef.current
    // Only bounce on a real positional change after the initial measure.
    if (prevLeft !== null && prevLeft !== nextLeft) {
      const pill = root.querySelector<HTMLElement>('.pills-seg-pill')
      if (pill) {
        // Moved right → arrived on the right edge → squash anchored right; else left.
        const movedRight = nextLeft > prevLeft
        pill.style.transformOrigin = movedRight ? 'right center' : 'left center'
        const name = 'pseg-squash'
        // Re-trigger reliably: clear, force reflow, then set the animation string.
        pill.style.animation = 'none'
        void pill.offsetWidth
        pill.style.animation = `${name} calc(260ms * var(--anim-mult)) cubic-bezier(.22,1,.36,1)`
      }
    }
    prevLeftRef.current = nextLeft
  }

  useLayoutEffect(measure, [active])
  useEffect(() => {
    const t = setTimeout(measure, 140)
    return () => clearTimeout(t)
  }, [active])

  return pos
}
