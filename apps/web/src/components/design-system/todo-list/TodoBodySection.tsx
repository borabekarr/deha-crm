// Render-only split of TodoList's stats/filters/list/bar section
// (react-doctor no-giant-component). Class names, DOM order and markup are
// unchanged from the parent; the list/filters/stats nodes stay imperatively
// managed by todo-list-hook.ts through the same ref objects.
import type { MutableRefObject } from 'react'

interface TodoBodySectionProps {
  statDoneRef: MutableRefObject<HTMLElement | null>
  statWaitRef: MutableRefObject<HTMLElement | null>
  filtersRef: MutableRefObject<HTMLDivElement | null>
  listRef: MutableRefObject<HTMLDivElement | null>
  btnAddRef: MutableRefObject<HTMLButtonElement | null>
  onAddClick: () => void
}

export function TodoBodySection({
  statDoneRef,
  statWaitRef,
  filtersRef,
  listRef,
  btnAddRef,
  onAddClick,
}: TodoBodySectionProps) {
  return (
    <>
      <div className="td-sec">
        <h2>Your tasks</h2>
        <div className="td-stats">
          <span className="td-stat">
            <span className="dot-done"><span className="material-icons">check</span></span>
            <span className="td-stat-lbl">
              <b ref={(el) => { statDoneRef.current = el }}>2</b>completed
            </span>
          </span>
          <span className="td-stat">
            <span className="spin" />
            <span className="td-stat-lbl">
              <b ref={(el) => { statWaitRef.current = el }}>3</b>waiting
            </span>
          </span>
        </div>
      </div>

      <div className="td-filters" ref={(el) => { filtersRef.current = el }} />

      <div className="td-list" ref={(el) => { listRef.current = el }} />
      <div className="td-empty">
        <span className="ee-ico"><span className="material-icons">task_alt</span></span>
        <span className="ee-t">All done for today</span>
        <span className="ee-s">Add a task to keep the momentum going.</span>
      </div>

      <div className="td-bar">
        <button
          type="button"
          className="btn-add"
          ref={btnAddRef}
          onClick={onAddClick}
        >
          <span className="material-icons">add</span>Add Task
        </button>
      </div>
    </>
  )
}
