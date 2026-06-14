import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Chart.css'

import { useState, useRef, useCallback } from 'react'
import {
  DS,
  mountChart,
  buildLinePath,
  buildAreaPath,
  xOf,
  yOf,
} from './chart-hook'

// ---------------------------------------------------------------------------
// Chart -- Line/area chart, dual-series, tooltip, axis labels, footer stats
// Faithful port of components-chart.html. No raw useEffect.
// ---------------------------------------------------------------------------

const SEG_LABELS: Record<'D' | 'W' | 'M', string> = {
  D: 'Daily',
  W: 'Weekly',
  M: 'Monthly',
}

interface ChartUpdate {
  linePath?: string
  areaPath?: string
  prevPath?: string
  peakLeft?: string
  peakTop?: string
  guideLeft?: string
  guideOpacity?: string
  tipLeft?: string
  tipTop?: string
  tipOpacity?: string
  tipLabel?: string
  tipVal?: string
  numVal?: number
  delta?: number
  period?: string
  peakVal?: string
  avg?: number
  conv?: number
}

// Derive initial state from DS.D
const INIT_KEY = 'D'
const INIT_D = DS[INIT_KEY]
const INIT_N = INIT_D.cur.length

export default function Chart() {
  // ── path state ──────────────────────────────────────────────────────────
  const [linePath, setLinePath]     = useState(() => buildLinePath(INIT_D.cur))
  const [areaPath, setAreaPath]     = useState(() => buildAreaPath(INIT_D.cur))
  const [prevPath, setPrevPath]     = useState(() => buildLinePath(INIT_D.prev))

  // ── peak dot (the always-visible green dot that flows along the line) ───
  const [peakLeft, setPeakLeft]     = useState(`${xOf(INIT_N - 1, INIT_N)}%`)
  const [peakTop,  setPeakTop]      = useState(`${(yOf(INIT_D.cur[INIT_N - 1]) / 90) * 100}%`)

  // ── hover state ─────────────────────────────────────────────────────────
  const [guideLeft,    setGuideLeft]    = useState('50%')
  const [guideOpacity, setGuideOpacity] = useState('0')
  const [tipLeft,      setTipLeft]      = useState('50%')
  const [tipTop,       setTipTop]       = useState('0%')
  const [tipOpacity,   setTipOpacity]   = useState('0')
  const [tipLabel,     setTipLabel]     = useState(INIT_D.labels[INIT_N - 1])
  const [tipVal,       setTipVal]       = useState(String(INIT_D.cur[INIT_N - 1]))

  // ── headline state ───────────────────────────────────────────────────────
  const [numVal,   setNumVal]   = useState(INIT_D.num)
  const [delta,    setDelta]    = useState(INIT_D.delta)
  const [period,   setPeriod]   = useState(INIT_D.period)
  const [peakVal,  setPeakVal]  = useState(`${INIT_D.peakWord} · ${INIT_D.cur[INIT_D.peakI]}`)
  const [avg,      setAvg]      = useState(INIT_D.avg)
  const [conv,     setConv]     = useState(INIT_D.conv)

  // ── segmented control state ──────────────────────────────────────────────
  const [activeKey, setActiveKey] = useState<'D' | 'W' | 'M'>(INIT_KEY)

  // ── seg-pill positioning (mirrors _controls.js move()) ───────────────────
  function positionPill(segEl: HTMLDivElement): void {
    const pill = segEl.querySelector<HTMLSpanElement>('.seg-pill')
    const active = segEl.querySelector<HTMLButtonElement>('button.active')
    if (!pill || !active) return
    pill.style.left  = `${active.offsetLeft}px`
    pill.style.width = `${active.offsetWidth}px`
  }

  // ── refs ─────────────────────────────────────────────────────────────────
  const lineRef   = useRef<SVGPathElement | null>(null)
  const cleanupFn = useRef<(() => void) | null>(null)
  const apiRef    = useRef<ReturnType<typeof mountChart> | null>(null)
  const segRef    = useRef<HTMLDivElement | null>(null)

  // update dispatcher — keeps the hook's RAF loops from touching React directly
  const handleUpdate = useCallback((patch: ChartUpdate) => {
    if (patch.linePath    !== undefined) setLinePath(patch.linePath)
    if (patch.areaPath    !== undefined) setAreaPath(patch.areaPath)
    if (patch.prevPath    !== undefined) setPrevPath(patch.prevPath)
    if (patch.peakLeft    !== undefined) setPeakLeft(patch.peakLeft)
    if (patch.peakTop     !== undefined) setPeakTop(patch.peakTop)
    if (patch.guideLeft   !== undefined) setGuideLeft(patch.guideLeft)
    if (patch.guideOpacity !== undefined) setGuideOpacity(patch.guideOpacity)
    if (patch.tipLeft     !== undefined) setTipLeft(patch.tipLeft)
    if (patch.tipTop      !== undefined) setTipTop(patch.tipTop)
    if (patch.tipOpacity  !== undefined) setTipOpacity(patch.tipOpacity)
    if (patch.tipLabel    !== undefined) setTipLabel(patch.tipLabel)
    if (patch.tipVal      !== undefined) setTipVal(patch.tipVal)
    if (patch.numVal      !== undefined) setNumVal(patch.numVal)
    if (patch.delta       !== undefined) setDelta(patch.delta)
    if (patch.period      !== undefined) setPeriod(patch.period)
    if (patch.peakVal     !== undefined) setPeakVal(patch.peakVal)
    if (patch.avg         !== undefined) setAvg(patch.avg)
    if (patch.conv        !== undefined) setConv(patch.conv)
  }, [])

  // ── callback ref: wire the animation engine when the path element mounts ─
  const lineCallbackRef = useCallback((el: SVGPathElement | null) => {
    if (el) {
      lineRef.current = el
      const cleanup = mountChart(el, handleUpdate)
      cleanupFn.current = cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiRef.current = (el as any).__chartApi ?? null
      return cleanup
    } else {
      cleanupFn.current?.()
      cleanupFn.current = null
      lineRef.current = null
    }
  }, [handleUpdate])

  // callback ref: position pill without transition on first mount, then enable
  const segCallbackRef = useCallback((el: HTMLDivElement | null) => {
    segRef.current = el
    if (!el) return
    const pill = el.querySelector<HTMLSpanElement>('.seg-pill')
    if (pill) {
      // suppress transition on initial placement (mirrors _controls.js)
      pill.style.transition = 'none'
      positionPill(el)
      // re-enable transition after one frame
      requestAnimationFrame(() => { pill.style.transition = '' })
    }
    // listen for resize so pill stays positioned
    const onResize = () => { positionPill(el) }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize) }
  }, [])

  // ── segmented control ────────────────────────────────────────────────────
  function handleSegClick(key: 'D' | 'W' | 'M'): void {
    if (key === activeKey) return
    setActiveKey(key)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = lineRef.current as any
    if (el?.__chartApi) {
      el.__chartApi.morphTo(key, numVal)
    }
    // reposition pill after React updates the DOM (next microtask)
    if (segRef.current) {
      const segEl = segRef.current
      setTimeout(() => { positionPill(segEl) }, 0)
    }
  }

  // ── pointer events on canvas-wrap ────────────────────────────────────────
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    const d = DS[activeKey]
    const n = d.cur.length
    const r = e.currentTarget.getBoundingClientRect()
    const fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))

    // Nearest data point index -- used only for label/value text
    const i = Math.max(0, Math.min(n - 1, Math.round(fx * (n - 1))))

    // Continuous SVG-space X: line spans [PAD, 100-PAD] = [6, 94]
    const PAD = 6
    const lx = Math.max(PAD, Math.min(100 - PAD, PAD + fx * (100 - 2 * PAD)))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = lineRef.current as any
    // Drive dot continuously along the actual sampled line (Y from pointAtX)
    el?.__chartApi?.setDotImmediate(lx)

    // Tooltip Y: yOf returns 0..90 SVG units; divide by 90 to get CSS %.
    // This matches the formula used in setDotAt (p.y/90*100) so tooltip
    // tracks the same coordinate space as the dot.
    const tp = (yOf(d.cur[i]) / 90) * 100

    setGuideLeft(`${lx}%`)
    setGuideOpacity('1')
    setTipLeft(`${lx}%`)
    setTipTop(`${tp}%`)
    setTipOpacity('1')
    setTipLabel(d.labels[i])
    setTipVal(String(d.cur[i]))
  }

  function handlePointerLeave(): void {
    const n = DS[activeKey].cur.length
    setGuideOpacity('0')
    setTipOpacity('0')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = lineRef.current as any
    el?.__chartApi?.moveDotTo(xOf(n - 1, n))
  }

  // ── x-axis labels ─────────────────────────────────────────────────────────
  const d = DS[activeKey]
  const xLabels = d.labels.map((lbl, i) => (
    <span
      key={lbl}
      className={`x-lbl${i === d.peakI ? ' peak' : ''}`}
      style={{ left: `${xOf(i, d.labels.length).toFixed(2)}%` }}
    >
      {lbl}
    </span>
  ))

  return (
    <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
      <div className="frame">
        <div className="shell">
          <div className="chart">

            {/* Header -- mirrors .exp-top/.exp-crumb from MetricCard */}
            <div className="ch-head">
              <div className="ch-crumb">
                <span className="material-icons ch-crumb-icon">show_chart</span>
                Queries <span className="ch-crumb-sep">/</span>{' '}
                <strong>Appointments</strong>
              </div>

              {/* Number row: left col (number stacked above delta+period) + seg pinned right */}
              <div className="ch-num-row">
                <div className="ch-num-col">
                  <div className="ch-num">{numVal.toLocaleString('en-US')}</div>
                  <div className="ch-stat-row">
                    <span className="ch-delta">
                      <span className="material-icons">trending_up</span>+{delta}%
                    </span>
                    <span className="ch-period">{period}</span>
                  </div>
                </div>

                {/* Segmented control -- pinned right via margin-left: auto on .ch-seg */}
                <div className="seg compact ch-seg" ref={segCallbackRef}>
                  <span className="seg-pill" />
                  {(['D', 'W', 'M'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      data-k={k}
                      className={activeKey === k ? 'active' : ''}
                      onClick={() => { handleSegClick(k) }}
                    >
                      {SEG_LABELS[k]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="ch-legend">
              <span className="leg">
                <span className="leg-dot" style={{ background: '#10B981' }} />
                Current
              </span>
              <span className="leg">
                <span className="leg-line" />
                Previous
              </span>
            </div>

            {/* Chart area */}
            <div className="chart-area">
              <div className="y-axis">
                <span>60</span>
                <span>30</span>
                <span>0</span>
              </div>

              <div
                className="canvas-wrap"
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
              >
                <svg viewBox="0 0 100 90" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* value 60 -> yOf(60)=0, nudged to 2 so stroke is visible */}
                  <line x1="0" x2="100" y1="2" y2="2" stroke="#E2E8F0" strokeWidth="0.4" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                  {/* value 30 -> yOf(30)=45 */}
                  <line x1="0" x2="100" y1="45" y2="45" stroke="#E2E8F0" strokeWidth="0.4" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                  <line x1="0" x2="100" y1="90" y2="90" stroke="#E2E8F0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

                  <path d={prevPath} fill="none" stroke="#94A3B8" strokeWidth="1.4" strokeDasharray="3 3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <path d={areaPath} fill="url(#areaGrad)" />
                  <path
                    ref={lineCallbackRef}
                    d={linePath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* Vertical hover guide */}
                <div
                  className="ch-guide"
                  style={{ left: guideLeft, opacity: guideOpacity }}
                />

                {/* Peak dot — always-visible, flows along line */}
                <div
                  className="peak-dot"
                  style={{ left: peakLeft, top: peakTop }}
                />

                {/* Tooltip */}
                <div
                  className="ch-tooltip"
                  style={{ left: tipLeft, top: tipTop, opacity: tipOpacity }}
                >
                  <span>{tipLabel}</span>
                  {' · '}
                  <span className="val">{tipVal}</span>
                </div>
              </div>
            </div>

            {/* X-axis */}
            <div className="x-axis" style={{ marginLeft: 32 }}>
              {xLabels}
            </div>

            {/* Footer stats */}
            <div className="ch-footer">
              <div className="f-cell">
                <span className="f-label">
                  <span className="f-icon gold">
                    <span className="material-icons">emoji_events</span>
                  </span>
                  Peak day
                </span>
                <span className="f-val">{peakVal}</span>
              </div>
              <div className="f-cell">
                <span className="f-label">
                  <span className="f-icon slate">
                    <span className="material-icons">show_chart</span>
                  </span>
                  Daily avg
                </span>
                <span className="f-val">{avg}</span>
              </div>
              <div className="f-cell">
                <span className="f-label">
                  <span className="f-icon emerald">
                    <span className="material-icons">trending_up</span>
                  </span>
                  Conversion
                </span>
                <span className="f-val green">{conv}%</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
