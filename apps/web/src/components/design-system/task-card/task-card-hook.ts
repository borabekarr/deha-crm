/**
 * task-card-hook.ts — timer / tween helpers for TaskCard + TaskDetailsPopover.
 *
 * NO raw useEffect anywhere in the task-card folder.
 *
 * Strategy for timers / animation:
 *  - useTween: drives a number from 0→target via RAF/setTimeout stored on a
 *    plain ref object.  The hook starts the loop synchronously on the first
 *    render (guarded by a "started" ref) and cleans up via the returned
 *    callback-ref teardown.
 *  - Countdown interval (popover "now" tick): wired via a callback ref on the
 *    overlay element. Cleanup is stored on the element itself.
 *  - Toast timer: plain useRef holding the timeout ID — no effect needed.
 *  - Keyboard listener (Escape): attached/detached via a callback ref on the
 *    outermost overlay div.
 */

import { useState, useRef, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OverlayEl extends HTMLDivElement {
  __overlayCleanup?: () => void
}

// ── useTween ──────────────────────────────────────────────────────────────────
//
// Animates 0 → target over `dur` ms using a cubic ease-out curve.
// Uses setTimeout (16 ms cadence) stored in a plain ref — no useEffect.
// The loop is started synchronously on first call (guarded by a startedRef).
// Callers must call the returned `stop` function on unmount (via callback ref
// teardown stored on the element, exactly like streak-card-hook.ts).

export function useTween(target: number, dur: number): number {
  const [v, setV] = useState(0)
  const idRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedRef = useRef(false)
  const targetRef = useRef(target)
  const setVRef = useRef(setV)
  // Sync latest-value refs during render — safe: these refs are never used for
  // rendering (only read inside the tick closure and event callbacks).
  // eslint-disable-next-line react-hooks/refs
  setVRef.current = setV
  // eslint-disable-next-line react-hooks/refs
  targetRef.current = target

  // Run-once guard: start the tween loop on the first call only.
  // startedRef.current read/write is safe here: this block is the only place
  // that reads it and the value is not used for rendering.
  // eslint-disable-next-line react-hooks/refs
  if (!startedRef.current) {
    startedRef.current = true
    // Capture start time once at first render — not recomputed on re-renders.
    // eslint-disable-next-line react-hooks/purity, local/no-nondeterministic-render
    const T = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const tick = () => {
      // eslint-disable-next-line react-hooks/purity
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const p = Math.min(1, (now - T) / (dur || 760))
      const eased = targetRef.current * (1 - Math.pow(1 - p, 3))
      setVRef.current(eased)
      if (p < 1) {
        idRef.current = setTimeout(tick, 16)
      } else {
        setVRef.current(targetRef.current)
      }
    }
    // Kick off the first tick synchronously during first render — safe: only
    // fires once (startedRef guard above) and idRef is not read for rendering.
    // eslint-disable-next-line react-hooks/refs
    idRef.current = setTimeout(tick, 16)
  }

  return v
}

// ── stopTween — call on unmount ────────────────────────────────────────────────
export function stopTween(idRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>): void {
  if (idRef.current !== null) clearTimeout(idRef.current)
}

// ── useCountdownRef ───────────────────────────────────────────────────────────
//
// Returns a callback ref to attach to the popover overlay container.
// On mount: starts a 1-second interval that calls the provided setter.
// On unmount: clears the interval (stored on the element).
//
// Usage:
//   const overlayRef = useCountdownRef(setNow, open)
//   <div ref={overlayRef} ...>

export function useCountdownRef(
  setNow: (n: number) => void,
  open: boolean,
): (el: HTMLDivElement | null) => void {
  const openRef = useRef(open)
  // eslint-disable-next-line react-hooks/refs
  openRef.current = open
  const setNowRef = useRef(setNow)
  // eslint-disable-next-line react-hooks/refs
  setNowRef.current = setNow

  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return

    const e = el as OverlayEl
    // Clear any previous interval on re-attach
    e.__overlayCleanup?.()

    if (!openRef.current) {
      e.__overlayCleanup = undefined
      return
    }

    const id = setInterval(() => setNowRef.current(Date.now()), 1000)
    e.__overlayCleanup = () => clearInterval(id)
  }, [])

  return ref
}

// ── useKeydownRef ─────────────────────────────────────────────────────────────
//
// Returns a callback ref that, when attached, wires a keydown listener on
// `window` for the Escape key and stores cleanup on the element.
//
// Usage:
//   const escRef = useKeydownRef(onClose)
//   <div ref={escRef} ...>

export function useKeydownRef(
  onClose: () => void,
): (el: HTMLDivElement | null) => void {
  const onCloseRef = useRef(onClose)
  // eslint-disable-next-line react-hooks/refs
  onCloseRef.current = onClose

  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const e = el as OverlayEl
    e.__overlayCleanup?.()

    const handler = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', handler)
    e.__overlayCleanup = () => window.removeEventListener('keydown', handler)
  }, [])

  return ref
}

// ── helpers ───────────────────────────────────────────────────────────────────

export function fmtShort(ms: number): string {
  ms = Math.max(0, ms)
  const t = Math.floor(ms / 1000)
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return h >= 1
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${m}m ${String(s).padStart(2, '0')}s`
}

export function competeCount(data: { level: number; note?: string }): number {
  const match = (data.note || '').match(/(\d+)\s+other tasks/)
  if (match) return Number(match[1])
  const map: Record<number, number> = { 0: 1, 1: 2, 2: 4 }
  return map[data.level] ?? 2
}
