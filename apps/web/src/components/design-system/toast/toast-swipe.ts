import { useRef, type PointerEvent } from 'react'
import type { VariantCfg } from './variants'
import { ms } from './toast-vm'

// Swipe-to-dismiss gesture, split out of ToastStage (react-doctor
// no-giant-component) as a custom hook so the refs/handlers it owns stay
// exactly where they were -- ToastStage still calls this and owns the
// resulting handlers/refs, only the implementation moved to its own module.
// Value for value unchanged from ToastStage's own former inline block.
//
// ---- swipe-to-dismiss --------------------------------------------------
// Gesture motion is written straight onto the node (no per-frame React
// state): the drag tracks the pointer 1:1, can be re-grabbed mid-fling, and
// the phase machine is only handed control at commit time. `data-ts-base`
// carries the stack transform this drag is offsetting.
// `behind` is the deck variant's peek-parallax set: the wraps stacked behind
// the dragged one, collected once at pointerdown so the move handler stays a
// straight write. Empty for every variant with parallax: 0.
export function useToastSwipe(
  cfg: VariantCfg,
  timers: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>,
  startExit: (id: string) => void,
) {
  const drag = useRef<{ id: string; el: HTMLElement; x0: number; t0: number; dx: number; behind: HTMLElement[] } | null>(null)
  const lastDx = useRef(0)

  const resetBehind = (behind: HTMLElement[]) => {
    behind.forEach((b) => {
      Object.assign(b.style, { transition: cfg.wrapTransition, transform: b.dataset.tsBase || '' })
    })
  }

  const onSwipeStart = (id: string) => (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Pointer capture retargets the resulting click's dispatch path to the
    // captured element, so a click starting on a button descendant (Undo,
    // close) would never reach the button's own onClick. Leave those to
    // native click dispatch -- no swipe/capture, no drag tracking.
    if ((e.target as HTMLElement).closest('button')) return
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    el.style.transition = 'none' // hand the current frame to the finger
    // Caught mid-fling: kill the pending hand-back before it dismisses a toast
    // the user just took back, and snap the node under the finger, opaque.
    if (timers.current['s' + id]) {
      clearTimeout(timers.current['s' + id])
      delete timers.current['s' + id]
      el.style.transform = el.dataset.tsBase || ''
      el.style.opacity = '1'
    }
    const behind = cfg.parallax
      ? Array.from(el.parentElement?.querySelectorAll<HTMLElement>('.ts-wrap') || []).filter(
          (b) => b !== el && b.style.visibility !== 'hidden',
        )
      : []
    behind.forEach((b) => {
      b.style.transition = 'none'
    })
    drag.current = { id, el, x0: e.clientX, t0: e.timeStamp, dx: 0, behind }
    lastDx.current = 0
  }

  const onSwipeMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    d.dx = e.clientX - d.x0
    lastDx.current = d.dx
    d.el.style.transform = `${d.el.dataset.tsBase} translateX(${d.dx}px)`
    d.el.style.opacity = String(Math.max(1 - Math.abs(d.dx) / 260, 0.15))
    // Peek-parallax: the deck follows the finger at a fraction, so the stack
    // reads as one connected object instead of a card sliding off a backdrop.
    d.behind.forEach((b) => {
      b.style.transform = `${b.dataset.tsBase} translateX(${d.dx * cfg.parallax}px)`
    })
  }

  const onSwipeEnd = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    if (d.el.hasPointerCapture(e.pointerId)) d.el.releasePointerCapture(e.pointerId)
    const v = d.dx / Math.max(e.timeStamp - d.t0, 1)
    resetBehind(d.behind)
    if (Math.abs(d.dx) > cfg.swipeDistance || Math.abs(v) > cfg.swipeVelocity) {
      // Velocity handoff: keep flinging along the drag axis, then let the
      // phase machine run its exit under an already-invisible node.
      d.el.style.transition = `transform ${ms(cfg.flingMs)} var(--ease-out), opacity ${ms(cfg.fadeMs)} var(--ease-out)`
      d.el.style.transform = `${d.el.dataset.tsBase} translateX(${Math.sign(d.dx) * 480}px)`
      d.el.style.opacity = '0'
      const { id, el } = d
      timers.current['s' + id] = setTimeout(() => {
        delete timers.current['s' + id]
        el.style.transition = cfg.wrapTransition // restore React's exact string
        startExit(id)
      }, cfg.fadeMs)
    } else {
      // Under threshold: settle back on the same curve the stack uses (in
      // Snap that curve overshoots the slot positionally, never in scale).
      d.el.style.transition = cfg.wrapTransition
      d.el.style.transform = d.el.dataset.tsBase || ''
      d.el.style.opacity = '1'
    }
  }

  return { onSwipeStart, onSwipeMove, onSwipeEnd, lastDx }
}
