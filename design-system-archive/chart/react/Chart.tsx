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
  MAXV,
} from './chart-hook'

// ---------------------------------------------------------------------------
// Chart — Line/area chart, dual-series, tooltip, axis labels, footer stats
// Faithful port of components-chart.html. No raw useEffect.
// ---------------------------------------------------------------------------

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

  // ── refs ─────────────────────────────────────────────────────────────────
  const lineRef   = useRef<SVGPathElement | null>(null)
  const cleanupFn = useRef<(() => void) | null>(null)
  const apiRef    = useRef<ReturnType<typeof mountChart> | null>(null)

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

  // ── segmented control ────────────────────────────────────────────────────
  function handleSegClick(key: 'D' | 'W' | 'M'): void {
    if (key === activeKey) return
    setActiveKey(key)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = lineRef.current as any
    if (el?.__chartApi) {
      el.__chartApi.morphTo(key, numVal)
    }
  }

  // ── pointer events on canvas-wrap ────────────────────────────────────────
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    const d = DS[activeKey]
    const n = d.cur.length
    const r = e.currentTarget.getBoundingClientRect()
    const fx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    const i = Math.max(0, Math.min(n - 1, Math.round(fx * (n - 1))))
    const lx = xOf(i, n)
    const tp = (yOf(d.cur[i]) / MAXV) * 100   // percentage of SVG height → CSS %

    setGuideLeft(`${lx}%`)
    setGuideOpacity('1')
    setTipLeft(`${lx}%`)
    setTipTop(`${tp}%`)
    setTipOpacity('1')
    setTipLabel(d.labels[i])
    setTipVal(String(d.cur[i]))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el = lineRef.current as any
    el?.__chartApi?.moveDotTo(lx)
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

            {/* Header */}
            <div className="ch-head">
              <div>
                <div className="ch-eyebrow">
                  <span className="icon-chip">
                    <span className="material-icons">show_chart</span>
                  </span>
                  Queries and Appointments
                </div>
                <div className="ch-stat">
                  <div className="ch-num">{numVal.toLocaleString('en-US')}</div>
                  <div className="ch-stat-row">
                    <span className="ch-delta">
                      <span className="material-icons">trending_up</span>+{delta}%
                    </span>
                    <span className="ch-period">{period}</span>
                  </div>
                </div>
              </div>

              {/* Segmented control (compact) */}
              <div className="seg compact">
                <span className="seg-pill" />
                {(['D', 'W', 'M'] as const).map((k) => (
                  <button
                    key={k}
                    data-k={k}
                    className={activeKey === k ? 'active' : ''}
                    onClick={() => { handleSegClick(k) }}
                  >
                    {k}
                  </button>
                ))}
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

                  <line x1="0" x2="100" y1="20" y2="20" stroke="#E2E8F0" strokeWidth="0.4" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                  <line x1="0" x2="100" y1="55" y2="55" stroke="#E2E8F0" strokeWidth="0.4" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
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

                {/* Hover dot — hidden; peak-dot serves both roles per prototype */}
                <div
                  className="ch-hover-dot"
                  style={{ opacity: '0' }}
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
