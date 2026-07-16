import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ThemeEditor.css'

import { useState } from 'react'
import { useProximityGroup } from '@/lib/hooks'
import { useSquircle } from '../../../lib/hooks/use-squircle'

// ── Swatch colours (verbatim from prototype) ─────────────────────────────────
const SWATCHES = ['var(--brand-primary-500)', '#EF4444', '#EAB308', '#F97316', '#232323']

// ── Range background helper (mirrors updateRange / updateBrightness JS) ──────
function rangeGradient(value: number): string {
  return `linear-gradient(to right, var(--brand-primary-500) 0%, var(--brand-primary-500) ${value}%, var(--tk-empty,#ECECEC) ${value}%, var(--tk-empty,#ECECEC) 100%)`
}

export default function ThemeEditor() {
  // Window mode: 'default' | 'compact'
  const [windowMode, setWindowMode] = useState<'default' | 'compact'>('default')

  // Theme swatch index (0 = emerald, initial sel)
  const [selectedSwatch, setSelectedSwatch] = useState(0)

  // Text size slider (initial value 55 from prototype)
  const [textSize, setTextSize] = useState(55)

  // Brightness slider (initial value 68 from prototype)
  const [brightness, setBrightness] = useState(68)

  // Startup toggle (initial state: on — sw-base sw-on in prototype)
  const [startupOn, setStartupOn] = useState(true)
  const teProxRef = useProximityGroup<HTMLDivElement>()
  const teOuterSquircleRef = useSquircle<HTMLDivElement>()
  const tePanelSquircleRef = useSquircle<HTMLDivElement>()

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="te-bg">
        <div className="te-outer" ref={teOuterSquircleRef}>
          <div
            className="te-panel"
            ref={(el) => {
              teProxRef(el)
              tePanelSquircleRef(el)
            }}
          >

            {/* Top bar */}
            <div className="te-topbar">
              <label className="te-search">
                <span className="material-icons">search</span>
                <input type="text" placeholder="Search..." aria-label="Search theme tokens" />
              </label>
              <button type="button" className="te-save" data-proximity>
                <span className="material-icons" style={{ fontSize: 14 }}>save</span>
                Save
              </button>
            </div>

            <div className="te-divider" />

            {/* Window mode */}
            <div className="te-section">
              <div className="te-s-head">
                <span className="te-s-title">Window mode</span>
                <span className="material-icons">chevron_right</span>
              </div>
              <div className="te-modes">

                {/* Default mode card */}
                <div
                  className={`te-mode${windowMode === 'default' ? ' sel' : ''}`}
                  data-proximity
                  onClick={() => setWindowMode('default')}
                >
                  <div className="te-thumb">
                    <div className="tw-row">
                      <div className="tw-block" />
                      <div className="tw-lines">
                        <div className="tw-line" style={{ width: '85%' }} />
                        <div className="tw-line" style={{ width: '60%' }} />
                      </div>
                    </div>
                    <div className="tw-row">
                      <div className="tw-block" />
                      <div className="tw-lines">
                        <div className="tw-line" style={{ width: '90%' }} />
                        <div className="tw-line" style={{ width: '50%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="te-mode-foot">
                    <span className="te-mode-name">Default</span>
                    <span className={`te-checkmark${windowMode === 'default' ? ' active' : ''}`}>
                      {windowMode === 'default' && <span className="material-icons">check</span>}
                    </span>
                  </div>
                </div>

                {/* Compact mode card */}
                <div
                  className={`te-mode${windowMode === 'compact' ? ' sel' : ''}`}
                  data-proximity
                  onClick={() => setWindowMode('compact')}
                >
                  <div className="te-thumb te-thumb-compact">
                    <div className="tw-line" style={{ width: '100%' }} />
                    <div className="tw-line" style={{ width: '75%' }} />
                    <div className="tw-line" style={{ width: '95%' }} />
                    <div className="tw-line" style={{ width: '60%' }} />
                    <div className="tw-line" style={{ width: '85%' }} />
                    <div className="tw-line" style={{ width: '70%' }} />
                  </div>
                  <div className="te-mode-foot">
                    <span className="te-mode-name">Compact</span>
                    <span className={`te-checkmark${windowMode === 'compact' ? ' active' : ''}`}>
                      {windowMode === 'compact' && <span className="material-icons">check</span>}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <div className="te-divider" />

            {/* Theme + Text size + Brightness */}
            <div className="te-section">

              {/* Theme row */}
              <div className="te-row">
                <span className="te-label">Theme</span>
                <div className="te-swatches">
                  {SWATCHES.map((color, i) => (
                    <button
                      type="button"
                      key={color}
                      className={`te-sw${selectedSwatch === i ? ' sel' : ''}`}
                      data-proximity
                      style={{ '--c': color } as React.CSSProperties}
                      onClick={() => setSelectedSwatch(i)}
                      aria-label={`Select theme color ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Text size row */}
              <div className="te-row">
                <span className="te-label">Text size</span>
                <div className="te-size-row">
                  <span className="te-a-sm">A</span>
                  <input
                    type="range"
                    className="te-range"
                    value={textSize}
                    min={0}
                    max={100}
                    style={{ background: rangeGradient(textSize) }}
                    onChange={(e) => setTextSize(Number(e.target.value))}
                    aria-label="Text size"
                  />
                  <span className="te-a-lg">A</span>
                </div>
              </div>

              {/* Brightness row */}
              <div className="te-row">
                <span className="te-label">Brightness</span>
                <div className="te-bright-row">
                  <input
                    type="range"
                    className="te-range"
                    value={brightness}
                    min={0}
                    max={100}
                    style={{ width: 104, background: rangeGradient(brightness) }}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    aria-label="Brightness"
                  />
                  <span className="te-bright-pct">{brightness}%</span>
                </div>
              </div>

            </div>

            <div className="te-divider" />

            {/* Hotkey + Startup */}
            <div className="te-section">

              {/* Hotkey row */}
              <div className="te-row">
                <span className="te-label">Hotkey</span>
                <div className="te-hotkey">⌘ Space</div>
              </div>

              {/* Startup toggle row */}
              <div className="te-row">
                <span className="te-label">Startup</span>
                <button
                  type="button"
                  className={`te-tog${startupOn ? ' on' : ''}`}
                  data-proximity
                  onClick={() => setStartupOn((v) => !v)}
                  aria-label="Toggle startup"
                  aria-pressed={startupOn}
                />
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
