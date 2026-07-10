import { useState, useRef, useCallback } from 'react'
import { useAutoHeight } from '../../../lib/hooks/use-auto-height'
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
  onDelete: () => void
}

function MemoryBlock({ label, text, onDelete }: MemoryBlockProps) {
  const [editing, setEditing] = useState(false)
  // originalText: the text at the time the card was opened (never mutated by save)
  const [originalText] = useState(text)
  // committed: what is displayed (may differ from original after save)
  const [committed, setCommitted] = useState(text)
  const [draft, setDraft] = useState(text)
  // hasSavedEdit: true once user has saved a change; keeps revert active
  const [hasSavedEdit, setHasSavedEdit] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { ref: editZoneRef } = useAutoHeight<HTMLDivElement>({ open: editing })

  // Callback ref: auto-grow on mount + whenever editing opens
  const textareaCallbackRef = useCallback((el: HTMLTextAreaElement | null) => {
    textareaRef.current = el
    if (el) {
      requestAnimationFrame(() => autoGrow(el))
    }
  }, [])

  // draft differs from committed (text has changed since edit opened)
  const isDirty = draft !== committed
  // save is also blocked when text is empty
  const canSave = isDirty && draft.trim() !== ''
  // revert is active if draft differs from committed OR if there's a prior saved edit
  const canRevert = isDirty || hasSavedEdit

  function handleEdit() {
    setDraft(committed)
    setEditing(true)
  }

  function handleSave() {
    if (!canSave) return
    setCommitted(draft)
    setHasSavedEdit(true)
    setEditing(false)
  }

  function handleRevert() {
    if (!canRevert) return
    // Revert to original text (before any edits were saved)
    setDraft(originalText)
    setCommitted(originalText)
    setHasSavedEdit(false)
    setEditing(false)
  }

  function handleClearAll() {
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
        {/* Block-level close button — always mounted, fades in/out via CSS class */}
        <button
          type="button"
          className={`mem-block-close-btn${editing ? ' mem-block-close-btn--visible' : ' mem-block-close-btn--hidden'}`}
          aria-label="Cancel edit"
          aria-hidden={!editing}
          tabIndex={editing ? 0 : -1}
          onClick={handleClose}
        >
          <span className="material-icons">close</span>
        </button>
        <div className="mem-content-top">
          <span className="mem-num-tag">
            <span className="material-icons">memory</span>
            {label}
          </span>
          <div className="mem-content-actions">
            {/* Edit button — always mounted, fades out when editing */}
            <button
              type="button"
              className={`mem-edit-btn${editing ? ' mem-edit-btn--hidden' : ' mem-edit-btn--visible'}`}
              aria-hidden={editing}
              tabIndex={editing ? -1 : 0}
              onClick={handleEdit}
            >
              <span className="material-icons">edit</span>
              Edit
            </button>
            {/* Inline delete button — soft red, always visible, styled like delete-all */}
            <button
              type="button"
              className="mem-inline-delete-btn"
              aria-label={`Delete ${label}`}
              tabIndex={0}
              onClick={onDelete}
            >
              <span className="material-icons">delete</span>
            </button>
          </div>
        </div>
        {/* Committed text — always mounted, hides when editing */}
        <p className={`mem-text${editing ? ' mem-text--hidden' : ' mem-text--visible'}`}>
          {committed}
          {hasSavedEdit && (
            <span className="mem-edited-badge">edited</span>
          )}
        </p>
        {/* Edit zone — always mounted, reveals when editing */}
        <div
          ref={editZoneRef}
          className={`mem-edit-zone${editing ? ' mem-edit-zone--open' : ' mem-edit-zone--closed'}`}
        >
          <textarea
            ref={textareaCallbackRef}
            className="mem-edit-textarea"
            value={draft}
            onChange={handleTextareaChange}
            aria-label={`Edit memory: ${label}`}
            tabIndex={editing ? 0 : -1}
          />
          <div className="mem-edit-actions">
            <button
              type="button"
              className="mem-action-btn mem-action-clear"
              onClick={handleClearAll}
              tabIndex={editing ? 0 : -1}
            >
              <span className="material-icons">clear_all</span>
              Clear all
            </button>
            <button
              type="button"
              className={`mem-action-btn mem-action-revert${!canRevert ? ' mem-action-btn--disabled' : ''}`}
              onClick={handleRevert}
              disabled={!canRevert}
              aria-disabled={!canRevert}
              tabIndex={editing ? 0 : -1}
            >
              <span className="material-icons">undo</span>
              Revert changes
            </button>
            <button
              type="button"
              className={`mem-action-btn mem-action-save${!canSave ? ' mem-action-btn--disabled' : ''}`}
              onClick={handleSave}
              disabled={!canSave}
              aria-disabled={!canSave}
              tabIndex={editing ? 0 : -1}
            >
              <span className="material-icons">check</span>
              Save
            </button>
          </div>
        </div>
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
  const [memoryList, setMemoryList] = useState(memories)

  function handleDeleteMemory(index: number) {
    setMemoryList(prev => prev.filter((_, i) => i !== index))
  }

  if (closed) return null

  return (
    <div className="mem-outer">
      <div className="mem-card">
        <div className="mem-card-body">
          {/* Header row — title + close button on same line */}
          <div className="mem-head">
            <div className="mem-head-row">
              <span className="mem-head-icon-tag">
                <span className="material-icons">tips_and_updates</span>
              </span>
              <span className="mem-head-title">{title}</span>
              {/* Close button — inline on title line, not absolutely positioned */}
              <button
                type="button"
                className="mem-close-btn"
                aria-label="Close"
                onClick={() => setClosed(true)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
          </div>
          {memoryList.map((m, i) => (
            <MemoryBlock
              key={m.label}
              label={m.label}
              text={m.text}
              onDelete={() => handleDeleteMemory(i)}
            />
          ))}
        </div>
        <div className="mem-footer">
          <span className="mem-footer-label">Manage all memories</span>
          <span className="material-icons mem-footer-arrow">chevron_right</span>
          <div className="mem-footer-right">
            {/* Red "Delete all" destructive button */}
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
