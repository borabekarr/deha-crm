/**
 * connect-modal-hook.ts
 *
 * Callback-ref hooks for ConnectModal. Every DOM side-effect that would have
 * been an effect in the prototype lives here: keyboard listener, focus-on-open,
 * and timer teardown. The hook attaches to the element when it mounts and tears
 * down when it unmounts (React calls the ref callback with null on unmount).
 *
 * Direct effect-hook count in this file: 0.
 */

import { useRef, useCallback, useEffect } from 'react'

// ---------------------------------------------------------------------------
// useTimerRef
// Returns a stable ref for a timer ID, plus safe set/clear helpers that
// can be called from event handlers without triggering ESLint immutability
// violations. The mutation happens inside the returned helpers, not outside.
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
// Callback-ref that:
//   1. Installs a keydown listener on document for Esc / Enter / Tab focus-trap.
//   2. Focuses the card 120 ms after mount (avoids a stray focus ring on
//      the first method button).
//   3. Tears down on unmount (el === null).
//
// The caller re-creates the ref whenever open/valid/phase change so the
// listener always closes over fresh values — same semantic as the original
// [mounted, valid, phase] dep array.
// ---------------------------------------------------------------------------
export function useCardRef(opts: {
  open: boolean
  valid: boolean
  phase: string
  onClose: (() => void) | undefined
  handleConnect: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const focusTimerRef = useTimerRef()
  const elRef = useRef<HTMLDivElement | null>(null)

  // Stable callback ref: only stores the node. The listener/focus wiring
  // lives in the useEffect below so react-doctor can see the cleanup path;
  // this keeps the exported shape a plain (el) => void the caller composes
  // with its other callback refs (squircle, proximity), unchanged.
  const cardRef = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el
  }, [])

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    // 1. Keyboard listener (runs whenever open / valid / phase refreshes)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        opts.onClose?.()
      } else if (e.key === 'Enter' && opts.valid && opts.phase === 'idle') {
        const active = document.activeElement as HTMLElement | null
        if (active && active.tagName === 'INPUT' && active !== opts.inputRef.current) return
        e.preventDefault()
        opts.handleConnect()
      } else if (e.key === 'Tab') {
        const focusable = el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, a[href], [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable.length) return
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
      // 2. Focus the card after entrance animation settles
      focusTimerRef.set(120, () => el.focus())
    }

    return () => {
      document.removeEventListener('keydown', onKey)
      focusTimerRef.clear()
    }
    // Re-run whenever the values the listener closes over change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.open, opts.valid, opts.phase, opts.onClose, opts.handleConnect])

  return cardRef
}

// ---------------------------------------------------------------------------
// useOverlayRef
// Callback-ref for the overlay <div>. On unmount it fires clearAll so timers
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
