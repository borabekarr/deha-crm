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
// ---------------------------------------------------------------------------

/* ---- SVG icons (inline, no Material glyphs needed) ---- */
function IcoTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M9.5 7V5.6A1.6 1.6 0 0 1 11.1 4h1.8A1.6 1.6 0 0 1 14.5 5.6V7"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M6.6 7l.9 12A1.7 1.7 0 0 0 9.2 20.6h5.6A1.7 1.7 0 0 0 16.5 19l.9-12"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M10 11v5.5M14 11v5.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function IcoUndo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9.5C4 9.5 6 5 12 5c5 0 8 4 8 7s-3 7-8 7a9 9 0 0 1-6-2.3"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M4 4v5.5h5.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

/* ---- Stagger text: letters animate in one-by-one ---- */
function Stagger({ text }: { text: string }) {
  return (
    <>
      {/* eslint-disable react/no-array-index-key */}
      {text.split('').map((ch, i) => (
        <span
          key={`${i}-${ch}`}
          className="db-ch"
          style={{ animationDelay: `calc(${0.05 + i * 0.014}s * var(--anim-mult, 1))` }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
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

/* ---- Component ---- */
export default function DeleteButton({
  seconds = 5,
  label = 'Delete account',
  onDelete,
}: DeleteButtonProps) {
  const [dbState, setDbState] = useState<DbState>('idle')
  // count is managed via the callback-ref timer loop; initial value = seconds.
  // When state returns to idle we reset count to the current `seconds` prop.
  const [count, setCount] = useState(seconds)
  const [width, setWidth] = useState<number | null>(null)

  // Stable refs for hook to use
  const rootElRef = useRef<HTMLButtonElement | null>(null)
  const stateRef = useRef<DbState>('idle')
  const countRef = useRef(seconds)

  // Keep refs in sync with state (intentional render-time ref writes — pattern endorsed by React docs for "latest value" refs)
  // eslint-disable-next-line react-hooks/refs
  stateRef.current = dbState
  // eslint-disable-next-line react-hooks/refs
  countRef.current = count

  // Callback ref for the inner span -- measures width for the morph
  const innerCbRef = useCallback(
    (el: HTMLElement | null) => {
      dbInnerRef(el, setWidth)
    },
    // Re-run when state or count changes so width tracks new content
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dbState, count, label],
  )

  // Callback ref for the outer button -- wires/clears countdown timers
  const rootCbRef = useCallback(
    (el: HTMLButtonElement | null) => {
      rootElRef.current = el
      dbRootRef(el, dbState, count, setCount, (nextState: DbState) => {
        setDbState(nextState)
        if (nextState === 'done') onDelete?.()
      })
      // Return cleanup so React can unwire on unmount
      return () => cleanupDbRoot(el)
    },
    // Re-run whenever state or count changes to re-arm the correct timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dbState, count],
  )

  function onClick() {
    if (dbState === 'idle') {
      // Arm: reset count to prop value and enter confirming
      const newCount = seconds
      setCount(newCount)
      setDbState('confirming')
    } else if (dbState === 'confirming') {
      // Cancel: clear timers, return to idle, reset count
      cleanupDbRoot(rootElRef.current)
      setCount(seconds)
      setDbState('idle')
    }
    // done state: button is non-interactive (no-op)
  }

  const ariaLabel =
    dbState === 'idle'
      ? label
      : dbState === 'confirming'
        ? `Cancel deletion. ${count} seconds remaining.`
        : 'Account deleted'

  return (
    <button
      type="button"
      ref={rootCbRef}
      className="db"
      data-state={dbState}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={dbState === 'done'}
      style={{ width: width !== null ? `${width}px` : undefined }}
    >
      <span className="db-inner" ref={innerCbRef} key={dbState}>
        {dbState === 'idle' && (
          <>
            <span className="db-ic">
              <IcoTrash />
            </span>
            <span className="db-text">
              <Stagger text={label} />
            </span>
          </>
        )}
        {dbState === 'confirming' && (
          <>
            <span className="db-undo">
              <IcoUndo />
            </span>
            <span className="db-text">
              <Stagger text="Cancel deletion" />
            </span>
            <span className="db-badge">
              <span key={count} className="db-num">
                {count}
              </span>
            </span>
          </>
        )}
        {dbState === 'done' && (
          <>
            <span className="db-ic">
              <IcoCheck />
            </span>
            <span className="db-text">
              <Stagger text="Account deleted" />
            </span>
          </>
        )}
      </span>
    </button>
  )
}
