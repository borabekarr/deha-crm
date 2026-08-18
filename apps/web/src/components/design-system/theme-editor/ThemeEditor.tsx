import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './ThemeEditor.css'

import { useState } from 'react'
import { useProximityGroup } from '@/lib/hooks'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import type { PrimaryTheme } from '@/lib/primary-themes'

// ── Palette swatches (demo-only: mirrors colors-primary's data-primary set,
// applied to the te-preview subtree only, never document root) ──────────────
const PALETTE_SWATCHES: { theme: PrimaryTheme; css: string }[] = [
  { theme: 'emerald', css: 'var(--brand-primary-500)' },
  { theme: 'sunflower', css: 'var(--sunflower-4)' },
  { theme: 'bloodymary', css: 'var(--bloodymary-3)' },
  { theme: 'petalglow', css: 'var(--petalglow-4)' },
  { theme: 'sexyblue', css: 'var(--sexyblue-3)' },
  { theme: 'richgold', css: 'var(--richgold-3)' },
]

// ── Range background helper (mirrors updateRange / updateBrightness JS) ──────
function rangeGradient(value: number): string {
  return `linear-gradient(to right, var(--brand-primary-500) 0%, var(--brand-primary-500) ${value}%, var(--tk-empty,#ECECEC) ${value}%, var(--tk-empty,#ECECEC) 100%)`
}

export default function ThemeEditor() {
  // Preview-only theme selection (mirrors colors-primary's 5 alt palettes + emerald default)
  const [selectedTheme, setSelectedTheme] = useState<PrimaryTheme>('emerald')

  // Text size slider (initial value 55 from prototype) — scales the preview area only
  const [textSize, setTextSize] = useState(55)

  // Brightness slider (initial value 68 from prototype) — filters the preview area only
  const [brightness, setBrightness] = useState(68)

  // Motion toggle (on = normal speed). Off sets --anim-mult: 0 on the preview subtree only.
  const [motionOn, setMotionOn] = useState(true)
  const resetDefaults = () => {
    setTextSize(55)
    setBrightness(68)
    setMotionOn(true)
  }
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
              <div className="te-header">
                <span className="material-icons te-header-icon">palette</span>
                <span className="te-header-text">Theme Editor</span>
              </div>
            </div>

            <div className="te-divider" />

            {/* Theme + Text size + Brightness */}
            <div className="te-section">

              {/* Theme row (demo-only: mirrors colors-primary's palette picker, applies to the preview subtree below) */}
              <div className="te-row">
                <span className="te-label">Theme</span>
                <div className="te-swatches">
                  {PALETTE_SWATCHES.map(({ theme, css }) => (
                    <button
                      type="button"
                      key={theme}
                      className={`te-sw${selectedTheme === theme ? ' sel' : ''}`}
                      data-proximity
                      style={{ '--c': css } as React.CSSProperties}
                      onClick={() => setSelectedTheme(theme)}
                      aria-label={`Preview ${theme} theme`}
                      aria-pressed={selectedTheme === theme}
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

              {/* Live preview — demo-only scope: theme/text-size/brightness/motion
                  apply to this subtree only, never document root, no localStorage */}
              <div
                className="te-preview"
                data-primary={selectedTheme === 'emerald' ? undefined : selectedTheme}
                style={{
                  fontSize: 12 + (textSize / 100) * 10,
                  filter: `brightness(${(0.6 + (brightness / 100) * 0.8).toFixed(2)})`,
                  '--anim-mult': motionOn ? 1 : 0,
                } as React.CSSProperties}
              >
                <span className="te-preview-badge">Preview</span>
                <p className="te-preview-text">The quick brown fox jumps over the lazy dog.</p>
                <button type="button" className="te-preview-btn" data-proximity>
                  Sample action
                </button>
              </div>

            </div>

            <div className="te-divider" />

            {/* Motion */}
            <div className="te-section">

              {/* Motion toggle row — off sets --anim-mult: 0 on the preview subtree (speeds up the CRM) */}
              <div className="te-row">
                <span className="te-label">Motion</span>
                <button
                  type="button"
                  className={`te-tog${motionOn ? ' on' : ''}`}
                  data-proximity
                  onClick={() => setMotionOn((v) => !v)}
                  aria-label="Toggle preview motion"
                  aria-pressed={motionOn}
                />
              </div>

            </div>

            <div className="te-footer">
              <button type="button" className="te-reset" data-proximity onClick={resetDefaults}>
                Reset
              </button>
              <button type="button" className="te-save" data-proximity>
                <span className="material-icons" style={{ fontSize: 14 }}>save</span>
                Save
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
