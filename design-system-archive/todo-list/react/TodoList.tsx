import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './TodoList.css'

import { useRef, useState, useCallback } from 'react'
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
  todoMountRef,
  todoCleanupRef,
  nextUid,
} from './todo-list-hook'

// ── Static initial date ──────────────────────────────────────────────────────

const INITIAL_DATE = new Date(2026, 1, 8) // Sunday Feb 8 2026

// ── Component ─────────────────────────────────────────────────────────────────

export default function TodoList() {
  // Current selected date
  const [curDate, setCurDate] = useState(() => new Date(INITIAL_DATE))
  // Week days for the current week (Mon–Sun)
  const [weekDays, setWeekDays] = useState<Date[]>(() => {
    const mon = startOfWeek(new Date(INITIAL_DATE))
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
  })
  const [activeIdx, setActiveIdx] = useState(() => (new Date(INITIAL_DATE).getDay() + 6) % 7)

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
      todoMountRef(el, getRefs(), activeFilterRef.current)
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
    changeDay(listRef.current, tasks, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current)
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
        changeDay(listRef.current, tasks, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current)
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

  function navBy(delta: number) {
    const prevMon = weekDays.length ? startOfWeek(weekDays[0]).getTime() : null
    curDate.setDate(curDate.getDate() + delta)
    setCurDate(new Date(curDate))
    const mon = startOfWeek(curDate)
    if (prevMon === null || mon.getTime() !== prevMon) {
      slideWeek(delta > 0 ? 1 : -1)
    } else {
      const idx = (curDate.getDay() + 6) % 7
      setActiveIdx(idx)
      afterWeekUpdate()
      if (listRef.current) {
        const tasks = getTasksForDay(curDate)
        changeDay(listRef.current, tasks, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current)
      }
    }
  }

  // ── Popover helpers ───────────────────────────────────────────────────────

  function syncScheduleDOM(st: typeof popState) {
    const rep = st.repeat === 'repeat'
    if (popRepBoxRef.current) popRepBoxRef.current.hidden = !rep
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
        '<button class="td-pop-dow' + (i === dow ? ' on' : '') + '" data-dow="' + i + '">' + d + '</button>'
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
    // Render cads
    if (popCadsRef.current) {
      popCadsRef.current.innerHTML = CADS.map(c =>
        '<button class="td-pop-cad' + (c === cad ? ' on' : '') + '" data-cad="' + c + '">' + CADLBL[c] + '</button>'
      ).join('')
      popCadsRef.current.querySelectorAll<HTMLElement>('[data-cad]').forEach(b => {
        b.addEventListener('click', () => {
          const newCad = b.dataset.cad!
          setPopState(prev => {
            const next = { ...prev, cad: newCad }
            popCadsRef.current?.querySelectorAll('.td-pop-cad').forEach(x => x.classList.toggle('on', x === b))
            syncScheduleDOM(next)
            return next
          })
        })
      })
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
        insertTask(task, listRef.current, statDoneRef.current, statWaitRef.current, activeFilterRef.current, filtersRef.current)
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
  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === 'Escape') closePop() }

  return (
    <div className="card" style={{ padding: 0, background: 'var(--bg-app)' }} onKeyDown={handleKeyDown}>
      <div className="frame">
        <div className="shell zoom" style={{ borderRadius: '48px', padding: '8px' }}>
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
                <button aria-label="Previous day" onClick={() => navBy(-1)}>
                  <span className="material-icons">chevron_left</span>
                </button>
                <button aria-label="Next day" onClick={() => navBy(1)}>
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
                  key={i}
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
            <div
              className={'td-pop' + (popOpen ? ' show' : '')}
              role="dialog"
              aria-label="Task editor"
            >
              <div className="td-pop-head">
                <span
                  className="td-pop-ic"
                  ref={(el) => { popIcRef.current = el }}
                >
                  <span className="material-icons">priority_high</span>
                </span>
                <div
                  style={{ flex: 1, fontSize: '14px', fontWeight: 800, color: 'var(--fg1)' }}
                  ref={(el) => { popHdRef.current = el }}
                >
                  Task details
                </div>
                <button className="td-pop-x" aria-label="Close" onClick={closePop}>
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
                />
                <div className="td-pop-label">Tag</div>
                <div className="td-pop-pris" ref={(el) => { popPrisRef.current = el }} />
                <div className="td-pop-label">Schedule</div>
                <div
                  className="seg fill"
                  ref={(el) => {
                    if (el && !(el as HTMLElement & { _segInit?: boolean })._segInit) {
                      ;(el as HTMLElement & { _segInit?: boolean })._segInit = true
                    }
                  }}
                  onClick={(e) => {
                    const b = (e.target as Element).closest<HTMLButtonElement>('[data-rep]')
                    if (!b) return
                    const newRep = b.dataset.rep as 'once' | 'repeat'
                    setPopState(prev => {
                      const next = { ...prev, repeat: newRep }
                      syncScheduleDOM(next)
                      return next
                    })
                  }}
                >
                  <span className="seg-pill" />
                  <button data-rep="once" className={popState.repeat === 'once' ? 'active' : ''}>One-time</button>
                  <button data-rep="repeat" className={popState.repeat === 'repeat' ? 'active' : ''}>Repeats</button>
                </div>
                <div ref={popRepBoxRef} hidden>
                  <div className="td-pop-label">Repeat every</div>
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
                <div className="td-pop-label">Time</div>
                <input
                  className="td-pop-input"
                  ref={popTimeRef}
                  type="text"
                  placeholder="2:00 PM"
                />
              </div>
              <button className="td-pop-save" onClick={handleSave}>
                <span className="material-icons" ref={(el) => { popSaveIcRef.current = el }}>check</span>
                <span ref={(el) => { popSaveTxtRef.current = el }}>Save changes</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
