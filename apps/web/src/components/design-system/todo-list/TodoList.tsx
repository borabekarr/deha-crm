import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './TodoList.css'

import { useRef, useState, useCallback } from 'react'
import { iconClass } from '../../../lib/iconClass'
import {
  type TodoRefs,
  type Task,
  type PriorityKey,
  PRIORITY,
  DEFAULT_PRI,
  DOW,
  DAYNAME,
  MONTHS,
  CADS,
  CADLBL,
  DOWS,
  badgeHTML,
  startOfWeek,
  movePill,
  changeDay,
  getTasksForDay,
  insertTask,
  updateStats,
  refreshFilters,
  completeRow,
  todoMountRef,
  todoCleanupRef,
  nextUid,
} from './todo-list-hook'

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
      taskDetailTask.title = newTitle
      // Update the DOM row title if visible
      const listEl = listRef.current
      if (listEl) {
        const row = listEl.querySelector<HTMLElement>('[data-id="' + taskDetailTask.id + '"]')
        if (row) {
          const titleEl = row.querySelector<HTMLElement>('.t-title')
          if (titleEl) titleEl.textContent = newTitle
        }
      }
    }
    closeTaskDetailPopover()
  }

  // Callback ref: attaches Escape key listener for task detail popover
  const tdpOverlayRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeTaskDetailPopover() }
    el.addEventListener('keydown', handler)
    // Store cleanup on the element for GC safety (component is long-lived)
    ;(el as HTMLDivElement & { _tdpCleanup?: () => void })._tdpCleanup?.()
    ;(el as HTMLDivElement & { _tdpCleanup?: () => void })._tdpCleanup = () => el.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Popover state
  const [popOpen, setPopOpen] = useState(false)
  const [popMode, setPopMode] = useState<'view' | 'edit' | 'add'>('view')
  const [popRow, setPopRow] = useState<(HTMLElement & { _task: Task }) | null>(null)
  const [popState, setPopState] = useState({
    pri: DEFAULT_PRI as PriorityKey,
    repeat: 'once' as 'once' | 'repeat',
    cad: 'weekly',
    dow: 1,
    dom: 1,
  })

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

  function getRefs(): TodoRefs {
    return {
      list: listRef.current,
      statDone: statDoneRef.current,
      statWait: statWaitRef.current,
      filtersEl: filtersRef.current,
      weekEl: weekElRef.current,
    }
  }

  // ── Callback ref for the card container — triggers mount logic ───────────
  const containerCallbackRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el
    if (el) {
      todoMountRef(el, getRefs(), activeFilterRef.current, openTaskPopover)
    } else {
      todoCleanupRef(el)
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Week pill positioning (called after week DOM is ready) ───────────────
  const weekCallbackRef = useCallback((el: HTMLDivElement | null) => {
    weekElRef.current = el
  }, [])

  // Rebuild week days array for the given date's week
  function computeWeekForDate(d: Date): { days: Date[], idx: number } {
    const mon = startOfWeek(d)
    const days = Array.from({ length: 7 }, (_, i) => {
      const x = new Date(mon); x.setDate(mon.getDate() + i); return x
    })
    return { days, idx: (d.getDay() + 6) % 7 }
  }

  // ── Week pill move after state change ────────────────────────────────────
  function afterWeekUpdate() {
    requestAnimationFrame(() => {
      if (weekElRef.current && weekPillRef.current) {
        movePill(weekElRef.current, weekPillRef.current)
        requestAnimationFrame(() => {
          weekPillRef.current?.classList.remove('no-anim')
        })
      }
    })
  }

  // ── Select a day within the current week ─────────────────────────────────
  function handleSelectDay(i: number) {
    const newDate = new Date(weekDays[i])
    setCurDate(newDate)
    setActiveIdx(i)
    afterWeekUpdate()
    if (!listRef.current) return
    const tasks = getTasksForDay(newDate)
    changeDay(listRef.current, tasks, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current, openTaskPopover)
  }

  // ── Week slide animation ──────────────────────────────────────────────────
  function slideWeek(dir: 1 | -1) {
    const weekEl = weekElRef.current
    if (!weekEl) return
    const outX = dir > 0 ? -34 : 34
    weekEl.style.transition = 'transform 200ms cubic-bezier(.4,0,.6,1), opacity 200ms ease'
    weekEl.style.transform = 'translateX(' + outX + 'px)'
    weekEl.style.opacity = '0'
    setTimeout(() => {
      const { days, idx } = computeWeekForDate(curDate)
      setWeekDays(days)
      setActiveIdx(idx)
      const tasks = getTasksForDay(curDate)
      if (listRef.current) {
        changeDay(listRef.current, tasks, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current, openTaskPopover)
      }
      weekEl.style.transition = 'none'
      weekEl.style.transform = 'translateX(' + (-outX) + 'px)'
      weekEl.style.opacity = '0'
      void weekEl.offsetWidth
      weekEl.style.transition = 'transform 380ms cubic-bezier(.22,1,.36,1), opacity 300ms ease'
      weekEl.style.transform = 'translateX(0)'
      weekEl.style.opacity = '1'
      setTimeout(() => { weekEl.style.transition = ''; weekEl.style.transform = '' }, 400)
    }, 200)
  }

  // Move the selection WEEK-BY-WEEK (not day-by-day). The selected
  // day-of-week is preserved across the jump; the week strip slides.
  function navBy(delta: number) {
    curDate.setDate(curDate.getDate() + delta * 7)
    setCurDate(new Date(curDate))
    slideWeek(delta > 0 ? 1 : -1)
  }

  // ── Popover helpers ───────────────────────────────────────────────────────

  // Position the sliding black .seg-pill under the active repeat button.
  // (_controls.js drives this on static pages; here we drive it ourselves so
  //  the black active pill is actually visible — item 9.)
  function moveSegPill(repeat: 'once' | 'repeat') {
    const seg = segRef.current
    const pill = segPillRef.current
    if (!seg || !pill) return
    const btn = seg.querySelector<HTMLElement>('[data-rep="' + repeat + '"]')
    if (!btn) return
    pill.style.width = btn.offsetWidth + 'px'
    pill.style.left = btn.offsetLeft + 'px'
  }

  // Slide the frequency-selector pill under the active cadence chip.
  function moveFreqPill() {
    const wrap = popCadsRef.current
    if (!wrap) return
    const pill = wrap.querySelector<HTMLElement>('.td-freq-pill')
    const active = wrap.querySelector<HTMLElement>('.td-freq-opt.on')
    if (!pill || !active) return
    pill.style.width = active.offsetWidth + 'px'
    pill.style.left = active.offsetLeft + 'px'
  }

  function syncScheduleDOM(st: typeof popState) {
    const rep = st.repeat === 'repeat'
    // Container open/close is class-driven (item 16) — handled in JSX via
    // popState.repeat; we only populate inner content when repeating.
    if (!rep) return
    const { cad, dow, dom } = st
    if (cad === 'daily') {
      if (popOnBoxRef.current) popOnBoxRef.current.hidden = true
    } else if (cad === 'weekly') {
      if (popOnBoxRef.current) { popOnBoxRef.current.hidden = false }
      if (popOnLblRef.current) popOnLblRef.current.textContent = 'On'
      if (popDaysRef.current) popDaysRef.current.hidden = false
      if (popDomRef.current) popDomRef.current.hidden = true
    } else {
      if (popOnBoxRef.current) { popOnBoxRef.current.hidden = false }
      if (popOnLblRef.current) popOnLblRef.current.textContent = 'On day'
      if (popDaysRef.current) popDaysRef.current.hidden = true
      if (popDomRef.current) { popDomRef.current.hidden = false; popDomRef.current.value = String(dom) }
    }
    // Render days
    if (popDaysRef.current) {
      popDaysRef.current.innerHTML = DOWS.map((d, i) =>
        '<button type="button" class="td-pop-dow' + (i === dow ? ' on' : '') + '" data-dow="' + i + '">' + d + '</button>'
      ).join('')
      popDaysRef.current.querySelectorAll<HTMLElement>('[data-dow]').forEach(b => {
        b.addEventListener('click', () => {
          const newDow = +b.dataset.dow!
          setPopState(prev => {
            const next = { ...prev, dow: newDow }
            syncScheduleDOM(next)
            return next
          })
        })
      })
    }
    // Render the frequency selector (item 17) — segmented chips + sliding pill.
    if (popCadsRef.current) {
      const exists = popCadsRef.current.querySelector('.td-freq-track')
      if (!exists) {
        popCadsRef.current.innerHTML =
          '<div class="td-freq-track">' +
            '<span class="td-freq-pill"></span>' +
            CADS.map(c =>
              '<button type="button" class="td-freq-opt' + (c === cad ? ' on' : '') + '" data-cad="' + c + '">' +
                '<span class="td-freq-lbl">' + CADLBL[c] + '</span>' +
              '</button>'
            ).join('') +
          '</div>'
        popCadsRef.current.querySelectorAll<HTMLElement>('[data-cad]').forEach(b => {
          b.addEventListener('click', () => {
            const newCad = b.dataset.cad!
            popCadsRef.current?.querySelectorAll('.td-freq-opt').forEach(x => x.classList.toggle('on', x === b))
            moveFreqPill()
            setPopState(prev => {
              const next = { ...prev, cad: newCad }
              syncScheduleDOM(next)
              return next
            })
          })
        })
      } else {
        popCadsRef.current.querySelectorAll<HTMLElement>('.td-freq-opt').forEach(b => {
          b.classList.toggle('on', b.dataset.cad === cad)
        })
      }
      requestAnimationFrame(() => moveFreqPill())
    }
  }

  function renderPrisDOM(pri: PriorityKey) {
    if (!popPrisRef.current) return
    popPrisRef.current.innerHTML = (Object.keys(PRIORITY) as PriorityKey[]).map(k => {
      const p = PRIORITY[k]
      return '<button class="td-pop-pri' + (k === pri ? ' on' : '') + '" data-pri="' + k + '" style="--tag:' + p.color + '">' + badgeHTML(p) + '</button>'
    }).join('')
    popPrisRef.current.querySelectorAll<HTMLElement>('[data-pri]').forEach(b => {
      b.addEventListener('click', () => {
        const newPri = b.dataset.pri as PriorityKey
        setPopState(prev => {
          const next = { ...prev, pri: newPri }
          popPrisRef.current?.querySelectorAll('.td-pop-pri').forEach(x => x.classList.toggle('on', x === b))
          syncIconDOM(newPri)
          return next
        })
      })
    })
  }

  function syncIconDOM(pri: PriorityKey) {
    const p = PRIORITY[pri] || PRIORITY[DEFAULT_PRI]
    if (popIcRef.current) {
      const icEl = popIcRef.current.querySelector<HTMLElement>('.material-icons')
      if (icEl) icEl.textContent = (popMode !== 'add' && popRow) ? popRow._task.icon : p.bi
      popIcRef.current.style.setProperty('--tag', p.color)
      popIcRef.current.style.setProperty('--tag-bg', p.bg)
    }
  }

  function openPop(row: (HTMLElement & { _task: Task }) | null, mode: 'view' | 'edit' | 'add') {
    setPopMode(mode)
    setPopRow(row)
    let st: typeof popState
    if (row) {
      const t = row._task
      st = {
        pri: t.priority,
        repeat: (t.repeat || 'once') as 'once' | 'repeat',
        cad: t.cad || 'weekly',
        dow: t.dow != null ? t.dow : 1,
        dom: t.dom != null ? t.dom : 1,
      }
      if (popTitleRef.current) popTitleRef.current.value = t.title
      if (popTimeRef.current) popTimeRef.current.value = t.time
      if (popHdRef.current) popHdRef.current.textContent = mode === 'edit' ? 'Edit task' : 'Task details'
      if (popSaveTxtRef.current) popSaveTxtRef.current.textContent = 'Save changes'
      if (popSaveIcRef.current) popSaveIcRef.current.textContent = 'check'
    } else {
      st = { pri: DEFAULT_PRI, repeat: 'once', cad: 'weekly', dow: 1, dom: 1 }
      if (popTitleRef.current) popTitleRef.current.value = ''
      if (popTimeRef.current) popTimeRef.current.value = ''
      if (popHdRef.current) popHdRef.current.textContent = 'New task'
      if (popSaveTxtRef.current) popSaveTxtRef.current.textContent = 'Add task'
      if (popSaveIcRef.current) popSaveIcRef.current.textContent = 'add'
    }
    setPopState(st)
    renderPrisDOM(st.pri)
    syncScheduleDOM(st)
    syncIconDOM(st.pri)
    setPopOpen(true)
    // Position the segmented active pill once the popover is laid out.
    requestAnimationFrame(() => requestAnimationFrame(() => moveSegPill(st.repeat)))
    if (mode === 'edit' || mode === 'add') {
      setTimeout(() => {
        popTitleRef.current?.focus()
        if (mode === 'edit') popTitleRef.current?.select()
      }, 140)
    }
  }

  function closePop() { setPopOpen(false); setPopRow(null) }

  function handleSave() {
    const p = PRIORITY[popState.pri] || PRIORITY[DEFAULT_PRI]
    if (popMode === 'add') {
      const task: Task = {
        id: nextUid(),
        title: popTitleRef.current?.value.trim() || 'New task',
        time: popTimeRef.current?.value.trim() || 'Anytime',
        priority: popState.pri,
        icon: p.bi,
        repeat: popState.repeat,
        cad: popState.cad,
        dow: popState.dow,
        dom: popState.dom,
      }
      if (listRef.current) {
        insertTask(task, listRef.current, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current, openTaskPopover)
      }
      closePop(); return
    }
    if (!popRow) { closePop(); return }
    const t = popRow._task
    t.title = popTitleRef.current?.value.trim() || t.title
    t.time = popTimeRef.current?.value.trim() || t.time
    t.priority = popState.pri
    t.repeat = popState.repeat
    t.cad = popState.cad
    t.dow = popState.dow
    t.dom = popState.dom
    const card = popRow.querySelector<HTMLElement>('.task')
    if (card) { card.style.setProperty('--tag', p.color); card.style.setProperty('--tag-bg', p.bg) }
    popRow.dataset.pri = t.priority
    popRow.classList.toggle('is-repeat', t.repeat === 'repeat')
    const titleEl = popRow.querySelector<HTMLElement>('.t-title')
    if (titleEl) titleEl.textContent = t.title
    const timeEl = popRow.querySelector<HTMLElement>('.t-time')
    if (timeEl) timeEl.textContent = t.time
    const badge = popRow.querySelector<HTMLElement>('.t-badge')
    if (badge) {
      badge.innerHTML = badgeHTML(p)
      badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop')
    }
    if (listRef.current) {
      updateStats(listRef.current, statDoneRef.current, statWaitRef.current, () => refreshFilters(listRef.current!, filtersRef.current, activeFilterRef.current))
    }
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
            {/* Header */}
            <div className="td-head">
              <div>
                <div className="td-month">{monthLabel}</div>
                <div className="td-day">{dayLabel}</div>
              </div>
              <div className="td-nav">
                <button type="button" aria-label="Previous week" onClick={() => navBy(-1)}>
                  <span className="material-icons">chevron_left</span>
                </button>
                <button type="button" aria-label="Next week" onClick={() => navBy(1)}>
                  <span className="material-icons">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Week */}
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
                  onClick={() => handleSelectDay(i)}
                >
                  <span className="dow">{DOW[i]}</span>
                  <span className="dnum">{d.getDate()}</span>
                </button>
              ))}
            </div>

            {/* Section + stats */}
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

            {/* Tag filters */}
            <div className="td-filters" ref={(el) => { filtersRef.current = el }} />

            {/* List */}
            <div className="td-list" ref={(el) => { listRef.current = el }} />
            <div className="td-empty">
              <span className="ee-ico"><span className="material-icons">task_alt</span></span>
              <span className="ee-t">All done for today</span>
              <span className="ee-s">Add a task to keep the momentum going.</span>
            </div>

            {/* Bottom bar */}
            <div className="td-bar">
              <button
                type="button"
                className="btn-add"
                ref={btnAddRef}
                onClick={handleAddClick}
              >
                <span className="material-icons">add</span>Add Task
              </button>
            </div>

            {/* Task details / edit / add popover */}
            <div
              className={'td-scrim' + (popOpen ? ' show' : '')}
              onClick={closePop}
            />
            <dialog
              className={'td-pop' + (popOpen ? ' show' : '')}
              aria-label="Task editor"
              style={{ margin: 0 }}
            >
              <div className="td-pop-head">
                <span
                  className="td-pop-ic"
                  ref={(el) => { popIcRef.current = el }}
                >
                  <span className="material-icons">priority_high</span>
                </span>
                <div
                  style={{ flex: 1, fontSize: '16px', fontWeight: 900, color: 'var(--fg1)', letterSpacing: '-0.01em' }}
                  ref={(el) => { popHdRef.current = el }}
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
                  ref={popTitleRef}
                  type="text"
                  placeholder="What needs doing?"
                  aria-label="Task name"
                />
                <div className="td-pop-label">Tag</div>
                <div className="td-pop-pris" ref={(el) => { popPrisRef.current = el }} />
                <div className="td-pop-label">Schedule</div>
                <div
                  className="seg fill"
                  ref={segRef}
                  onClick={(e) => {
                    const b = (e.target as Element).closest<HTMLButtonElement>('[data-rep]')
                    if (!b) return
                    const newRep = b.dataset.rep as 'once' | 'repeat'
                    moveSegPill(newRep)
                    setPopState(prev => {
                      const next = { ...prev, repeat: newRep }
                      syncScheduleDOM(next)
                      return next
                    })
                  }}
                >
                  <span className="seg-pill" ref={segPillRef} />
                  <button type="button" data-rep="once" className={popState.repeat === 'once' ? 'active' : ''}>One-time</button>
                  <button type="button" data-rep="repeat" className={popState.repeat === 'repeat' ? 'active' : ''}>Repeats</button>
                </div>
                {/* Repeat options: container EXTENDS first (grid-rows 0fr→1fr),
                    then inner content morphs in — item 16. Mounted-through so the
                    collapse transition can play. */}
                <div
                  ref={popRepBoxRef}
                  className={'td-rep-box ' + (popState.repeat === 'repeat' ? 'td-rep-open' : 'td-rep-closed')}
                >
                  <div className="td-rep-inner">
                    <div className="td-pop-label">Repeat every</div>
                    {/* Frequency selector — segmented, sliding pill (item 17) */}
                    <div className="td-pop-cads" ref={(el) => { popCadsRef.current = el }} />
                    <div ref={popOnBoxRef}>
                      <div className="td-pop-label" ref={(el) => { popOnLblRef.current = el }}>On</div>
                      <div className="td-pop-days" ref={(el) => { popDaysRef.current = el }} />
                      <select
                        className="td-pop-select"
                        ref={popDomRef}
                        hidden
                        onChange={(e) => setPopState(prev => ({ ...prev, dom: +e.target.value }))}
                      >
                        {domOptions}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="td-pop-label">Time</div>
                <input
                  className="td-pop-input"
                  ref={popTimeRef}
                  type="text"
                  placeholder="2:00 PM"
                  aria-label="Task time"
                />
              </div>
              <button type="button" className="td-pop-save" onClick={handleSave}>
                <span className="material-icons" ref={(el) => { popSaveIcRef.current = el }}>check</span>
                <span ref={(el) => { popSaveTxtRef.current = el }}>Save changes</span>
              </button>
            </dialog>

            {/* Task detail popover (.tdp-*) */}
            {(() => {
              const t = taskDetailTask
              const p = t ? (PRIORITY[t.priority] || PRIORITY[DEFAULT_PRI]) : null
              const scheduleLabel = t?.repeat === 'repeat'
                ? ('Repeating · ' + (t.cad
                    ? (t.cad.charAt(0).toUpperCase() + t.cad.slice(1))
                    : 'Weekly'))
                : 'One-time task'
              const scheduleIcon = t?.repeat === 'repeat' ? 'repeat' : 'today'
              return (
                <div
                  ref={tdpOverlayRef}
                  className={'tdp-overlay' + (taskDetailOpen ? ' tdp-open' : '')}
                  onClick={closeTaskDetailPopover}
                  tabIndex={-1}
                  aria-modal="true"
                  aria-label="Task detail"
                >
                  <div className="tdp-outer" onClick={e => e.stopPropagation()}>
                    <div
                      className="tdp-card"
                      style={p ? ({ '--tag': p.color } as React.CSSProperties) : undefined}
                    >
                      {t && p && (
                        <>
                          {/* Header: icon tile + title + time + close */}
                          <div className="tdp-head">
                            <span className="tdp-ico">
                              <span className={iconClass(t.icon)}>{t.icon}</span>
                            </span>
                            <div className="tdp-title-block">
                              <div className="tdp-title">{t.title}</div>
                              <div className="tdp-time">
                                <span className="material-icons" style={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '3px', opacity: 0.7 }}>schedule</span>
                                {t.time}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="tdp-close"
                              aria-label="Close"
                              onClick={closeTaskDetailPopover}
                            >
                              <span className="material-icons">close</span>
                            </button>
                          </div>

                          {/* Task-board styled card preview (item 4 — mirrors
                              the TaskBoard .tb-card: title, priority pill, footer
                              hint). Texts adjusted to this task. */}
                          <div className="tdp-tbcard">
                            <div className="tdp-tbcard-title">{t.title}</div>
                            <div className="tdp-tbcard-row">
                              <span
                                className="tdp-tbcard-pri"
                                style={{ '--tag': p.color } as React.CSSProperties}
                              >
                                <span className="tdp-tbcard-dot" />
                                {p.label}
                              </span>
                              <span className="tdp-tbcard-time">
                                <span className="material-icons">schedule</span>{t.time}
                              </span>
                            </div>
                            <div className="tdp-tbcard-foot">
                              <span className="material-icons">{scheduleIcon}</span>
                              {scheduleLabel}
                            </div>
                          </div>

                          {/* Priority badge row */}
                          <div className="tdp-tag-row">
                            <span className="tdp-badge" style={{ '--tag': p.color } as React.CSSProperties}>
                              <span className="material-icons">{p.bi}</span>{p.label}
                            </span>
                            <span className="tdp-sched-tag">
                              <span className="material-icons">{scheduleIcon}</span>{scheduleLabel}
                            </span>
                          </div>

                          {/* Edit mode: inline title input */}
                          {taskDetailEditMode ? (
                            <>
                              <input
                                ref={tdpEditInputRef}
                                className="tdp-edit-input"
                                type="text"
                                defaultValue={t.title}
                                placeholder="Task title"
                                aria-label="Edit task title"
                                autoFocus
                              />
                              <div className="tdp-footer-row">
                                <button
                                  type="button"
                                  className="btn-green tdp-btn-muted"
                                  onClick={() => setTaskDetailEditMode(false)}
                                >
                                  <span className="material-icons">close</span>Cancel
                                </button>
                                <button
                                  type="button"
                                  className="btn-green"
                                  onClick={saveTaskDetailEdit}
                                >
                                  <span className="material-icons">check</span>Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Detail body: neurology-aware lifecycle note */}
                              <div className="tdp-body">
                                <span className={iconClass('neurology')} style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '5px', color: '#8B5CF6' }}>neurology</span>
                                {t.repeat === 'repeat'
                                  ? 'AI tracks this recurring task and surfaces it at the optimal time in your schedule.'
                                  : 'AI keeps this one-time task prioritized based on your focus patterns and deadline proximity.'}
                              </div>
                              {/* Action buttons — green, no gradient on the card */}
                              <div className="tdp-footer-row">
                                <button
                                  type="button"
                                  className="btn-green tdp-btn-muted"
                                  onClick={() => {
                                    setTaskDetailEditMode(true)
                                    setTimeout(() => {
                                      tdpEditInputRef.current?.select()
                                    }, 60)
                                  }}
                                >
                                  <span className="material-icons">edit</span>Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-green"
                                  onClick={() => {
                                    closeTaskDetailPopover()
                                    const listEl = listRef.current
                                    if (!listEl || !t) return
                                    const row = listEl.querySelector<HTMLElement>('[data-id="' + t.id + '"]')
                                    if (row) {
                                      completeRow(row, listEl, true)
                                      updateStats(listEl, statDoneRef.current, statWaitRef.current, () => refreshFilters(listEl, filtersRef.current, activeFilterRef.current))
                                    }
                                  }}
                                >
                                  <span className="material-icons">check_circle</span>Complete
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </section>
        </div>
      </div>
    </div>
  )
}
