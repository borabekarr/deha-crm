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
  // Direction-aware animation state on the .rows container.
  // 'lb-entering-*'  → entering panel slides in from the direction of the new metric.
  // 'lb-exiting-*'   → current panel exits in the travel direction before content switches.
  // 'lb-entering'    → neutral fade (initial mount, no direction).
  type RowsAnim = 'lb-entering' | 'lb-entering-right' | 'lb-entering-left' | 'lb-exiting-left' | 'lb-exiting-right' | ''
  const [rowsAnim, setRowsAnim] = useState<RowsAnim>('')
  const rowsRef = useRef<HTMLDivElement | null>(null)

  // Refs for FLIP
  const rowEls = useRef<Record<string, HTMLElement | null>>({})
  const flipState = useRef<FlipState>({ prevRects: {} })

  // Ref for tween cleanup
  const tweenState = useRef<TweenState>({ timerId: null, start: {}, t0: 0 })
  // Timer that sequences exit animation → content switch → enter animation
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Enter class to apply after content switches (set in switchMetric, read in useLayoutEffect)
  const pendingEnterClassRef = useRef<RowsAnim>('lb-entering')
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
  // Rows enter animation: fires on mount and after each content switch.
  // Reads pendingEnterClassRef set by switchMetric so the correct direction class
  // is applied without having to add dir to the dep array.
  // ---------------------------------------------------------------------------
  useLayoutEffect(() => {
    setRowsAnim(pendingEnterClassRef.current)
  }, [metric])

  // ---------------------------------------------------------------------------
  // Metric switch: play exit animation on current rows, then switch content and
  // trigger the direction-aware enter animation.
  //
  // dir > 0  (revenue → growth):  rows travel left  → exit lb-exiting-left,  enter lb-entering-right
  // dir < 0  (growth → revenue):  rows travel right → exit lb-exiting-right, enter lb-entering-left
  //
  // The 200ms timer matches the lb-exiting-* CSS duration; content switches only
  // after the exit completes so the old rows are fully gone before new ones appear.
  // ---------------------------------------------------------------------------
  function switchMetric(newMetric: Metric, newDir: number) {
    if (newMetric === metric) return

    // Cancel any in-flight switch timer
    if (switchTimerRef.current !== null) {
      clearTimeout(switchTimerRef.current)
      switchTimerRef.current = null
    }

    if (newDir !== 0) {
      const exitClass: RowsAnim  = newDir > 0 ? 'lb-exiting-left'    : 'lb-exiting-right'
      const enterClass: RowsAnim = newDir > 0 ? 'lb-entering-right'   : 'lb-entering-left'
      // Stash enter class so useLayoutEffect([metric]) picks it up after the switch
      pendingEnterClassRef.current = enterClass
      setDir(newDir)
      setRowsAnim(exitClass)
      // Switch content after the exit animation completes (200ms CSS duration)
      switchTimerRef.current = setTimeout(() => {
        switchTimerRef.current = null
        setMetric(newMetric)
      }, 200)
    } else {
      pendingEnterClassRef.current = 'lb-entering'
      setDir(0)
      setMetric(newMetric)
    }
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
