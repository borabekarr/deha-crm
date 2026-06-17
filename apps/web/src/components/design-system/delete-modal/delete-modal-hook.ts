/**
 * delete-modal-hook.ts
 *
 * Callback-ref hooks for DeleteModal. Every DOM side-effect that would have
 * been a useEffect in the prototype lives here: keyboard listener (Esc/Enter/
 * Tab focus-trap), focus-on-open, and timer teardown.
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
// useCardRef
// Callback-ref for the dm-card element.
//   1. Installs a keydown listener for Esc (close) / Tab (focus-trap).
//   2. Focuses the card 120ms after mount.
//   3. Tears down listener + timer on unmount (el === null).
//
// Accepts phase so Escape is only wired when idle.
// Re-created whenever open / phase / onClose change so the listener always
// closes over fresh values (same semantic as the original dep array).
// ---------------------------------------------------------------------------
export function useCardRef(opts: {
  open: boolean
  phase: string
  onClose: (() => void) | undefined
}) {
  const cleanupRef = useRef<(() => void) | null>(null)
  const focusTimer = useTimerRef()

  const cardRef = useCallback(
    (el: HTMLDivElement | null) => {
      // Teardown previous listener + pending focus timer
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      focusTimer.clear()

      if (!el) return

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && opts.phase === 'idle') {
          e.preventDefault()
          opts.onClose?.()
          return
        }

        if (e.key === 'Tab') {
          // Focus trap: collect all focusable children
          const focusable = Array.from(
            el.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((n) => n.offsetParent !== null)

          if (focusable.length === 0) return
          const first = focusable[0]
          const last = focusable[focusable.length - 1]

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      if (opts.open) {
        document.addEventListener('keydown', onKey)
        cleanupRef.current = () => document.removeEventListener('keydown', onKey)
        // Focus card after entrance animation settles
        focusTimer.set(120, () => el.focus())
      }
    },
    // Re-create whenever values the listener closes over change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.open, opts.phase, opts.onClose],
  )

  return cardRef
}

// ---------------------------------------------------------------------------
// useOverlayRef
// Callback-ref for the overlay element. On unmount fires clearAll so timers
// don't leak after the component tree is removed.
// ---------------------------------------------------------------------------
export function useOverlayRef(clearAll: () => void) {
  return useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) clearAll()
    },
    [clearAll],
  )
}
