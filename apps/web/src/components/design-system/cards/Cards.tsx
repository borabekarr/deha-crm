import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Cards.css'
import { useSquircle } from '../../../lib/hooks/use-squircle'

export default function Cards() {
  const innerSquircleRef = useSquircle<HTMLDivElement>()
  const concentricOuterRef = useSquircle<HTMLDivElement>()
  const concentricInnerRef = useSquircle<HTMLDivElement>()

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
              ref={concentricOuterRef}
              style={{ '--corner-radius': '28px' } as React.CSSProperties}
            >
              <div className="card-inner concentric-demo-inner" ref={concentricInnerRef}>
                <div className="card-name">Concentric squircle pair</div>
                <div className="card-desc">inner = outer − inset (28 − 8 = 20), smoothing 0.6</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
