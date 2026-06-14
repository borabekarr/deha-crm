import '../../../../design-system/preview/_base.css'
import './ModelSelectionSheet.css'

// ---------------------------------------------------------------------------
// ModelSelectionSheet — AI model selection mobile-style sheet
// Faithful port of apps/web/design-system/preview/components-model-selection-sheet.html
// DOM: .mss-card > .shell.sel-shell > .sheet > (.sh-head, .sh-body, .confetti)
// NO raw useEffect — all animation/interaction lives in model-selection-sheet-hook.ts
// ---------------------------------------------------------------------------

import { useCallback, useRef } from 'react'
import {
  modelSelectionSheetRef,
  cleanupModelSelectionSheet,
  MODELS,
} from './model-selection-sheet-hook'

export default function ModelSelectionSheet() {
  const m0 = MODELS[0]
  const elRef = useRef<HTMLDivElement | null>(null)

  // Ref callback that wires hook on mount, cleans up on unmount
  const sheetRefWithCleanup = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      elRef.current = el
      modelSelectionSheetRef(el)
    } else {
      cleanupModelSelectionSheet(elRef.current)
      elRef.current = null
    }
  }, [])

  return (
    <div className="mss-card">
      <div className="shell sel-shell" data-screen-label="AI Model Selection Sheet">
        <div className="sheet" ref={sheetRefWithCleanup as React.RefCallback<HTMLDivElement>}>

          {/* Header */}
          <div className="sh-head">
            <button className="nav-btn" id="mss-prevBtn" aria-label="Previous model">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="sh-head-mid">
              <div className="sh-title">Select Intelligence</div>
              <div className="dots">
                {MODELS.map((_, i) => (
                  <span key={i} className={`dot${i === 0 ? ' on' : ''}`} />
                ))}
              </div>
            </div>
            <button className="nav-btn" id="mss-nextBtn" aria-label="Next model">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          {/* Body */}
          <div className="sh-body">
            {/* identity */}
            <div className="ident">
              <div className="logo">
                <span className="material-symbols-outlined logo-glyph">{m0.glyph}</span>
              </div>
              <div className="ident-text">
                <div className="ident-name morph-host">
                  <span className="morph-cur">{m0.name}</span>
                </div>
                <div className="ident-vendor morph-host">
                  <span className="morph-cur">{m0.vendor}</span>
                </div>
              </div>
            </div>

            {/* metrics */}
            <div className="metrics">
              {/* Speed */}
              <div className="metric">
                <div className="m-top">
                  <span className="m-ic" style={{ '--ic': '#F97316' } as React.CSSProperties}>
                    <span className="material-symbols-outlined">bolt</span>
                  </span>
                  <span className="m-label">Speed</span>
                  <span className="m-badge" data-badge="speed">
                    <span className="m-badge-txt">{m0.speed.label}</span>
                  </span>
                </div>
                <div className="bar">
                  <div
                    className="bar-fill"
                    data-fill="speed"
                    style={{ '--w': (m0.speed.v * 100).toFixed(1) + '%' } as React.CSSProperties}
                  />
                </div>
              </div>
              {/* IQ */}
              <div className="metric">
                <div className="m-top">
                  <span className="m-ic" style={{ '--ic': '#8B5CF6' } as React.CSSProperties}>
                    <span className="material-symbols-outlined">neurology</span>
                  </span>
                  <span className="m-label">IQ</span>
                  <span className="m-badge" data-badge="iq">
                    <span className="m-badge-txt">{m0.iq.label}</span>
                  </span>
                </div>
                <div className="bar">
                  <div
                    className="bar-fill"
                    data-fill="iq"
                    style={{ '--w': (m0.iq.v * 100).toFixed(1) + '%' } as React.CSSProperties}
                  />
                </div>
              </div>
              {/* Price */}
              <div className="metric">
                <div className="m-top">
                  <span className="m-ic" style={{ '--ic': '#10B981' } as React.CSSProperties}>
                    <span className="material-symbols-outlined">attach_money</span>
                  </span>
                  <span className="m-label">Price</span>
                  <span className="m-badge" data-badge="price">
                    <span className="m-badge-txt">{m0.price.label}</span>
                  </span>
                </div>
                <div className="bar">
                  <div
                    className="bar-fill"
                    data-fill="price"
                    style={{ '--w': (m0.price.v * 100).toFixed(1) + '%' } as React.CSSProperties}
                  />
                </div>
              </div>
              {/* Privacy */}
              <div className="metric">
                <div className="m-top">
                  <span className="m-ic" style={{ '--ic': '#3B82F6' } as React.CSSProperties}>
                    <span className="material-symbols-outlined">lock</span>
                  </span>
                  <span className="m-label">Privacy</span>
                  <span className="m-badge" data-badge="privacy">
                    <span className="m-badge-txt">{m0.privacy.label}</span>
                  </span>
                </div>
                <div className="bar">
                  <div
                    className="bar-fill"
                    data-fill="privacy"
                    style={{ '--w': (m0.privacy.v * 100).toFixed(1) + '%' } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>

            {/* specs */}
            <div className="specs-wrap">
              <span className="specs-rule" />
              <button className="specs-btn" id="mss-specsBtn">
                View Full Specs: {m0.name}
              </button>
              <span className="specs-rule" />
            </div>

            {/* confirm */}
            <button className="confirm" id="mss-confirmBtn">
              <span
                className="material-symbols-outlined confirm-icon"
                id="mss-confirmIcon"
              >
                check
              </span>
              <span id="mss-confirmText" className="confirm-text">Confirm Selection</span>
            </button>
          </div>

          <canvas className="confetti" />
        </div>
      </div>

      <div className="mss-hint">click ‹ › to switch model · tap &ldquo;Confirm Selection&rdquo;</div>
    </div>
  )
}
