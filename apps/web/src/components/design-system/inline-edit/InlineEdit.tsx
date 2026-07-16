import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './InlineEdit.css'

import { useState, useRef, useCallback } from 'react'
import { ieRootRef, cleanupIeRoot, ieInputRef, registerSavedTimer, registerConfirmTimer, registerOutsideListener, cleanupOutsideListener } from './inline-edit-hook'
import { useProximityGroup } from '@/lib/hooks'

// ---------------------------------------------------------------------------
// InlineEdit — inline-editable text handle field
// Port of deha-claude-design-htmls/inline-edit/inline-edit.{html,jsx}
//
// Interaction:
//   • Click field or pen button → enter editing mode (border lifts, emerald ring).
//   • Enter key or check button → commit value, flash ring, show Kaydedildi toast.
//   • Escape key → discard draft, revert to last committed value.
//
// All six source useEffect calls eliminated:
//   #1  draft ← value sync (outside prop)  → draft seeded inside startEdit() handler.
//   #2  focus+select on editing=true        → callback ref ieInputRef().
//   #3  clearTimeout on unmount             → cleanupIeRoot() in root callback ref.
//   #4  App: setValue when t.value changes  → not needed; caller owns value prop.
//   #5  App: dark-mode toggle               → not needed; _darkmode.css system handles it.
//   #6  App: seed value on tweak            → not needed; caller re-renders with new prop.
// ---------------------------------------------------------------------------

export interface InlineEditProps {
  /** Accessible label shown above the field */
  fieldLabel?: string
  /** When true, shows a "@" prefix glyph inside the field */
  prefix?: boolean
  /** Controlled committed value */
  value?: string
  /** Fires when user commits a new value; receives the trimmed string */
  onCommit?: (next: string) => void
}

export default function InlineEdit({
  fieldLabel = 'Kullanıcı adı',
  prefix = true,
  value = 'deha_bora',
  onCommit,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saved, setSaved] = useState(false)
  // true while the save-button press animation is playing (~200ms)
  const [confirming, setConfirming] = useState(false)

  // Holds a ref to the root .ie-field div for timer cleanup on unmount.
  const rootElRef = useRef<HTMLDivElement | null>(null)
  // Direct DOM ref for reading the live input value during commit (avoids stale closure).
  const inputDomRef = useRef<HTMLInputElement | null>(null)
  // Tracks whether the button has ever changed mode; suppresses morph animation
  // on the very first render so icons don't play ieIcIn from cold. State (not a
  // ref) so it can be read during render without tripping react-hooks/refs.
  const [hasToggled, setHasToggled] = useState(false)

  const fieldGroupRef = useProximityGroup<HTMLDivElement>()

  // ----- handlers -----------------------------------------------------------

  // Cancel edit: revert draft to committed value, exit editing, remove outside listener.
  // Same action as Escape key and click-outside.
  function cancelEdit() {
    setDraft(value)
    setEditing(false)
    cleanupOutsideListener(rootElRef.current)
  }

  function startEdit() {
    if (editing) return
    setHasToggled(true)
    setSaved(false)
    // Seed draft from the current canonical value (replaces useEffect #1).
    setDraft(value)
    setEditing(true)
    // Attach a document pointerdown listener that cancels edit when the user
    // clicks outside the field. Wired imperatively (not via useEffect) and
    // stored on the root element for cleanup on unmount via cleanupIeRoot().
    registerOutsideListener(rootElRef.current, cancelEdit)
  }

  function commit() {
    // Read live DOM value to avoid stale React state closure (fixes save-loses-value bug).
    const liveVal = inputDomRef.current?.value ?? draft
    // Required-value guard: empty trim falls back to last committed value.
    const next = liveVal.trim() || value
    setDraft(next)
    onCommit?.(next)
    setEditing(false)
    setConfirming(false)
    setSaved(true)
    // Remove the outside listener now that editing has ended.
    cleanupOutsideListener(rootElRef.current)
    // Timer set inside handler (event-driven); cleanup stored on root element
    // via registerSavedTimer() so it is cancelled on unmount (replaces useEffect #3).
    registerSavedTimer(rootElRef.current, () => setSaved(false), 3000)
  }

  function scheduleCommit() {
    // Play press animation first (.is-confirming), then fire commit after
    // the animation duration (~200ms). Immediate entry (startEdit) is unaffected.
    setConfirming(true)
    registerConfirmTimer(rootElRef.current, commit, 200)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
  }

  // ----- callback ref: root div (timer cleanup on unmount) ------------------
  // STABLE (useCallback []) so React does not detach/reattach it on every
  // render. An inline ref would re-run on each setState, firing cleanupIeRoot
  // and killing in-flight saved/confirm timers — the root cause of the saved
  // badge "staying until clicked" and the press-delay commit never firing.
  const handleRootRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      rootElRef.current = el
      ieRootRef(el)
    } else {
      cleanupIeRoot(rootElRef.current)
      rootElRef.current = null
    }
    fieldGroupRef(el)
  }, [fieldGroupRef])

  // ----- render -------------------------------------------------------------
  return (
    <div className="ie-wrap">
      {fieldLabel && <span className="ie-label">{fieldLabel}</span>}

      <div
        ref={handleRootRef}
        className="ie-field"
        data-editing={String(editing)}
        data-saved={String(saved)}
        onMouseDown={() => { if (!editing) startEdit() }}
      >
        {/*
          Input region and saved-morph are BOTH always mounted (mounted-through-exit).
          CSS data-saved transitions crossfade them: saved=true fades morph in / input
          out; saved=false reverses. The prefix follows the same crossfade.
        */}
        {prefix && <span className="ie-prefix">@</span>}

        <input
          // Callback ref: ieInputRef moves caret to end when editing becomes true
          // (replaces useEffect #2). Also stores direct DOM ref for commit().
          ref={(el) => { inputDomRef.current = el; ieInputRef(el, editing) }}
          className="ie-input"
          value={editing ? draft : value}
          readOnly={!editing}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          aria-label={fieldLabel}
        />

        {/* In-place saved confirmation — always mounted, crossfades via data-saved */}
        <span className="ie-saved-morph" aria-live="polite" aria-hidden={!saved}>
          <span className="ie-ic material-symbols-outlined">check_circle</span>
          Kaydedildi
        </span>

        {/* Cancel button — mounted-through-exit; visible only while editing.
            Occupies done's former position; done slides right as field widens. */}
        <button
          type="button"
          className="ie-cancel"
          data-proximity
          data-visible={String(editing)}
          aria-label="Vazgec"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            cancelEdit()
          }}
        >
          <span className="ie-ic material-symbols-outlined">close</span>
        </button>

        <button
          type="button"
          className={`ie-act${confirming ? ' is-confirming' : ''}`}
          data-proximity
          data-mode={editing ? 'save' : 'edit'}
          data-saved={String(saved)}
          data-ie-ready={hasToggled ? 'true' : undefined}
          aria-label={editing ? 'Kaydet' : 'Duzenle'}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Save press: play press animation first, commit fires after ~200ms.
            // Edit-entry press remains immediate.
            if (editing) { scheduleCommit() } else { startEdit() }
          }}
        >
          {/*
            Both icons stay mounted so the cross-morph (shrink+fade ↔ grow+fade)
            is visible. CSS data-mode selectors drive ieIcOut (exit) + ieIcIn (enter).
          */}
          <span
            className="ie-ic ie-ic--edit material-symbols-outlined"
            aria-hidden={editing}
          >
            edit
          </span>
          <span
            className="ie-ic ie-ic--save material-symbols-outlined"
            aria-hidden={!editing}
          >
            check
          </span>
        </button>
      </div>

      <div className="ie-foot">
        <p className="ie-cap">Tap the pencil to edit your handle.</p>
      </div>
    </div>
  )
}
