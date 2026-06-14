import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './StreakCard.css'

import { useRef, useState, useCallback } from 'react'
import {
  streakCardRef,
  cleanupStreakCard,
  tween,
  setBarWidth,
  drawRing,
} from './streak-card-hook'

// Ring geometry — mirrors hook constants; initial dashoffset = full circumference (invisible)
const RING_R = 15.2
const RING_C = 2 * Math.PI * RING_R

function RingSVG({ pct }: { pct: number }) {
  const off = RING_C * (1 - pct)
  const circumStr = RING_C.toFixed(2)
  return (
    <svg viewBox="0 0 35 35">
      <circle cx="17.5" cy="17.5" r={RING_R} fill="none" stroke="var(--sc-ring-track)" strokeWidth="3.4" />
      <circle
        className="ring-prog"
        cx="17.5" cy="17.5" r={RING_R}
        fill="none" stroke="#10B981" strokeWidth="3.4"
        strokeLinecap="round"
        strokeDasharray={circumStr}
        strokeDashoffset={circumStr}
        data-off={off.toFixed(2)}
      />
    </svg>
  )
}

// Bar width as a single source of truth (6825/10000 = 68.25%)
// The hook also uses 68.25% — the declarative style is intentionally absent
// from the .sc-bar-fill JSX; the hook owns bar width imperatively.

// ---------------------------------------------------------------------------
// Windowing constants
// ---------------------------------------------------------------------------

// Number of day cells visible at once.
const WINDOW_SIZE = 7

// When cur reaches this many slots from the right edge of the visible window,
// the window advances so cur stays two slots from the right edge.
// Threshold = WINDOW_SIZE - 3  (i.e. index 4 in a 0-based 7-cell window)
const WINDOW_THRESHOLD = WINDOW_SIZE - 3 // = 4

// Derive the first visible index from the absolute cur index.
// While cur < WINDOW_THRESHOLD the window is anchored at 0.
// Once cur >= WINDOW_THRESHOLD the window slides so cur lands at position
// WINDOW_THRESHOLD inside the window (two from the right edge).
function windowStart(cur: number): number {
  return Math.max(0, cur - WINDOW_THRESHOLD)
}

// ---------------------------------------------------------------------------
// Data model — verbatim from prototype state object
// ---------------------------------------------------------------------------

interface DayEntry {
  label: string
  done: boolean
}

interface StreakState {
  streakDays: number
  steps: number
  maxSteps: number
  cur: number
  days: DayEntry[]
  activeRingPct: number
}

const INITIAL_STATE: StreakState = {
  streakDays: 32,
  steps: 6825,
  maxSteps: 10000,
  cur: 3,
  days: [
    { label: 'Mon', done: true },
    { label: 'Tue', done: true },
    { label: 'Wed', done: true },
    { label: 'Thu', done: false }, // today, in progress (~72%)
    { label: 'Fri', done: false },
    { label: 'Sat', done: false },
    { label: 'Sun', done: false },
  ],
  activeRingPct: 0.72,
}

const DOW_CYCLE = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function nextWeekday(label: string): string {
  const i = DOW_CYCLE.indexOf(label)
  return DOW_CYCLE[(i + 1) % 7]
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

function pctOf(steps: number, maxSteps: number): number {
  return Math.round((steps / maxSteps) * 100)
}

// ---------------------------------------------------------------------------
// Day dot renderer — pure JSX equivalent of prototype renderDays()
// ---------------------------------------------------------------------------

// DayDots renders a pre-sliced 7-cell window. visibleCur is the cur index
// mapped into the visible slice (absolute cur minus windowStart).
function DayDots({ days, visibleCur, activeRingPct }: { days: DayEntry[]; visibleCur: number; activeRingPct: number }) {
  return (
    <div className="sc-days">
      {days.map((d, i) => {
        const isActive = !d.done && i === visibleCur
        const cls = 'sc-day' + (d.done ? ' is-done' : isActive ? ' is-active' : '')
        return (
          <div key={d.label} className={cls} style={{ '--i': i } as React.CSSProperties}>
            {d.done ? (
              <div className="sc-dot done">
                <span className="material-icons">check</span>
              </div>
            ) : isActive ? (
              <div className="sc-dot active">
                <RingSVG pct={activeRingPct} />
              </div>
            ) : (
              <div className="sc-dot empty" />
            )}
            <div className="sc-day-label">{d.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// StreakCard
// ---------------------------------------------------------------------------

export default function StreakCard() {
  const [state, setState] = useState<StreakState>(() => ({ ...INITIAL_STATE, days: INITIAL_STATE.days.map((d) => ({ ...d })) }))

  // Refs to DOM nodes used by the hook / interaction handlers
  const cardRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const streakNumRef = useRef<HTMLSpanElement | null>(null)
  const stepsValRef = useRef<HTMLSpanElement | null>(null)
  const stepsPctRef = useRef<HTMLDivElement | null>(null)
  const flameRef = useRef<HTMLDivElement | null>(null)

  // ---------------------------------------------------------------------------
  // Callback ref for the .streak element — wires entrance animation via hook.
  // NO raw useEffect — animation lifecycle lives entirely in streak-card-hook.ts
  //
  // The hook resolves .sc-bar-fill via querySelector on the card element, so
  // there is no null-abort risk from barRef.current being unset at mount time.
  // ---------------------------------------------------------------------------
  const handleCardRef = useCallback(
    (el: HTMLDivElement | null) => {
      cardRef.current = el
      streakCardRef(el)
      return () => cleanupStreakCard(el)
    },
     
    [],
  )

  // ---------------------------------------------------------------------------
  // Interaction handlers (mirrors prototype replay / markDone / nextDay / addSteps)
  // ---------------------------------------------------------------------------

  function handleReplay() {
    setState((prev) => ({
      ...INITIAL_STATE,
      days: INITIAL_STATE.days.map((d) => ({ ...d })),
      streakDays: prev.streakDays,
      steps: prev.steps,
    }))
    // Re-run entrance animation — hook resolves bar via querySelector internally
    const card = cardRef.current
    if (!card) return
    streakCardRef(card)
  }

  function handleMarkDone() {
    setState((prev) => {
      const d = prev.days[prev.cur]
      if (!d || d.done) return prev
      const newDays = prev.days.map((day, i) => (i === prev.cur ? { ...day, done: true } : day))
      const fromStreak = prev.streakDays
      const newStreakDays = prev.streakDays + 1

      // tween streak number
      if (streakNumRef.current) {
        tween(streakNumRef.current, fromStreak, newStreakDays, 520, (v) => String(Math.round(v)), () => {
          if (streakNumRef.current) {
            streakNumRef.current.textContent = String(newStreakDays)
            streakNumRef.current.classList.remove('elastic')
            void streakNumRef.current.offsetWidth
            streakNumRef.current.classList.add('elastic')
          }
        })
      }

      // flare flame
      if (flameRef.current) {
        flameRef.current.classList.remove('flare')
        void flameRef.current.offsetWidth
        flameRef.current.classList.add('flare')
      }

      return { ...prev, days: newDays, streakDays: newStreakDays }
    })
  }

  function handleNextDay() {
    setState((prev) => {
      // Advance cur to the next absolute index.
      const newCur = prev.cur + 1

      // Pad days so that slice(wStart, wStart + WINDOW_SIZE) always yields
      // exactly WINDOW_SIZE entries. wStart is derived from newCur so we
      // must compute it here before checking the length.
      const newWStart = windowStart(newCur)
      const needed = newWStart + WINDOW_SIZE
      let newDays = prev.days
      while (newDays.length < needed) {
        const lastLabel = newDays[newDays.length - 1].label
        newDays = [...newDays, { label: nextWeekday(lastLabel), done: false }]
      }

      // draw ring after state update on next frame
      requestAnimationFrame(() => {
        if (cardRef.current) drawRing(cardRef.current)
      })

      return { ...prev, days: newDays, cur: newCur }
    })
  }

  function handleAddSteps() {
    setState((prev) => {
      const fromSteps = prev.steps
      const newSteps = Math.min(prev.maxSteps, prev.steps + 1250)
      const fromPct = pctOf(fromSteps, prev.maxSteps)
      const newPct = pctOf(newSteps, prev.maxSteps)

      if (stepsValRef.current) {
        tween(stepsValRef.current, fromSteps, newSteps, 880, fmt, () => {
          if (stepsValRef.current) {
            stepsValRef.current.textContent = fmt(newSteps)
            stepsValRef.current.classList.remove('bump')
            void stepsValRef.current.offsetWidth
            stepsValRef.current.classList.add('bump')
          }
        })
      }
      if (stepsPctRef.current) {
        tween(stepsPctRef.current, fromPct, newPct, 880, (v) => Math.round(v) + '%')
      }
      if (barRef.current) setBarWidth(barRef.current, newPct, true)

      return { ...prev, steps: newSteps }
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const pct = pctOf(state.steps, state.maxSteps)

  // Derive the visible 7-day window from cur (pure computation, no effect).
  // wStart slides forward once cur reaches WINDOW_THRESHOLD slots from the
  // right edge, keeping cur two positions from the right edge thereafter.
  const wStart = windowStart(state.cur)
  const visibleDays = state.days.slice(wStart, wStart + WINDOW_SIZE)
  const visibleCur = state.cur - wStart

  return (
    <div className="stk-root">
      <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
        <div className="frame">

          {/* Shell bezel */}
          <div className="shell sc-shell" style={{ borderRadius: '32px' }}>

            {/* The streak card — entrance animation wired via callback ref */}
            <div
              className="streak"
              ref={handleCardRef}
              data-screen-label="Streak card"
            >
              {/* HEAD */}
              <div className="sc-head">
                <div className="sc-flame" ref={flameRef}>
                  <span className="material-symbols-outlined">local_fire_department</span>
                </div>
                <div className="sc-head-text">
                  <div className="sc-eyebrow">Streak</div>
                  <div className="sc-streak">
                    <span className="sc-streak-num" ref={streakNumRef}>{state.streakDays}</span>
                    <span className="sc-streak-unit">Days</span>
                  </div>
                </div>
                <div className="sc-foot" title="Step tracking">
                  <span className="material-symbols-outlined">footprint</span>
                </div>
              </div>

              <div className="sc-divider" />

              {/* Day dots — sliced to the derived 7-cell window */}
              <DayDots days={visibleDays} visibleCur={visibleCur} activeRingPct={state.activeRingPct} />

              {/* Steps */}
              <div className="sc-steps">
                <div className="sc-eyebrow">Steps</div>
                <div className="sc-steps-row">
                  <div className="sc-steps-num">
                    <span className="sc-steps-val" ref={stepsValRef}>{fmt(state.steps)}</span>
                    <span className="sc-steps-max">/{fmt(state.maxSteps)}</span>
                  </div>
                  <div className="sc-pct" ref={stepsPctRef}>{pct}%</div>
                </div>
                <div className="sc-bar">
                  {/* Bar width is managed imperatively by streak-card-hook.ts (68.25%).
                      No declarative style here — single source of truth in the hook. */}
                  <div
                    className="sc-bar-fill"
                    ref={barRef}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Demo controls */}
          <div className="sc-controls">
            <button type="button" className="sc-btn" onClick={handleReplay}>
              <span className="material-icons">replay</span>Replay
            </button>
            <button type="button" className="sc-btn" onClick={handleMarkDone}>
              <span className="material-icons">check</span>Mark done
            </button>
            <button type="button" className="sc-btn" onClick={handleNextDay}>
              <span className="material-icons">arrow_forward</span>Next day
            </button>
            <button type="button" className="sc-btn" onClick={handleAddSteps}>
              <span className="material-icons">directions_walk</span>+1,250 steps
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
