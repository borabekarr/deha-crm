import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './PieChart.css'

// ---------------------------------------------------------------------------
// Pie Chart — Deha Design System
// A composable donut / pie chart with animated slices, hover interactions and
// a synced interactive legend. Faithful port of
// apps/web/design-system/claude-design/raw/pie-chart/PieChart.jsx —
// byte-preserved DOM/CSS/timings per CONVERSION-SOP.md. No motion
// tokenization in this pass (deferred to a later value-identical pass).
//
// Arc geometry uses d3-shape (the raw source loads window.d3 == d3-shape +
// d3-path from a CDN bundle; here it is the npm `d3-shape` package, same
// API surface: pie()/arc()/centroid()). The mount sweep, hover "pop-out",
// glow and fade are pure setTimeout / CSS, matching the source 1:1.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect, useMemo, type CSSProperties } from 'react'
import { pie as d3Pie, arc as d3Arc, type PieArcDatum } from 'd3-shape'
import { useSquircle } from '../../../lib/hooks/use-squircle'

/* Deha-native slice palette — brand emerald + the semantic accents. */
const DEHA_PALETTE = ['#10B981', '#3B82F6', '#EAB308', '#F97316', '#8B5CF6', '#EF4444']

/* number tween hook — eases `target` over `dur` ms, returns the live value */
function useTween(target: number, dur = 520) {
  const [val, setVal] = useState(target)
  const valRef = useRef(target)
  useEffect(() => {
    valRef.current = val
  }, [val])
  useEffect(() => {
    const from = valRef.current
    const start = Date.now()
    // setInterval (not recursive setTimeout) so the tick loop is a single
    // timer with one owner: the id below both starts and stops it.
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dur)
      const e = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setVal(from + (target - from) * e)
      if (t >= 1) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
     
  }, [target, dur])
  return val
}

function formatNumber(n: number) {
  return Math.round(n).toLocaleString('en-US')
}

export interface PieChartDatum {
  label: string
  value: number
  color?: string
}

export interface PieChartProps {
  data?: PieChartDatum[]
  title?: string
  size?: number
  innerRadius?: number
  padAngle?: number
  cornerRadius?: number
  hoverEffect?: 'translate' | 'grow' | 'none'
  hoverOffset?: number
  showGlow?: boolean
  showCenter?: boolean
  showLegend?: boolean
  prefix?: string
  suffix?: string
  defaultLabel?: string
}

const DEFAULT_DATA: PieChartDatum[] = [
  { label: 'Electronics', value: 4250 },
  { label: 'Clothing', value: 3120 },
  { label: 'Food', value: 2100 },
  { label: 'Home', value: 1580 },
  { label: 'Other', value: 1050 },
]

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function PieChart({
  data = DEFAULT_DATA,
  title = 'Sales by Category',
  size = 240,
  innerRadius = 64,
  padAngle = 0.022,
  cornerRadius = 6,
  hoverEffect = 'translate',
  hoverOffset = 12,
  showGlow = true,
  showCenter = true,
  showLegend = true,
  prefix = '',
  suffix = '',
  defaultLabel = 'Total',
}: PieChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [mount, setMount] = useState(0) // 0 → 1 global mount progress

  /* squircle corner treatment — same card-primitives canon as Cards.tsx's
     concentric-demo-outer/inner pair (36 outer / 28 inner). */
  const outerShellRef = useSquircle<HTMLDivElement>()
  const wrapRef = useSquircle<HTMLDivElement>()

  const colored = useMemo(
    () => data.map((d, i) => ({ ...d, color: d.color || DEHA_PALETTE[i % DEHA_PALETTE.length] })),
    [data],
  )
  const total = useMemo(() => colored.reduce((s, d) => s + d.value, 0), [colored])

  const center = size / 2
  const outerRadius = center - hoverOffset - 2 // padding so pop-out never clips

  /* d3 arcs (data order preserved) */
  const arcs = useMemo(() => {
    const gen = d3Pie<(typeof colored)[number]>()
      .value((d) => d.value)
      .startAngle(0)
      .endAngle(2 * Math.PI)
      .padAngle(padAngle)
      .sort(null)
    return gen(colored)
  }, [colored, padAngle])

  /* arc path generator */
  const arcGen = useMemo(() => {
    return d3Arc<PieArcDatum<(typeof colored)[number]> & { outerRadius: number; innerRadius?: number }>()
      .innerRadius(innerRadius)
      .cornerRadius(cornerRadius)
  }, [innerRadius, cornerRadius])

  /* mount sweep — staggered per slice, eased. setTimeout-driven (not rAF) so it
     reliably completes to a full donut even when the iframe is backgrounded and
     rAF is paused — matching the leaderboard's deliberate robustness pattern. */
  useEffect(() => {
    const DUR = 900
    const start = Date.now()
    // setInterval (not recursive setTimeout) so the tick loop is a single
    // timer with one owner: the id below both starts and stops it.
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / DUR)
      setMount(p)
      if (p >= 1) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [arcs.length])

  /* center value tween — hooks must run unconditionally, before any guard */
  const centerDatum = hovered != null ? colored[hovered] : null
  const displayValue = useTween(centerDatum ? centerDatum.value : total, 520)

  /* per-slice eased reveal (stagger) */
  const sliceProgress = (i: number) => {
    const delay = 0.08 + i * 0.1 // fraction of timeline
    const span = 0.55
    // mount stops ticking at exactly 1 (never overshoots), so slices whose
    // delay+span > 1 (the last slice at 5 items: 0.48+0.55 = 1.03) never
    // reach local=1 through the raw formula alone -- clamp explicitly once
    // mount settles so every slice always closes to its true endAngle.
    const local = mount >= 1 ? 1 : Math.max(0, Math.min(1, (mount - delay) / span))
    return easeOutCubic(local)
  }

  const displayLabel = centerDatum ? centerDatum.label : defaultLabel
  const displayColor = centerDatum ? centerDatum.color : 'var(--brand-primary)'
  const pct = total ? ((centerDatum ? centerDatum.value : total) / total) * 100 : 0

  return (
    // The raw source's .frame{display:flex;justify-content:center} +
    // .pc-shell{display:grid;place-items:stretch} chrome shrinks the
    // component to its own content width; this wrapper reproduces that
    // packaging-only layout need (not part of the byte-preserved .pc-*
    // rule set) so the block-level .pc-wrap doesn't stretch to the
    // preview route's full container width — same precedent as Shimmer's
    // centering wrapper.
    <div style={{ display: 'grid', placeItems: 'center' }}>
    <div
      className="pc-outer-shell"
      ref={outerShellRef}
      style={{ '--corner-radius': '36px' } as CSSProperties}
    >
    <div
      className="pc-wrap"
      ref={wrapRef}
      style={{ '--corner-radius': '28px' } as CSSProperties}
    >
      <div className="pc-head">
        <span className="pc-head-icon material-symbols-outlined" aria-hidden="true">pie_chart</span>
        <div className="pc-title">{title}</div>
      </div>

      <div className="pc-body">
        {/* ── donut ── */}
        <div className="pc-chart" style={{ width: size, height: size }}>
          <svg width={size} height={size} role="img" aria-label={title}>
            <g transform={`translate(${center},${center})`}>
              {arcs.map((a, i) => {
                const prog = sliceProgress(i)
                const sweptEnd = a.startAngle + (a.endAngle - a.startAngle) * prog
                const dPath = arcGen({ ...a, endAngle: sweptEnd, outerRadius })

                const isHovered = hovered === i
                const isFaded = hovered != null && hovered !== i

                // radial pop-out direction via centroid
                const [cx, cy] = arcGen.centroid({ ...a, outerRadius })
                const mag = Math.hypot(cx, cy) || 1
                const tx = hoverEffect === 'translate' && isHovered ? (cx / mag) * hoverOffset : 0
                const ty = hoverEffect === 'translate' && isHovered ? (cy / mag) * hoverOffset : 0

                // grow effect: re-render at larger outer radius
                const grownOuter = hoverEffect === 'grow' && isHovered ? outerRadius + hoverOffset : outerRadius
                const visPath =
                  hoverEffect === 'grow'
                    ? arcGen({ ...a, endAngle: sweptEnd, outerRadius: grownOuter })
                    : dPath

                return (
                  <g
                    key={a.data.label}
                    className="pc-slice-g"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* hitbox (stationary, base radius, full sector for a stable target) */}
                    <path d={arcGen({ ...a, innerRadius: 0, outerRadius }) ?? undefined} fill="transparent" />
                    {/* visible slice */}
                    <path
                      className="pc-slice"
                      d={visPath ?? undefined}
                      fill={a.data.color}
                      style={
                        {
                          opacity: isFaded ? 0.4 : 1,
                          transform: `translate(${tx}px, ${ty}px)`,
                          filter: showGlow && isHovered ? `drop-shadow(0 0 12px ${a.data.color})` : 'none',
                        } as CSSProperties
                      }
                    />
                  </g>
                )
              })}
            </g>
          </svg>

          {/* ── donut center ── */}
          {showCenter && innerRadius > 0 && (
            <div className="pc-center" style={{ width: innerRadius * 2 - 14, height: innerRadius * 2 - 14 }}>
              <div className="pc-center-val">
                {prefix}
                {formatNumber(displayValue)}
                {suffix}
              </div>
              <div className="pc-center-label" style={{ color: centerDatum ? displayColor : 'var(--fg4)' }}>
                {centerDatum && <span className="pc-center-dot" style={{ background: displayColor }}></span>}
                {displayLabel}
              </div>
              <div className="pc-center-pct">{pct.toFixed(1)}%</div>
            </div>
          )}
        </div>

        {/* ── legend ── */}
        {showLegend && (
          <ul className="pc-legend">
            {colored.map((d, i) => {
              const isHovered = hovered === i
              const isFaded = hovered != null && hovered !== i
              const share = total ? (d.value / total) * 100 : 0
              return (
                <li
                  key={d.label}
                  className={'pc-leg-row' + (isHovered ? ' is-hovered' : '') + (isFaded ? ' is-faded' : '')}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className="pc-leg-swatch" style={{ background: d.color }}></span>
                  <span className="pc-leg-label" title={d.label}>{d.label}</span>
                  <span className="pc-leg-sep" aria-hidden="true"></span>
                  <span className="pc-leg-val">{formatNumber(d.value)}</span>
                  <span className="pc-leg-sep" aria-hidden="true"></span>
                  <span className="pc-leg-pct">{share.toFixed(1)}%</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
    </div>
    </div>
  )
}

export default PieChart
