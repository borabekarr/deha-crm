import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './AnimatedList.css'

import { useState } from 'react'
import { useProximityGroup, useSquircle } from '@/lib/hooks'
import { makeRowRef, buildTransition, useAnimatedListStore, type AnimVariant } from './animated-list-hook'

/* =========================================================================
   AnimatedList — Deha Design System (React port)
   Real-time push feed: absolute-slot model.

   Each item occupies an absolute slot keyed by id. When a new item prepends
   at index 0, React updates every other row's `top` and CSS transitions them
   down. The new row's entrance (opacity/transform) is driven imperatively via
   a callback ref (makeRowRef). When the oldest item is pushed beyond
   maxVisible, it is kept mounted (mounted-through-exit) — React applies the
   exit opacity/transform inline, and a timer removes it after the animation
   completes so it never flickers off mid-transition.

   All mutable state (heights, cache, entered set, nodeRefs, prevVisIds) is
   encapsulated in `useAnimatedListStore` so the component render path reads
   only plain computed values — no `.current` access during render.
   ========================================================================= */

const VARIANTS: Record<string, AnimVariant> = {
  scale: {
    initial: { opacity: 0, transform: 'translateY(-22px) scale(0.96)' },
    exit:    { opacity: 0, transform: 'translateY(10px) scale(0.92)' },
    ease: 'cubic-bezier(.22,1,.36,1)',
  },
  slide: {
    initial: { opacity: 0, transform: 'translateY(-32px)' },
    exit:    { opacity: 0, transform: 'translateY(28px)' },
    ease: 'cubic-bezier(.22,1,.36,1)',
  },
  fade: {
    initial: { opacity: 0, transform: 'none' },
    exit:    { opacity: 0, transform: 'translateY(8px)' },
    ease: 'cubic-bezier(.4,0,.2,1)',
  },
  bounce: {
    initial: { opacity: 0, transform: 'translateY(-20px) scale(0.8)' },
    exit:    { opacity: 0, transform: 'translateY(14px) scale(0.86)' },
    ease: 'cubic-bezier(.34,1.7,.46,1)',
  },
}

export interface AnimatedListProps<T extends { id: string | number }> {
  /** Items to display; index 0 = newest. Each item must have a unique `id`. */
  items?: T[]
  /** Row renderer — return any React node for a single item. */
  renderItem?: (item: T, index: number) => React.ReactNode
  /** Maximum number of rows shown at once before the oldest exits. Default 8. */
  maxVisible?: number
  /** Gap in px between rows. Default 12. */
  gap?: number
  /** Entrance / exit animation variant. Default 'scale'. */
  animation?: 'scale' | 'slide' | 'fade' | 'bounce'
  /** Fallback row height in px used before the row is measured. Default 64. */
  rowHeight?: number
  /** Extra class applied to the outermost element. */
  className?: string
}

/* ── Main component ──────────────────────────────────────────────── */
export function AnimatedList<T extends { id: string | number }>({
  items = [],
  renderItem,
  maxVisible = 8,
  gap = 12,
  animation = 'scale',
  rowHeight = 64,
  className = '',
}: AnimatedListProps<T>) {
  const variant = VARIANTS[animation] ?? VARIANTS['scale']
  const visible = items.slice(0, maxVisible)

  const fullTransition = buildTransition(variant.ease)

  // All mutable imperative state lives in the store hook.
  // The component render path only reads the plain values computeRender returns.
  const { exits, computeRender, makeNodeRef, getEntered } = useAnimatedListStore<T>(rowHeight, gap)

  // computeRender updates internal state and returns plain computed values.
  // It is safe to call during render: all .current accesses are inside the hook.
  const { combined, tops, containerHeight } = computeRender(visible, exits)

  const effectiveRenderItem = renderItem ?? (() => null)

  return (
    <div
      className={('al-root ' + className).trim()}
      style={{
        position: 'relative',
        height: containerHeight + 'px',
        transition: `height calc(500ms * var(--anim-mult,1)) ${variant.ease}`,
      }}
    >
      {combined.map((row) => {
        // Live rows: React controls only top/zIndex.
        // Opacity & transform are owned by the imperative entrance callback ref,
        // so a re-render can never reset a settled row back to invisible.
        // Exit rows: React drives opacity/transform/top to slide+fade out.
        const style: React.CSSProperties = {
          position: 'absolute',
          left: 0,
          right: 0,
          top: tops[row.id] + 'px',
          transition: fullTransition,
          willChange: 'top, transform, opacity',
          zIndex: row.exiting ? 0 : 1,
        }
        if (row.exiting) {
          style.opacity = variant.exit.opacity
          style.transform = variant.exit.transform
          style.pointerEvents = 'none'
        }

        return (
          <div
            key={row.id}
            className="al-row"
            style={style}
            ref={(el) => {
              // Register / unregister DOM node — happens outside render.
              makeNodeRef(row.id)(el)
              // Play entrance imperatively via callback ref — no useEffect.
              if (el) {
                makeRowRef(variant, getEntered(), row.id)(el)
              } else {
                makeRowRef(variant, getEntered(), row.id)(null)
              }
            }}
          >
            {effectiveRenderItem(row.item, row.index)}
          </div>
        )
      })}
    </div>
  )
}

/* =========================================================================
   Built-in demo — self-contained Payments Radar feed.
   Renders standalone in the showcase with no required props.
   Auto-seeds 5 initial items; a "Push event" button prepends one more.
   The self-rescheduling push timer lives in the hook via a callback ref.
   ========================================================================= */

type RiskLevel = 'low' | 'elevated' | 'blocked' | 'review'

interface PaymentEvent {
  id: number
  amount: string
  meth: string
  place: string
  risk: RiskLevel
  score: string
}

const METHODS = [
  { meth: 'Visa ···4242',       icon: 'credit_card' },
  { meth: 'Mastercard ···8801', icon: 'credit_card' },
  { meth: 'Amex ···1007',       icon: 'credit_card' },
  { meth: 'Apple Pay',          icon: 'phone_iphone' },
  { meth: 'PayPal wallet',      icon: 'account_balance_wallet' },
  { meth: 'SEPA transfer',      icon: 'account_balance' },
]
const PLACES = ['Berlin, DE', 'Austin, US', 'Lisbon, PT', 'Toronto, CA', 'Tokyo, JP', 'Lagos, NG', 'Paris, FR', 'São Paulo, BR']
const RISK_POOL: RiskLevel[] = ['low','low','low','low','elevated','elevated','review','blocked']
const RISK_META: Record<RiskLevel, { label: string; icon: string }> = {
  low:      { label: 'Low risk', icon: 'verified_user' },
  elevated: { label: 'Elevated', icon: 'bolt' },
  review:   { label: 'Review',   icon: 'flag' },
  blocked:  { label: 'Blocked',  icon: 'block' },
}

let _nextId = 1
function makeEvent(): PaymentEvent {
  const m = METHODS[(Math.random() * METHODS.length) | 0]
  const risk = RISK_POOL[(Math.random() * RISK_POOL.length) | 0]
  const amt = Math.random() * 880 + 12
  const score =
    risk === 'low'      ? (Math.random() * 18) | 0
    : risk === 'elevated' ? 42 + ((Math.random() * 22) | 0)
    : risk === 'review'   ? 60 + ((Math.random() * 15) | 0)
    :                       82 + ((Math.random() * 16) | 0)
  return {
    id: _nextId++,
    amount: '$' + amt.toFixed(2),
    meth: m.meth,
    place: PLACES[(Math.random() * PLACES.length) | 0],
    risk,
    score: String(score).padStart(2, '0'),
  }
}
function seed(n: number): PaymentEvent[] {
  return Array.from({ length: n }, makeEvent).reverse()
}

// Real component (not a plain render function) so useSquircle gets one stable
// hook slot per row id -- the .al-row wrapper above keys each mounted subtree.
function AlEvItem({ it }: { it: PaymentEvent }): React.ReactElement {
  const r = RISK_META[it.risk]
  const squircleRef = useSquircle<HTMLDivElement>()
  return (
    <div className={`al-ev al-ev--${it.risk}`} ref={squircleRef}>
      <span className="al-ev-ico material-symbols-outlined">{it.risk === 'low' ? 'verified_user' : it.risk === 'elevated' ? 'bolt' : it.risk === 'review' ? 'flag' : 'block'}</span>
      <div className="al-ev-main">
        <div className="al-ev-amt-row">
          <span className="al-ev-amt">{it.amount}</span>
          <span className="al-ev-meth">{it.meth}</span>
        </div>
        <div className="al-ev-sub">{it.place}</div>
      </div>
      <div className="al-ev-right">
        <span className="al-ev-pill">{r.label}</span>
        <span className="al-ev-score">score {it.score}</span>
      </div>
    </div>
  )
}

function renderEvent(it: PaymentEvent): React.ReactNode {
  return <AlEvItem it={it} />
}

type AnimMode = 'scale' | 'slide' | 'fade' | 'bounce'
const ANIM_MODES: AnimMode[] = ['scale', 'slide', 'fade', 'bounce']

export default function AnimatedListDemo() {
  const [items, setItems] = useState<PaymentEvent[]>(() => seed(5))
  const [anim, setAnim] = useState<AnimMode>('scale')
  const controlsRef = useProximityGroup<HTMLDivElement>()

  function pushEvent(): void {
    setItems((prev) => [makeEvent(), ...prev].slice(0, 8))
  }

  return (
    <div className="al-radar">
      <div className="al-rd-top">
        <span className="al-rd-ic material-symbols-outlined">radar</span>
        <div>
          <div className="al-rd-tt">Payments Radar</div>
          <div className="al-rd-sb">Live risk scoring</div>
        </div>
        <span className="al-live">
          <span className="al-live-dot" />
          Live
        </span>
      </div>

      <div className="al-controls" ref={controlsRef}>
        <div className="al-anim-pills">
          {ANIM_MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={'al-anim-pill' + (m === anim ? ' al-active' : '')}
              data-proximity
              onClick={() => setAnim(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <button type="button" className="al-push-btn" data-proximity onClick={pushEvent}>
          Push event
        </button>
      </div>

      <div className="al-feed">
        <AnimatedList<PaymentEvent>
          items={items}
          renderItem={renderEvent}
          maxVisible={5}
          gap={10}
          animation={anim}
          rowHeight={64}
        />
      </div>
    </div>
  )
}
