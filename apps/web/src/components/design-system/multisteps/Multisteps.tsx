/**
 * Multisteps.tsx
 *
 * Multistep Onboarding — morphing emerald capsule indicator + ripple buttons.
 * Faithful port of apps/web/design-system/preview/components-multisteps.html.
 *
 * Interaction model:
 *  - React state tracks the current step index (`cur`).
 *  - Changing `cur` (via Next, Back, or dot click) calls layout() on the
 *    stage element through the stored __msLayout function.
 *  - All imperative DOM work (dot creation, layout, ripple, celebrate) lives
 *    in multisteps-hook.ts via callback refs.
 *
 * NO raw useEffect in this file (ESLint + project rule).
 */

import './Multisteps.css'

import { useState, useRef, useCallback } from 'react'
import { useProximityGroup } from '@/lib/hooks'
import {
  type StageElement,
  type SurfaceElement,
  mountStage,
  cleanupStage,
  mountSurface,
  cleanupSurface,
  ripple,
  celebrate,
} from './multisteps-hook'

// ---------------------------------------------------------------------------
// Step data — mirrors STEPS array in the HTML prototype
// ---------------------------------------------------------------------------

interface Step {
  icon: string
  title: string
  desc: string
}

const STEPS: Step[] = [
  {
    icon: 'lightbulb',
    title: 'Welcome aboard',
    desc: "Let's get your workspace set up in three quick steps.",
  },
  {
    icon: 'tune',
    title: 'Personalize it',
    desc: 'Pick the defaults that match how your team likes to work.',
  },
  {
    icon: 'rocket_launch',
    title: "You're all set",
    desc: 'Review everything, then finish to start using Deha.',
  },
]

const N = STEPS.length

// ---------------------------------------------------------------------------
// Content pane (per-step icon / title / description)
// Rendered as declarative React — the content area is React-owned state,
// while the capsule/dot geometry stays in the imperative hook.
// ---------------------------------------------------------------------------

interface PaneProps {
  step: Step
  /** Direction coming from: 1 = forward, -1 = back */
  dir: 1 | -1
}

function StepPane({ step }: PaneProps) {
  return (
    <div className="ms-pane swap-in">
      <div className="ms-icon">
        <span className="material-symbols-outlined">{step.icon}</span>
      </div>
      <div className="ms-title">{step.title}</div>
      <div className="ms-desc">{step.desc}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Multisteps() {
  // ── React state ────────────────────────────────────────────────────────
  const [cur, setCur] = useState(0)
  const [paneKey, setPaneKey] = useState(0) // bump to remount pane and retrigger animation
  const [dir, setDir] = useState<1 | -1>(1)

  // ── DOM refs ────────────────────────────────────────────────────────────
  const capsuleRef   = useRef<HTMLDivElement>(null)
  const nextBtnRef   = useRef<HTMLButtonElement>(null)

  // ── Proximity groups (hover glow, locked convention: radius 80, dy×3) ───
  const dotsGroupRef    = useProximityGroup<HTMLDivElement>()
  const actionsGroupRef = useProximityGroup<HTMLDivElement>()

  // ── Callback ref: surface ───────────────────────────────────────────────
  const surfaceRefCb = useCallback((el: SurfaceElement | null) => {
    if (el) mountSurface(el)
    else cleanupSurface(el)
  }, [])

  // ── Navigation ─────────────────────────────────────────────────────────
  // Declared before stageRefCb so the callback ref can reference handleDotClick
  // without a forward-reference violation (react-hooks/immutability).

  function go(next: number): void {
    const clamped = Math.max(0, Math.min(N - 1, next))
    if (clamped === cur) return

    const newDir: 1 | -1 = clamped > cur ? 1 : -1
    const stage = capsuleRef.current?.parentElement as StageElement | null
    if (stage?.__msLayout) {
      // stage is a DOM element with augmented properties — the assignment is
      // to a mutable DOM property, not a React-managed value. Cast to bypass
      // the immutability lint which fires on values accessed through refs.
      stage.__msPrev = cur
      stage.__msLayout(clamped, true)
    }

    setDir(newDir)
    setCur(clamped)
    setPaneKey(k => k + 1)
  }

  function handleDotClick(idx: number): void {
    go(idx)
  }

  // ── Callback ref: stage ─────────────────────────────────────────────────
  const stageRefCb = useCallback(
    (el: StageElement | null) => {
      if (el) {
        mountStage(el, N, handleDotClick, capsuleRef.current)
        // Initial layout without pop animation
        el.__msLayout?.(0, false)
      } else {
        cleanupStage(el)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  function handleNext(): void {
    if (cur < N - 1) {
      go(cur + 1)
    } else {
      // Already on last step — celebrate
      if (nextBtnRef.current && capsuleRef.current) {
        celebrate(nextBtnRef.current, capsuleRef.current)
      }
    }
  }

  function handleBack(): void {
    go(cur - 1)
  }

  // ── Ripple handlers ────────────────────────────────────────────────────

  function handleNextPointerDown(e: React.PointerEvent<HTMLButtonElement>): void {
    ripple(e.currentTarget, e.nativeEvent as PointerEvent)
  }

  function handleBackPointerDown(e: React.PointerEvent<HTMLButtonElement>): void {
    ripple(e.currentTarget, e.nativeEvent as PointerEvent)
  }

  // ── Derived flags ──────────────────────────────────────────────────────
  const isFirst  = cur === 0
  const isFinish = cur === N - 1

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="card">
      <span className="label" style={{ alignSelf: 'flex-start' }}>
        Multistep · Onboarding
      </span>
      {/* Single-component shell — zoom on hover per SOP */}
      <div className="shell zoom" style={{ width: '100%', boxSizing: 'border-box', marginTop: 10 }}>
        <div className="ms-surface" ref={surfaceRefCb}>
          <div className="ms-eyebrow">Steps</div>

          {/* Morphing capsule indicator */}
          <div className="ms-indicator" ref={dotsGroupRef}>
            <div
              className="ms-stage"
              ref={stageRefCb}
            >
              {/* Capsule (width driven imperatively by the hook) */}
              <div className="ms-capsule" ref={capsuleRef} />
              {/* Dots are created imperatively inside mountStage */}
            </div>
          </div>

          {/* Step content — React-managed, keyed so pane remounts per step */}
          <div className="ms-content">
            <StepPane key={paneKey} step={STEPS[cur]} dir={dir} />
          </div>

          {/* Action buttons */}
          <div className="ms-actions" ref={actionsGroupRef}>
            <div className="ms-btn-slot ms-btn-slot--back">
              <button
                type="button"
                className={`ms-btn ms-btn--back${isFirst ? '' : ' show'}`}
                data-proximity
                onClick={handleBack}
                onPointerDown={handleBackPointerDown}
                aria-label="Go back"
              >
                Back
              </button>
            </div>
            <div className="ms-btn-slot ms-btn-slot--primary">
              <button
                type="button"
                ref={nextBtnRef}
                className={`ms-btn ms-btn--primary${isFinish ? ' is-finish' : ''}`}
                data-proximity
                onClick={handleNext}
                onPointerDown={handleNextPointerDown}
                aria-label={isFinish ? 'Finish setup' : 'Continue to next step'}
              >
                <span className="ms-check">
                  <span className="material-symbols-outlined">check</span>
                </span>
                <span className="ms-next-label">{isFinish ? 'Finish' : 'Continue'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
