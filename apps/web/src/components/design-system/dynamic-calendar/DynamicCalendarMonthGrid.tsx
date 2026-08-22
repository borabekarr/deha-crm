// Render-only split of DynamicCalendar's expanded "RIGHT — month grid"
// panel (react-doctor no-giant-component). Class names, DOM order and markup
// are unchanged from the parent; all state and refs stay in DynamicCalendar
// and arrive here as props (cellRefs/gridProximityRef are the same ref
// objects/callbacks the parent created, so focus + proximity wiring is
// untouched).
import { iconClass } from '@/lib/iconClass'
import type { GridCell } from './DynamicCalendar'
import { DOW_LABELS, DOW_SHORT, MONTHS, sameDay } from './dynamic-calendar-shared'

interface DynamicCalendarMonthGridProps {
  viewMonth: number
  viewYear: number
  cells: GridCell[]
  today: Date
  selected: Date
  eventDateKeys: Set<string>
  cellRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
  gridProximityRef: (el: HTMLTableElement | null) => void
  onCellKeyDown: (e: React.KeyboardEvent, idx: number) => void
  setSelected: (d: Date) => void
  setViewMonth: (m: number) => void
  setViewYear: (y: number) => void
  prevMonth: () => void
  nextMonth: () => void
}

export function DynamicCalendarMonthGrid({
  viewMonth,
  viewYear,
  cells,
  today,
  selected,
  eventDateKeys,
  cellRefs,
  gridProximityRef,
  onCellKeyDown,
  setSelected,
  setViewMonth,
  setViewYear,
  prevMonth,
  nextMonth,
}: DynamicCalendarMonthGridProps) {
  return (
    <div className="dc-right">
      <div className="dc-month-head">
        <span className="dc-month-name">
          {MONTHS[viewMonth]}
          <span className="dc-year">{viewYear}</span>
        </span>
        <div className="dc-month-nav">
          <button
            type="button"
            className="dc-nav-btn"
            onClick={(e) => { e.stopPropagation(); prevMonth() }}
            aria-label="Previous month"
          >
            <span className={`dc-icon ${iconClass('chevron_left')}`}>chevron_left</span>
          </button>
          <button
            type="button"
            className="dc-nav-btn"
            onClick={(e) => { e.stopPropagation(); nextMonth() }}
            aria-label="Next month"
          >
            <span className={`dc-icon ${iconClass('chevron_right')}`}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* Use a real <table> for the grid so th/td provide the correct semantics
          without needing role="columnheader" / role="gridcell" on divs. */}
      <table
        className="dc-grid"
        role="grid"
        aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
        ref={gridProximityRef}
      >
        <thead>
          <tr>
            {DOW_SHORT.map((d, i) => (
              <th key={DOW_LABELS[i]} scope="col" className="dc-dow">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }, (_, rowIdx) => (
            <tr key={`row-${viewYear}-${viewMonth}-${rowIdx}`}>
              {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((c) => {
                const cellDate = new Date(c.y, c.m, c.d)
                const isToday = sameDay(cellDate, today)
                const isSelected = sameDay(cellDate, selected)
                const cellKey = `${c.y}-${c.m}-${c.d}`
                const hasEvent = eventDateKeys.has(cellKey)
                const idx = rowIdx * 7 + cells.slice(rowIdx * 7, rowIdx * 7 + 7).indexOf(c)
                return (
                  <td key={cellKey} className="dc-cell-td">
                    <button
                      type="button"
                      ref={(el) => { cellRefs.current[idx] = el }}
                      className={[
                        'dc-cell',
                        c.dim && 'dim',
                        isToday && 'today',
                        isSelected && 'selected',
                        hasEvent && !isToday && 'has-event',
                      ].filter(Boolean).join(' ')}
                      aria-pressed={isSelected}
                      aria-label={cellDate.toDateString()}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected(cellDate)
                        if (c.m !== viewMonth) {
                          setViewMonth(c.m)
                          setViewYear(c.y)
                        }
                      }}
                      onKeyDown={(e) => onCellKeyDown(e, idx)}
                      style={{ '--dc-delay': `${120 + idx * 12}ms` } as React.CSSProperties}
                      data-proximity
                    >
                      {c.d}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
