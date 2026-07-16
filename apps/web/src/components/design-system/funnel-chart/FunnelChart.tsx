import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './FunnelChart.css'

import { useState, useCallback } from 'react'
import { hSegmentPath, funnelFmtCompact } from './funnel-chart-hook'
import { iconClass } from '../../../lib/iconClass'
import { useSquircle } from '../../../lib/hooks/use-squircle'

/* =========================================================================
   Deha Design System — Funnel Chart
   Horizontal funnel visualization. SVG trapezoid segments via hSegmentPath,
   emerald multi-layer halo rings, staggered entrance (pure CSS animation-delay
   on --i), hover lifts a segment's ring (scaleY) and dims siblings.
   No framer-motion. No useEffect. No useLayoutEffect.
   ========================================================================= */

/* ── Demo data ────────────────────────────────────────────────────────────── */
const DEMO_STAGES: FunnelStage[] = [
  { label: 'New Leads',   value: 4820, color: '#3B82F6' },
  { label: 'Qualified',   value: 2640, color: '#F97316' },
  { label: 'Proposal',    value: 1180, color: '#EF4444' },
  { label: 'Negotiation', value: 540,  color: '#8B5CF6' },
  { label: 'Won',         value: 286,  color: 'var(--brand-primary-500)' },
]

/* ── Types ────────────────────────────────────────────────────────────────── */
export interface FunnelStage {
  label: string
  value: number
  /** Per-segment colour override; falls back to component-level `color` prop. */
  color?: string
  /** Pre-formatted display value; defaults to `formatValue(value)`. */
  displayValue?: string
}

export interface FunnelChartProps {
  /** Funnel stage data, ordered largest → smallest. */
  stages?: FunnelStage[]
  /** Default fill colour for segments that do not supply their own `color`. */
  color?: string
  /** Number of stacked halo ring layers per segment. */
  layers?: number
  /** Gap in pixels between segments. */
  gap?: number
  /** 'curved' (default) or 'straight' trapezoid edges. */
  edges?: 'curved' | 'straight'
  /** Chart area height in pixels. */
  height?: number
  /** Show stage-to-stage conversion percentage badges. */
  showPercentage?: boolean
  /** Show count values below each segment. */
  showValues?: boolean
  /** Show stage name labels above each segment. */
  showLabels?: boolean
  /** Format raw numeric value for display. */
  formatValue?: (v: number) => string
  /** Format percentage number for badge label. */
  formatPercentage?: (p: number) => string
  /** Externally controlled hovered segment index (undefined = uncontrolled). */
  hoveredIndex?: number | null
  /** Called when hover changes in uncontrolled mode. */
  onHoverChange?: (i: number | null) => void
  /** Show summary footer strip. */
  showFooter?: boolean
  /** Eyebrow title displayed in the card header. */
  title?: string
  /** Delta badge text, e.g. '+17%'. Empty string hides the badge. */
  delta?: string
  /** Period label next to the delta badge. */
  period?: string
}

/* ── Segment sub-component ────────────────────────────────────────────────── */
interface SegmentProps {
  index: number
  normStart: number
  normEnd: number
  segW: number
  H: number
  color: string
  layers: number
  straight: boolean
  hovered: boolean
  dimmed: boolean
}

function Segment({
  index,
  normStart,
  normEnd,
  segW,
  H,
  color,
  layers,
  straight,
  hovered,
  dimmed,
}: SegmentProps) {
  const gridId = `fc-grid-${index}`

  const rings = Array.from({ length: layers }, (_, l) => {
    // Outer (l=0, full-size) ring is fully opaque so the trapezoid edge stays
    // crisp — no feathered halo. Inner rings (same hue) only carry the grid.
    const scale = 1 - (l / layers) * 0.12
    const opacity = 1
    return {
      layerIdx: l,
      d: hSegmentPath(normStart, normEnd, segW, H, scale, straight),
      opacity,
    }
  })

  return (
    <div
      className="fc-seg"
      style={{
        width: segW,
        height: H,
        opacity: dimmed ? 0.4 : 1,
        zIndex: hovered ? 10 : 1,
      }}
    >
      {/* CSS stagger: --i drives animation-delay via calc() in .fc-seg-enter */}
      <div
        className="fc-seg-enter"
        style={{ '--i': index } as React.CSSProperties}
      >
        <svg
          aria-hidden="true"
          preserveAspectRatio="none"
          viewBox={`0 0 ${segW} ${H}`}
        >
          <defs>
            <pattern
              id={gridId}
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M7 0H0V7"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {rings.map((r) => {
            const l = r.layerIdx
            const isInner = l === rings.length - 1
            const extraScale = 1 + (l / Math.max(layers - 1, 1)) * 0.12
            const tf = `scaleY(${hovered ? extraScale : 1})`
            return (
              <g key={`ring-layer-${l}`}>
                <path
                  className="fc-ring"
                  d={r.d}
                  fill={color}
                  opacity={r.opacity}
                  style={{ transform: tf }}
                />
                {isInner && (
                  <path
                    className="fc-ring fc-ring-tex"
                    d={r.d}
                    fill={`url(#${gridId})`}
                    style={{ transform: tf }}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/* ── Footer helpers ───────────────────────────────────────────────────────── */
function deriveMeta(stages: FunnelStage[]): {
  top: number
  winRate: number
  leakLabel: string
  leakPct: number
} {
  const first = stages[0]?.value ?? 1
  const last = stages[stages.length - 1]?.value ?? 0
  let dropIdx = 1
  let dropMax = -1
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1]?.value ?? 1
    const curr = stages[i]?.value ?? 0
    const d = 1 - curr / prev
    if (d > dropMax) {
      dropMax = d
      dropIdx = i
    }
  }
  return {
    top: first,
    winRate: (last / first) * 100,
    leakLabel: stages[dropIdx]?.label ?? '',
    leakPct: Math.round(dropMax * 100),
  }
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function FunnelChart({
  stages = DEMO_STAGES,
  color = 'var(--brand-primary-500)',
  layers = 3,
  gap = 6,
  edges = 'curved',
  height = 196,
  showPercentage = true,
  showValues = true,
  showLabels = true,
  formatValue = funnelFmtCompact,
  formatPercentage = (p) => `${Math.round(p)}%`,
  hoveredIndex: hoveredProp,
  onHoverChange,
  showFooter = true,
  title = 'Sales Funnel',
  delta = '+17%',
  period = 'leads this month',
}: FunnelChartProps) {
  /* Measure container width via a callback ref — no useEffect */
  const [w, setW] = useState(0)
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setW(entry.contentRect.width)
    })
    ro.observe(el)
    setW(el.getBoundingClientRect().width)
    // Store disconnector on the element so the cleanup return can reach it
    ;(el as HTMLDivElement & { __fcRo?: ResizeObserver }).__fcRo = ro
    return () => ro.disconnect()
  }, [])

  /* Hover state — controlled or uncontrolled */
  const controlled = hoveredProp !== undefined
  const [internalHover, setInternalHover] = useState<number | null>(null)
  const hoveredIndex = controlled ? hoveredProp : internalHover

  const setHovered = useCallback(
    (i: number | null) => {
      if (controlled) {
        onHoverChange?.(i)
      } else {
        setInternalHover(i)
      }
    },
    [controlled, onHoverChange],
  )

  /* Geometry */
  const n = stages.length
  const max = stages[0]?.value ?? 1
  const norms = stages.map((s) => (max ? s.value / max : 0))
  const totalGap = gap * (n - 1)
  const segW = n > 0 ? (w - totalGap) / n : 0
  const straight = edges === 'straight'
  const meta = showFooter ? deriveMeta(stages) : null
  const topValue = stages[0]?.value ?? 0
  const cardSquircleRef = useSquircle<HTMLDivElement>()

  return (
    <div className="shell">
      <div className="fc-card" ref={cardSquircleRef}>
        {/* ── Header ── */}
        <div className="fc-head">
          <div>
            <div className="fc-eyebrow">
              <span className={`fc-icon-chip ${iconClass('filter_alt')}`} />
              {title}
            </div>
            <div className="fc-stat">
              <div className="fc-num">
                {Math.round(topValue).toLocaleString('en-US')}
              </div>
              {(delta || period) && (
                <div className="fc-stat-row">
                  {delta && (
                    <span className="fc-delta">
                      <span className={iconClass('trending_up')} />
                      {delta}
                    </span>
                  )}
                  {period && <span className="fc-period">{period}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Funnel viz ── */}
        <div
          className="fc-stage"
          ref={containerRef}
          style={{ height }}
        >
          {w > 0 && (
            <>
              {/* Halo-ring segments */}
              <div className="fc-segs" style={{ gap }}>
                {stages.map((stage, i) => {
                  const normStart = norms[i] ?? 0
                  const normEnd = norms[Math.min(i + 1, n - 1)] ?? 0
                  return (
                    <Segment
                      key={stage.label}
                      index={i}
                      normStart={normStart}
                      normEnd={normEnd}
                      segW={segW}
                      H={height}
                      color={stage.color ?? color}
                      layers={layers}
                      straight={straight}
                      hovered={hoveredIndex === i}
                      dimmed={hoveredIndex != null && hoveredIndex !== i}
                    />
                  )
                })}
              </div>

              {/* Label overlays — also the hover targets */}
              {stages.map((stage, i) => {
                const dimmed = hoveredIndex != null && hoveredIndex !== i
                const display =
                  stage.displayValue != null
                    ? stage.displayValue
                    : formatValue(stage.value)
                const stageColor = stage.color ?? color
                return (
                  <div
                    key={`lbl-${stage.label}`}
                    className="fc-cell"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      left: (segW + gap) * i,
                      width: segW,
                      '--i': i,
                    } as React.CSSProperties}
                  >
                    <div
                      className="fc-cell-inner"
                      style={{ opacity: dimmed ? 0.4 : 1 }}
                    >
                      <div className="fc-cell-top">
                        {showLabels && (
                          <span className="fc-stagelabel">
                            <span
                              className="fc-dot"
                              style={{ background: stageColor }}
                            />
                            {stage.label}
                          </span>
                        )}
                      </div>
                      <div className="fc-cell-mid" />
                      <div className="fc-cell-bot">
                        {showValues && (
                          <span className="fc-value" style={{ '--val-c': stageColor } as React.CSSProperties}>{display}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Stage-to-stage conversion badges */}
              {showPercentage &&
                stages.slice(0, n - 1).map((stage, i) => {
                  const next = stages[i + 1]
                  if (!next) return null
                  const conv = stage.value
                    ? (next.value / stage.value) * 100
                    : 0
                  const dimmed =
                    hoveredIndex != null &&
                    hoveredIndex !== i &&
                    hoveredIndex !== i + 1
                  const cx = (segW + gap) * i + segW + gap / 2
                  return (
                    <div
                      key={`conv-${stage.label}-${next.label}`}
                      className="fc-conv"
                      style={{ left: cx, '--i': i } as React.CSSProperties}
                    >
                      <div
                        className="fc-conv-dim"
                        style={{ opacity: dimmed ? 0.3 : 1 }}
                      >
                        <span
                          className="fc-conv-pill"
                          title={`${formatPercentage(conv)} of ${stage.label} → ${next.label}`}
                          style={{ '--conv-next': next.color ?? color } as React.CSSProperties}
                        >
                          <span className="fc-conv-arrow">{'→'}</span>
                          {formatPercentage(conv)}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </>
          )}
        </div>

        {/* ── Footer strip ── */}
        {showFooter && meta && (
          <div className="fc-footer">
            <div className="fc-f-cell">
              <span className="fc-f-label">
                <span className={`fc-f-icon fc-f-icon--slate ${iconClass('groups')}`} />
                Top of funnel
              </span>
              <span className="fc-f-val">{funnelFmtCompact(meta.top)}</span>
            </div>
            <div className="fc-f-cell">
              <span className="fc-f-label">
                <span className={`fc-f-icon fc-f-icon--gold ${iconClass('emoji_events')}`} />
                Win rate
              </span>
              <span className="fc-f-val fc-f-val--green">
                {meta.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="fc-f-cell">
              <span className="fc-f-label">
                <span className={`fc-f-icon fc-f-icon--danger ${iconClass('trending_down')}`} />
                Biggest leak
              </span>
              <span className="fc-f-val">
                {meta.leakLabel}&nbsp;&minus;{meta.leakPct}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
