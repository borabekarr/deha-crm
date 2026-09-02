// Render-only split of TodoList's task editor popover (.td-scrim + .td-pop
// dialog) — react-doctor no-giant-component. Class names, DOM order and
// markup are unchanged from the parent; all the imperative schedule/priority
// DOM writes live in todo-list-hook.ts and stay wired through the same ref
// objects TodoList owns (passed down here and mutated in place).
import type { PopState, PopoverElRefs } from './todo-list-hook'

interface TodoTaskEditorPopoverProps {
  refs: PopoverElRefs
  popOpen: boolean
  popState: PopState
  domOptions: React.ReactNode
  closePop: () => void
  onSegClick: (e: React.MouseEvent) => void
  onDomChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onSave: () => void
}

export function TodoTaskEditorPopover({
  refs,
  popOpen,
  popState,
  domOptions,
  closePop,
  onSegClick,
  onDomChange,
  onSave,
}: TodoTaskEditorPopoverProps) {
  return (
    <>
      <div
        className={'td-scrim' + (popOpen ? ' show' : '')}
        onClick={closePop}
      />
      <dialog
        open
        className={'td-pop' + (popOpen ? ' show' : '')}
        aria-label="Task editor"
        style={{ margin: 0 }}
      >
        <div className="td-pop-head">
          <span className="td-pop-ic" ref={(el) => { refs.icRef.current = el }}>
            <span className="material-icons">priority_high</span>
          </span>
          <div
            style={{ flex: 1, fontSize: '16px', fontWeight: 900, color: 'var(--fg1)', letterSpacing: '-0.01em' }}
            ref={(el) => { refs.hdRef.current = el }}
          >
            Task details
          </div>
          <button type="button" className="td-pop-x" aria-label="Close" onClick={closePop}>
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="td-pop-scroll">
          <div className="td-pop-label">Task name</div>
          <input
            className="td-pop-input"
            ref={refs.titleRef}
            type="text"
            placeholder="What needs doing?"
            aria-label="Task name"
          />
          <div className="td-pop-label">Tag</div>
          <div className="td-pop-pris" ref={(el) => { refs.prisRef.current = el }} />
          <div className="td-pop-label">Schedule</div>
          <div
            className="seg fill"
            ref={refs.segRef}
            onClick={onSegClick}
          >
            <span className="seg-pill" ref={refs.segPillRef} />
            <button type="button" data-rep="once" className={popState.repeat === 'once' ? 'active' : ''}>One-time</button>
            <button type="button" data-rep="repeat" className={popState.repeat === 'repeat' ? 'active' : ''}>Repeats</button>
          </div>
          {/* Repeat options: container EXTENDS first (grid-rows 0fr→1fr),
              then inner content morphs in — item 16. Mounted-through so the
              collapse transition can play. */}
          <div
            ref={refs.repBoxRef}
            className={'td-rep-box ' + (popState.repeat === 'repeat' ? 'td-rep-open' : 'td-rep-closed')}
          >
            <div className="td-rep-inner">
              <div className="td-pop-label">Repeat every</div>
              <div className="td-pop-cads" ref={(el) => { refs.cadsRef.current = el }} />
              <div ref={refs.onBoxRef}>
                <div className="td-pop-label" ref={(el) => { refs.onLblRef.current = el }}>On</div>
                <div className="td-pop-days" ref={(el) => { refs.daysRef.current = el }} />
                <select
                  className="td-pop-select"
                  ref={refs.domRef}
                  hidden
                  onChange={onDomChange}
                >
                  {domOptions}
                </select>
              </div>
            </div>
          </div>
          <div className="td-pop-label">Time</div>
          <input
            className="td-pop-input"
            ref={refs.timeRef}
            type="text"
            placeholder="2:00 PM"
            aria-label="Task time"
          />
        </div>
        <button type="button" className="td-pop-save" onClick={onSave}>
          <span className="material-icons" ref={(el) => { refs.saveIcRef.current = el }}>check</span>
          <span ref={(el) => { refs.saveTxtRef.current = el }}>Save changes</span>
        </button>
      </dialog>
    </>
  )
}
