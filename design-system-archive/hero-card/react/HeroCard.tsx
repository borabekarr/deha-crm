import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './HeroCard.css'

// ---------------------------------------------------------------------------
// HeroCard — Emerald CTA hero with sheen + grid texture
// Faithful port of apps/web/design-system/preview/components-hero-card.html
// No JS animation in prototype → no hook file needed (static CSS sheen only).
// ---------------------------------------------------------------------------

export default function HeroCard() {
  return (
    <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
      <div className="hc-frame">
        <div className="shell zoom">
          <div className="hc-hero">
            <div className="hc-icon">
              <span className="material-icons">auto_awesome</span>
            </div>
            <div className="hc-title">Welcome to Deha CRM!</div>
            <div className="hc-sub">
              Your dashboard is already analyzing leads. Check out your AI-matched properties and conversion pipeline.
            </div>
            <button className="hc-btn">
              View Your Leads <span className="material-icons">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
