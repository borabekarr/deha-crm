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

import { useState, useCallback, useRef, type ReactNode } from 'react'
import { iconClass } from '../../../lib/iconClass'
import {
  useTimerRef,
  useOverlayRef,
  useDialogCancelListener,
  useDialogCloseTimer,
  useDialogBackdropDismiss,
} from './delete-modal-hook'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '@/lib/hooks'
import { tokenMs } from '@/lib/token-ms'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import '../../../../design-system/preview/_shared-feedback.css'
import { Button } from '@/components/design-system/buttons/Buttons'
import './DeleteModal.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DeleteModalProps {
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
function DeleteModal({
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
  const dialogElRef = useRef<HTMLDialogElement | null>(null)

  // ---- timer helpers (callback-ref pattern, no effect hooks) ----
  const enterTimer = useTimerRef()
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
      if (dialogElRef.current && !dialogElRef.current.open) dialogElRef.current.showModal()
      // MIRROR: DeleteModal.css longest staggered entrance leg (dm-actions:
      // 260ms delay + duration-expand 460ms = 720ms).
      enterTimer.set(720, () => setEntering(false))
    } else {
      // The dialog stays open (native `open` attribute) through the CSS exit
      // leg; useDialogCloseTimer below owns the actual dialog.close() call.
      setClosing(true)
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

        // Deleted state stays visible ~1.9s before the modal closes (was
        // 900ms) so the crossfade + badge pop have time to read as a
        // deliberate confirmation beat, not a flash.
        resolveTimer.set(1900, () => {
          onConfirm?.()
          onClose?.()
        })
      })
    })
  }

  // ---- shake reset via animationend (replaces animationend useEffect) ----
  // The shell fires animationend when dm-confirming/dm-shake completes (the
  // shake now targets the outer shell, not just the inner card).
  // We reset shake state here, giving us a clean handler-driven approach.
  const handleShellAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (e.animationName === 'dm-shake') setShake(false)
    },
    [],
  )

  // ---- callback refs (native <dialog> gives Esc + focus-trap + open-focus
  // for free; we only keep squircle/proximity hover wiring here) ----
  const squircleRef = useSquircle<HTMLDivElement>()
  const shellSquircleRef = useSquircle<HTMLDivElement>()
  const proxRef = useProximityGroup<HTMLDivElement>()
  const setCardRefs = useCallback(
    (el: HTMLDivElement | null) => {
      squircleRef(el)
      proxRef(el)
    },
    [squircleRef, proxRef],
  )

  // overlay ref: teardown timers when overlay unmounts
  const clearAll = useCallback(() => {
    enterTimer.clear()
    shakeTimer.clear()
    loadTimer.clear()
    resolveTimer.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const overlayRef = useOverlayRef(clearAll)
  // Stable identity (empty-ish deps via [overlayRef], itself stable) so React
  // does not detach/reattach this ref on every re-render -- an inline arrow
  // ref here caused overlayRef(null) -> clearAll() to fire on every render,
  // cancelling the pending close timer before it could ever run.
  const setDialogRef = useCallback(
    (el: HTMLDialogElement | null) => {
      dialogElRef.current = el
      overlayRef(el)
    },
    [overlayRef],
  )
  // cancel = native Escape; intercept so the CSS exit leg plays before close()
  useDialogCancelListener(dialogElRef, { phase, onClose })
  // Owns the exit-leg timer: after --overlay-morph-exit-dur (+ settle
  // buffer), flips `closing` back off and calls dialog.close().
  useDialogCloseTimer(dialogElRef, closing, tokenMs('--overlay-morph-exit-dur', 240) + 20, setClosing)
  // Backdrop click: the dialog is its own scrim, so dismissal is wired via a
  // native listener (not a JSX handler prop) from the hook file.
  useDialogBackdropDismiss(dialogElRef, { phase, onClose })

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
    <dialog
      ref={setDialogRef}
      className={`dm-overlay${entering ? ' dm-anim' : ''}`}
      data-state={overlayState}
      // Neutralise the UA <dialog> box model (border/margin/max-size); the
      // scrim background + padding stay entirely CSS-owned in DeleteModal.css
      // (`.dm-overlay`), unchanged.
      style={{ border: 'none', margin: 0, maxWidth: 'none', maxHeight: 'none', color: 'inherit' }}
      aria-labelledby="dm-title"
      aria-describedby="dm-body"
    >
      <div
        ref={shellSquircleRef}
        className={`dm-shell${shake ? ' dm-confirming' : ''}`}
        onAnimationEnd={handleShellAnimationEnd}
      >
        <div
          ref={setCardRefs}
          className="dm-card"
          data-done={isDone}
        >
          <button
            type="button"
            className="dm-close"
            data-proximity
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
            <span className="material-symbols-outlined dm-badge-icon" aria-hidden="true">
              {isDone ? 'check_circle' : 'delete'}
            </span>
          </div>

          <h2 className="dm-title" id="dm-title">
            {isDone ? 'Deleted' : title}
          </h2>

          <p className="dm-body" id="dm-body">
            {bodyContent}
          </p>

          {/* Always mounted -- never conditionally unmounted on isDone, so the
              exit fade below can actually play (a removed subtree cannot
              animate) and the card's reserved height never snaps shorter. */}
          <div className={`dm-actions${isDone ? ' dm-actions--done' : ''}`}>
            <Button
              variant="discuss"
              className="dm-btn"
              disabled={phase !== 'idle'}
              onClick={() => phase === 'idle' && onClose?.()}
            >
              <span className={iconClass('arrow_back')} aria-hidden="true">
                arrow_back
              </span>
              {cancelLabel}
            </Button>
            <Button
              variant="delete"
              className="dm-btn"
              disabled={phase !== 'idle'}
              onClick={handleConfirm}
            >
              {phase === 'idle' && (
                <span className="material-symbols-outlined" aria-hidden="true">
                  delete
                </span>
              )}
              {confirmContent}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

// ---------------------------------------------------------------------------
// Preview wrapper — default export used by the design-system registry.
// Holds local open state; renders a trigger button + the controlled modal.
// No useEffect.
// ---------------------------------------------------------------------------
function DeleteModalPreview() {
  const [open, setOpen] = useState(false)
  const triggerProxRef = useProximityGroup<HTMLDivElement>()

  return (
    <>
      <div className="dm-preview-trigger" ref={triggerProxRef}>
        <Button
          variant="delete"
          className="dm-preview-btn"
          onClick={() => setOpen(true)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            delete
          </span>
          Delete account
        </Button>
      </div>
      <DeleteModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default DeleteModalPreview
