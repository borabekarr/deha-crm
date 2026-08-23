/**
 * CalendarGrid.tsx
 *
 * Render-only: the day-of-week row + the direction-aware month grid stack
 * (departing exit overlay + live in-flow grid). The roving-tabindex state
 * (`gridCellRefs`) and its keydown handler (`handleGridKeyDown`) are owned
 * and computed by the parent (per the roving-tabindex-stays-in-the-parent
 * convention) and only wired here as props, exactly like the day-cell ref
 * callback below only writes into the parent-owned ref map.
 */
import { MONTH_NAMES, getDots, type Cell } from './calendar-shared'
import type { PanelDirectionState } from '../../../lib/hooks/use-panel-direction'
import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from 'react'

interface Props {
  cells: Cell[]
  exitingMonth: { cells: Cell[]; year: number; month: number } | null
  panelState: (index: number) => PanelDirectionState
  monthIndex: number
  curYear: number
  curMonth: number
  gridExitOverlayRef: (el: HTMLDivElement | null) => void
  gridProximityRef: (el: HTMLDivElement | null) => void
  sel: number
  setSel: (day: number) => void
  gridCellRefs: MutableRefObject<Record<number, HTMLDivElement | null>>
  handleGridKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void
}

export function CalendarGrid({
  cells, exitingMonth, panelState, monthIndex, curYear, curMonth,
  gridExitOverlayRef, gridProximityRef, sel, setSel, gridCellRefs, handleGridKeyDown,
}: Props) {
  // Shared cell renderer — reused for the live grid and the departing
  // exit-overlay so the two never diverge in markup. `interactive` disables
  // click/proximity/selection on the overlay copy (pointer-events: none
  // anyway, but keeps state derivation honest for the outgoing month).
  function renderCells(arr: Cell[], y: number, m: number, interactive: boolean) {
    return arr.map((cell) => {
      const dots = cell.m === 'c' ? getDots(y, m, cell.d) : []
      const isSelected = interactive && cell.m === 'c' && cell.d === sel
      const className = [
        'cal-cell',
        cell.m !== 'c' ? 'other-month' : '',
        isSelected ? 'selected' : '',
      ]
        .filter(Boolean)
        .join(' ')

      return (
        <div
          key={`${cell.m}-${cell.d}`}
          className={className}
          ref={interactive && cell.m === 'c' ? (el) => { gridCellRefs.current[cell.d] = el } : undefined}
          role={interactive && cell.m === 'c' ? 'gridcell' : undefined}
          tabIndex={interactive && cell.m === 'c' ? (isSelected ? 0 : -1) : undefined}
          aria-selected={interactive && cell.m === 'c' ? isSelected : undefined}
          onClick={interactive && cell.m === 'c' ? () => setSel(cell.d) : undefined}
          onKeyDown={
            interactive && cell.m === 'c'
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSel(cell.d)
                  }
                }
              : undefined
          }
          data-proximity={interactive && cell.m === 'c' ? true : undefined}
        >
          <div className="cal-date-num">{cell.d}</div>
          <div className="cal-dots">
            {(() => {
              const shown = dots.length > 3 ? dots.slice(0, 3) : dots
              const seen: Record<string, number> = {}
              return shown.map((clr) => {
                seen[clr] = (seen[clr] ?? 0) + 1
                return <div key={`${clr}-${seen[clr]}`} className="cal-dot" style={{ background: clr }} />
              })
            })()}
            {dots.length > 3 && <span className="cal-dot-more">+</span>}
          </div>
        </div>
      )
    })
  }

  return (
    <>
      {/* Day headers */}
      <div className="cal-dow-row">
        <div className="cal-dow">Sun</div>
        <div className="cal-dow">Mon</div>
        <div className="cal-dow">Tue</div>
        <div className="cal-dow">Wed</div>
        <div className="cal-dow">Thu</div>
        <div className="cal-dow">Fri</div>
        <div className="cal-dow">Sat</div>
      </div>

      {/* Calendar grid — direction-aware month switch via the shared
          usePanelDirection() hook + global [data-panel-state] keyframes
          (motion-tabs pattern, dsfb-02 canon): the departing month renders
          as an absolute exit overlay while the live grid enters in-flow. */}
      <div className="cal-grid-stack">
        {exitingMonth && (
          <div
            className="cal-grid"
            data-panel-state={panelState(exitingMonth.year * 12 + exitingMonth.month)}
            ref={gridExitOverlayRef}
          >
            {renderCells(exitingMonth.cells, exitingMonth.year, exitingMonth.month, false)}
          </div>
        )}
        <div
          className="cal-grid"
          data-panel-state={panelState(monthIndex)}
          key={`${curYear}-${curMonth}`}
          ref={gridProximityRef}
          role="grid"
          aria-label={`${MONTH_NAMES[curMonth]} ${curYear}`}
          onKeyDown={handleGridKeyDown}
        >
          {renderCells(cells, curYear, curMonth, true)}
        </div>
      </div>
    </>
  )
}
