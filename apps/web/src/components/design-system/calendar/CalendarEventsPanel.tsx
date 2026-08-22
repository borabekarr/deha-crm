/**
 * CalendarEventsPanel.tsx
 *
 * Render-only: the scrollable events list for the selected day + the
 * "Add event" row (both the populated and empty states) + the scroll
 * thumb. Scroll tracking state/refs and the open-popover handlers live in
 * the parent.
 */
import type { Ref } from 'react'
import type { CalEvent } from './calendar-shared'

interface Props {
  evScrollState: 'none' | 'top' | 'mid' | 'bottom'
  selKey: string
  evScrollContainerRef: Ref<HTMLDivElement>
  eventsProximityRef: (el: HTMLDivElement | null) => void
  label: string
  cnt: number
  events: CalEvent[]
  openEvPopover: (ev: CalEvent) => void
  openPopover: () => void
  evScrollThumbRef: Ref<HTMLDivElement>
}

export function CalendarEventsPanel({
  evScrollState, selKey, evScrollContainerRef, eventsProximityRef, label, cnt, events, openEvPopover, openPopover, evScrollThumbRef,
}: Props) {
  return (
    <div className="cal-events" data-scroll={evScrollState}>
      <div className="cal-ev-scroll-wrap">
        <div className="cal-ev-scroll" key={selKey} ref={evScrollContainerRef}>
          <div className="cal-events-container" ref={eventsProximityRef}>
            <div className="cal-ev-label">{label}</div>
            {cnt > 0 ? (
              <>
                {events.map((item) => (
                  <button
                    type="button"
                    key={`${item.time}-${item.title}`}
                    className="cal-ev-item"
                    onClick={() => openEvPopover(item)}
                    aria-label={`${item.time} ${item.title}`}
                    data-proximity
                  >
                    <div className="cev-left">
                      <div className="cev-dot" style={{ background: item.dot }} />
                      <span className="cev-time">{item.time}</span>
                      <span className="cev-badge" style={{ backgroundColor: item.color }}>
                        <span className="material-icons">{item.icon}</span>
                        {item.badge}
                      </span>
                      <span className="cev-title">{item.title}</span>
                    </div>
                    <span className="cev-chevron material-icons">chevron_right</span>
                  </button>
                ))}
                <div
                  className="cal-add-row"
                  onClick={openPopover}
                  data-proximity
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopover() } }}
                >
                  <div className="cal-add-icon">
                    <span className="material-icons">add</span>
                  </div>
                  <span className="cal-add-text">Add event</span>
                </div>
              </>
            ) : (
              <>
                <div className="cal-no-events">No events scheduled.</div>
                <div
                  className="cal-add-row"
                  onClick={openPopover}
                  data-proximity
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopover() } }}
                >
                  <div className="cal-add-icon">
                    <span className="material-icons">add</span>
                  </div>
                  <span className="cal-add-text">Add event</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="cal-ev-scrollbar" aria-hidden="true">
        <div className="cal-ev-scrollbar-thumb" ref={evScrollThumbRef} />
      </div>
    </div>
  )
}
