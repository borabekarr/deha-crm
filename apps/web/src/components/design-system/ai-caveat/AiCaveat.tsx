import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './AiCaveat.css'

// ── Component ─────────────────────────────────────────────────────────────────

export default function AiCaveat() {
  return (
    <div className="card">

      {/* Caveat banner */}
      <div className="ai-caveat">
        <span className="material-icons ai-caveat-icon">warning</span>
        <span className="ai-caveat-text">
          AI responses can be inaccurate or misleading.{' '}
          <a
            className="ai-caveat-link"
            href="https://www.deha.io/help/ai-accuracy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn how AI accuracy works
          </a>
        </span>
      </div>

    </div>
  )
}
