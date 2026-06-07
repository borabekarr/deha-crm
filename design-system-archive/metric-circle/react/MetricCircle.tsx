import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './MetricCircle.css'

// ---------------------------------------------------------------------------
// MetricCircle — circular progress metric (glowing capsule donut)
// Purely presentational: SVG ring verbatim from prototype, no useEffect.
// ---------------------------------------------------------------------------

// Circumference = 2π × 40 = 251.327
const C = 251.327

function calcOffset(pct: number): string {
  return (C * (1 - pct)).toFixed(2)
}

export default function MetricCircle() {
  return (
    <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
      <div className="frame">

        {/* Pill 1 — emerald, percentage format, 67% */}
        <div className="shell pill-shell">
          <div
            className="metric-circle anim"
            style={
              {
                '--c0': '#0FB57C',
                '--c1': '#3DF0A6',
                '--glow': '#10E08F',
              } as React.CSSProperties
            }
            data-preset="emerald"
            data-format="pct"
            data-value="67"
            data-pct="0.67"
          >
            <div className="ring-wrap">
              <span className="halo"></span>
              <svg className="ring" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <linearGradient id="grad-a" x1="0" y1="1" x2="1" y2="0">
                    <stop className="s0" offset="0%" />
                    <stop className="s1" offset="100%" />
                  </linearGradient>
                </defs>
                <circle className="track" cx="50" cy="50" r="40" />
                <circle
                  className="prog"
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#grad-a)"
                  strokeDashoffset={calcOffset(0.67)}
                />
              </svg>
            </div>
            <div className="text-block">
              <div className="num">
                <span className="num-val">67</span>
                <span className="suf">%</span>
              </div>
              <div className="mc-label">Sales by Day</div>
            </div>
          </div>
        </div>

        {/* Pill 2 — fuchsia, dollar format, $234 @ 58% */}
        <div className="shell pill-shell">
          <div
            className="metric-circle anim"
            style={
              {
                '--c0': '#C026D3',
                '--c1': '#FB7AD2',
                '--glow': '#E83BC4',
              } as React.CSSProperties
            }
            data-preset="fuchsia"
            data-format="dollar"
            data-value="234"
            data-pct="0.58"
          >
            <div className="ring-wrap">
              <span className="halo"></span>
              <svg className="ring" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <linearGradient id="grad-b" x1="0" y1="1" x2="1" y2="0">
                    <stop className="s0" offset="0%" />
                    <stop className="s1" offset="100%" />
                  </linearGradient>
                </defs>
                <circle className="track" cx="50" cy="50" r="40" />
                <circle
                  className="prog"
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#grad-b)"
                  strokeDashoffset={calcOffset(0.58)}
                />
              </svg>
            </div>
            <div className="text-block">
              <div className="num">
                <span className="cur">$</span>
                <span className="num-val">234</span>
              </div>
              <div className="mc-label">Sales by Day</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
