/**
 * status-card-hook.ts
 *
 * Callback-ref hook for StatusCard.
 * All timers/rAF live here with teardown — zero raw side-effects in the .tsx.
 *
 * Patterns used (per no-use-effect skill):
 *  - Copy timeout   → callback-ref on copy button (stores timer ids, clears on unmount)
 *  - Ripple timeout → callback-ref on header (stores per-ripple timer ids)
 *  - Count-up rAF   → exported function called from the toggle event handler
 */

/* ---- copy-link timer management ---- */
type CopyCallbacks = {
  onCopied: () => void
  onExiting: () => void
  onDone: () => void
}

interface CopyHandle {
  trigger: (callbacks: CopyCallbacks) => void
  cleanup: () => void
}

export function makeCopyHandle(): CopyHandle {
  let copyTimer: ReturnType<typeof setTimeout> | null = null
  let exitTimer: ReturnType<typeof setTimeout> | null = null

  function clearAll() {
    if (copyTimer !== null) { clearTimeout(copyTimer); copyTimer = null }
    if (exitTimer !== null) { clearTimeout(exitTimer); exitTimer = null }
  }

  function trigger({ onCopied, onExiting, onDone }: CopyCallbacks) {
    clearAll()
    onCopied()
    copyTimer = setTimeout(() => {
      onExiting()
      exitTimer = setTimeout(() => {
        onDone()
      }, 300)
    }, 1400)
  }

  return { trigger, cleanup: clearAll }
}

/* ---- copy-button callback ref ---- */
type CopyRefEl = HTMLElement & { __scCopyCleanup?: () => void }

export function copyBtnRef(
  el: CopyRefEl | null,
  handle: CopyHandle
): void {
  if (!el) {
    // node unmounted — clear timers
    handle.cleanup()
    return
  }
  el.__scCopyCleanup = () => handle.cleanup()
}

export function cleanupCopyBtn(el: CopyRefEl | null): void {
  if (!el) return
  el.__scCopyCleanup?.()
  delete el.__scCopyCleanup
}

/* ---- ripple management ---- */
export interface Ripple {
  id: number
  x: number
  y: number
}

type RippleSetFn = (updater: (rs: Ripple[]) => Ripple[]) => void

export function addRipple(
  e: React.PointerEvent<HTMLButtonElement>,
  host: HTMLButtonElement,
  setRipples: RippleSetFn
): void {
  const r = host.getBoundingClientRect()
  const id = Date.now() + Math.random()
  setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
  setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 650)
}

/* ---- count-up ---- */
/**
 * Runs a cubic-ease count from 0 → target over `ms` milliseconds.
 * Called from the open-toggle event handler; rAF + settle timeout
 * returned so the caller can cancel on early close (stored in a ref).
 */
export function startCountUp(
  target: number,
  ms: number,
  setN: (n: number) => void
): () => void {
  let raf: number
  let start: number | null = null
  const ease = (t: number) => 1 - Math.pow(1 - t, 3)

  const tick = (ts: number) => {
    if (start == null) start = ts
    const p = Math.min(1, (ts - start) / ms)
    setN(Math.round(target * ease(p)))
    if (p < 1) raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)
  // safety: land on the true value even if rAF is throttled
  const settle = setTimeout(() => setN(target), ms + 120)

  return () => {
    cancelAnimationFrame(raf)
    clearTimeout(settle)
  }
}
