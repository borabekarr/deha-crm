/**
 * PinnedList — Deha Design System
 *
 * When an item is pinned/unpinned, ONLY that item animates (scale entrance,
 * animated-list model). All other rows are completely static — no FLIP,
 * no reflow, no sibling churn.
 *
 * A newly-pinned item always lands at the TOP of the pinned section.
 * A newly-unpinned item returns to its natural slot in the "All" section.
 *
 * No useEffect / useLayoutEffect anywhere in this file.
 * Entrance animation is driven imperatively via a callback ref.
 */

import { useState, useCallback, useRef } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { useAutoHeight } from '../../../lib/hooks/use-auto-height'
import { useEntranceRef, useFLIPRefs } from './pinned-list-hook'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './PinnedList.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PinnedListItem {
  id: string
  name: string
  sub: string
  icon: string
  pinned: boolean
}

export interface PinnedListProps {
  items?: PinnedListItem[]
}

// ---------------------------------------------------------------------------
// Default demo data (renders standalone with no props)
// ---------------------------------------------------------------------------
const DEFAULT_ITEMS: PinnedListItem[] = [
  { id: 'inbox',     name: 'Inbox',      sub: 'Mail · 12 unread',          icon: 'mail',           pinned: true  },
  { id: 'cal',       name: 'Calendar',   sub: 'Schedule · 3 events today', icon: 'calendar_month', pinned: false },
  { id: 'analytics', name: 'Analytics',  sub: 'Reports · Updated 2h ago',  icon: 'insights',       pinned: true  },
  { id: 'chat',      name: 'Team Chat',  sub: 'Messaging · 5 channels',    icon: 'forum',          pinned: false },
  { id: 'files',     name: 'Files',      sub: 'Storage · 48 GB used',      icon: 'folder',         pinned: false },
  { id: 'billing',   name: 'Billing',    sub: 'Payments · Due in 4 days',  icon: 'payments',       pinned: false },
]

// ---------------------------------------------------------------------------
// Scale entrance: animated-list model (cubic-bezier(.22,1,.36,1), ~280ms)
// Applied imperatively via callback ref to ONLY the toggled item.
// ---------------------------------------------------------------------------
interface AugEl extends HTMLElement {
  __plEnterRafId?: number
  __plEnterSettleId?: ReturnType<typeof setTimeout>
  __plEnterPlayed?: boolean
}

/**
 * Returns a callback ref that plays a one-shot scale entrance animation.
 * The ref is keyed by `animKey` — when animKey changes, the "played" guard
 * is reset so the next mount of the same element replays the animation.
 *
 * Does NOT set any class on sibling elements — this is strictly per-element.
 */
function makeScaleEntranceRef(_animKey: string, isUnpin = false): (el: HTMLElement | null) => void {
  // Per-ref closure: tracks whether the entrance has played for this animKey.
  let played = false

  return (el: HTMLElement | null) => {
    const aug = el as AugEl | null

    if (!el || !aug) {
      // Cleanup on unmount
      if (aug?.__plEnterRafId !== undefined) {
        cancelAnimationFrame(aug.__plEnterRafId)
        delete aug.__plEnterRafId
      }
      if (aug?.__plEnterSettleId !== undefined) {
        clearTimeout(aug.__plEnterSettleId)
        delete aug.__plEnterSettleId
      }
      return
    }

    // Guard: only play once per animKey
    if (played) return
    played = true
    aug.__plEnterPlayed = true

    // Cancel any in-progress animation from a stale closure
    if (aug.__plEnterRafId !== undefined) cancelAnimationFrame(aug.__plEnterRafId)
    if (aug.__plEnterSettleId !== undefined) clearTimeout(aug.__plEnterSettleId)

    // Set initial state (invisible, scaled down and shifted up)
    aug.style.transition = 'none'
    aug.style.opacity = '0'
    aug.style.transform = 'translateY(-22px) scale(0.96)'
    // Unpin: slide under siblings for the duration of the entrance.
    // z-index 0 + position:relative (set in CSS) keeps the unpinning element
    // BELOW siblings whose will-change:transform stacking context paints later.
    if (isUnpin) aug.style.zIndex = '0'

    // Force reflow so the browser registers the start state before transitioning
    void aug.offsetHeight

    // Play: transition to resting state
    aug.__plEnterRafId = requestAnimationFrame(() => {
      aug.style.transition =
        `opacity calc(280ms * var(--anim-mult, 1)) ease-out,` +
        ` transform calc(280ms * var(--anim-mult, 1)) cubic-bezier(.22,1,.36,1)`
      aug.style.opacity = ''
      aug.style.transform = ''

      aug.__plEnterSettleId = setTimeout(() => {
        // Clean up inline styles after animation completes
        aug.style.transition = ''
        aug.style.opacity = ''
        aug.style.transform = ''
        aug.style.zIndex = '' // reset unpin z-index staging
        delete aug.__plEnterRafId
        delete aug.__plEnterSettleId
      }, 400)
    })
  }
}

// ---------------------------------------------------------------------------
// PinItem — individual card
// ---------------------------------------------------------------------------
interface PinItemProps {
  item: PinnedListItem
  onToggle: (id: string) => void
  entranceDelay: number
  /** When non-empty, this item plays the scale entrance animation. */
  animKey?: string
  /** True when this item was just unpinned — slides under siblings during entrance. */
  isUnpin?: boolean
}

function PinItem({ item, onToggle, entranceDelay, animKey, isUnpin }: PinItemProps) {
  // Stable entrance ref for initial mount stagger (only fires once on mount)
  const entranceRef = useEntranceRef(entranceDelay)

  // Combined callback ref: runs entrance stagger on first mount,
  // and plays scale entrance on the toggled item when animKey is set.
  // Inline function so react-hooks/use-memo is satisfied.
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      entranceRef(el)
      if (animKey && el) {
        makeScaleEntranceRef(animKey, isUnpin)(el)
      }
    },
    [entranceRef, animKey, isUnpin],
  )

  function handlePin(e: React.MouseEvent) {
    e.stopPropagation()
    onToggle(item.id)
  }

  return (
    <div
      ref={combinedRef}
      className={'pl-item' + (item.pinned ? ' is-pinned' : '')}
    >
      <span className="pl-ico">
        <span className={iconClass(item.icon)}>{item.icon}</span>
      </span>
      <div className="pl-main">
        <div className="pl-name">{item.name}</div>
        <div className="pl-sub">{item.sub}</div>
      </div>
      <button
        className="pl-pin"
        type="button"
        aria-label="Toggle pin"
        onClick={handlePin}
      >
        <span className={iconClass('push_pin')}>push_pin</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PinnedList — root component
// ---------------------------------------------------------------------------

/**
 * Stable item order within each section:
 * - Pinned: newly-pinned item always goes to index 0 (top of pinned group).
 *   Other pinned items keep their relative order.
 * - All: items maintain their original relative order minus pinned ones.
 *
 * We track `pinnedOrder` separately from the pinned flag so we can prepend
 * without disrupting other items.
 */
interface PinnedListState {
  items: PinnedListItem[]
  /** Ordered list of pinned ids — newest pin is at index 0. */
  pinnedOrder: string[]
  /** The id of the item whose toggle just fired — for scale entrance. */
  justToggled: string | null
  /** Monotonic counter to generate unique animKeys per toggle. */
  toggleGen: number
}

export default function PinnedList({ items: initialItems = DEFAULT_ITEMS }: PinnedListProps) {
  const [state, setState] = useState<PinnedListState>(() => {
    const items = initialItems.map((it) => ({ ...it }))
    // Build initial pinnedOrder: items that start pinned, in their original order
    const pinnedOrder = items.filter((it) => it.pinned).map((it) => it.id)
    return { items, pinnedOrder, justToggled: null, toggleGen: 0 }
  })

  // FLIP: node registry + snap/play helpers (no useEffect)
  const { snapRects, getFlipRef } = useFLIPRefs()
  // DOM node registry: outer wrapper div per item id, used for snapRects
  const nodeRefs = useRef<Record<string, HTMLElement>>({})
  // Easing to use for the current FLIP pass (pin vs unpin)
  const flipEaseRef = useRef('cubic-bezier(.22,1,.36,1)')

  // Pinned-section header collapses to 0 when the pinned group is empty --
  // measured height instead of a fixed max-height cap.
  const { ref: pinnedHeadRef } = useAutoHeight<HTMLDivElement>({
    open: state.pinnedOrder.length > 0,
  })

  function toggle(id: string) {
    const target = state.items.find((it) => it.id === id)
    if (!target) return

    // Select easing BEFORE mutating state:
    // PIN uses bounce/overshoot; UNPIN uses smooth spring.
    flipEaseRef.current = target.pinned
      ? 'cubic-bezier(.22,1,.36,1)'   // unpin: smooth
      : 'cubic-bezier(.34,1.7,.46,1)' // pin: bounce/overshoot

    // Snapshot all item positions (First in FLIP) before state mutation.
    snapRects(nodeRefs.current)

    setState((prev) => {
      const t = prev.items.find((it) => it.id === id)
      if (!t) return prev

      const nextGen = prev.toggleGen + 1

      const nextItems = prev.items.map((it) =>
        it.id === id ? { ...it, pinned: !it.pinned } : it,
      )

      let nextPinnedOrder: string[]
      if (!t.pinned) {
        // Pinning: prepend to pinnedOrder (new pin goes to top)
        nextPinnedOrder = [id, ...prev.pinnedOrder.filter((oid) => oid !== id)]
      } else {
        // Unpinning: remove from pinnedOrder
        nextPinnedOrder = prev.pinnedOrder.filter((oid) => oid !== id)
      }

      return {
        items: nextItems,
        pinnedOrder: nextPinnedOrder,
        justToggled: id,
        toggleGen: nextGen,
      }
    })
  }

  const { items, pinnedOrder, justToggled, toggleGen } = state

  // Build sorted pinned array: order by pinnedOrder array
  const itemMap = Object.fromEntries(items.map((it) => [it.id, it]))
  const pinned = pinnedOrder.map((id) => itemMap[id]).filter(Boolean)
  // All (unpinned): maintain original relative order
  const all = items.filter((it) => !it.pinned)

  const np = pinned.length
  const na = all.length

  const renderItem = (it: PinnedListItem, i: number) => {
    // animKey is derived purely from state -- no ref read during render.
    // It's unique per toggle: "<id>-<gen>". Only the just-toggled item gets one.
    const animKey = it.id === justToggled ? `${it.id}-${toggleGen}` : undefined
    const isToggled = it.id === justToggled
    // After toggle, it.pinned===false means this item was just unpinned.
    // Used to set z-index below siblings during the entrance animation.
    const isUnpin = isToggled && !it.pinned

    return (
      <div
        key={it.id}
        ref={(el) => {
          // Always register/unregister the DOM node for snapRects (before next toggle).
          if (el) {
            nodeRefs.current[it.id] = el
          } else {
            delete nodeRefs.current[it.id]
          }
          // FLIP: slide siblings into place. Skip the toggled item -- it gets
          // a scale entrance animation instead (makeScaleEntranceRef inside PinItem).
          if (!isToggled) {
            getFlipRef(it.id, flipEaseRef.current)(el)
          }
        }}
      >
        <PinItem
          item={it}
          onToggle={toggle}
          entranceDelay={60 + i * 70}
          animKey={animKey}
          isUnpin={isUnpin}
        />
      </div>
    )
  }

  return (
    <section className="pinlist" data-screen-label="Pinned List" aria-label="Pinned list">
      {/* Surface header */}
      <div className="pl-top">
        <span className="pl-top-ic">
          <span className={iconClass('apps')}>apps</span>
        </span>
        <div>
          <div className="pl-top-tt">Quick Access</div>
          <div className="pl-top-sb">Pin the workspaces you use most</div>
        </div>
      </div>

      {/* Pinned section */}
      <div className={'pl-sec pinned' + (np === 0 ? ' empty' : '')}>
        <div className="pl-head" ref={pinnedHeadRef}>
          <span className={`pl-head-icon ${iconClass('push_pin')}`}>push_pin</span>
          Pinned
          <span className="pl-count">{np}</span>
        </div>
        <div className="pl-items">{pinned.map(renderItem)}</div>
      </div>

      {/* All section */}
      <div
        className={
          'pl-sec all' +
          (np === 0 ? ' solo' : '') +
          (na === 0 ? ' no-items' : '')
        }
      >
        <div className="pl-head">
          All items
          <span className="pl-count">{na}</span>
        </div>
        <div className="pl-items">{all.map(renderItem)}</div>
        <div className="pl-empty">
          <span className={`pl-empty-icon ${iconClass('push_pin')}`}>push_pin</span>
          <span className="pl-empty-label">Everything is pinned</span>
        </div>
      </div>
    </section>
  )
}
