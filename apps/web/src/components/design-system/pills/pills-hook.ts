// pills-hook.ts — all effect/measurement logic lives here per the no-use-effect convention.
// Pills.tsx must have zero raw useEffect calls; import from this file instead.

import { useState, useLayoutEffect, useEffect } from 'react'
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

  const measure = () => {
    const root = ref.current
    if (!root) return
    const btn = root.querySelector<HTMLElement>('button.active')
    if (!btn) return
    setPos(prev =>
      prev.left === btn.offsetLeft && prev.width === btn.offsetWidth
        ? prev
        : { left: btn.offsetLeft, width: btn.offsetWidth }
    )
  }

  useLayoutEffect(measure, [active])
  useEffect(() => {
    const t = setTimeout(measure, 140)
    return () => clearTimeout(t)
  }, [active])

  return pos
}
