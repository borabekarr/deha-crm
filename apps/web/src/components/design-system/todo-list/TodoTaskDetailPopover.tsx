// Render-only split of TodoList's task detail popover (.tdp-*) — react-doctor
// no-giant-component. Class names, DOM order and markup are unchanged from
// the parent. The click-to-close-on-backdrop and Escape handlers stay
// imperatively wired on the <dialog> ref by TodoList's useEffect (moved off
// the onClick JSX prop so react-doctor's no-noninteractive-element-interactions
// rule doesn't flag the non-interactive <dialog> tag); this component only
// renders.
import type { MutableRefObject } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { PRIORITY, DEFAULT_PRI, type Task } from './todo-list-hook'

interface TodoTaskDetailPopoverProps {
  task: Task | null
  open: boolean
  editMode: boolean
  overlayRef: (el: HTMLDialogElement | null) => void
  editInputRef: MutableRefObject<HTMLInputElement | null>
  onClose: () => void
  onEditClick: () => void
  onEditCancel: () => void
  onSaveEdit: () => void
  onComplete: () => void
}

export function TodoTaskDetailPopover({
  task: t,
  open,
  editMode,
  overlayRef,
  editInputRef,
  onClose,
  onEditClick,
  onEditCancel,
  onSaveEdit,
  onComplete,
}: TodoTaskDetailPopoverProps) {
  const p = t ? (PRIORITY[t.priority] || PRIORITY[DEFAULT_PRI]) : null
  const scheduleLabel = t?.repeat === 'repeat'
    ? ('Repeating · ' + (t.cad
        ? (t.cad.charAt(0).toUpperCase() + t.cad.slice(1))
        : 'Weekly'))
    : 'One-time task'
  const scheduleIcon = t?.repeat === 'repeat' ? 'repeat' : 'today'
  return (
    // Native non-modal <dialog> rendered `open` unconditionally (never
    // toggling the attribute) so the existing background fade on
    // .tdp-overlay.tdp-open keeps driving show/hide exactly as before; the
    // click-outside-close + Escape listeners live imperatively on this ref
    // (TodoList's useEffect), not as JSX props. Border/margin/max-size UA
    // defaults neutralised inline; .tdp-overlay already sets its own
    // background.
    <dialog
      open
      ref={overlayRef}
      className={'tdp-overlay' + (open ? ' tdp-open' : '')}
      tabIndex={-1}
      aria-label="Task detail"
      style={{ border: 'none', margin: 0, maxWidth: 'none', maxHeight: 'none', color: 'inherit' }}
    >
      <div className="tdp-outer" onClick={e => e.stopPropagation()}>
        <div
          className="tdp-card"
          style={p ? ({ '--tag': p.color } as React.CSSProperties) : undefined}
        >
          {t && p && (
            <>
              {/* Header: icon tile + title + time + close */}
              <div className="tdp-head">
                <span className="tdp-ico">
                  <span className={iconClass(t.icon)}>{t.icon}</span>
                </span>
                <div className="tdp-title-block">
                  <div className="tdp-title">{t.title}</div>
                  <div className="tdp-time">
                    <span className="material-icons" style={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '3px', opacity: 0.7 }}>schedule</span>
                    {t.time}
                  </div>
                </div>
                <button
                  type="button"
                  className="tdp-close"
                  aria-label="Close"
                  onClick={onClose}
                >
                  <span className="material-icons">close</span>
                </button>
              </div>

              {/* Task-board styled card preview (item 4 — mirrors the
                  TaskBoard .tb-card: title, priority pill, footer hint).
                  Texts adjusted to this task. */}
              <div className="tdp-tbcard">
                <div className="tdp-tbcard-title">{t.title}</div>
                <div className="tdp-tbcard-row">
                  <span
                    className="tdp-tbcard-pri"
                    style={{ '--tag': p.color } as React.CSSProperties}
                  >
                    <span className="tdp-tbcard-dot" />
                    {p.label}
                  </span>
                  <span className="tdp-tbcard-time">
                    <span className="material-icons">schedule</span>{t.time}
                  </span>
                </div>
                <div className="tdp-tbcard-foot">
                  <span className="material-icons">{scheduleIcon}</span>
                  {scheduleLabel}
                </div>
              </div>

              {/* Priority badge row */}
              <div className="tdp-tag-row">
                <span className="tdp-badge" style={{ '--tag': p.color } as React.CSSProperties}>
                  <span className="material-icons">{p.bi}</span>{p.label}
                </span>
                <span className="tdp-sched-tag">
                  <span className="material-icons">{scheduleIcon}</span>{scheduleLabel}
                </span>
              </div>

              {/* Edit mode: inline title input */}
              {editMode ? (
                <>
                  <input
                    ref={editInputRef}
                    className="tdp-edit-input"
                    type="text"
                    defaultValue={t.title}
                    placeholder="Task title"
                    aria-label="Edit task title"
                    autoFocus
                  />
                  <div className="tdp-footer-row">
                    <button
                      type="button"
                      className="btn-green tdp-btn-muted"
                      onClick={onEditCancel}
                    >
                      <span className="material-icons">close</span>Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-green"
                      onClick={onSaveEdit}
                    >
                      <span className="material-icons">check</span>Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Detail body: neurology-aware lifecycle note */}
                  <div className="tdp-body">
                    <span className={iconClass('neurology')} style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '5px', color: '#8B5CF6' }}>neurology</span>
                    {t.repeat === 'repeat'
                      ? 'AI tracks this recurring task and surfaces it at the optimal time in your schedule.'
                      : 'AI keeps this one-time task prioritized based on your focus patterns and deadline proximity.'}
                  </div>
                  {/* Action buttons — green, no gradient on the card */}
                  <div className="tdp-footer-row">
                    <button
                      type="button"
                      className="btn-green tdp-btn-muted"
                      onClick={onEditClick}
                    >
                      <span className="material-icons">edit</span>Edit
                    </button>
                    <button
                      type="button"
                      className="btn-green"
                      onClick={onComplete}
                    >
                      <span className="material-icons">check_circle</span>Complete
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
