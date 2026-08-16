import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DeleteButton.css'
import './variants.css'
import { VariantPicker } from './VariantPicker'

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
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useLayoutEffect, type CSSProperties } from 'react'

// Prototype directions (ds-review-inputs Step 6): 'confirm' is the Step 5
// result, untouched (main/default). 'countdown' and 'celebrate' vary only
// presentation via [data-variant] CSS in variants.css — the state machine
// below is shared and unforked across all three, per the step's FAILURE GUARD.
const VARIANT_SLUGS = ['confirm', 'countdown', 'celebrate'] as const
const VARIANT_NAMES = ['Confirm', 'Countdown', 'Celebrate']

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
// (--duration-320 + --duration-200 = 520ms).
const ROLL_MS = 520
// MIRROR: DeleteButton.css .db-inner phase transitions. OUT is the 200ms
// blur-out leg. IN is the 360ms blur-back-in leg. MORPH (300ms) is deliberately
// SHORTER than the pill's own colour/size legs (340ms = --duration-180 +
// --duration-base): the content starts re-entering while the last 40ms of the
// colour settle is still running, so the two overlap instead of queueing.
const PHASE_OUT_MS = 200
const PHASE_MORPH_MS = 300
const PHASE_IN_MS = 360

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
type DbPhase = 'rest' | 'out' | 'morph' | 'in'

export interface DeleteButtonProps {
  seconds?: number
  label?: string
}

export default function DeleteButton({ seconds = 5, label = 'Delete' }: DeleteButtonProps) {
  const [state, setState] = useState<DbState>('idle') // logical: idle | confirming | done
  const [view, setView] = useState<DbState>('idle') // rendered/styled phase (lags through the morph)
  const [count, setCount] = useState(seconds)
  const [phase, setPhase] = useState<DbPhase>('rest') // rest | out | morph | in
  const innerRef = useRef<HTMLSpanElement>(null)
  const [w, setW] = useState<number | null>(null)
  const firstRun = useRef(true)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Prototype variant selection, persisted via ?v=N (PICKER.md contract).
  const [variant, setVariant] = useState(() => {
    if (typeof window === 'undefined') return 0
    const v = Number.parseInt(new URLSearchParams(window.location.search).get('v') ?? '', 10)
    return v >= 1 && v <= VARIANT_SLUGS.length ? v - 1 : 0
  })
  function selectVariant(i: number) {
    setVariant(i)
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(i + 1))
    window.history.replaceState(null, '', url)
  }

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  // measure content width for the morph
  useLayoutEffect(() => {
    if (innerRef.current) setW(innerRef.current.offsetWidth)
  }, [view, count, label])

  // keep the armed count synced while idle
  useEffect(() => {
    if (state === 'idle') setCount(seconds)
  }, [seconds, state])

  // tick the countdown
  useEffect(() => {
    if (state !== 'confirming') return
    if (count <= 0) {
      setState('done')
      return
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [state, count])

  // auto-reset after the deletion resolves
  useEffect(() => {
    if (state !== 'done') return
    const id = setTimeout(() => setState('idle'), 2100)
    return () => clearTimeout(id)
  }, [state])

  // drive the blur-morph transition whenever the logical state changes
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      setView(state)
      return
    }
    clearTimers()
    const to = state
    // Re-fire guard: a press that lands mid-morph (arm, then cancel before the
    // content has swapped) leaves the logical state equal to what is already
    // rendered. Replaying the blur chain there would flash content out and back
    // in for no visible change, so settle instead.
    if (to === view) {
      setPhase('rest')
      return
    }
    const m = animMult()
    // 1) OUT — current content blurs + shrinks out
    setPhase('out')
    timers.current.push(
      setTimeout(() => {
        // 2) MORPH — swap content while invisible; pill re-colours + re-sizes
        setView(to)
        setPhase('morph')
        timers.current.push(
          setTimeout(() => {
            // 3) IN — new content blurs back into focus
            setPhase('in')
            timers.current.push(
              setTimeout(() => {
                setPhase('rest')
              }, PHASE_IN_MS * m),
            )
          }, PHASE_MORPH_MS * m),
        )
      }, PHASE_OUT_MS * m),
    )
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function onClick() {
    if (state === 'idle') {
      setCount(seconds)
      setState('confirming')
    } else if (state === 'confirming') {
      setState('idle')
    }
  }

  const aria =
    state === 'idle' ? label : state === 'confirming' ? `Cancel, ${count} seconds remaining` : 'Deleted'

  const slug = VARIANT_SLUGS[variant]
  return (
    <>
      <button
        key={slug}
        className="db"
        data-state={view}
        data-phase={phase}
        data-variant={slug}
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
              {/* --db-progress only styles the 'countdown' variant's ring; harmless
                  elsewhere. Set inline per render, not a new effect/timer. */}
              <span className="db-count" style={{ '--db-progress': count / seconds } as CSSProperties}>
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
      <VariantPicker labels={VARIANT_NAMES} index={variant} onSelect={selectVariant} />
    </>
  )
}
