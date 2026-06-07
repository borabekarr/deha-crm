import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Cards.css'

export default function Cards() {
  return (
    <div className="card cards-outer" style={{ padding: 0 }}>
      <div className="cards-frame">
        <div className="cards-grid">
          <div className="shell zoom">
            <div className="card-inner">
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
        </div>
      </div>
    </div>
  )
}
