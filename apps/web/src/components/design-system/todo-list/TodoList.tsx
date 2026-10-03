import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './TodoList.css'

import { useRef, useState, useCallback, useEffect } from 'react'
import {
  type Task,
  type PriorityKey,
  type PopState,
  type PopoverElRefs,
  MONTHS,
  DAYNAME,
  startOfWeek,
  changeDay,
  getTasksForDay,
  refreshFilters,
  completeRow,
  updateStats,
  todoMountRef,
  todoCleanupRef,
  afterWeekUpdate,
  slideWeekAnimation,
  moveSegPill,
  syncScheduleDOM,
  syncIconDOM,
  openTaskEditor,
  saveTaskEditor,
  applyTaskTitleEdit,
  resolvePopoverRefs,
} from './todo-list-hook'
import { TodoHeaderWeek } from './TodoHeaderWeek'
import { TodoBodySection } from './TodoBodySection'
import { TodoTaskEditorPopover } from './TodoTaskEditorPopover'
import { TodoTaskDetailPopover } from './TodoTaskDetailPopover'

// ── Component ─────────────────────────────────────────────────────────────────

export default function TodoList() {
  // Current selected date — always today on first load
  const [curDate, setCurDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  // Week days for the current week (Mon–Sun)
  const [weekDays, setWeekDays] = useState<Date[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const mon = startOfWeek(today)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
  })
  // Derive active index from today's day-of-week (Mon=0 … Sun=6)
  const [activeIdx, setActiveIdx] = useState(() => (new Date().getDay() + 6) % 7)

  // Task detail popover state
  const [taskDetailTask, setTaskDetailTask] = useState<Task | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [taskDetailEditMode, setTaskDetailEditMode] = useState(false)
  const tdpEditInputRef = useRef<HTMLInputElement | null>(null)

  function openTaskPopover(task: Task) {
    setTaskDetailTask(task)
    setTaskDetailEditMode(false)
    setTaskDetailOpen(true)
  }

  function closeTaskDetailPopover() {
    setTaskDetailOpen(false)
    setTaskDetailEditMode(false)
  }

  function saveTaskDetailEdit() {
    if (!taskDetailTask) { closeTaskDetailPopover(); return }
    const newTitle = tdpEditInputRef.current?.value.trim()
    if (newTitle && newTitle !== taskDetailTask.title) {
      setTaskDetailTask(prev => prev ? { ...prev, title: newTitle } : prev)
      applyTaskTitleEdit(listRef.current, taskDetailTask.id, newTitle)
    }
    closeTaskDetailPopover()
  }

  function startEditFromDetail() {
    setTaskDetailEditMode(true)
    setTimeout(() => { tdpEditInputRef.current?.select() }, 60)
  }

  function completeFromDetail() {
    closeTaskDetailPopover()
    const listEl = listRef.current
    const t = taskDetailTask
    if (!listEl || !t) return
    const row = listEl.querySelector<HTMLElement>('[data-id="' + t.id + '"]')
    if (row) {
      completeRow(row, listEl, true)
      updateStats(listEl, statDoneRef.current, statWaitRef.current, () => refreshFilters(listEl, filtersRef.current, activeFilterRef.current))
    }
  }

  // Stable callback ref: only stores the node. The keydown + click-outside
  // listeners live in the useEffect below so react-doctor can see the
  // cleanup path (and so the non-interactive <dialog> tag never carries a
  // JSX onClick prop).
  const tdpOverlayElRef = useRef<HTMLDialogElement | null>(null)
  const tdpOverlayRef = useCallback((el: HTMLDialogElement | null) => {
    tdpOverlayElRef.current = el
  }, [])

  useEffect(() => {
    const el = tdpOverlayElRef.current
    if (!el) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTaskDetailPopover() }
    const handleClick = () => closeTaskDetailPopover()
    el.addEventListener('keydown', handleKey)
    el.addEventListener('click', handleClick)
    return () => {
      el.removeEventListener('keydown', handleKey)
      el.removeEventListener('click', handleClick)
    }
     
  }, [])

  // Popover state
  const [popOpen, setPopOpen] = useState(false)
  // popMode/popRow drive imperative DOM only (never rendered in JSX); a ref
  // avoids a wasted rerender on every open/close.
  const popModeRef = useRef<'view' | 'edit' | 'add'>('view')
  const popRowRef = useRef<(HTMLElement & { _task: Task }) | null>(null)
  const [popState, setPopState] = useState<PopState>({
    pri: 'urgent_important' as PriorityKey,
    repeat: 'once',
    cad: 'weekly',
    dow: 1,
    dom: 1,
  })
  // Mirrors popState for the click handlers below (attached imperatively via
  // syncScheduleDOM/renderPrisDOM, outside React's render cycle), so rapid
  // successive clicks always read the latest value instead of a stale
  // render's closure. Written only through setPopStateSynced.
  const popStateRef = useRef(popState)
  function setPopStateSynced(v: PopState) {
    popStateRef.current = v
    setPopState(v)
  }

  // DOM refs
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const statDoneRef = useRef<HTMLElement | null>(null)
  const statWaitRef = useRef<HTMLElement | null>(null)
  const filtersRef = useRef<HTMLDivElement | null>(null)
  const weekElRef = useRef<HTMLDivElement | null>(null)
  const weekPillRef = useRef<HTMLElement | null>(null)
  const btnAddRef = useRef<HTMLButtonElement | null>(null)
  const popTitleRef = useRef<HTMLInputElement | null>(null)
  const popTimeRef = useRef<HTMLInputElement | null>(null)
  const popPrisRef = useRef<HTMLDivElement | null>(null)
  const popIcRef = useRef<HTMLElement | null>(null)
  const popHdRef = useRef<HTMLDivElement | null>(null)
  const popRepBoxRef = useRef<HTMLDivElement | null>(null)
  const popCadsRef = useRef<HTMLDivElement | null>(null)
  const popOnBoxRef = useRef<HTMLDivElement | null>(null)
  const popOnLblRef = useRef<HTMLElement | null>(null)
  const popDaysRef = useRef<HTMLDivElement | null>(null)
  const popDomRef = useRef<HTMLSelectElement | null>(null)
  const popSaveTxtRef = useRef<HTMLElement | null>(null)
  const popSaveIcRef = useRef<HTMLElement | null>(null)
  const segRef = useRef<HTMLDivElement | null>(null)
  const segPillRef = useRef<HTMLSpanElement | null>(null)

  const activeFilterRef = useRef({ current: 'all' })

  const popoverElRefs: PopoverElRefs = {
    segRef, segPillRef, titleRef: popTitleRef, timeRef: popTimeRef, prisRef: popPrisRef,
    icRef: popIcRef, hdRef: popHdRef, repBoxRef: popRepBoxRef, cadsRef: popCadsRef,
    onBoxRef: popOnBoxRef, onLblRef: popOnLblRef, daysRef: popDaysRef, domRef: popDomRef,
    saveTxtRef: popSaveTxtRef, saveIcRef: popSaveIcRef,
  }

  // ── Callback ref for the card container — triggers mount logic ───────────
  const containerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el
    if (el) {
      todoMountRef(el, { list: listRef.current, statDone: statDoneRef.current, statWait: statWaitRef.current, filtersEl: filtersRef.current, weekEl: weekElRef.current }, activeFilterRef.current, openTaskPopover)
    } else {
      todoCleanupRef(el)
    }
  }, [])

  // ── Week pill positioning (called after week DOM is ready) ───────────────
  const weekCallbackRef = useCallback((el: HTMLDivElement | null) => {
    weekElRef.current = el
  }, [])

  // ── Select a day within the current week ─────────────────────────────────
  function handleSelectDay(i: number) {
    const newDate = new Date(weekDays[i])
    setCurDate(newDate)
    setActiveIdx(i)
    afterWeekUpdate(weekElRef.current, weekPillRef.current)
    if (!listRef.current) return
    const tasks = getTasksForDay(newDate)
    changeDay(listRef.current, tasks, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current, openTaskPopover)
  }

  // Move the selection WEEK-BY-WEEK (not day-by-day). The selected
  // day-of-week is preserved across the jump; the week strip slides.
  function navBy(delta: number) {
    curDate.setDate(curDate.getDate() + delta * 7)
    setCurDate(new Date(curDate))
    if (weekElRef.current) {
      slideWeekAnimation(delta > 0 ? 1 : -1, weekElRef.current, curDate, setWeekDays, setActiveIdx, listRef.current, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current, openTaskPopover)
    }
  }

  // ── Popover helpers (DOM writes live in todo-list-hook.ts) ───────────────

  function handleScheduleChange(next: PopState) {
    setPopStateSynced(next)
    syncScheduleDOM(resolvePopoverRefs(popoverElRefs), next, handleScheduleChange, () => popStateRef.current)
  }

  function handlePriChange(newPri: PriorityKey) {
    setPopStateSynced({ ...popStateRef.current, pri: newPri })
    syncIconDOM(popIcRef.current, newPri, popModeRef.current, popRowRef.current)
  }

  function handleSegClick(e: React.MouseEvent) {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-rep]')
    if (!b) return
    const newRep = b.dataset.rep as 'once' | 'repeat'
    moveSegPill(segRef.current, segPillRef.current, newRep)
    handleScheduleChange({ ...popStateRef.current, repeat: newRep })
  }

  function handleDomChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPopState(prev => ({ ...prev, dom: +e.target.value }))
  }

  function openPop(row: (HTMLElement & { _task: Task }) | null, mode: 'view' | 'edit' | 'add') {
    openTaskEditor(row, mode, resolvePopoverRefs(popoverElRefs), popModeRef, popRowRef, setPopStateSynced, handlePriChange, handleScheduleChange, () => popStateRef.current, setPopOpen)
  }

  function closePop() { setPopOpen(false); popRowRef.current = null }

  function handleSave() {
    saveTaskEditor(popState, popModeRef, popRowRef, resolvePopoverRefs(popoverElRefs), listRef.current, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current, openTaskPopover)
    closePop()
  }

  // ── Add button flash ─────────────────────────────────────────────────────
  function handleAddClick() {
    const btn = btnAddRef.current
    if (btn) { btn.classList.remove('flash'); void btn.offsetWidth; btn.classList.add('flash') }
    openPop(null, 'add')
  }

  // ── Derived header values ─────────────────────────────────────────────────
  const monthLabel = MONTHS[curDate.getMonth()] + ' ' + curDate.getDate()
  const dayLabel = DAYNAME[activeIdx]

  // ── Day-of-month options ──────────────────────────────────────────────────
  const domOptions = Array.from({ length: 28 }, (_, i) => (
    <option key={i + 1} value={i + 1}>Day {i + 1}</option>
  ))

  // ── Keyboard close ────────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (taskDetailOpen) { closeTaskDetailPopover(); return }
      closePop()
    }
  }

  return (
    <div className="card" style={{ padding: 0, background: 'var(--bg-app)' }} onKeyDown={handleKeyDown}>
      <div className="frame">
        <div className="shell" style={{ borderRadius: '48px', padding: '8px' }}>
          <section
            className="todo"
            ref={containerCallbackRef}
            aria-label="Daily to-do list"
          >
            <TodoHeaderWeek
              monthLabel={monthLabel}
              dayLabel={dayLabel}
              onNavBy={navBy}
              weekDays={weekDays}
              activeIdx={activeIdx}
              weekCallbackRef={weekCallbackRef}
              weekElRef={weekElRef}
              weekPillRef={weekPillRef}
              onSelectDay={handleSelectDay}
            />

            <TodoBodySection
              statDoneRef={statDoneRef}
              statWaitRef={statWaitRef}
              filtersRef={filtersRef}
              listRef={listRef}
              btnAddRef={btnAddRef}
              onAddClick={handleAddClick}
            />

            <TodoTaskEditorPopover
              refs={popoverElRefs}
              popOpen={popOpen}
              popState={popState}
              domOptions={domOptions}
              closePop={closePop}
              onSegClick={handleSegClick}
              onDomChange={handleDomChange}
              onSave={handleSave}
            />

            <TodoTaskDetailPopover
              task={taskDetailTask}
              open={taskDetailOpen}
              editMode={taskDetailEditMode}
              overlayRef={tdpOverlayRef}
              editInputRef={tdpEditInputRef}
              onClose={closeTaskDetailPopover}
              onEditClick={startEditFromDetail}
              onEditCancel={() => setTaskDetailEditMode(false)}
              onSaveEdit={saveTaskDetailEdit}
              onComplete={completeFromDetail}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
