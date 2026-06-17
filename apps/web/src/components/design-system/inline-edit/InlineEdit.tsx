import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './InlineEdit.css'

import { useState, useRef } from 'react'
import { ieRootRef, cleanupIeRoot, ieInputRef, registerSavedTimer } from './inline-edit-hook'

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

  // Holds a ref to the root .ie-field div for timer cleanup on unmount.
  const rootElRef = useRef<HTMLDivElement | null>(null)

  // ----- handlers -----------------------------------------------------------

  function startEdit() {
    if (editing) return
    setSaved(false)
    // Seed draft from the current canonical value (replaces useEffect #1).
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    const next = draft.trim() || value
    setDraft(next)
    onCommit?.(next)
    setEditing(false)
    setSaved(true)
    // Timer set inside handler (event-driven); cleanup stored on root element
    // via registerSavedTimer() so it is cancelled on unmount (replaces useEffect #3).
    registerSavedTimer(rootElRef.current, () => setSaved(false), 2000)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    else if (e.key === 'Escape') { e.preventDefault(); setDraft(value); setEditing(false) }
  }

  // ----- callback ref: root div (timer cleanup on unmount) ------------------
  function handleRootRef(el: HTMLDivElement | null) {
    if (el) {
      rootElRef.current = el
      ieRootRef(el)
    } else {
      cleanupIeRoot(rootElRef.current)
      rootElRef.current = null
    }
  }

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
        {prefix && <span className="ie-prefix">@</span>}

        <input
          // Callback ref: ieInputRef focuses+selects when editing becomes true
          // (replaces useEffect #2).
          ref={(el) => ieInputRef(el, editing)}
          className="ie-input"
          value={editing ? draft : value}
          readOnly={!editing}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          aria-label={fieldLabel}
        />

        <button
          type="button"
          className="ie-act"
          data-mode={editing ? 'save' : 'edit'}
          aria-label={editing ? 'Kaydet' : 'Düzenle'}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (editing) { commit() } else { startEdit() }
          }}
        >
          {/* key forces re-mount so ieIcIn entrance animation re-plays on mode switch */}
          <span className="ie-ic material-symbols-outlined" key={editing ? 'save' : 'edit'}>
            {editing ? 'check' : 'edit'}
          </span>
        </button>
      </div>

      <div className="ie-foot">
        {saved ? (
          <span className="ie-toast" key="toast">
            {/* check_circle is a standard glyph present in material-symbols-outlined */}
            <span className="ie-ic material-symbols-outlined">check_circle</span>
            Kaydedildi
          </span>
        ) : (
          <p className="ie-cap">Tap the pencil to edit your handle.</p>
        )}
      </div>
    </div>
  )
}
