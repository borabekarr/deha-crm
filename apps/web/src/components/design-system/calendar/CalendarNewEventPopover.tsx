/**
 * CalendarNewEventPopover.tsx
 *
 * Render-only: the task-creation popover form (title/date/time/color
 * fields + cancel/add actions). `newEvent` state and `commitEvent` live in
 * the parent; this component only takes props and renders identical
 * markup.
 */
import { useCallback } from 'react'
import { B, O, P, INFO, type NewEvent } from './calendar-shared'

interface Props {
  popOpen: boolean
  closePopover: () => void
  newEvent: NewEvent
  setNewEvent: (updater: (n: NewEvent) => NewEvent) => void
  commitEvent: () => void
}

export function CalendarNewEventPopover({ popOpen, closePopover, newEvent, setNewEvent, commitEvent }: Props) {
  // Callback-ref focus instead of `autoFocus` (no-autofocus): this component
  // only mounts the field while popOpen is true, so focusing on ref-attach
  // reproduces the same "focus the title field when the popover opens"
  // behavior with no visible/timing difference.
  const titleInputRef = useCallback((el: HTMLInputElement | null) => { el?.focus() }, [])

  if (!popOpen) return null
  return (
    <div className="cal-popover-backdrop" onClick={closePopover}>
      <div className="cal-popover" onClick={(e) => e.stopPropagation()}>
        <p className="cal-pop-title">New Event</p>

        <div className="cal-pop-field">
          <label className="cal-pop-label" htmlFor="cal-new-title">Title</label>
          <input
            id="cal-new-title"
            aria-label="Title"
            className="cal-pop-input"
            type="text"
            placeholder="Event title"
            value={newEvent.title}
            onChange={(e) => setNewEvent((n) => ({ ...n, title: e.target.value }))}
            ref={titleInputRef}
          />
        </div>

        <div className="cal-pop-field">
          <label className="cal-pop-label" htmlFor="cal-new-date">Date</label>
          <input
            id="cal-new-date"
            aria-label="Date"
            className="cal-pop-input"
            type="date"
            value={newEvent.date}
            onChange={(e) => setNewEvent((n) => ({ ...n, date: e.target.value }))}
          />
        </div>

        <div className="cal-pop-field">
          <label className="cal-pop-label" htmlFor="cal-new-time">Time</label>
          <input
            id="cal-new-time"
            aria-label="Time"
            className="cal-pop-input"
            type="time"
            value={newEvent.time}
            onChange={(e) => setNewEvent((n) => ({ ...n, time: e.target.value }))}
          />
        </div>

        <div className="cal-pop-field">
          <span className="cal-pop-label" id="cal-pop-type-label">Type</span>
          <div className="cal-pop-colors" role="group" aria-labelledby="cal-pop-type-label">
            {[B, O, P].map((c) => (
              <button
                key={c}
                type="button"
                className={`cal-pop-color-btn${newEvent.color === c ? ' active' : ''}`}
                style={{ background: c }}
                onClick={() => setNewEvent((n) => ({ ...n, color: c }))}
                aria-label={INFO[c]?.badge ?? c}
              />
            ))}
          </div>
        </div>

        <div className="cal-pop-actions">
          <button type="button" className="cal-pop-cancel" onClick={closePopover}>Cancel</button>
          <button type="button" className="cal-pop-add" onClick={commitEvent}>Add</button>
        </div>
      </div>
    </div>
  )
}
