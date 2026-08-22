/**
 * Leaderboard — React port of apps/web/design-system/preview/components-leaderboard.html
 *
 * NO raw useEffect in this folder. Timers and FLIP live in leaderboard-hook.ts,
 * wired via callback refs and useLayoutEffect.
 */
import { useState, useRef, useLayoutEffect, useCallback } from 'react'
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
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { usePanelDirection } from '../../../lib/hooks/use-panel-direction'

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
  const [display, setDisplay] = useState<Record<string, number>>(initDisplay)
  // usePanelDirection indices: revenue=0, growth=1. `activeIndex` flips
  // IMMEDIATELY on click (no stale-direction gap); `metric` (content) lags,
  // flipping only after the exit timer fires. So panelState(metricIndex)
  // reads 'exiting-*' pre-switch, 'entering-*' post-switch -- the two-phase
  // sequence falls out of the hook, no manual dir math. Exit names are
  // swapped vs travel direction per the global convention (motion-tokens.css):
  // dir > 0 (revenue→growth, RIGHT) -> exit 'exiting-left', enter 'entering-
  // right'; dir < 0 is the mirror.
  const [activeIndex, setActiveIndex] = useState(0)
  const panelState = usePanelDirection(activeIndex)
  const metricIndex = metric === 'revenue' ? 0 : 1
  const rowState = panelState(metricIndex)
  // Exit plays on the .rows container (no stagger); enter plays per-.row
  // (staggered, see Leaderboard.css) -- never both at once.
  const containerPanelState =
    rowState === 'exiting-left' || rowState === 'exiting-right' ? rowState : undefined
  const rowPanelState =
    rowState === 'entering-right' || rowState === 'entering-left' ? rowState : undefined
  const rowsRef = useRef<HTMLDivElement | null>(null)
  // Proximity group: leaderboard rows are interactive (cursor:pointer, clickable-feel rows).
  const rowsProximityRef = useProximityGroup<HTMLDivElement>()
  const rowsCombinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      rowsRef.current = el
      rowsProximityRef(el)
    },
    [rowsProximityRef],
  )

  // Refs for FLIP
  const rowEls = useRef<Record<string, HTMLElement | null>>({})
  const flipState = useRef<FlipState>({ prevRects: {} })

  // Ref for tween cleanup
  const tweenState = useRef<TweenState>({ timerId: null, start: {}, t0: 0 })
  // Timer that sequences exit animation → content switch (usePanelDirection
  // derives the enter state automatically once metric catches up, below).
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep a ref to current display values for tween start point. Synced via
  // useLayoutEffect (not render-time mutation) so react-doctor's render-purity
  // check is satisfied; displayRef is only read inside the async tween
  // callback, never used to compute rendered output, so the one-paint lag
  // doesn't change what's on screen.
  const displayRef = useRef(display)
  useLayoutEffect(() => {
    displayRef.current = display
  }, [display])

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
  // Metric switch: flip activeIndex immediately (drives the exit state via
  // rowState above), then switch metric after the exit completes -- 120ms
  // (scaled by --anim-mult) matches the global panel-exit-* --duration-fast
  // -- so old rows are fully gone before new ones appear; the enter state
  // then falls out of panelState(metricIndex) once metric catches up.
  // ---------------------------------------------------------------------------
  function switchMetric(newMetric: Metric) {
    if (newMetric === metric) return

    // Cancel any in-flight switch timer
    if (switchTimerRef.current !== null) {
      clearTimeout(switchTimerRef.current)
      switchTimerRef.current = null
    }

    setActiveIndex(newMetric === 'revenue' ? 0 : 1)
    const rawMult = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult')
    const animMult = parseFloat(rawMult) || 1
    switchTimerRef.current = setTimeout(() => {
      switchTimerRef.current = null
      setMetric(newMetric)
    }, 120 * animMult)
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
                onClick={() => switchMetric('revenue')}
              >
                <span className={iconClass('payments')}>payments</span>
                Revenue
              </button>
              <button
                type="button"
                className={metric === 'growth' ? 'active' : ''}
                onClick={() => switchMetric('growth')}
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
            className="rows"
            ref={rowsCombinedRef}
            data-panel-state={containerPanelState}
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
                  data-proximity
                  data-panel-state={rowPanelState}
                >
                  <div className="who">
                    <div className={'avatar ' + (leader ? 'a1' : 'a2')}>{rank}</div>
                    <div>
                      <div
                        className="name"
                        style={prominent ? undefined : { color: '#232323' }}
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
                    style={leader ? undefined : { color: '#232323', fontSize: '15px' }}
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
