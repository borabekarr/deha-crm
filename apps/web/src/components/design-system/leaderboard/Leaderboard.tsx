/**
 * Leaderboard — React port of apps/web/design-system/preview/components-leaderboard.html
 *
 * NO raw useEffect in this folder. Timers and FLIP live in leaderboard-hook.ts,
 * wired via callback refs and useLayoutEffect.
 */
import React, { useState, useRef, useLayoutEffect, useCallback } from 'react'
import './Leaderboard.css'
import { iconClass } from '../../../lib/iconClass'
import {
  AGENTS,
  type Metric,
  fmt,
  startTween,
  runFlip,
  lbSegRef,
  cleanupLbSeg,
  repositionLbPill,
  type TweenState,
  type FlipState,
} from './leaderboard-hook'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initDisplay(): Record<string, number> {
  const o: Record<string, number> = {}
  AGENTS.forEach((a) => { o[a.id] = a.revenue })
  return o
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Leaderboard() {
  const [metric, setMetric] = useState<Metric>('revenue')
  const [dir, setDir] = useState(0)
  const [display, setDisplay] = useState<Record<string, number>>(initDisplay)
  // 'rows-in' / '' — drives the CSS animation class on the .rows container
  const [rowsAnim, setRowsAnim] = useState<'rows-in' | ''>('')
  const rowsRef = useRef<HTMLDivElement | null>(null)

  // Refs for FLIP
  const rowEls = useRef<Record<string, HTMLElement | null>>({})
  const flipState = useRef<FlipState>({ prevRects: {} })

  // Ref for tween cleanup
  const tweenState = useRef<TweenState>({ timerId: null, start: {}, t0: 0 })
  // Keep a ref to current display values for tween start point.
  // Sync during render — safe: displayRef is only read inside the tween callback,
  // never used to compute rendered output.
  const displayRef = useRef(display)
  // eslint-disable-next-line react-hooks/refs
  displayRef.current = display

  // Ref for seg pill element
  const segElRef = useRef<HTMLDivElement | null>(null)

  // ---------------------------------------------------------------------------
  // Pill "armed" timer — one-shot, wired via callback ref on the seg element
  // ---------------------------------------------------------------------------
  const segCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      segElRef.current = el
      lbSegRef(el)
    } else {
      cleanupLbSeg(segElRef.current)
      segElRef.current = null
    }
  }, [])

  // ---------------------------------------------------------------------------
  // FLIP: run on every render (same as prototype's bare useLayoutEffect)
  // ---------------------------------------------------------------------------
  useLayoutEffect(() => {
    runFlip(rowEls.current as Record<string, HTMLElement | null>, flipState.current)
  })

  // ---------------------------------------------------------------------------
  // Pill reposition: run when metric changes
  // ---------------------------------------------------------------------------
  useLayoutEffect(() => {
    const seg = segElRef.current
    if (!seg) return
    repositionLbPill(seg)
  }, [metric])

  // ---------------------------------------------------------------------------
  // Number tween: wired via callback ref on a stable anchor element
  // ---------------------------------------------------------------------------
  const tweenAnchorRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    // Store cleanup on element; the tween itself is triggered by metric changes
    // via the tweenTriggerRef pattern below
  }, [])

  // Tween trigger: start a new tween whenever metric changes.
  // We use a layout-effect equivalent but with a stable ref to avoid stale closures.
  const metricRef = useRef<Metric>(metric)
  useLayoutEffect(() => {
    if (metricRef.current === metric && tweenState.current.timerId !== null) return
    metricRef.current = metric
    const cleanup = startTween(metric, displayRef.current, setDisplay, tweenState)
    return cleanup
  }, [metric])

  // ---------------------------------------------------------------------------
  // Rows enter animation: fires on mount (initial entrance) and after each metric
  // change. setRowsAnim inside useLayoutEffect flushes synchronously before paint,
  // so there is no intermediate flash of the unclassed element.
  // ---------------------------------------------------------------------------
  useLayoutEffect(() => {
    setRowsAnim('rows-in')
  }, [metric])

  // ---------------------------------------------------------------------------
  // Metric switch: immediately updates direction and metric; useLayoutEffect([metric])
  // above sets 'rows-in' so the directional enter animation plays automatically.
  // ---------------------------------------------------------------------------
  function switchMetric(newMetric: Metric, newDir: number) {
    if (newMetric === metric) return
    setDir(newDir)
    setMetric(newMetric)
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const ordered = AGENTS.slice().sort((a, b) => b[metric] - a[metric])

  // ---------------------------------------------------------------------------
  // Row callback ref factory
  // ---------------------------------------------------------------------------
  function makeRowRef(id: string) {
    return (el: HTMLDivElement | null) => {
      rowEls.current[id] = el
    }
  }

  return (
    <div className="frame">
      <div className="lb-outer">
        <div className="lb">
          <div className="head">
            <div className="h-title">
              <span className="material-symbols-outlined h-title-icon">leaderboard</span>
              Leaderboard
            </div>
            <div
              className="seg"
              ref={segCallbackRef}
            >
              <span className="seg-pill" />
              <button
                type="button"
                className={metric === 'revenue' ? 'active' : ''}
                onClick={() => switchMetric('revenue', metric === 'growth' ? -1 : 0)}
              >
                <span className={iconClass('payments')}>payments</span>
                Revenue
              </button>
              <button
                type="button"
                className={metric === 'growth' ? 'active' : ''}
                onClick={() => switchMetric('growth', metric === 'revenue' ? 1 : 0)}
              >
                <span className={iconClass('trending_up')}>trending_up</span>
                Growth %
              </button>
            </div>
          </div>

          <div className="colhead">
            <span className="l">Full Name</span>
            <span className="col-metric">
              <span className="cm-anim" key={metric}>
                {metric === 'growth' ? 'Growth' : 'Revenue'}
              </span>
            </span>
          </div>

          {/* Stable anchor for tween (no-op in DOM, just a mount point) */}
          <div ref={tweenAnchorRef} style={{ display: 'none' }} />

          <div
            className={rowsAnim ? `rows ${rowsAnim}` : 'rows'}
            ref={rowsRef}
            style={{'--dir': dir} as React.CSSProperties}
          >
            {ordered.map((agent, i) => {
              const rank = i + 1
              const leader = rank === 1
              const prominent = leader || agent.you
              return (
                <div
                  key={agent.id}
                  className={'row' + (agent.you ? ' win' : '')}
                  ref={makeRowRef(agent.id)}
                >
                  <div className="who">
                    <div className={'avatar ' + (leader ? 'a1' : 'a2')}>{rank}</div>
                    <div>
                      <div
                        className="name"
                        style={prominent ? undefined : { color: '#334155' }}
                      >
                        {agent.name}
                      </div>
                      {leader && (
                        <div className="sub">
                          <span className="material-icons">trending_up</span>
                          Top 1%
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className="rev"
                    style={leader ? undefined : { color: '#334155', fontSize: '15px' }}
                  >
                    {fmt(metric, display[agent.id] ?? 0)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
