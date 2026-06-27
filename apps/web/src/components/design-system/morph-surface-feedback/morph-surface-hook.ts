/**
 * morph-surface-hook.ts
 *
 * Callback-ref hooks for MorphSurface. Every DOM side-effect that would have
 * been a useEffect in the prototype lives here: textarea autofocus on open,
 * click-outside close, and the success-flash timer.
 *
 * Direct effect-hook count in this file: 0.
 */

import { useRef, useCallback } from 'react'

// ---------------------------------------------------------------------------
// useTimerRef
// Thin wrapper that stores a setTimeout id in a ref so it can be cancelled
// from a callback ref without triggering re-renders.
// ---------------------------------------------------------------------------
export function useTimerRef() {
  const idRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = useCallback((ms: number, fn: () => void) => {
    if (idRef.current !== null) clearTimeout(idRef.current)
    idRef.current = setTimeout(fn, ms)
  }, [])

  const clear = useCallback(() => {
    if (idRef.current !== null) {
      clearTimeout(idRef.current)
      idRef.current = null
    }
  }, [])

  return { set, clear }
}

// ---------------------------------------------------------------------------
// useTextareaRef
// Callback-ref for the <textarea> element.
//   1. When the element mounts while `open === true`, schedules focus after
//      120ms so it fires after the morph entrance transition begins.
//   2. Tears down the pending timer on unmount (el === null).
//
// Re-created whenever `open` changes so the closure is always fresh.
// ---------------------------------------------------------------------------
export function useTextareaRef(open: boolean) {
  const focusTimer = useTimerRef()

  const textareaRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      focusTimer.clear()
      if (!el) return
      if (open) {
        focusTimer.set(120, () => el.focus())
      }
    },
    // Re-create when open changes; focusTimer.clear/set are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  )

  return textareaRef
}

// ---------------------------------------------------------------------------
// useClickOutside
// Callback-ref for the root surface element.
//   1. When `open === true`, attaches pointerdown + click listeners on
//      document so a click that both starts AND ends outside the surface
//      triggers `onClose`.
//   2. Tears down listeners when open changes to false or element unmounts.
//
// Re-created whenever `open` or `onClose` change.
// ---------------------------------------------------------------------------
export function useClickOutside(open: boolean, onClose: () => void) {
  const cleanupRef = useRef<(() => void) | null>(null)

  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      // Teardown any previous listeners
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }

      if (!el || !open) return

      let startedOutside = false

      const isOutside = (e: PointerEvent | MouseEvent) =>
        !el.contains(e.target as Node)

      const down = (e: PointerEvent) => {
        startedOutside = isOutside(e)
      }
      const up = (e: MouseEvent) => {
        if (startedOutside && isOutside(e)) onClose()
        startedOutside = false
      }

      document.addEventListener('pointerdown', down)
      document.addEventListener('click', up)

      cleanupRef.current = () => {
        document.removeEventListener('pointerdown', down)
        document.removeEventListener('click', up)
      }
    },
    // Re-create whenever values the listener closes over change.
    [open, onClose],
  )

  return rootRef
}

// ---------------------------------------------------------------------------
// useSuccessFlash
// Manages the 1.5s success-flash timer.
//   Returns a `triggerFlash` function that sets success=true, schedules
//   reset after 1500ms, and clears any in-flight timer first.
// ---------------------------------------------------------------------------
export function useSuccessFlash(setSuccess: (v: boolean) => void) {
  const flashTimer = useTimerRef()

  const triggerFlash = useCallback(() => {
    setSuccess(true)
    flashTimer.set(1500, () => setSuccess(false))
  }, [setSuccess, flashTimer])

  const clearFlash = useCallback(() => {
    flashTimer.clear()
    setSuccess(false)
  }, [setSuccess, flashTimer])

  return { triggerFlash, clearFlash }
}
