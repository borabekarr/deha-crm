import { useCallback, useRef, useState } from 'react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Cards.css'
import { useSquircle } from '../../../lib/hooks/use-squircle'

const MIN_W = 240
const MAX_W = 560
const MIN_H = 120
const MAX_H = 320

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export default function Cards() {
  const innerSquircleRef = useSquircle<HTMLDivElement>()
  const concentricOuterRef = useSquircle<HTMLDivElement>()
  const concentricInnerRef = useSquircle<HTMLDivElement>()
  const outerElRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  // Imperative drag handler, no lifecycle effect: measure at drag start,
  // attach window listeners for the duration of the drag, detach on pointerup.
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const outer = outerElRef.current
    if (!outer) return
    const rect = outer.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startW = rect.width
    const startH = rect.height

    const onMove = (me: PointerEvent) => {
      setSize({
        w: clamp(MIN_W, startW + (me.clientX - startX), MAX_W),
        h: clamp(MIN_H, startH + (me.clientY - startY), MAX_H),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  return (
    <div className="card cards-outer" style={{ padding: 0 }}>
      <div className="cards-frame">
        <div className="cards-grid">
          <div className="shell zoom">
            <div className="card-inner" ref={innerSquircleRef}>
              <div className="card-name">Inner Card</div>
              <div className="card-desc">white · slate-200 border · 20px radius · clean inset</div>
              <span className="card-tag">.card-inner · nested surface</span>
            </div>
          </div>
          <div className="card-accent">
            <div className="card-name" style={{ position: 'relative', zIndex: 1 }}>Accent Card</div>
            <div className="card-desc card-desc-w" style={{ position: 'relative', zIndex: 1 }}>Emerald fill · sheen overlay · 24px radius · emerald-glow shadow.</div>
            <span className="card-tag card-tag-w" style={{ position: 'relative', zIndex: 1 }}>.card-accent · hero / goal / simulator</span>
          </div>
          <div className="concentric-demo">
            <div
              className="concentric-demo-outer"
              ref={(el) => { concentricOuterRef(el); outerElRef.current = el }}
              style={{
                '--corner-radius': '28px',
                width: size?.w,
                height: size?.h,
              } as React.CSSProperties}
            >
              <div className="card-inner concentric-demo-inner" ref={concentricInnerRef}>
                <div className="card-name">Concentric squircle pair</div>
                <div className="card-desc">inner = outer − inset (28 − 8 = 20), smoothing 0.6</div>
              </div>
            </div>
            <div
              className="concentric-demo-resize-handle"
              aria-hidden="true"
              onPointerDown={handleResizePointerDown}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
