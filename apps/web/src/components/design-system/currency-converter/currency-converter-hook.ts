// currency-converter-hook.ts
// Encapsulates timer (clock tick) and keyboard listener side-effects via callback refs.
// All side-effects are isolated here; components stay pure.

import { useCallback } from 'react'

/** Returns a callback-ref that starts a 60-second interval, calling onTick each time.
 *  Attach to any mounted DOM node; teardown is automatic on unmount.
 *  onTick must be stable (wrapped in useCallback at the call site). */
export function useClockTick(onTick: () => void) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      const id = setInterval(onTick, 60_000)
      return () => clearInterval(id)
    },
    [onTick]
  )
}

/** Returns a callback-ref that registers a keydown handler on `window`.
 *  Attach to any mounted DOM node; teardown is automatic on unmount.
 *  onKey must be stable (wrapped in useCallback at the call site). */
export function useWindowKey(onKey: (e: KeyboardEvent) => void) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    },
    [onKey]
  )
}

/** Tiny helper: current HH:MM string */
export function nowHM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
