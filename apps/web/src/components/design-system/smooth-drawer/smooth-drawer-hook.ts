/**
 * smooth-drawer-hook.ts
 *
 * Callback-ref hooks for SmoothDrawer. Every DOM side-effect that would have
 * been a useEffect in the prototype lives here: ESC keydown listener and
 * drag-to-dismiss pointer handlers (pointerdown/move/up) on the handle element.
 *
 * Supports all four sides (bottom/top/left/right). Drag axis is vertical for
 * top/bottom and horizontal for left/right; dismiss direction matches the
 * side's natural close direction.
 *
 * Direct effect-hook count in this file: 0.
 */

import { useRef, useCallback } from 'react'

export type DrawerSide = 'bottom' | 'top' | 'left' | 'right'

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
// useSheetRef
// Callback-ref for the .sd-sheet element.
//   1. Installs a keydown listener for Esc (close) on document.
//   2. Tears down listener on unmount (el === null).
//   3. Re-created whenever open / onClose change so the listener always
//      closes over fresh values.
// ---------------------------------------------------------------------------
export function useSheetRef(opts: {
  open: boolean
  onClose: () => void
}) {
  const cleanupRef = useRef<(() => void) | null>(null)

  const sheetRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      if (!el) return

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && opts.open) {
          e.preventDefault()
          opts.onClose()
        }
      }

      if (opts.open) {
        document.addEventListener('keydown', onKey)
        cleanupRef.current = () => document.removeEventListener('keydown', onKey)
      }
    },
    // Re-create whenever values the listener closes over change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.open, opts.onClose],
  )

  return sheetRef
}

// ---------------------------------------------------------------------------
// useHandleRef
// Callback-ref for the .sd-handle-wrap element.
// Wires pointerdown/pointermove/pointerup for drag-to-dismiss.
// Reports drag offset (delta) along the side's axis and fires onDismiss when
// drag exceeds threshold in the closing direction.
//
// Axis:
//   bottom → vertical (clientY), closes on drag down  (positive delta)
//   top    → vertical (clientY), closes on drag up    (negative delta)
//   left   → horizontal (clientX), closes on drag left (negative delta)
//   right  → horizontal (clientX), closes on drag right (positive delta)
// ---------------------------------------------------------------------------
export function useHandleRef(opts: {
  onDragChange: (delta: number, dragging: boolean) => void
  onDismiss: () => void
  side?: DrawerSide
  dismissThreshold?: number
}) {
  const threshold = opts.dismissThreshold ?? 110
  const side = opts.side ?? 'bottom'
  const startCoord = useRef<number | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      if (!el) return

      const isVertical = side === 'bottom' || side === 'top'
      // Sign: which direction is "dismiss"? positive for bottom/right, negative for top/left
      const dismissSign = side === 'bottom' || side === 'right' ? 1 : -1

      const getCoord = (e: PointerEvent) => isVertical ? e.clientY : e.clientX

      const onDown = (e: PointerEvent) => {
        startCoord.current = getCoord(e)
        opts.onDragChange(0, true)
        try { el.setPointerCapture(e.pointerId) } catch (_) { /* ignore */ }
      }

      const onMove = (e: PointerEvent) => {
        if (startCoord.current == null) return
        const raw = getCoord(e) - startCoord.current
        // Clamp: only allow drag in the dismiss direction (no reverse drag)
        const delta = dismissSign > 0 ? Math.max(0, raw) : Math.min(0, raw)
        opts.onDragChange(delta, true)
      }

      const onUp = (e: PointerEvent) => {
        if (startCoord.current == null) return
        const raw = getCoord(e) - startCoord.current
        startCoord.current = null
        opts.onDragChange(0, false)
        // Dismiss if dragged past threshold in closing direction
        if (raw * dismissSign > threshold) {
          opts.onDismiss()
        }
      }

      el.addEventListener('pointerdown', onDown)
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
      el.addEventListener('pointercancel', onUp)

      cleanupRef.current = () => {
        el.removeEventListener('pointerdown', onDown)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        el.removeEventListener('pointercancel', onUp)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts.onDragChange, opts.onDismiss, threshold, side],
  )

  return handleRef
}
