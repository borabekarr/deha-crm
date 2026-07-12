/**
 * DeleteModal — Deha Design System
 * Reusable, accessible destructive-action confirm dialog.
 * Warning badge with shake-on-arm animation, loading → deleted success beat.
 *
 * Props:
 *   open          : boolean
 *   title         : string                    heading copy
 *   itemName      : string                    highlighted noun in body copy
 *   body          : (name: string) => ReactNode  optional custom body renderer
 *   confirmLabel  : string                    danger button label
 *   cancelLabel   : string                    keep button label
 *   onConfirm()   : fired after the success beat
 *   onClose()
 *
 * No useEffect / useLayoutEffect anywhere. All DOM side-effects live in
 * delete-modal-hook.ts callback refs. Always mounted; open/close driven by
 * CSS visibility/opacity (mounted-through-exit pattern).
 */

import { useState, useCallback, type ReactNode } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { useCardRef, useTimerRef, useOverlayRef } from './delete-modal-hook'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import '../../../../design-system/preview/_shared-feedback.css'
import '../buttons/Buttons.css'
import './DeleteModal.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DeleteModalProps {
  open?: boolean
  onClose?: () => void
  onConfirm?: () => void
  title?: string
  itemName?: string
  body?: (name: string) => ReactNode
  confirmLabel?: string
  cancelLabel?: string
}

// ---------------------------------------------------------------------------
// Component (named export — for direct controlled usage)
// ---------------------------------------------------------------------------
export function DeleteModal({
  open = false,
  onClose,
  onConfirm,
  title = 'Delete Project',
  itemName = 'Demo',
  body,
  confirmLabel = 'Yes, Delete!',
  cancelLabel = 'No, Keep It.',
}: DeleteModalProps) {
  // ---- state ----
  // entering/closing drive CSS animation classes.
  // prevOpen + setState-during-render replaces the two [open]-dependent effects.
  const [closing, setClosing] = useState(false)
  const [entering, setEntering] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')
  const [shake, setShake] = useState(false)

  const [prevOpen, setPrevOpen] = useState(open)

  // ---- timer helpers (callback-ref pattern, no effect hooks) ----
  const enterTimer = useTimerRef()
  const closeTimer = useTimerRef()
  const shakeTimer = useTimerRef()
  const loadTimer = useTimerRef()
  const resolveTimer = useTimerRef()

  // ---- derive animation state when `open` flips (replaces two useEffects) ----
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setClosing(false)
      setEntering(true)
      setPhase('idle')
      setShake(false)
      enterTimer.set(600, () => setEntering(false))
    } else {
      setClosing(true)
      closeTimer.set(260, () => setClosing(false))
    }
  }

  // ---- shake → loading → done chain (replaces shakeTimer useEffect + nested setTimeouts) ----
  // Called from the delete button click handler; no effect hook needed.
  function handleConfirm() {
    if (phase !== 'idle') return

    setShake(true)
    shakeTimer.clear()
    shakeTimer.set(430, () => {
      setShake(false)
      setPhase('loading')

      loadTimer.set(1100, () => {
        setPhase('done')

        resolveTimer.set(900, () => {
          onConfirm?.()
          onClose?.()
        })
      })
    })
  }

  // ---- shake reset via animationend (replaces animationend useEffect) ----
  // The card element fires animationend when dm-confirming completes.
  // We reset shake state here, giving us a clean handler-driven approach.
  const handleCardAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (e.animationName === 'dm-shake') setShake(false)
    },
    [],
  )

  // ---- callback refs (replace keyboard/focus effects) ----
  const cardRef = useCardRef({ open, phase, onClose })

  // overlay ref: teardown timers when overlay unmounts
  const clearAll = useCallback(() => {
    enterTimer.clear()
    closeTimer.clear()
    shakeTimer.clear()
    loadTimer.clear()
    resolveTimer.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const overlayRef = useOverlayRef(clearAll)

  // ---- derived values ----
  const isDone = phase === 'done'
  const overlayState = closing ? 'closing' : open ? 'open' : 'closed'

  // ---- confirm button content ----
  const confirmContent =
    phase === 'loading' ? (
      <span className="dm-spinner" aria-hidden="true" />
    ) : phase === 'done' ? (
      <>
        <svg className="dm-ok" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13l4 4 10-11" />
        </svg>
        <span>Deleted</span>
      </>
    ) : (
      <span>{confirmLabel}</span>
    )

  // ---- body copy ----
  const bodyContent = isDone ? (
    <>
      <b>&ldquo;{itemName}&rdquo;</b> has been permanently removed.
    </>
  ) : body ? (
    body(itemName)
  ) : (
    <>
      You&rsquo;re going to delete the <b>&ldquo;{itemName}&rdquo;</b> project. Are you sure?
    </>
  )

  return (
    <div
      ref={overlayRef}
      className={`dm-overlay${entering ? ' dm-anim' : ''}`}
      data-state={overlayState}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && phase === 'idle') onClose?.()
      }}
    >
      <div className="dm-shell">
        <div
          ref={cardRef}
          className={`dm-card${shake ? ' dm-confirming' : ''}`}
          tabIndex={-1}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dm-title"
          aria-describedby="dm-body"
          onAnimationEnd={handleCardAnimationEnd}
        >
          <button
            type="button"
            className="dm-close"
            aria-label="Close"
            onClick={() => phase === 'idle' && onClose?.()}
          >
            <span className={iconClass('close')} aria-hidden="true">
              close
            </span>
          </button>

          <div
            className={`dm-badge icon-badge icon-badge--lg${isDone ? ' dm-badge--done' : ''}`}
            style={{ '--icon-c': isDone ? 'var(--brand-primary-500)' : '#EF4444' } as React.CSSProperties}
            data-done={isDone}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {isDone ? 'check_circle' : 'delete'}
            </span>
          </div>

          <h2 className="dm-title" id="dm-title">
            {isDone ? 'Deleted' : title}
          </h2>

          <p className="dm-body" id="dm-body">
            {bodyContent}
          </p>

          {!isDone && (
            <div className="dm-actions">
              <button
                type="button"
                className="dm-btn btn-discuss"
                disabled={phase !== 'idle'}
                onClick={() => phase === 'idle' && onClose?.()}
              >
                <span className={iconClass('arrow_back')} aria-hidden="true">
                  arrow_back
                </span>
                {cancelLabel}
              </button>
              <button
                type="button"
                className="dm-btn btn-delete"
                disabled={phase !== 'idle'}
                onClick={handleConfirm}
              >
                {phase === 'idle' && (
                  <span className="material-symbols-outlined" aria-hidden="true">
                    delete
                  </span>
                )}
                {confirmContent}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Preview wrapper — default export used by the design-system registry.
// Holds local open state; renders a trigger button + the controlled modal.
// No useEffect.
// ---------------------------------------------------------------------------
function DeleteModalPreview() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="dm-preview-trigger">
        <button
          type="button"
          className="btn-delete dm-preview-btn"
          onClick={() => setOpen(true)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            delete
          </span>
          Delete account
        </button>
      </div>
      <DeleteModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default DeleteModalPreview
