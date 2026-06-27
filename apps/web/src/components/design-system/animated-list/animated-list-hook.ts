/**
 * AnimatedList hook — imperative entrance animation via callback ref.
 *
 * NO raw useEffect anywhere in AnimatedList.tsx.
 * Each row's entrance (set initial transform/opacity → force reflow → settle)
 * is driven imperatively from the callback ref returned by makeRowRef(), so
 * the animation is guaranteed regardless of React re-render timing.
 *
 * Timer / rAF ids are stored on the element itself so cleanup is always
 * co-located with the thing it guards.
 */

import { useRef, useState, useReducer, useCallback } from 'react'

type AnimVariant = {
  initial: { opacity: number; transform: string }
  exit: { opacity: number; transform: string }
  ease: string
}

// Augmented element type so we can stash cleanup handles on the node.
type AugEl = HTMLElement & {
  __alRafId?: number
  __alTimerId?: ReturnType<typeof setTimeout>
}

const TRANSITION_MS = 500
const SETTLE_SAFETY_MS = 640

/**
 * Build the full CSS transition shorthand for live/settling rows.
 * Wraps durations in `calc(…*var(--anim-mult,1))` so slow-down mode works.
 */
export function buildTransition(ease: string): string {
  return (
    `top calc(${TRANSITION_MS}ms * var(--anim-mult,1)) ${ease},` +
    ` transform calc(${TRANSITION_MS}ms * var(--anim-mult,1)) ${ease},` +
    ` opacity calc(320ms * var(--anim-mult,1)) ease-out`
  )
}

/**
 * Returns a callback ref for a newly-mounted live row.
 * Plays the entrance: sets initial state, flushes reflow, then transitions
 * to the resting state (opacity:1, transform:none).
 *
 * @param variant  The animation variant object (initial/exit styles + easing).
 * @param entered  Set of ids whose entrance has already played; updated in place.
 * @param id       Unique id of this row.
 */
export function makeRowRef(
  variant: AnimVariant,
  entered: Set<string | number>,
  id: string | number,
): (el: HTMLElement | null) => void {
  return (el: HTMLElement | null): void => {
    if (!el) {
      // Cleanup on unmount
      const aug = el as AugEl | null
      if (aug?.__alRafId !== undefined) {
        cancelAnimationFrame(aug.__alRafId)
        delete aug.__alRafId
      }
      if (aug?.__alTimerId !== undefined) {
        clearTimeout(aug.__alTimerId)
        delete aug.__alTimerId
      }
      return
    }

    // Entrance already played for this id — skip (handles re-renders).
    if (entered.has(id)) return
    entered.add(id)

    const aug = el as AugEl

    // Background tab: CSS transitions are frozen — show row at resting state
    // immediately so content is never stuck invisible.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      el.style.transition = 'none'
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    // Set 'from' state without transition, then flush reflow, then animate.
    el.style.transition = 'none'
    el.style.opacity = String(variant.initial.opacity)
    el.style.transform = variant.initial.transform
    void el.offsetWidth // force reflow — commits 'from' state before transition starts

    const fullTransition = buildTransition(variant.ease)
    aug.__alRafId = requestAnimationFrame(() => {
      delete aug.__alRafId
      el.style.transition = fullTransition
      el.style.opacity = '1'
      el.style.transform = 'none'

      // Safety net: if transition freezes mid-entrance (tab backgrounded),
      // guarantee the row still lands at its visible resting state.
      aug.__alTimerId = setTimeout(() => {
        delete aug.__alTimerId
        if (el.isConnected) {
          el.style.opacity = '1'
          el.style.transform = 'none'
        }
      }, SETTLE_SAFETY_MS)
    })
  }
}

// ── Exit row shape ────────────────────────────────────────────────────────────
interface ExitRow<T> { id: string | number; item: T }

// ── Mutable store bag — all imperative state in one ref ───────────────────────
// Encapsulates every ref read that would otherwise happen during render, so the
// component can read plain computed values instead of .current properties.
interface StoreBag<T extends { id: string | number }> {
  heights:    Map<string | number, number>
  cache:      Map<string | number, T>
  entered:    Set<string | number>
  nodeRefs:   Map<string | number, HTMLElement>
  prevVisIds: Array<string | number>
  pendingFrame: boolean
}

/**
 * useAnimatedListStore
 *
 * Manages all mutable imperative state for AnimatedList. All .current access
 * is confined to this hook, so the component render path reads only plain
 * computed values (heights snapshot, exits state, bump counter).
 */
export function useAnimatedListStore<T extends { id: string | number }>(
  rowHeight: number,
  gap: number,
) {
  // Single ref bag — keeps all mutable data in one place
  const bagRef = useRef<StoreBag<T>>({
    heights:      new Map(),
    cache:        new Map(),
    entered:      new Set(),
    nodeRefs:     new Map(),
    prevVisIds:   [],
    pendingFrame: false,
  })

  const [exits, setExits] = useState<ExitRow<T>[]>([])
  const [, bump] = useReducer((x: number) => (x + 1) % 1e9, 0)

  // Stable remove-exit callback
  const removeExit = useCallback((id: string | number) => {
    const bag = bagRef.current
    setExits((xs) => xs.filter((x) => x.id !== id))
    bag.heights.delete(id)
    bag.cache.delete(id)
    bag.entered.delete(id)
    bag.nodeRefs.delete(id)
  }, [])

  /**
   * Called once per render with the current visible item list.
   * Updates cache, computes exits, schedules a post-paint measurement pass,
   * and returns the computed values the component needs to render correctly.
   *
   * All ref reads happen here, inside the hook, not in the component.
   */
  function computeRender(visible: T[], currentExits: ExitRow<T>[]) {
    const bag = bagRef.current

    // Keep cache up-to-date so exiting rows can still render their data.
    for (const it of visible) bag.cache.set(it.id, it)

    const curIds = visible.map((i) => i.id)
    const liveSet = new Set(curIds)
    const newlyGone = bag.prevVisIds.filter(
      (id) => !liveSet.has(id) && bag.cache.has(id) && !currentExits.some((e) => e.id === id),
    )

    const exitRows: ExitRow<T>[] = currentExits
      .filter((x) => !liveSet.has(x.id))
      .concat(newlyGone.map((id) => ({ id, item: bag.cache.get(id) as T })))

    // Schedule post-paint measurement once per render cycle.
    if (!bag.pendingFrame) {
      bag.pendingFrame = true
      Promise.resolve().then(() => {
        bag.pendingFrame = false

        // 1) Measure row heights.
        let changed = false
        bag.nodeRefs.forEach((el, id) => {
          const h = el.offsetHeight
          if (h && bag.heights.get(id) !== h) {
            bag.heights.set(id, h)
            changed = true
          }
        })

        // 2) Commit newly-gone rows into exit state + schedule unmount.
        if (newlyGone.length) {
          setExits((xs) =>
            xs.concat(newlyGone.map((id) => ({ id, item: bag.cache.get(id) as T }))),
          )
          newlyGone.forEach((id) => setTimeout(() => removeExit(id), 560))
        }
        bag.prevVisIds = curIds

        if (changed) bump()
      })
    }

    // Build combined row list: live rows first, then exiting rows below.
    const combined = visible
      .map((it, i) => ({ id: it.id, item: it, index: i, exiting: false }))
      .concat(exitRows.map((x) => ({ id: x.id, item: x.item, index: -1, exiting: true })))

    // Compute slot top positions.
    let acc = 0
    const tops: Record<string | number, number> = {}
    combined.forEach((row) => {
      tops[row.id] = acc
      acc += (bag.heights.get(row.id) ?? rowHeight) + gap
    })

    // Compute container height (live rows only, last gap excluded).
    let containerHeight = 0
    for (const it of visible) {
      containerHeight += (bag.heights.get(it.id) ?? rowHeight) + gap
    }
    containerHeight = Math.max(0, containerHeight - gap)

    return { combined, tops, containerHeight }
  }

  /**
   * Callback ref factory — registers or unregisters a row DOM element.
   * Called from the component's inline ref prop; never during render itself.
   */
  function makeNodeRef(id: string | number) {
    return (el: HTMLElement | null) => {
      const bag = bagRef.current
      if (el) {
        bag.nodeRefs.set(id, el)
      } else {
        bag.nodeRefs.delete(id)
      }
    }
  }

  /**
   * Exposes the entered set and nodeRefs so makeRowRef can use them
   * from the component's inline ref without touching bagRef.current there.
   * Returned as stable references (same object across renders).
   */
  function getEntered(): Set<string | number> {
    return bagRef.current.entered
  }

  return { exits, computeRender, makeNodeRef, getEntered, removeExit }
}

export type { AnimVariant, ExitRow }
