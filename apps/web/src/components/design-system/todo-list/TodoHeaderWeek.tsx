// Render-only split of TodoList's header (month/day + nav) and week strip
// (react-doctor no-giant-component). Class names, DOM order and markup are
// unchanged from the parent; the week pill and its movePill positioning
// stay wired the same way, they just live here now. State/refs stay owned
// by TodoList and arrive here as the same ref objects (mutated in place).
import type { MutableRefObject } from 'react'
import { DOW, movePill } from './todo-list-hook'

interface TodoHeaderWeekProps {
  monthLabel: string
  dayLabel: string
  onNavBy: (delta: 1 | -1) => void
  weekDays: Date[]
  activeIdx: number
  weekCallbackRef: (el: HTMLDivElement | null) => void
  weekElRef: MutableRefObject<HTMLDivElement | null>
  weekPillRef: MutableRefObject<HTMLElement | null>
  onSelectDay: (i: number) => void
}

export function TodoHeaderWeek({
  monthLabel,
  dayLabel,
  onNavBy,
  weekDays,
  activeIdx,
  weekCallbackRef,
  weekElRef,
  weekPillRef,
  onSelectDay,
}: TodoHeaderWeekProps) {
  return (
    <>
      <div className="td-head">
        <div>
          <div className="td-month">{monthLabel}</div>
          <div className="td-day">{dayLabel}</div>
        </div>
        <div className="td-nav">
          <button type="button" aria-label="Previous week" onClick={() => onNavBy(-1)}>
            <span className="material-icons">chevron_left</span>
          </button>
          <button type="button" aria-label="Next week" onClick={() => onNavBy(1)}>
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="td-week" ref={weekCallbackRef}>
        <span
          className="td-week-pill no-anim"
          ref={(el) => {
            weekPillRef.current = el
            if (el && weekElRef.current) {
              movePill(weekElRef.current, el)
              requestAnimationFrame(() => {
                requestAnimationFrame(() => el.classList.remove('no-anim'))
              })
            }
          }}
        />
        {weekDays.map((d, i) => (
          <button
            type="button"
            key={d.toISOString().slice(0, 10)}
            className={'td-daybtn' + (i === activeIdx ? ' active' : '')}
            onClick={() => onSelectDay(i)}
          >
            <span className="dow">{DOW[i]}</span>
            <span className="dnum">{d.getDate()}</span>
          </button>
        ))}
      </div>
    </>
  )
}
