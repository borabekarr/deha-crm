import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './StreakCard.css'

import { useRef, useState, useCallback } from 'react'
import {
  streakCardRef,
  cleanupStreakCard,
  buildRingSVG,
  tween,
  setBarWidth,
  drawRing,
} from './streak-card-hook'

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

function DayDots({ days, cur, activeRingPct }: { days: DayEntry[]; cur: number; activeRingPct: number }) {
  return (
    <div className="sc-days">
      {days.map((d, i) => {
        const isActive = !d.done && i === cur
        const cls = 'sc-day' + (d.done ? ' is-done' : isActive ? ' is-active' : '')
        return (
          <div key={d.label} className={cls} style={{ '--i': i } as React.CSSProperties}>
            {d.done ? (
              <div className="sc-dot done">
                <span className="material-icons">check</span>
              </div>
            ) : isActive ? (
              <div
                className="sc-dot active"
                dangerouslySetInnerHTML={{ __html: buildRingSVG(activeRingPct) }}
              />
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
  const stepsPctRef = useRef<HTMLSpanElement | null>(null)
  const flameRef = useRef<HTMLDivElement | null>(null)

  // ---------------------------------------------------------------------------
  // Callback ref for the .streak element — wires entrance animation via hook.
  // NO raw useEffect — animation lifecycle lives entirely in streak-card-hook.ts
  // ---------------------------------------------------------------------------
  const handleCardRef = useCallback(
    (el: HTMLDivElement | null) => {
      cardRef.current = el
      streakCardRef(el, barRef.current)
      return () => cleanupStreakCard(el)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Re-run entrance animation: reset bar then trigger hook on card
    const card = cardRef.current
    const bar = barRef.current
    if (!card || !bar) return
    streakCardRef(card, bar)
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
      const doneCount = prev.days.filter((d) => d.done).length
      let newDays: DayEntry[]
      let newCur: number

      if (doneCount >= 6) {
        const keep = prev.days.filter((d) => d.done).slice(-2).map((d) => d.label)
        const win: DayEntry[] = keep.map((l) => ({ label: l, done: true }))
        let last = keep.length ? keep[keep.length - 1] : prev.days[prev.days.length - 1].label
        while (win.length < 7) {
          last = nextWeekday(last)
          win.push({ label: last, done: false })
        }
        newDays = win
        newCur = keep.length
      } else {
        newDays = prev.days
        newCur = Math.min(prev.days.length - 1, prev.cur + 1)
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

              {/* Day dots */}
              <DayDots days={state.days} cur={state.cur} activeRingPct={state.activeRingPct} />

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
                  <div
                    className="sc-bar-fill"
                    ref={barRef}
                    style={{ width: pct + '%' }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Demo controls */}
          <div className="sc-controls">
            <button className="sc-btn" onClick={handleReplay}>
              <span className="material-icons">replay</span>Replay
            </button>
            <button className="sc-btn" onClick={handleMarkDone}>
              <span className="material-icons">check</span>Mark done
            </button>
            <button className="sc-btn" onClick={handleNextDay}>
              <span className="material-icons">arrow_forward</span>Next day
            </button>
            <button className="sc-btn" onClick={handleAddSteps}>
              <span className="material-icons">directions_walk</span>+1,250 steps
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
