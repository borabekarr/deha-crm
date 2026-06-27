import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DeleteButton.css'

import { useState, useRef, useCallback } from 'react'
import type { DbState } from './delete-button-hook'
import { dbRootRef, cleanupDbRoot, dbInnerRef } from './delete-button-hook'

// ---------------------------------------------------------------------------
// DeleteButton -- Morphing confirm-delete pill
// Faithful port of apps/web/design-system/preview/delete-button/delete-button.jsx
//
// States: idle → confirming (countdown) → done → idle (auto-reset)
// Width morphs via measured .db-inner offsetWidth stored in state.
// All timer logic lives in delete-button-hook.ts via callback refs.
// NO raw useEffect / useLayoutEffect anywhere in this file.
//
// Animation: vertical-slide morph (dbSlideIn / dbSlideOut) via mounted-through-
// exit pattern. Both outgoing and incoming content are rendered simultaneously
// so old content slides up+fades while new content slides in from below.
// ---------------------------------------------------------------------------

/* ---- SVG icons (inline; strokes use currentColor for phase-aware tinting) ---- */
function IcoTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <path
        d="M9.5 7V5.6A1.6 1.6 0 0 1 11.1 4h1.8A1.6 1.6 0 0 1 14.5 5.6V7"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path
        d="M6.6 7l.9 12A1.7 1.7 0 0 0 9.2 20.6h5.6A1.7 1.7 0 0 0 16.5 19l.9-12"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path d="M10 11v5.5M14 11v5.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  )
}

function IcoUndo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9.5C4 9.5 6 5 12 5c5 0 8 4 8 7s-3 7-8 7a9 9 0 0 1-6-2.3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M4 4v5.5h5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IcoCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---- Props ---- */
export interface DeleteButtonProps {
  /** Countdown seconds before deletion resolves (default: 5) */
  seconds?: number
  /** Button label in idle state (default: "Delete account") */
  label?: string
  /** Called when countdown reaches zero (deletion confirmed) */
  onDelete?: () => void
}

/* ---- MorphSlot: an absolutely stacked layer inside the clip region ---- */
function MorphSlot({
  isExiting,
  children,
}: {
  isExiting: boolean
  children: React.ReactNode
}) {
  return (
    <span className={`db-morph-slot ${isExiting ? 'db-slide-out' : 'db-slide-in'}`}>
      {children}
    </span>
  )
}

/* ---- Component ---- */
export default function DeleteButton({
  seconds = 5,
  label = 'Delete account',
  onDelete,
}: DeleteButtonProps) {
  const [dbState, setDbState] = useState<DbState>('idle')
  const [prevState, setPrevState] = useState<DbState | null>(null)
  // nextPendingState: the incoming state during exit phase (before dbState flips)
  const [nextPendingState, setNextPendingState] = useState<DbState | null>(null)
  // count is managed via the callback-ref timer loop; initial value = seconds.
  const [count, setCount] = useState(seconds)
  const [prevCount, setPrevCount] = useState<number | null>(null)
  const [width, setWidth] = useState<number | null>(null)
  // exitPhase: true during exit animation so outgoing content stays mounted
  const [exitPhase, setExitPhase] = useState(false)

  // Stable refs for hook to use
  const rootElRef = useRef<HTMLButtonElement | null>(null)
  const stateRef = useRef<DbState>('idle')
  const countRef = useRef(seconds)

  // Keep refs in sync with state
  // eslint-disable-next-line react-hooks/refs
  stateRef.current = dbState
  // eslint-disable-next-line react-hooks/refs
  countRef.current = count

  // Callback ref for the inner span -- measures width for the morph
  const innerCbRef = useCallback(
    (el: HTMLElement | null) => {
      dbInnerRef(el, setWidth)
    },
    // Re-run when state, count, or exitPhase changes so width tracks new content
    // (exitPhase flip renders confirming slot in-DOM before dbState transitions,
    // so including it ensures the badge is measured before width animates)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dbState, count, label, exitPhase],
  )

  // Stable ref to transitionTo so the hook callback can call it without stale closure
  const transitionToRef = useRef<((nextState: DbState, opts?: { resetCount?: number }) => void) | null>(null)

  // Callback ref for the outer button -- wires/clears countdown timers
  const rootCbRef = useCallback(
    (el: HTMLButtonElement | null) => {
      rootElRef.current = el
      dbRootRef(el, dbState, count, setCount, (nextState: DbState) => {
        // Route through mounted-through-exit transition; fire onDelete after done
        transitionToRef.current?.(nextState)
        if (nextState === 'done') onDelete?.()
      })
      return () => cleanupDbRoot(el)
    },
    // Re-run whenever state or count changes to re-arm the correct timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dbState, count],
  )

  // Exit animation duration in ms (matches dbSlideOut: 200ms)
  const EXIT_MS = 200

  function transitionTo(nextState: DbState, opts?: { resetCount?: number }) {
    // Mounted-through-exit: remember what was showing, start exit phase
    setPrevState(stateRef.current)
    setPrevCount(countRef.current)
    setNextPendingState(nextState)
    setExitPhase(true)
    // After exit animation, swap to new state
    const t = window.setTimeout(() => {
      setExitPhase(false)
      setPrevState(null)
      setPrevCount(null)
      setNextPendingState(null)
      setDbState(nextState)
      if (opts?.resetCount !== undefined) setCount(opts.resetCount)
    }, EXIT_MS)
    // Store timer on root element for cleanup if needed
    if (rootElRef.current) {
      (rootElRef.current as HTMLButtonElement & { __dbTransition?: ReturnType<typeof setTimeout> }).__dbTransition = t
    }
  }

  // Keep transitionToRef current so the hook callback can call it
  // eslint-disable-next-line react-hooks/refs
  transitionToRef.current = transitionTo

  function onClick() {
    if (dbState === 'idle' && !exitPhase) {
      // Arm: reset count to prop value and enter confirming
      transitionTo('confirming', { resetCount: seconds })
    } else if (dbState === 'confirming' && !exitPhase) {
      // Cancel: clear timers, return to idle, reset count
      cleanupDbRoot(rootElRef.current)
      transitionTo('idle', { resetCount: seconds })
    }
    // done state: button is non-interactive (no-op)
  }

  const ariaLabel =
    dbState === 'idle'
      ? label
      : dbState === 'confirming'
        ? `Cancel deletion. ${count} seconds remaining.`
        : 'Account deleted'

  // During exit phase: data-state should reflect the INCOMING state so CSS
  // padding selectors (db[data-state='x'] .db-slide-in) size the entering slot correctly.
  // After exit phase: data-state reflects dbState normally.
  const dataState = exitPhase && nextPendingState ? nextPendingState : dbState

  // Determine what to render: during exitPhase we show prevState exiting + incoming new state
  // After exitPhase we just show dbState as the entering content
  const renderExiting = exitPhase && prevState !== null
  const currentStateToRender = exitPhase && nextPendingState ? nextPendingState : dbState

  function renderPhaseSlot(state: DbState, cnt: number, isExiting: boolean) {
    if (state === 'idle') {
      return (
        <MorphSlot isExiting={isExiting}>
          <span className="db-ic"><IcoTrash /></span>
          <span className="db-text">{label}</span>
        </MorphSlot>
      )
    }
    if (state === 'confirming') {
      return (
        <MorphSlot isExiting={isExiting}>
          <span className="db-undo"><IcoUndo /></span>
          <span className="db-text">Cancel deletion</span>
          <span className="db-badge">
            <span key={cnt} className="db-num">{cnt}</span>
          </span>
        </MorphSlot>
      )
    }
    // done
    return (
      <MorphSlot isExiting={isExiting}>
        <span className="db-ic"><IcoCheck /></span>
        <span className="db-text">Account deleted</span>
      </MorphSlot>
    )
  }

  return (
    <button
      type="button"
      ref={rootCbRef}
      className="db"
      data-state={dataState}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={dbState === 'done'}
      style={{ width: width !== null ? `${width}px` : undefined }}
    >
      {/* db-inner: clip mask + position context for stacked morph slots */}
      <span className="db-inner" ref={innerCbRef}>
        {/* Exiting content (mounted-through-exit) */}
        {renderExiting && renderPhaseSlot(prevState!, prevCount ?? count, true)}
        {/* Entering / current content */}
        {renderPhaseSlot(currentStateToRender, count, false)}
      </span>
    </button>
  )
}
