import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './SpringShowcase.css'

import { useRef, useState } from 'react'
import { LazyMotion, domMax, m, useMotionValue } from 'framer-motion'
import { animate } from 'framer-motion/dom'
import { SPRING_ELEGANT, SPRING_BOUYANT } from '@/lib/motion-spring'

/* =========================================================================
   SpringShowcase — Deha Design System
   Zone 1 "Reorder": layoutId identity animation driven by SPRING_ELEGANT
   (Reordered Cards Keep Their Identity pattern — position/size/radius
   animate, cards stay mounted, no pop-into-slot).
   Zone 2 "Flick": a draggable ball released inside a bounded track settles
   with SPRING_BOUYANT, next to a twin settling with SPRING_ELEGANT, so the
   two house springs can be felt side by side.

   Checked at click/drag-end time (not stored as reactive state), matching
   usePillSpring's motionDisabled convention in lib/motion-spring.ts.
   ========================================================================= */

const CARD_LABELS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot']
const TRACK_MAX = 176 // track width (220) minus ball diameter (44)

function motionDisabled(): boolean {
  if (typeof window === 'undefined') return false
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult').trim()
  const mult = raw === '' ? 1 : parseFloat(raw)
  if (Number.isFinite(mult) && mult <= 0) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function shuffled<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function FlickLane({ label, spring }: { label: string; spring: typeof SPRING_ELEGANT | typeof SPRING_BOUYANT }) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)

  const settle = (target: number) => {
    animate(x, target, motionDisabled() ? { duration: 0 } : spring)
  }

  return (
    <div className="ss-flick-lane">
      <div className="ss-flick-track" ref={trackRef} data-testid={`ss-track-${label}`}>
        <m.div
          className="ss-ball"
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0.12}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={() => settle(x.get() > TRACK_MAX / 2 ? TRACK_MAX : 0)}
        />
      </div>
      <span className="ss-flick-caption">{label}</span>
    </div>
  )
}

export default function SpringShowcase() {
  const [order, setOrder] = useState(CARD_LABELS)

  return (
    <LazyMotion features={domMax} strict>
      <div className="ss-root">
        <section className="ss-zone">
          <div className="ss-zone-head">
            <h3 className="ss-zone-title">Reorder</h3>
            <button type="button" className="ss-shuffle-btn" onClick={() => setOrder(shuffled(order))}>
              Shuffle
            </button>
          </div>
          <div className="ss-grid">
            {order.map((label) => (
              <m.div
                key={label}
                layoutId={label}
                layout
                className="ss-card"
                transition={motionDisabled() ? { duration: 0 } : SPRING_ELEGANT}
              >
                {label}
              </m.div>
            ))}
          </div>
        </section>

        <section className="ss-zone">
          <div className="ss-zone-head">
            <h3 className="ss-zone-title">Flick</h3>
            <p className="ss-zone-hint">Drag and release each ball to feel the settle.</p>
          </div>
          <div className="ss-flick-row">
            <FlickLane label="Bouyant" spring={SPRING_BOUYANT} />
            <FlickLane label="Elegant" spring={SPRING_ELEGANT} />
          </div>
        </section>
      </div>
    </LazyMotion>
  )
}
