import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './IndexBar.css'

import { useCallback, useRef } from 'react'
import { iconClass } from '../../../lib/iconClass'
import {
  METRICS,
  STAGES,
  N_BARS,
  ACTIVE_BAR,
  lerpColor,
  fmtVal,
  tweenValue,
  drawSpark,
  playBars,
} from './index-bar-hook'

// ── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  index: number
  onPlay: (cb: () => void) => void
}

function MetricCard({ index, onPlay }: MetricCardProps) {
  const m = METRICS[index]
  const valRef = useRef<HTMLSpanElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Register play callback via callback ref on mount
  const rootRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return
      onPlay(() => {
        if (cleanupRef.current) cleanupRef.current()
        const valEl = valRef.current
        const pathEl = pathRef.current
        if (valEl) cleanupRef.current = tweenValue(valEl, m)
        if (pathEl) drawSpark(pathEl, m)
      })
    },
    [m, onPlay],
  )

  return (
    <div className="idx-m" ref={rootRef}>
      <div className="idx-m-title">
        <span className="material-symbols-outlined idx-m-ico">{m.icon}</span>
        {m.title}
      </div>
      <span className="idx-m-val" ref={valRef}>
        {fmtVal(m, 0)}
      </span>
      <span className={`idx-badge ${m.dir}`}>
        <span className="material-icons">
          {m.dir === 'up' ? 'trending_up' : 'trending_down'}
        </span>
        {m.dir === 'up' ? '+' : '−'}
        {m.delta}
      </span>
      <div className="idx-spark">
        <svg viewBox="0 0 180 62" preserveAspectRatio="none">
          <path className={`idx-spark-line ${m.trend}`} ref={pathRef} />
        </svg>
      </div>
    </div>
  )
}

// ── IndexBar ─────────────────────────────────────────────────────────────────

export default function IndexBar() {
  // Collect per-metric play callbacks
  const metricPlayers = useRef<Array<() => void>>([])

  const registerPlayer = useCallback((idx: number) => (cb: () => void) => {
    metricPlayers.current[idx] = cb
  }, [])

  // Callback ref for bars wrapper — plays entrance on first mount
  const barsRef = useRef<HTMLDivElement>(null)
  const hasPlayed = useRef(false)

  const barsCallbackRef = useCallback((el: HTMLDivElement | null) => {
    ;(barsRef as React.MutableRefObject<HTMLDivElement | null>).current = el
    if (el && !hasPlayed.current) {
      hasPlayed.current = true
      requestAnimationFrame(() => play())
    }
  }, [])  

  function play() {
    // play metrics with stagger
    METRICS.forEach((_, i) => {
      setTimeout(() => {
        metricPlayers.current[i]?.()
      }, 120 + i * 110)
    })
    // play bars
    if (barsRef.current) {
      playBars(barsRef.current, barsRef.current)
    }
  }

  // Build bar elements (static array, derived from constants)
  const bars = Array.from({ length: N_BARS }, (_, i) => {
    const isActive = i === ACTIVE_BAR
    const bg = isActive ? '#10B981' : lerpColor(i / (N_BARS - 1))
    const gridImage = isActive
      ? 'linear-gradient(rgba(255,255,255,0.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.18) 1px,transparent 1px)'
      : undefined
    return (
      <div
        key={i}
        className={`idx-bar${isActive ? ' active' : ''}`}
        style={{
          background: bg,
          backgroundImage: gridImage,
          backgroundSize: gridImage ? '7px 7px' : undefined,
        }}
      />
    )
  })

  return (
    <>
      <p className="sec">Pipeline Index Bar — dashboard overview</p>
      <p className="sec-sub">
        Three live pipeline metrics over a color-graded stage index. The bars draw in, numbers count up, and the current stage glows.
      </p>

      <div className="idx-outer">
        <div className="idx zoom">
            {/* WHITE SURFACE */}
            <div className="idx-card">
              <div className="idx-metrics">
                {METRICS.map((m, i) => (
                  <MetricCard key={m.title} index={i} onPlay={registerPlayer(i)} />
                ))}
              </div>

              <div className="idx-funnel">
                <div className="idx-funnel-head">
                  <span className="idx-funnel-title">Pipeline Stage Funnel</span>
                  <span className="idx-funnel-stage">
                    Current · <b>Moderate Priority</b>
                  </span>
                </div>
                <div className="idx-bars-wrap">
                  <div className="idx-bars" ref={barsCallbackRef}>
                    {bars}
                  </div>
                </div>
                <div className="idx-ticks">
                  {STAGES.map((s) => (
                    <div
                      key={s.name}
                      className={`idx-tick${s.name === 'Moderate' ? ' on' : ''}`}
                    >
                      <span className="idx-tick-label">{s.name}</span>
                      <span className={`idx-tick-icon ${iconClass(s.icon)}`}>{s.icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DRAWER FOOTER */}
            <div className="idx-drawer">
              <span className="idx-foot-txt">
                Pipeline is <b>projected to increase</b>.
              </span>
            </div>
        </div>
      </div>

      <div className="replay">
        <button type="button" onClick={play}>
          <span className="material-symbols-outlined">replay</span>
          Replay
        </button>
      </div>
    </>
  )
}
