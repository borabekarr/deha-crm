/**
 * todo-list-hook.ts
 *
 * Encapsulates all DOM-level side effects for TodoList:
 *  - Staggered entrance animation on mount via callback ref
 *  - Per-row pointer drag logic (right=complete, left=actions, vertical=reorder)
 *  - FLIP reorder animation
 *  - completeRow, uncompleteRow, removeRow, insertTask
 *  - Confetti burst on drag-complete
 *  - Week calendar pill positioning
 *  - Tag filter show/hide with morph animation
 *  - Stat counter tween
 *
 * NO raw useEffect anywhere in this folder.
 * All side effects are triggered through callback refs or event handlers.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  title: string
  time: string
  priority: 'urgent_important' | 'urgent' | 'important'
  icon: string
  done?: boolean
  repeat?: 'once' | 'repeat'
  cad?: string
  dow?: number
  dom?: number
}

export interface TodoRefs {
  list: HTMLDivElement | null
  statDone: HTMLElement | null
  statWait: HTMLElement | null
  filtersEl: HTMLDivElement | null
  weekEl: HTMLDivElement | null
}

interface MountState {
  __todoTimer?: ReturnType<typeof setTimeout>
}

// ── Constants ────────────────────────────────────────────────────────────────

export const PRIORITY = {
  urgent_important: { label: 'Urgent & Important', color: '#EF4444', bg: 'var(--semantic-danger-bg)',  bi: 'priority_high' },
  urgent:           { label: 'Urgent',             color: '#F97316', bg: 'var(--semantic-hot-bg)',     bi: 'bolt' },
  important:        { label: 'Important',          color: '#EAB308', bg: 'var(--semantic-warning-bg)', bi: 'flag' },
} as const

export type PriorityKey = keyof typeof PRIORITY

export const DEFAULT_PRI: PriorityKey = 'urgent_important'

export const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
export const DAYNAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const CADS = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const
export const CADLBL: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }
export const DOWS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export const SEED_TASKS: Task[] = [
  { id: 't1', title: 'Review design mockups',  time: '2:00 PM',  priority: 'urgent_important', icon: 'image_search' },
  { id: 't2', title: 'Client call preparation', time: '3:30 PM',  priority: 'urgent',           icon: 'description' },
  { id: 't3', title: 'Code review PR #234',     time: '5:00 PM',  priority: 'important',        icon: 'code' },
  { id: 't4', title: 'Finalize Q1 budget',      time: '10:00 AM', priority: 'urgent_important', icon: 'account_balance', repeat: 'repeat', cad: 'quarterly', dom: 1 },
  { id: 't5', title: 'Reply to investor email', time: '11:30 AM', priority: 'urgent',           icon: 'mail' },
  { id: 't6', title: 'Read industry report',    time: '7:00 PM',  priority: 'important',        icon: 'menu_book', repeat: 'repeat', cad: 'weekly', dow: 6 },
]

const DAY_TASKS: Record<number, Task[]> = {
  0: [
    { id:'mo1', title:'Weekly planning sync',      time:'9:00 AM',  priority:'urgent_important', icon:'event_note' },
    { id:'mo2', title:'Approve marketing budget',  time:'11:00 AM', priority:'urgent',           icon:'account_balance' },
    { id:'mo3', title:'1:1 with design lead',      time:'2:00 PM',  priority:'important',        icon:'forum' },
    { id:'mo4', title:'Triage support backlog',    time:'4:00 PM',  priority:'urgent',           icon:'support_agent' },
  ],
  1: [
    { id:'tu1', title:'Ship onboarding v2',        time:'10:00 AM', priority:'urgent_important', icon:'rocket_launch' },
    { id:'tu2', title:'Investor deck review',      time:'12:00 PM', priority:'urgent',           icon:'slideshow' },
    { id:'tu3', title:'Refine pricing model',      time:'1:30 PM',  priority:'important',        icon:'sell', repeat:'repeat', cad:'monthly', dom:2 },
    { id:'tu4', title:'Interview · backend role',  time:'3:00 PM',  priority:'important',        icon:'person_search' },
    { id:'tu5', title:'Reply to partner email',    time:'5:30 PM',  priority:'urgent',           icon:'mail' },
  ],
  2: [
    { id:'we1', title:'Roadmap deep-work block',   time:'9:30 AM',  priority:'urgent_important', icon:'map' },
    { id:'we2', title:'QA the release build',      time:'2:00 PM',  priority:'urgent',           icon:'fact_check' },
    { id:'we3', title:'Read industry report',      time:'6:00 PM',  priority:'important',        icon:'menu_book' },
  ],
  3: [
    { id:'th1', title:'Board update draft',        time:'10:00 AM', priority:'urgent_important', icon:'description' },
    { id:'th2', title:'Customer discovery calls',  time:'1:00 PM',  priority:'urgent',           icon:'call', repeat:'repeat', cad:'weekly', dow:3 },
    { id:'th3', title:'Polish empty states',       time:'3:30 PM',  priority:'important',        icon:'brush' },
    { id:'th4', title:'Renew SSL certificates',    time:'5:00 PM',  priority:'urgent',           icon:'lock' },
  ],
  4: [
    { id:'fr1', title:'Demo day rehearsal',        time:'9:00 AM',  priority:'urgent_important', icon:'co_present' },
    { id:'fr2', title:'Close sprint & retro',      time:'11:30 AM', priority:'urgent',           icon:'checklist' },
    { id:'fr3', title:'Approve payroll',           time:'1:00 PM',  priority:'urgent_important', icon:'payments', repeat:'repeat', cad:'monthly', dom:28 },
    { id:'fr4', title:'Publish changelog',         time:'3:00 PM',  priority:'important',        icon:'campaign' },
    { id:'fr5', title:'Plan weekend on-call',      time:'5:00 PM',  priority:'important',        icon:'schedule' },
  ],
  5: [
    { id:'sa1', title:'Inbox zero sweep',          time:'10:30 AM', priority:'important',        icon:'mark_email_read' },
    { id:'sa2', title:'Sketch Q2 OKRs',            time:'12:00 PM', priority:'important',        icon:'lightbulb' },
  ],
  6: SEED_TASKS,
}


// ── Helpers ──────────────────────────────────────────────────────────────────

// Escape user-supplied text before it is interpolated into an innerHTML string.
// task.title / task.time originate from popover <input> values, so they must be
// neutralized to prevent DOM-text-as-HTML injection (CodeQL js/xss-through-dom).
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function badgeHTML(p: typeof PRIORITY[PriorityKey]): string {
  return '<span class="material-icons">' + (p.bi || 'label') + '</span>' + p.label
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const wd = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - wd)
  x.setHours(0, 0, 0, 0)
  return x
}

// ── Stat counter tween ───────────────────────────────────────────────────────

export function tween(el: HTMLElement, from: number, to: number): void {
  if (from === to) { el.textContent = String(to); return }
  const t0 = performance.now()
  const dur = 420
  let done = false
  const step = (now: number) => {
    if (done) return
    let k = Math.min(1, (now - t0) / dur)
    k = 1 - Math.pow(1 - k, 3)
    el.textContent = String(Math.round(from + (to - from) * k))
    if (k < 1) requestAnimationFrame(step); else done = true
  }
  requestAnimationFrame(step)
  setTimeout(() => { done = true; el.textContent = String(to) }, dur + 90)
}

// ── FLIP reorder animation ───────────────────────────────────────────────────

export function flip(list: HTMLElement, mutate: () => void): void {
  const rows = Array.from(list.children) as HTMLElement[]
  const first = rows.map(r => r.getBoundingClientRect().top)
  mutate()
  rows.forEach((r, i) => {
    if (!r.isConnected || r.parentNode !== list) return
    const dy = first[i] - r.getBoundingClientRect().top
    if (!dy) return
    r.style.transition = 'none'
    r.style.transform = 'translateY(' + dy + 'px)'
    void r.offsetWidth
    r.style.transition = 'transform 520ms cubic-bezier(.2,1.1,.3,1)'
    r.style.transform = ''
    setTimeout(() => { r.style.transition = ''; r.style.transform = '' }, 580)
  })
}

// ── Confetti burst ───────────────────────────────────────────────────────────

export function launchConfetti(row: HTMLElement): void {
  const rect = row.getBoundingClientRect()
  const cx = rect.left + rect.width * 0.3
  const cy = rect.top + rect.height / 2
  const colors = ['#10B981','#34D399','#6EE7B7','#fff','#BBF7D0','#059669']
  for (let i = 0; i < 22; i++) {
    const dot = document.createElement('span')
    const angle = (i / 22) * Math.PI * 2 - Math.PI / 2
    const dist = 28 + Math.random() * 52
    const dx = (Math.cos(angle) * dist).toFixed(1)
    const dy = (Math.sin(angle) * dist - 12).toFixed(1)
    const size = (4 + Math.random() * 4).toFixed(1)
    dot.style.cssText =
      'position:fixed;width:' + size + 'px;height:' + size + 'px;border-radius:50%;pointer-events:none;z-index:9999;' +
      'background:' + colors[i % colors.length] + ';left:' + cx + 'px;top:' + cy + 'px;' +
      '--dx:' + dx + 'px;--dy:' + dy + 'px;' +
      'animation:confetti-burst 580ms cubic-bezier(.2,1,.4,1) ' + (i * 16) + 'ms both;'
    document.body.appendChild(dot)
    setTimeout(() => { dot.remove() }, 700 + i * 16)
  }
}

// ── Complete / uncomplete / remove ───────────────────────────────────────────

export function completeRow(row: HTMLElement, list: HTMLElement, fromDrag?: boolean): void {
  if (row.classList.contains('is-done')) return
  row.classList.add('is-done', 'glow')
  const clr = (e: AnimationEvent) => {
    if (e.animationName === 'done-glow') { row.classList.remove('glow'); row.removeEventListener('animationend', clr) }
  }
  row.addEventListener('animationend', clr)
  if (fromDrag) launchConfetti(row)
  updateStats(list)
}

export function uncompleteRow(row: HTMLElement, list: HTMLElement): void {
  if (!row.classList.contains('is-done')) return
  flip(list, () => {
    row.classList.remove('is-done')
    let ref: Element | null = null
    for (let i = 0; i < list.children.length; i++) {
      if (!list.children[i].classList.contains('is-done') && list.children[i] !== row) { ref = list.children[i]; break }
    }
    list.insertBefore(row, ref)
  })
  updateStats(list)
}

export function removeRow(row: HTMLElement, list: HTMLElement): void {
  const h = row.offsetHeight
  row.classList.add('removing')
  setTimeout(() => {
    row.style.transition = 'max-height 280ms ease, opacity 240ms ease, margin 280ms ease'
    row.style.maxHeight = h + 'px'
    row.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      row.style.maxHeight = '0px'
      row.style.opacity = '0'
      row.style.marginBottom = '-11px'
    })
  }, 220)
  setTimeout(() => { if (row.parentNode) row.parentNode.removeChild(row); updateStats(list) }, 560)
}

// ── Stats update ─────────────────────────────────────────────────────────────

const BASE_DONE = 2

export function updateStats(
  list: HTMLElement,
  statDone?: HTMLElement | null,
  statWait?: HTMLElement | null,
  refreshFiltersFn?: () => void,
): void {
  let done = 0, wait = 0
  list.querySelectorAll('.task-row').forEach(r => {
    if (r.classList.contains('is-done')) done++; else wait++
  })
  list.classList.toggle('empty', list.children.length === 0)
  if (statDone) tween(statDone, +(statDone.textContent || '0'), BASE_DONE + done)
  if (statWait) tween(statWait, +(statWait.textContent || '0'), wait)
  refreshFiltersFn?.()
}

// ── Tag filter show/hide ──────────────────────────────────────────────────────

export function hideRowFilter(r: HTMLElement): void {
  if (r.classList.contains('filtered-out') || r.dataset.filtering) return
  r.dataset.filtering = '1'
  const h = r.offsetHeight
  r.style.overflow = 'hidden'
  r.style.maxHeight = h + 'px'
  void r.offsetWidth
  r.style.transition = 'max-height 520ms cubic-bezier(.4,0,.2,1), margin-bottom 520ms cubic-bezier(.4,0,.2,1), opacity 300ms ease, transform 360ms cubic-bezier(.4,0,.2,1)'
  r.style.opacity = '0'
  r.style.transform = 'scale(.96)'
  r.style.maxHeight = '0px'
  r.style.marginBottom = '-11px'
  setTimeout(() => {
    r.classList.add('filtered-out')
    r.style.maxHeight = ''
    r.style.overflow = ''
    r.style.transition = ''
    r.style.marginBottom = ''
    r.style.opacity = ''
    r.style.transform = ''
    delete r.dataset.filtering
  }, 540)
}

export function showRowFilter(r: HTMLElement): void {
  if (!r.classList.contains('filtered-out')) return
  r.classList.remove('filtered-out')
  r.style.maxHeight = 'none'
  const h = r.scrollHeight
  r.style.overflow = 'hidden'
  r.style.maxHeight = '0px'
  r.style.marginBottom = '-11px'
  r.style.opacity = '0'
  r.style.transform = 'scale(.96)'
  void r.offsetWidth
  r.style.transition = 'max-height 560ms cubic-bezier(.22,1,.36,1), margin-bottom 560ms cubic-bezier(.22,1,.36,1), opacity 420ms ease 80ms, transform 520ms cubic-bezier(.22,1,.36,1) 80ms'
  r.style.maxHeight = h + 'px'
  r.style.marginBottom = '0px'
  r.style.opacity = '1'
  r.style.transform = 'scale(1)'
  setTimeout(() => {
    r.style.maxHeight = ''
    r.style.overflow = ''
    r.style.transition = ''
    r.style.marginBottom = ''
    r.style.opacity = ''
    r.style.transform = ''
  }, 660)
}

// ── Make a task row DOM element ───────────────────────────────────────────────

export function makeRow(
  task: Task,
  delay: number | null,
  list: HTMLElement,
  statDone: HTMLElement | null,
  statWait: HTMLElement | null,
  activeFilterRef: { current: string },
  filtersEl: HTMLElement | null,
): HTMLDivElement {
  const p = PRIORITY[task.priority] || PRIORITY[DEFAULT_PRI]
  const row = document.createElement('div')
  row.className = 'task-row'
  row.dataset.id = task.id
  row.dataset.pri = task.priority
  ;(row as HTMLDivElement & { _task: Task })._task = task
  if (task.done) row.classList.add('is-done')
  if (task.repeat === 'repeat') row.classList.add('is-repeat')

  row.innerHTML =
    '<div class="reveal"><span class="rv-check"><span class="material-icons">check</span></span>Complete</div>' +
    '<div class="actions">' +
      '<button class="t-act edit" aria-label="Edit task"><span class="material-icons">edit</span></button>' +
      '<button class="t-act del" aria-label="Delete task"><span class="material-icons">delete</span></button>' +
    '</div>' +
    '<div class="task" style="--tag:' + p.color + ';--tag-bg:' + p.bg + ';">' +
      '<span class="t-ico"><span class="material-icons">' + escapeHtml(task.icon) + '</span></span>' +
      '<div class="t-main">' +
        '<div class="t-title">' + escapeHtml(task.title) + '</div>' +
        '<span class="t-badge">' + badgeHTML(p) + '</span>' +
      '</div>' +
      '<div class="t-right">' +
        '<span class="t-repeat"><span class="material-icons">repeat</span></span>' +
        '<span class="t-time">' + escapeHtml(task.time) + '</span>' +
        '<button class="t-complete"><span class="material-icons">check</span>Complete</button>' +
      '</div>' +
    '</div>'

  const card = row.querySelector('.task') as HTMLElement
  if (delay != null) {
    card.classList.add('preanim', 'anim')
    setTimeout(() => card.classList.remove('preanim'), 30 + delay)
    setTimeout(() => card.classList.remove('anim'), 30 + delay + 660)
  }

  wireRow(row, list, statDone, statWait, activeFilterRef, filtersEl)
  return row
}

// ── Per-row drag wiring ───────────────────────────────────────────────────────

export function wireRow(
  row: HTMLDivElement,
  list: HTMLElement,
  statDone: HTMLElement | null,
  statWait: HTMLElement | null,
  activeFilterRef: { current: string },
  filtersEl: HTMLElement | null,
): void {
  const card = row.querySelector('.task') as HTMLElement
  const pill = row.querySelector('.t-complete') as HTMLButtonElement | null
  const reveal = row.querySelector('.reveal') as HTMLElement
  const delBtn = row.querySelector('.t-act.del') as HTMLButtonElement | null
  const editBtn = row.querySelector('.t-act.edit') as HTMLButtonElement | null

  const refreshFn = () => refreshFilters(list, filtersEl, activeFilterRef)
  const statsFn = () => updateStats(list, statDone, statWait, refreshFn)

  if (pill) pill.addEventListener('click', (e) => { e.stopPropagation(); completeRow(row, list) })

  let startX = 0, startY = 0, dragging = false, mode: string | null = null
  let armed = false, didDrag = false
  let W = 0, threshold = 0, pid: number | null = null, roTop = 0
  const ACT_W = 130

  function releaseCard() {
    if (pid != null) { try { card.releasePointerCapture(pid) } catch (_) {} pid = null }
  }

  function settleClosed() {
    card.classList.add('settling')
    card.style.transform = ''
    row.classList.remove('act-open', 'armed')
    const clr = () => { card.classList.remove('settling'); card.removeEventListener('transitionend', clr) }
    card.addEventListener('transitionend', clr)
    setTimeout(() => card.classList.remove('settling'), 480)
  }

  card.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = e.target as Element
    if (target.closest('.t-check') || target.closest('.t-act') || target.closest('.t-complete')) return
    if (e.button != null && e.button !== 0) return
    if (row.classList.contains('act-open')) { settleClosed(); return }
    startX = e.clientX; startY = e.clientY; dragging = true; mode = null; armed = false; didDrag = false
    W = card.offsetWidth; threshold = W * 0.4; pid = e.pointerId
    try { card.setPointerCapture(pid) } catch (_) {}
  })

  card.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return
    const mx = e.clientX - startX, my = e.clientY - startY
    if (!mode) {
      if (Math.abs(mx) < 6 && Math.abs(my) < 6) return
      didDrag = true
      if (Math.abs(my) > Math.abs(mx) * 1.5 && Math.abs(my) > 10) {
        mode = 'reorder'; roTop = row.getBoundingClientRect().top; row.classList.add('reordering')
      } else if (mx < 0) {
        if (row.classList.contains('is-done')) { dragging = false; releaseCard(); return }
        mode = 'left'; card.classList.add('dragging')
      } else {
        if (row.classList.contains('is-done')) { dragging = false; releaseCard(); return }
        mode = 'right'; card.classList.add('dragging'); reveal.style.opacity = '1'
      }
    }
    if (mode === 'reorder') {
      card.style.transform = 'translateY(' + my + 'px)'
    } else if (mode === 'right') {
      const dx = Math.max(0, mx)
      const damp = Math.min(dx, W * 0.84)
      card.style.transform = 'translateX(' + damp + 'px)'
      const na = dx >= threshold
      if (na !== armed) {
        armed = na; row.classList.toggle('armed', armed)
        if (armed && navigator.vibrate) navigator.vibrate(8)
      }
    } else {
      const lx = Math.max(-ACT_W - 26, Math.min(0, mx))
      const d2 = lx < -ACT_W ? -ACT_W + (lx + ACT_W) * 0.3 : lx
      card.style.transform = 'translateX(' + d2 + 'px)'
    }
  })

  function endDrag() {
    if (!dragging) { releaseCard(); return }
    dragging = false; releaseCard(); card.classList.remove('dragging')
    if (mode === 'reorder') {
      const myMatch = /translateY\(([-0-9.]+)px\)/.exec(card.style.transform)
      const my = parseFloat(myMatch ? myMatch[1] : '0') || 0
      const sibs = Array.from(list.children).filter(r => r !== row) as HTMLElement[]
      const center = roTop + my + row.offsetHeight / 2
      let ref: Element | null = null
      for (let i = 0; i < sibs.length; i++) {
        const rb = sibs[i].getBoundingClientRect()
        if (center < rb.top + rb.height / 2) { ref = sibs[i]; break }
      }
      card.style.transform = ''
      flip(list, () => { list.insertBefore(row, ref) })
      row.classList.remove('reordering')
    } else if (mode === 'right') {
      reveal.style.opacity = ''
      if (armed) {
        card.style.transition = 'transform 220ms cubic-bezier(.4,0,.2,1)'
        card.style.transform = 'translateX(' + W + 'px)'
        row.classList.remove('armed')
        setTimeout(() => {
          card.style.transition = 'transform 360ms cubic-bezier(.4,0,0,1)'
          card.style.transform = ''
          setTimeout(() => {
            card.style.transition = ''
            completeRow(row, list, true)
            statsFn()
          }, 380)
        }, 230)
      } else { settleClosed() }
    } else if (mode === 'left') {
      const curMatch = /translateX\(([-0-9.]+)px\)/.exec(card.style.transform)
      const cur = parseFloat(curMatch ? curMatch[1] : '0') || 0
      card.classList.add('settling')
      if (cur <= -ACT_W * 0.5) { card.style.transform = 'translateX(' + (-ACT_W) + 'px)'; row.classList.add('act-open') }
      else { card.style.transform = ''; row.classList.remove('act-open') }
      const clr = () => { card.classList.remove('settling'); card.removeEventListener('transitionend', clr) }
      card.addEventListener('transitionend', clr)
      setTimeout(() => card.classList.remove('settling'), 480)
    }
    mode = null; armed = false
  }
  card.addEventListener('pointerup', endDrag)
  card.addEventListener('pointercancel', endDrag)

  if (delBtn) delBtn.addEventListener('click', (e) => { e.stopPropagation(); removeRow(row, list); statsFn() })
  if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); settleClosed() })

  card.addEventListener('click', (e: MouseEvent) => {
    if (didDrag) { didDrag = false; return }
    const target = e.target as Element
    if (target.closest('.t-act') || target.closest('.t-complete')) return
    card.classList.remove('tap'); void card.offsetWidth; card.classList.add('tap')
  })
}

// ── Tag filters ───────────────────────────────────────────────────────────────

export function buildFilters(
  filtersEl: HTMLElement,
  list: HTMLElement,
  activeFilterRef: { current: string },
): void {
  let html = '<button class="td-filt on" data-f="all">All<span class="fct" data-c="all">0</span></button>'
  ;(Object.keys(PRIORITY) as PriorityKey[]).forEach(k => {
    const p = PRIORITY[k]
    html += '<button class="td-filt" data-f="' + k + '">' +
      '<span class="fdot" style="--fcolor:' + p.color + '"></span>' + p.label +
      '<span class="fct" data-c="' + k + '">0</span></button>'
  })
  filtersEl.innerHTML = html
  filtersEl.querySelectorAll<HTMLElement>('.td-filt').forEach(b => {
    b.addEventListener('click', () => {
      activeFilterRef.current = b.dataset.f || 'all'
      filtersEl.querySelectorAll('.td-filt').forEach(x => x.classList.toggle('on', x === b))
      applyFilter(list, activeFilterRef, true)
    })
  })
}

export function refreshFilters(
  list: HTMLElement,
  filtersEl: HTMLElement | null,
  activeFilterRef: { current: string },
): void {
  if (!filtersEl) return
  const counts: Record<string, number> = { all: 0 }
  ;(Object.keys(PRIORITY) as PriorityKey[]).forEach(k => { counts[k] = 0 })
  list.querySelectorAll<HTMLElement>('.task-row').forEach(r => {
    counts.all++
    if (r.dataset.pri && counts[r.dataset.pri] != null) counts[r.dataset.pri]++
  })
  filtersEl.querySelectorAll<HTMLElement>('.fct').forEach(el => {
    el.textContent = String(counts[el.dataset.c || ''] || 0)
  })
  applyFilter(list, activeFilterRef, false)
}

export function applyFilter(
  list: HTMLElement,
  activeFilterRef: { current: string },
  animate: boolean,
): void {
  list.querySelectorAll<HTMLElement>('.task-row').forEach(r => {
    const show = activeFilterRef.current === 'all' || r.dataset.pri === activeFilterRef.current
    const hidden = r.classList.contains('filtered-out')
    if (show && hidden) { animate ? showRowFilter(r) : r.classList.remove('filtered-out') }
    else if (!show && !hidden) { animate ? hideRowFilter(r) : r.classList.add('filtered-out') }
  })
}

// ── Week calendar ─────────────────────────────────────────────────────────────

export function movePill(weekEl: HTMLElement, weekPill: HTMLElement | null): void {
  if (!weekPill) return
  const active = weekEl.querySelector<HTMLElement>('.td-daybtn.active')
  if (!active) return
  weekPill.style.width = active.offsetWidth + 'px'
  weekPill.style.height = active.offsetHeight + 'px'
  weekPill.style.transform = 'translate(' + active.offsetLeft + 'px,' + active.offsetTop + 'px)'
}

// ── Day change animation ──────────────────────────────────────────────────────

export function changeDay(
  list: HTMLElement,
  newTasks: Task[],
  statDone: HTMLElement | null,
  statWait: HTMLElement | null,
  activeFilterRef: { current: string },
  filtersEl: HTMLElement | null,
): void {
  const old = Array.from(list.children) as HTMLElement[]
  const mountNew = () => {
    list.innerHTML = ''
    newTasks.forEach(t => {
      const row = makeRow(t, null, list, statDone, statWait, activeFilterRef, filtersEl)
      row.classList.add('filtered-out')
      list.appendChild(row)
    })
    Array.from(list.children).forEach(r => showRowFilter(r as HTMLElement))
    updateStats(list, statDone, statWait, () => refreshFilters(list, filtersEl, activeFilterRef))
  }
  if (old.length) {
    old.forEach(r => {
      const h = r.offsetHeight
      r.style.overflow = 'hidden'; r.style.maxHeight = h + 'px'
      void r.offsetWidth
      r.style.transition = 'max-height 460ms cubic-bezier(.4,0,.2,1), margin-bottom 460ms cubic-bezier(.4,0,.2,1), opacity 280ms ease, transform 360ms cubic-bezier(.4,0,.2,1)'
      r.style.opacity = '0'; r.style.transform = 'scale(.96)'
      r.style.maxHeight = '0px'; r.style.marginBottom = '-11px'
    })
    setTimeout(mountNew, 470)
  } else {
    mountNew()
  }
}

// ── Load day tasks ────────────────────────────────────────────────────────────

const dayStateMap: Record<number, Task[]> = { 6: SEED_TASKS }

export function getTasksForDay(date: Date): Task[] {
  const wd = (date.getDay() + 6) % 7
  if (!dayStateMap[wd]) {
    dayStateMap[wd] = (DAY_TASKS[wd] || []).map(t => ({ ...t }))
  }
  return dayStateMap[wd]
}

// ── Insert task ───────────────────────────────────────────────────────────────

let uid = 100
export function nextUid(): string { return 't' + (uid++) }

export function insertTask(
  task: Task,
  list: HTMLElement,
  statDone: HTMLElement | null,
  statWait: HTMLElement | null,
  activeFilterRef: { current: string },
  filtersEl: HTMLElement | null,
): void {
  const row = makeRow(task, 0, list, statDone, statWait, activeFilterRef, filtersEl)
  const badge = row.querySelector('.t-badge') as HTMLElement
  badge.classList.add('pop')
  let ref: Element | null = null
  for (let i = 0; i < list.children.length; i++) {
    if (!list.children[i].classList.contains('is-done')) { ref = list.children[i]; break }
  }
  flip(list, () => { list.insertBefore(row, ref) })
  updateStats(list, statDone, statWait, () => refreshFilters(list, filtersEl, activeFilterRef))
}

// ── Mount callback ref ─────────────────────────────────────────────────────

export function todoMountRef(
  el: HTMLDivElement | null,
  refs: TodoRefs,
  activeFilterRef: { current: string },
): void {
  if (!el) {
    const s = el as unknown as (HTMLDivElement & MountState) | null
    clearTimeout(s?.__todoTimer)
    return
  }
  const s = el as HTMLDivElement & MountState
  clearTimeout(s.__todoTimer)

  const { list, statDone, statWait, filtersEl, weekEl } = refs
  if (!list || !filtersEl || !weekEl) return

  // Build filters
  buildFilters(filtersEl, list, activeFilterRef)

  // Build initial task list (Sunday seed)
  const initialDate = new Date(2026, 1, 8)
  const initialTasks = getTasksForDay(initialDate)
  list.innerHTML = ''
  initialTasks.forEach((t, i) => {
    list.appendChild(makeRow(t, 80 + i * 90, list, statDone, statWait, activeFilterRef, filtersEl))
  })

  updateStats(list, statDone, statWait, () => refreshFilters(list, filtersEl, activeFilterRef))

  // Close open action panels when clicking outside
  const handleGlobalPointerDown = (e: PointerEvent) => {
    const target = e.target as Element
    const inRow = target.closest('.task-row')
    list.querySelectorAll<HTMLElement>('.task-row.act-open').forEach(r => {
      if (r !== inRow) {
        r.classList.remove('act-open')
        const c = r.querySelector<HTMLElement>('.task')
        if (c) {
          c.style.transition = 'transform 280ms cubic-bezier(.4,0,0,1)'
          c.style.transform = ''
          setTimeout(() => { c.style.transition = '' }, 310)
        }
      }
    })
  }
  document.addEventListener('pointerdown', handleGlobalPointerDown)
  s.__todoTimer = setTimeout(() => {
    document.removeEventListener('pointerdown', handleGlobalPointerDown)
  }, 1000 * 60 * 60) // cleanup after 1hr (component unmount should ideally call cleanup)
}

export function todoCleanupRef(el: HTMLDivElement | null): void {
  if (!el) return
  const s = el as HTMLDivElement & MountState
  clearTimeout(s.__todoTimer)
  delete s.__todoTimer
}
