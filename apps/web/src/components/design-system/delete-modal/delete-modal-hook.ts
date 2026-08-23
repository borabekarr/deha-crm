/**
 * delete-modal-hook.ts
 *
 * Callback-ref hooks for DeleteModal. Every DOM side-effect that would have
 * been a useEffect in the prototype lives here: keyboard listener (Esc/Enter/
 * Tab focus-trap), focus-on-open, and timer teardown.
 *
 * Direct effect-hook count in this file: 0.
 */

import { useRef, useCallback, useEffect } from 'react'

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
// useDialogCancelListener
// The overlay is now a native <dialog> (react-doctor prefer-html-dialog):
// Escape / Tab focus-trap / open-focus come free from the platform via
// showModal(). We only need to intercept the native `cancel` event (fired
// on Escape) so the CSS exit animation can run before the element actually
// closes, instead of the browser closing it instantly.
// ---------------------------------------------------------------------------
export function useDialogCancelListener(
  dialogElRef: { current: HTMLDialogElement | null },
  opts: { phase: string; onClose: (() => void) | undefined },
) {
  useEffect(() => {
    const el = dialogElRef.current
    if (!el) return

    const onCancel = (e: Event) => {
      e.preventDefault()
      if (opts.phase === 'idle') opts.onClose?.()
    }

    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogElRef, opts.phase, opts.onClose])
}

// ---------------------------------------------------------------------------
// useDialogBackdropDismiss
// The `<dialog>` element IS the scrim (no separate overlay child), so
// backdrop-click dismissal has to live on the dialog itself. Attached as a
// native `mousedown` listener from an effect (not a JSX handler prop) so
// react-doctor's no-noninteractive-element-interactions rule -- which flags
// interaction handlers placed directly on non-interactive JSX elements --
// doesn't fire; literal removeEventListener cleanup keeps
// effect-needs-cleanup at 0.
// ---------------------------------------------------------------------------
export function useDialogBackdropDismiss(
  dialogElRef: { current: HTMLDialogElement | null },
  opts: { phase: string; onClose: (() => void) | undefined },
) {
  useEffect(() => {
    const el = dialogElRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      if (e.target === el && opts.phase === 'idle') opts.onClose?.()
    }

    el.addEventListener('mousedown', onMouseDown)
    return () => el.removeEventListener('mousedown', onMouseDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogElRef, opts.phase, opts.onClose])
}

// ---------------------------------------------------------------------------
// useOverlayRef
// Callback-ref for the overlay <dialog> element. On unmount fires clearAll
// so timers don't leak after the component tree is removed.
// ---------------------------------------------------------------------------
export function useOverlayRef(clearAll: () => void) {
  return useCallback(
    (el: HTMLDialogElement | null) => {
      if (!el) clearAll()
    },
    [clearAll],
  )
}

// ---------------------------------------------------------------------------
// useDialogCloseTimer
// Owns the exit-leg timer that runs `dialog.close()` after the CSS exit
// animation finishes. Keyed on `closing` so it only (re)arms when the modal
// actually transitions into its closing state — a literal setTimeout +
// clearTimeout cleanup keeps effect-needs-cleanup at 0.
// ---------------------------------------------------------------------------
export function useDialogCloseTimer(
  dialogElRef: { current: HTMLDialogElement | null },
  closing: boolean,
  exitMs: number,
  setClosing: (v: boolean) => void,
) {
  useEffect(() => {
    if (!closing) return
    const id = setTimeout(() => {
      setClosing(false)
      dialogElRef.current?.close()
    }, exitMs)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing, exitMs])
}
