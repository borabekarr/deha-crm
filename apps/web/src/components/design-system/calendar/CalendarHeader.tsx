/**
 * CalendarHeader.tsx
 *
 * Render-only: month/year title + event count + today/prev/next nav
 * buttons. State (curYear/curMonth) and the nav handlers live in the
 * parent; this component only takes props and renders identical markup.
 */
import { MONTH_NAMES, countMonthEvents } from './calendar-shared'

interface Props {
  curMonth: number
  curYear: number
  isViewingToday: boolean
  goToday: () => void
  prevMonth: () => void
  nextMonth: () => void
}

export function CalendarHeader({ curMonth, curYear, isViewingToday, goToday, prevMonth, nextMonth }: Props) {
  return (
    <div className="cal-header">
      <div className="cal-title-area">
        <span className="cal-month-yr">{MONTH_NAMES[curMonth]} {curYear}</span>
        <span className="cal-count">{countMonthEvents(curYear, curMonth)}</span>
      </div>
      <div className="cal-actions">
        <button
          type="button"
          className={`cal-today-btn${isViewingToday ? ' is-today' : ''}`}
          onClick={goToday}
        >
          Today
        </button>
        <button type="button" className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month">
          <span className="material-icons">chevron_left</span>
        </button>
        <button type="button" className="cal-nav-btn" onClick={nextMonth} aria-label="Next month">
          <span className="material-icons">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
