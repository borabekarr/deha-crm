import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DeleteButton.css'

// ---------------------------------------------------------------------------
// Delete Button — Deha Design System
// A destructive action that morphs into a cancelable countdown. Click to arm
// deletion; a soft confirm pill counts down (click again to cancel). When the
// timer ends it resolves to a solid-emerald "Deleted" state, then resets.
// On every state change the icon + text DISSOLVE: their colour matches the
// pill's inner colour so they vanish into it while the pill morphs colour,
// then they emerge into the new colour once the morph is complete.
//
// Faithful port of
// apps/web/design-system/claude-design/raw/delete-button/delete-button.jsx —
// byte-preserved DOM/CSS/timings per CONVERSION-SOP.md. Motion was tokenized
// value-identically in the ds-review-inputs pass (every ported literal maps to
// an exact token or a value-identical calc() sum); rendered timings unchanged.
//
// This is the canonical, single-behavior delete button (the "Confirm"
// countdown-to-delete direction). The Hold/Arm/Swipe prototype variants and
// the ProtoPicker demo harness were removed (F24): this is the only variant.
// ---------------------------------------------------------------------------

import { useState, useEffect, useReducer, useRef, useLayoutEffect } from 'react'

// Global slow-down multiplier (:root[data-anim-slow]). The CSS side wraps every
// duration in calc(... * var(--anim-mult, 1)); the JS timers below mirror CSS
// durations, so they have to read the same multiplier or they cut the CSS
// animation short in Slow-Down mode.
function animMult(): number {
  if (typeof document === 'undefined') return 1
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult')
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? n : 1
}

// The roll keyframes are gated behind (prefers-reduced-motion: no-preference),
// so under reduce there is no animation to separate the two digits — the JS must
// not mount the rolling pair at all or st.from and st.to render superimposed at
// the same absolute coordinates. Read live (not cached at module scope) so an OS
// or emulateMedia change is honoured without a remount.
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// MIRROR: DeleteButton.css .db-d.in / .db-d.up animation duration
// (--duration-260 + --duration-150 = 410ms, motion-sweep step 2: was 520ms).
const ROLL_MS = 410
// MIRROR: DeleteButton.css .db-inner phase transitions. The old content is
// swapped for the new one INSTANTLY into the hidden entrance pose (no held
// "OUT" frame beforehand) so the label change tracks the width change
// directly instead of lagging behind it (F24: Bora flagged the old 150ms
// pre-swap hold as "the text transition is delaying"). IN is the 260ms
// blur-back-in leg.
const PHASE_IN_MS = 260

// ── icon ──────────────────────────────────────────────────────────────────

interface SymProps {
  name: string
  size?: number
  wght?: number
  fill?: number
}

function Sym({ name, size = 20, wght = 600, fill = 0 }: SymProps) {
  return (
    <span
      className="material-symbols-outlined"
      aria-hidden="true"
      style={{
        fontSize: size,
        lineHeight: 1,
        fontVariationSettings: `'opsz' 24, 'wght' ${wght}, 'FILL' ${fill}, 'GRAD' 0`,
      }}
    >
      {name}
    </span>
  )
}

// odometer counter — the old digit rolls up and out, the new rolls in from below
function RollNum({ value }: { value: number }) {
  const prevRef = useRef(value)
  const [st, setSt] = useState({ from: value, to: value, rolling: false })

  useEffect(() => {
    const from = prevRef.current
    if (from === value) return
    prevRef.current = value
    // Under reduce, swap straight to the new digit: no rolling pair, so no two
    // superimposed digits during the (un-animated) roll window.
    if (prefersReducedMotion()) {
      setSt({ from: value, to: value, rolling: false })
      return
    }
    setSt({ from, to: value, rolling: true })
    const id = setTimeout(() => setSt({ from: value, to: value, rolling: false }), ROLL_MS * animMult())
    return () => clearTimeout(id)
  }, [value])

  return (
    <span className="db-roll">
      {st.rolling ? (
        // Keyed on the target digit so a roll interrupted by the next tick
        // remounts the pair: same class on the same node would not restart the
        // CSS animation, and the digit would swap without moving.
        <>
          <span className="db-d up" key={`u${st.to}`}>
            {st.from}
          </span>
          <span className="db-d in" key={`i${st.to}`}>
            {st.to}
          </span>
        </>
      ) : (
        <span className="db-d cur">{st.to}</span>
      )}
    </span>
  )
}

// ── button ────────────────────────────────────────────────────────────────

type DbState = 'idle' | 'confirming' | 'done'
type DbPhase = 'rest' | 'morph' | 'in'

// Explicit state machine: `view` is a field of the machine, only ever set by
// the reducer itself (from its own `state` field) in response to a dispatched
// action -- never copied from another state variable inside an effect. Effects
// only *dispatch*; they never call two setters to keep two values in sync.
interface DbMachine {
  state: DbState // logical: idle | confirming | done
  view: DbState // rendered/styled phase (lags through the morph)
  phase: DbPhase // rest | morph | in
  count: number
}

type DbAction =
  | { type: 'arm'; seconds: number }
  | { type: 'cancel' }
  | { type: 'tick' }
  | { type: 'expire' }
  | { type: 'reset' }
  | { type: 'morph-start' }
  | { type: 'phase-in' }
  | { type: 'phase-rest' }

function dbReducer(m: DbMachine, action: DbAction): DbMachine {
  switch (action.type) {
    case 'arm':
      return m.state === 'idle' ? { ...m, state: 'confirming', count: action.seconds } : m
    case 'cancel':
      return m.state === 'confirming' ? { ...m, state: 'idle' } : m
    case 'tick':
      return { ...m, count: m.count - 1 }
    case 'expire':
      return { ...m, state: 'done' }
    case 'reset':
      return { ...m, state: 'idle' }
    // Re-fire guard: a press that lands mid-morph (arm, then cancel before the
    // content has swapped) leaves `state` equal to what is already rendered.
    // The morph-driving effect below only dispatches this when state !== view.
    case 'morph-start':
      return { ...m, view: m.state, phase: 'morph' }
    case 'phase-in':
      return { ...m, phase: 'in' }
    case 'phase-rest':
      return { ...m, phase: 'rest' }
    default:
      return m
  }
}

interface DeleteButtonProps {
  seconds?: number
  label?: string
}

function DeleteButton({ seconds = 5, label = 'Delete' }: DeleteButtonProps) {
  const [machine, dispatch] = useReducer(dbReducer, {
    state: 'idle',
    view: 'idle',
    phase: 'rest',
    count: seconds,
  })
  const { state, view, phase, count } = machine
  const innerRef = useRef<HTMLSpanElement>(null)
  const [w, setW] = useState<number | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafs = useRef<number[]>([])

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    rafs.current.forEach(cancelAnimationFrame)
    rafs.current = []
  }

  // measure content width for the morph
  useLayoutEffect(() => {
    if (innerRef.current) setW(innerRef.current.offsetWidth)
  }, [view, count, label])

  // Note: count is only ever rendered while state === 'confirming' (see the
  // `view === 'confirming'` branch below), and onClick already resets it to
  // `seconds` at the exact moment idle -> confirming fires. A standalone
  // "keep count synced while idle" effect was therefore write-only: it set
  // state nothing downstream needed yet, and the width-measure effect below
  // (deps include `count`) re-ran off that write, chaining an extra redraw
  // for a value that isn't on screen. Removed rather than resynced.

  // tick the countdown
  useEffect(() => {
    if (state !== 'confirming') return
    if (count <= 0) {
      dispatch({ type: 'expire' })
      return
    }
    const id = setTimeout(() => dispatch({ type: 'tick' }), 1000)
    return () => clearTimeout(id)
  }, [state, count])

  // auto-reset after the deletion resolves
  useEffect(() => {
    if (state !== 'done') return
    const id = setTimeout(() => dispatch({ type: 'reset' }), 2100)
    return () => clearTimeout(id)
  }, [state])

  // Drive the blur-morph transition whenever the logical state changes. This
  // effect only dispatches actions -- `view` is never set directly here; the
  // reducer is the single place that copies `state` into `view` (see
  // 'morph-start' above), so there is no cross-hook state mirroring in an
  // effect body. On mount state === view already ('idle'), so this settles to
  // 'rest' as a no-op instead of needing a separate first-run branch.
  useEffect(() => {
    clearTimers()
    // Re-fire guard: a press that lands mid-morph (arm, then cancel before the
    // content has swapped) leaves the logical state equal to what is already
    // rendered. Replaying the blur chain there would flash content out and back
    // in for no visible change, so settle instead.
    if (state === view) {
      dispatch({ type: 'phase-rest' })
      return
    }
    const m = animMult()
    // 1) MORPH — swap content immediately into the hidden entrance pose (no
    // transition-delay, no held OUT frame): the label changes in the same
    // tick as the width, so the two track together instead of the label
    // lagging behind.
    dispatch({ type: 'morph-start' })
    // Two rAFs let the hidden pose commit a frame before we animate out of
    // it -- collapsing to one rAF (or a 0ms timeout) risks the browser
    // coalescing the style write and skipping the transition entirely.
    rafs.current.push(
      requestAnimationFrame(() => {
        rafs.current.push(
          requestAnimationFrame(() => {
            // 2) IN — new content blurs back into focus
            dispatch({ type: 'phase-in' })
            timers.current.push(
              setTimeout(() => {
                dispatch({ type: 'phase-rest' })
              }, PHASE_IN_MS * m),
            )
          }),
        )
      }),
    )
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function onClick() {
    if (state === 'idle') {
      dispatch({ type: 'arm', seconds })
    } else if (state === 'confirming') {
      dispatch({ type: 'cancel' })
    }
  }

  const aria =
    state === 'idle' ? label : state === 'confirming' ? `Cancel, ${count} seconds remaining` : 'Deleted'

  return (
    <>
      <button
        type="button"
        className="db"
        data-state={view}
        data-phase={phase}
        onClick={onClick}
        aria-label={aria}
        style={{ width: w ? `${w}px` : 'auto' }}
      >
        <span className="db-inner" ref={innerRef}>
          {view === 'idle' && (
            <>
              <span className="db-ic">
                <Sym name="delete" size={20} wght={700} />
              </span>
              <span className="db-text">{label}</span>
            </>
          )}
          {view === 'confirming' && (
            <>
              <span className="db-ic">
                <Sym name="undo" size={20} wght={700} />
              </span>
              <span className="db-text">Cancel</span>
              <span className="db-count">
                <RollNum value={count} />
              </span>
            </>
          )}
          {view === 'done' && (
            <>
              <span className="db-ic">
                <Sym name="check_circle" size={21} wght={650} fill={1} />
              </span>
              <span className="db-text">Deleted</span>
            </>
          )}
        </span>
      </button>
    </>
  )
}

export default DeleteButton
