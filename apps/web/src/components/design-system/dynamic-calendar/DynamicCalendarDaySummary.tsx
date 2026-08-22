// Render-only split of DynamicCalendar's expanded "LEFT — today / selected
// summary + events" panel (react-doctor no-giant-component). Class names,
// DOM order and markup are unchanged from the parent; all state stays in
// DynamicCalendar and arrives here as props.
import { iconClass } from '@/lib/iconClass'
import type { CalEvent } from './DynamicCalendar'
import { fmtRange, sameDay } from './dynamic-calendar-shared'

interface DynamicCalendarDaySummaryProps {
  selected: Date
  today: Date
  nextEvent: CalEvent | null
  eventsToday: CalEvent[]
  onOpenCalendar?: (d?: Date) => void
}

export function DynamicCalendarDaySummary({
  selected,
  today,
  nextEvent,
  eventsToday,
  onOpenCalendar,
}: DynamicCalendarDaySummaryProps) {
  return (
    <div className="dc-left">
      <button
        type="button"
        className="dc-open-cal-btn"
        onClick={(e) => { e.stopPropagation(); onOpenCalendar?.(selected) }}
        aria-label={onOpenCalendar ? 'Open Calendar app' : 'Selected date'}
      >
        <div className="dc-today-row">
          <span className="dc-today-dow">
            {selected.toLocaleDateString('en-US', { weekday: 'short' })}
          </span>
        </div>
        <h2 className="dc-today-num">{selected.getDate()}</h2>
      </button>

      <div className="dc-event-list-wrap">
        <div className="dc-event-list">
          {eventsToday.map((ev, i) => (
            <div
              key={ev.id}
              className={`dc-event-row kind-${ev.kind}${
                sameDay(ev.start, today) && ev.kind === 'event' && nextEvent && ev.id === nextEvent.id
                  ? ' is-focus' : ''
              }`}
              style={{ '--dc-delay': `${120 + i * 70}ms` } as React.CSSProperties}
            >
              {ev.kind === 'bday' ? (
                <span className="dc-glyph">
                  <span className={`dc-icon ${iconClass('cake')}`}>cake</span>
                </span>
              ) : (
                <span className="dc-dot" />
              )}
              <div className="dc-event-row-text">
                <div className="dc-event-row-title">{ev.title}</div>
                {ev.kind === 'event' && (
                  <div className="dc-event-row-time">{fmtRange(ev.start, ev.end)}</div>
                )}
              </div>
            </div>
          ))}
          {eventsToday.length === 0 && (
            <div
              className="dc-more"
              style={{ '--dc-delay': 'var(--duration-fast)' } as React.CSSProperties}
            >
              Nothing scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
