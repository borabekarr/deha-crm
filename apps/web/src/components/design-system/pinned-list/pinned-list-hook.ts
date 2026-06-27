/**
 * pinned-list-hook.ts
 *
 * Callback-ref hooks for PinnedList. All DOM side-effects that would have
 * been useEffect / useLayoutEffect in the prototype live here:
 *   - Entrance stagger: sets preanim/anim classes, removes them after timers
 *   - FLIP: snapshots bounding rects before state mutation (via useFLIPSnap),
 *     then applies invert+play in a post-render callback ref (useFLIPPlay).
 *
 * Direct effect-hook count in this file: 0.
 */

import { useRef, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ElementWithTimers extends HTMLElement {
  __plPreanimTimer?: ReturnType<typeof setTimeout>
  __plAnimTimer?: ReturnType<typeof setTimeout>
  __plFlipRaf?: number
}

// ---------------------------------------------------------------------------
// useEntranceRef
// Callback ref factory. When an item wrapper mounts, schedules the
// preanim/anim class removal after the stagger delay so the CSS opacity+
// transform transition plays. Stores timer ids on the element; cleanup
// cancels them on unmount.
// ---------------------------------------------------------------------------
interface ElementWithEntrance extends ElementWithTimers {
  __plEntrancePlayed?: boolean
}

export function useEntranceRef(delay: number) {
  return useCallback(
    (el: HTMLElement | null) => {
      const e = el as ElementWithEntrance | null
      if (!e) return

      // Guard: only play the entrance once per element (first mount only).
      // When React re-renders and the delay prop changes, the callback ref
      // fires again with the already-mounted element — we must NOT re-animate.
      if (e.__plEntrancePlayed) return
      e.__plEntrancePlayed = true

      // Clear any previous timers stored on this element
      if (e.__plPreanimTimer !== undefined) {
        clearTimeout(e.__plPreanimTimer)
        delete e.__plPreanimTimer
      }
      if (e.__plAnimTimer !== undefined) {
        clearTimeout(e.__plAnimTimer)
        delete e.__plAnimTimer
      }

      // Start invisible; CSS class .pl-item.preanim sets opacity:0 + translateY
      e.classList.add('pl-preanim', 'pl-anim')

      // Remove preanim after stagger delay → CSS transition fires
      e.__plPreanimTimer = setTimeout(() => {
        e.classList.remove('pl-preanim')
        delete e.__plPreanimTimer
      }, delay)

      // Remove transition class after it completes (delay + max transition)
      e.__plAnimTimer = setTimeout(() => {
        e.classList.remove('pl-anim')
        delete e.__plAnimTimer
      }, delay + 660)
    },
    [delay],
  )
}

// ---------------------------------------------------------------------------
// useFLIPRefs
// Returns two helpers:
//   snapRects(nodeRefs) — call BEFORE state mutation to capture First rects
//   flipPlayRef         — callback ref factory; call AFTER React renders the
//                         new layout to apply invert→play on each moved node.
//
// Usage pattern in PinnedList.tsx:
//   const { snapRects, getFlipRef } = useFLIPRefs()
//
//   function toggle(id) {
//     snapRects(nodeRefs.current)
//     setItems(...)
//   }
//
//   // In JSX: ref={getFlipRef(id)}
// ---------------------------------------------------------------------------
export function useFLIPRefs() {
  const prevRects = useRef<Map<string, DOMRect>>(new Map())
  const playedIds = useRef<Set<string>>(new Set())

  /** Snapshot bounding rects for all tracked nodes before state mutation. */
  function snapRects(nodeMap: Record<string, HTMLElement>) {
    const snap = new Map<string, DOMRect>()
    for (const id of Object.keys(nodeMap)) {
      const el = nodeMap[id]
      if (el) snap.set(id, el.getBoundingClientRect())
    }
    prevRects.current = snap
    playedIds.current = new Set()
  }

  /**
   * Callback ref factory for each item wrapper. When the DOM node mounts
   * (or re-attaches after React reconciles), computes the LAST rect, derives
   * the invert delta from the stored FIRST rect, and plays the spring
   * transition. Stores the rAF id on the element for cleanup.
   *
   * @param id   - item identifier matching the key used in snapRects
   * @param ease - CSS timing function for the slide-back animation.
   *               Pass cubic-bezier(.34,1.7,.46,1) for a bounce (PIN),
   *               or cubic-bezier(.22,1,.36,1) for a smooth slide (UNPIN).
   */
  function getFlipRef(id: string, ease: string = 'cubic-bezier(.22,1,.36,1)') {
    return (el: HTMLElement | null) => {
      if (!el) return

      const first = prevRects.current.get(id)
      if (!first) return
      if (playedIds.current.has(id)) return // already played for this update

      const last = el.getBoundingClientRect()
      const dx = first.left - last.left
      const dy = first.top - last.top

      if (Math.abs(dy) < 0.5 && Math.abs(dx) < 0.5) return

      playedIds.current.add(id)

      // Invert: jump to First position with a slight shrink so the play step
      // scales 0.96 -> 1 alongside the slide (animated-list scale pop pattern).
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px,${dy}px) scale(0.96)`

      // Play: animate back to Last (natural) position using the caller-supplied easing.
      const e = el as ElementWithTimers
      if (e.__plFlipRaf !== undefined) {
        cancelAnimationFrame(e.__plFlipRaf)
      }
      e.__plFlipRaf = requestAnimationFrame(() => {
        el.style.transition = `transform calc(540ms * var(--anim-mult, 1)) ${ease}`
        el.style.transform = ''

        const onEnd = (ev: TransitionEvent) => {
          if (ev.propertyName !== 'transform') return
          el.style.transition = ''
          el.removeEventListener('transitionend', onEnd)
        }
        el.addEventListener('transitionend', onEnd)
        delete e.__plFlipRaf
      })
    }
  }

  return { snapRects, getFlipRef }
}
