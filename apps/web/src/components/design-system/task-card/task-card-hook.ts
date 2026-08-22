/**
 * task-card-hook.ts — timer / tween helpers for TaskCard + TaskDetailsPopover.
 *
 * Strategy for timers / animation:
 *  - useTween: drives a number from 0→target via setTimeout, started once on
 *    mount in a useEffect with a literal clearTimeout cleanup.
 *  - Countdown interval (popover "now" tick): stored node via a stable
 *    callback ref, listener wiring in a useEffect (react-doctor needs the
 *    setInterval call inside an effect body to see the cleanup path).
 *  - Keyboard listener (Escape): same stored-node + effect pattern.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

// ── useTween ──────────────────────────────────────────────────────────────────
//
// Animates 0 → target over `dur` ms using a cubic ease-out curve.
// Uses setTimeout (16 ms cadence). The loop starts once on mount; `target`
// changes are read live via targetRef so the loop is never restarted.

export function useTween(target: number, dur: number): number {
  const [v, setV] = useState(0)
  const targetRef = useRef(target)

  useEffect(() => {
    targetRef.current = target
  }, [target])

  useEffect(() => {
    const T = typeof performance !== 'undefined' ? performance.now() : Date.now()
    // setInterval (not recursive setTimeout) so the tick loop is a single
    // timer with one owner: the id below both starts and stops it.
    const id = setInterval(() => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const p = Math.min(1, (now - T) / (dur || 760))
      const eased = targetRef.current * (1 - Math.pow(1 - p, 3))
      setV(eased)
      if (p >= 1) {
        setV(targetRef.current)
        clearInterval(id)
      }
    }, 16)
    return () => clearInterval(id)
    // Run-once: the loop reads target/dur live via targetRef and the `dur`
    // closure, it never needs to restart when either changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return v
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
  const elRef = useRef<HTMLDivElement | null>(null)
  const setNowRef = useRef(setNow)
  useEffect(() => {
    setNowRef.current = setNow
  }, [setNow])

  // Stable callback ref: only stores the node so the caller can still
  // compose it with useKeydownRef's ref on the same element.
  const ref = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el
  }, [])

  useEffect(() => {
    if (!elRef.current || !open) return
    const id = setInterval(() => setNowRef.current(Date.now()), 1000)
    return () => clearInterval(id)
  }, [open])

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
  const elRef = useRef<HTMLDivElement | null>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Stable callback ref: only stores the node so the caller can still
  // compose it with useCountdownRef's ref on the same element.
  const ref = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el
  }, [])

  useEffect(() => {
    if (!elRef.current) return
    const handler = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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
