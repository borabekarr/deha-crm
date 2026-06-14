import { useState, useRef, useCallback } from 'react'
import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './AiMemoryCard.css'

// ── Static content (verbatim from prototype) ─────────────────────────────────

const SINGLE_MEMORY = {
  title: 'New memory added',
  memories: [
    {
      label: 'Memory',
      text: 'Is a professional designer leading teams building AI products. They are researching AI UX patterns, especially memory and adaptive interfaces, and apply this work across the full product lifecycle from concept to production.',
    },
  ],
}

const MULTI_MEMORY = {
  title: '2 memories added',
  memories: [
    {
      label: 'Memory 1',
      text: 'Prefers concise, bullet-point responses when reviewing technical specifications or implementation plans.',
    },
    {
      label: 'Memory 2',
      text: 'Works primarily in real estate CRM with a focus on lead scoring and AI-assisted pipeline management.',
    },
  ],
}

// ── Auto-grow textarea helper ─────────────────────────────────────────────────

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MemoryBlockProps {
  label: string
  text: string
}

function MemoryBlock({ label, text }: MemoryBlockProps) {
  const [editing, setEditing] = useState(false)
  const [committed, setCommitted] = useState(text)
  const [draft, setDraft] = useState(text)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Callback ref: auto-grow on mount + whenever editing opens
  const textareaCallbackRef = useCallback((el: HTMLTextAreaElement | null) => {
    textareaRef.current = el
    if (el) {
      // Defer one frame so the CSS transition has started
      requestAnimationFrame(() => autoGrow(el))
    }
  }, [])

  const isDirty = draft !== committed

  function handleEdit() {
    setDraft(committed)
    setEditing(true)
  }

  function handleSave() {
    if (!isDirty) return
    setCommitted(draft)
    setEditing(false)
  }

  function handleRevert() {
    if (!isDirty) return
    setDraft(committed)
    setEditing(false)
  }

  function handleClearAll() {
    // Clears textarea text, keeps edit mode open
    setDraft('')
    if (textareaRef.current) {
      requestAnimationFrame(() => autoGrow(textareaRef.current!))
    }
  }

  function handleClose() {
    setDraft(committed)
    setEditing(false)
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value)
    autoGrow(e.target)
  }

  return (
    <div className="mem-block">
      <div className={`mem-content${editing ? ' mem-content--editing' : ''}`}>
        {/* Close button — top-right when in edit mode */}
        {editing && (
          <button
            type="button"
            className="mem-block-close-btn"
            aria-label="Cancel edit"
            onClick={handleClose}
          >
            <span className="material-icons">close</span>
          </button>
        )}
        <div className="mem-content-top">
          <span className="mem-num-tag">
            <span className="material-icons">memory</span>
            {label}
          </span>
          {!editing && (
            <button type="button" className="mem-edit-btn" onClick={handleEdit}>
              <span className="material-icons">edit</span>
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="mem-edit-zone">
            <textarea
              ref={textareaCallbackRef}
              className="mem-edit-textarea"
              value={draft}
              onChange={handleTextareaChange}
              aria-label={`Edit memory: ${label}`}
            />
            <div className="mem-edit-actions">
              <button
                type="button"
                className="mem-action-btn mem-action-clear"
                onClick={handleClearAll}
              >
                <span className="material-icons">clear_all</span>
                Clear all
              </button>
              <button
                type="button"
                className={`mem-action-btn mem-action-revert${!isDirty ? ' mem-action-btn--disabled' : ''}`}
                onClick={handleRevert}
                disabled={!isDirty}
                aria-disabled={!isDirty}
              >
                <span className="material-icons">undo</span>
                Revert changes
              </button>
              <button
                type="button"
                className={`mem-action-btn mem-action-save${!isDirty ? ' mem-action-btn--disabled' : ''}`}
                onClick={handleSave}
                disabled={!isDirty}
                aria-disabled={!isDirty}
              >
                <span className="material-icons">check</span>
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="mem-text">{committed}</p>
        )}
      </div>
    </div>
  )
}

interface MemCardProps {
  title: string
  memories: { label: string; text: string }[]
}

function MemCard({ title, memories }: MemCardProps) {
  const [closed, setClosed] = useState(false)
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false)

  if (closed) return null

  return (
    <div className="mem-outer">
      {/* (e/f) Close button repositioned to bottom-left, slightly inset */}
      <button
        type="button"
        className="mem-close-btn"
        aria-label="Close"
        onClick={() => setClosed(true)}
      >
        <span className="material-icons">close</span>
      </button>
      <div className="mem-card">
        <div className="mem-card-body">
          <div className="mem-head">
            <div className="mem-head-row">
              <span className="mem-head-icon-tag">
                <span className="material-icons">tips_and_updates</span>
              </span>
              <span className="mem-head-title">{title}</span>
            </div>
          </div>
          {memories.map((m) => (
            <MemoryBlock key={m.label} label={m.label} text={m.text} />
          ))}
        </div>
        <div className="mem-footer">
          <span className="mem-footer-label">Manage all memories</span>
          <span className="material-icons mem-footer-arrow">chevron_right</span>
          <div className="mem-footer-right">
            {/* (g) Red "Delete all" destructive button — bigger/thicker */}
            <button
              type="button"
              className="mem-delete-all-tag"
              onClick={() => setDeletePopoverOpen(true)}
            >
              <span className="material-icons">delete_forever</span>
              Delete all
            </button>
            {deletePopoverOpen && (
              <div className="mem-delete-popover">
                <div className="mem-delete-popover-inner">
                  <span className="mem-delete-warning-tag">
                    <span className="material-icons">warning</span>
                    you sure you wanna delete permanently? this action can&apos;t be untaken
                  </span>
                  <div className="mem-delete-popover-btns">
                    <button
                      type="button"
                      className="mem-action-btn mem-action-revert"
                      onClick={() => setDeletePopoverOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="mem-delete-forever-tag"
                      onClick={() => {
                        setClosed(true)
                        setDeletePopoverOpen(false)
                      }}
                    >
                      <span className="material-icons">delete_forever</span>
                      Delete forever
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AiMemoryCard() {
  return (
    <div
      className="card"
      style={{
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        background: '#F8FAFC',
        backgroundImage:
          'radial-gradient(ellipse at top right, rgba(16,185,129,0.06) 0%, #F8FAFC 55%)',
      }}
    >
      <MemCard title={SINGLE_MEMORY.title} memories={SINGLE_MEMORY.memories} />
      <MemCard title={MULTI_MEMORY.title} memories={MULTI_MEMORY.memories} />
    </div>
  )
}
