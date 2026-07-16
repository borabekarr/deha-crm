/**
 * DatetimeWheelPicker hook — DOM-side behavior for the five-wheel iOS
 * date + time picker. Wheel mechanics (snap, settle, depth-fade, aligning
 * guard, committed-index reconciliation) are modeled on date-picker-hook.ts;
 * the sheet enter/exit + scrim chrome reuses the shared sheet chrome timing
 * pattern (local-var-flip + anim-mult; original component now in
 * design-system-archive/).
 *
 * NO raw useEffect. All side-effects run through the exported callback ref.
 * The existing date-picker component is untouched — this extends the pattern
 * to five wheels (day / month / year / hour / minute) in its own file.
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface PickerEl extends HTMLDivElement {
  __datetimeCleanup?: () => void
}

type Unit = 'day' | 'month' | 'year' | 'hour' | 'minute'

// ── Constants (export layout wins: 44px rows / 220px viewport / 88px pads) ────

const ROW_H = 44
const VIEWPORT_H = 220
const PADDING = (VIEWPORT_H - ROW_H) / 2 // 88px — centers first/last item

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const YEAR_MIN = 2000
const YEAR_MAX = 2050

const SCALE_TABLE   = [1, 0.92, 0.85, 0.78, 0.70]
const OPACITY_TABLE = [1, 0.60, 0.35, 0.15, 0.05]

// ── Value tables ─────────────────────────────────────────────────────────────

const DAY_VALUES: string[] = []
for (let d = 1; d <= 31; d++) DAY_VALUES.push(String(d))

const YEAR_VALUES: string[] = []
for (let y = YEAR_MIN; y <= YEAR_MAX; y++) YEAR_VALUES.push(String(y))

const HOUR_VALUES: string[] = []
for (let h = 0; h < 24; h++) HOUR_VALUES.push(String(h).padStart(2, '0'))

const MINUTE_VALUES: string[] = []
for (let mi = 0; mi < 60; mi++) MINUTE_VALUES.push(String(mi).padStart(2, '0'))

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

export interface Sel {
  day: number
  month: number // 0-based
  year: number
  hour: number
  minute: number
}

/** Trigger-card date string, e.g. "4 Jul 2026". */
export function formatDate(s: Sel): string {
  return s.day + ' ' + MONTHS_SHORT[s.month] + ' ' + s.year
}

/** Trigger-card / summary time string, e.g. "14:05". */
export function formatTime(s: Sel): string {
  return String(s.hour).padStart(2, '0') + ':' + String(s.minute).padStart(2, '0')
}

/** Live in-sheet summary, e.g. "Fri, 4 Jul · 14:05". */
export function formatSummary(s: Sel): string {
  const wd = new Date(s.year, s.month, s.day).toLocaleDateString('en-US', { weekday: 'short' })
  return wd + ', ' + s.day + ' ' + MONTHS_SHORT[s.month] + ' · ' + formatTime(s)
}

function makeSpacer(): HTMLDivElement {
  const div = document.createElement('div')
  div.style.height = PADDING + 'px'
  div.style.flexShrink = '0'
  div.setAttribute('aria-hidden', 'true')
  return div
}

// ── Callback ref ─────────────────────────────────────────────────────────────

/** Callback ref for the .dtw-shell element. Wires all five wheels + sheet. */
export function datetimePickerRef(el: HTMLDivElement | null): void {
  if (!el) return

  // If a prior invocation wired this element (ref reattach / StrictMode
  // double-invoke), tear it down first so stale listeners don't corrupt the
  // new instance's aligning window.
  cleanupDatetimePicker(el)

  const rawMult = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult')
  const animMult = parseFloat(rawMult) || 1

  // ── DOM refs ────────────────────────────────────────────────────────────
  const scrollDay    = el.querySelector<HTMLDivElement>('#dtw-scroll-day')
  const scrollMonth  = el.querySelector<HTMLDivElement>('#dtw-scroll-month')
  const scrollYear   = el.querySelector<HTMLDivElement>('#dtw-scroll-year')
  const scrollHour   = el.querySelector<HTMLDivElement>('#dtw-scroll-hour')
  const scrollMinute = el.querySelector<HTMLDivElement>('#dtw-scroll-minute')
  const sheet        = el.querySelector<HTMLDivElement>('#dtw-sheet')
  const scrim        = el.querySelector<HTMLDivElement>('#dtw-scrim')
  const openBtn      = el.querySelector<HTMLButtonElement>('#dtw-open-btn')
  const cancelBtn    = el.querySelector<HTMLButtonElement>('#dtw-cancel-btn')
  const doneBtn      = el.querySelector<HTMLButtonElement>('#dtw-done-btn')
  const resetBtn     = el.querySelector<HTMLButtonElement>('#dtw-reset-btn')
  const summaryEl    = el.querySelector<HTMLDivElement>('#dtw-summary')
  const trgDate      = el.querySelector<HTMLDivElement>('.dtw-trigger-date')
  const trgTime      = el.querySelector<HTMLDivElement>('.dtw-trigger-time')
  const trgBadge     = el.querySelector<HTMLSpanElement>('.dtw-trigger-badge')

  if (
    !scrollDay || !scrollMonth || !scrollYear || !scrollHour || !scrollMinute ||
    !sheet || !scrim || !openBtn || !cancelBtn || !doneBtn || !resetBtn ||
    !summaryEl || !trgDate || !trgTime || !trgBadge
  ) return

  const $day    = scrollDay
  const $month  = scrollMonth
  const $year   = scrollYear
  const $hour   = scrollHour
  const $minute = scrollMinute
  const $sheet   = sheet
  const $scrim   = scrim
  const $summary = summaryEl

  const scrollFor: Record<Unit, HTMLDivElement> = {
    day: $day, month: $month, year: $year, hour: $hour, minute: $minute,
  }

  // ── Working + applied state (default: now) ────────────────────────────────
  const now = new Date()
  // sel = live wheel state (edited in the sheet). applied = committed to trigger.
  const sel: Sel = {
    day:    now.getDate(),
    month:  now.getMonth(),
    year:   clamp(now.getFullYear(), YEAR_MIN, YEAR_MAX),
    hour:   now.getHours(),
    minute: now.getMinutes(),
  }
  const applied: Sel = { ...sel }

  const allTimers: ReturnType<typeof setTimeout>[] = []
  const allRafs: number[] = []

  // ── Index <-> value mapping per unit ──────────────────────────────────────
  function valuesFor(unit: Unit): string[] {
    switch (unit) {
      case 'day':    return DAY_VALUES
      case 'month':  return MONTHS
      case 'year':   return YEAR_VALUES
      case 'hour':   return HOUR_VALUES
      case 'minute': return MINUTE_VALUES
    }
  }
  function indexOfSel(unit: Unit): number {
    switch (unit) {
      case 'day':    return sel.day - 1
      case 'month':  return sel.month
      case 'year':   return sel.year - YEAR_MIN
      case 'hour':   return sel.hour
      case 'minute': return sel.minute
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderColumn(scrollEl: HTMLDivElement, values: string[], selectedIdx: number): void {
    scrollEl.innerHTML = ''
    scrollEl.appendChild(makeSpacer())
    for (let i = 0; i < values.length; i++) {
      const item = document.createElement('div')
      item.className = 'dtw-item'
      item.textContent = values[i]
      item.dataset.idx = String(i)
      if (i === selectedIdx) item.classList.add('active')
      scrollEl.appendChild(item)
    }
    scrollEl.appendChild(makeSpacer())
  }

  function renderAll(): void {
    ;(['day', 'month', 'year', 'hour', 'minute'] as Unit[]).forEach((u) => {
      renderColumn(scrollFor[u], valuesFor(u), indexOfSel(u))
    })
  }

  function snapTo(scrollEl: HTMLDivElement, index: number): void {
    scrollEl.scrollTop = index * ROW_H
  }

  // Programmatic snap that defeats CSS mandatory snap: disable snap, set
  // scrollTop, restore next frame.
  function snapNoSnap(scrollEl: HTMLDivElement, index: number): void {
    const prev = scrollEl.style.scrollSnapType
    scrollEl.style.scrollSnapType = 'none'
    scrollEl.scrollTop = index * ROW_H
    const r = requestAnimationFrame(() => { scrollEl.style.scrollSnapType = prev })
    allRafs.push(r)
  }

  function setActiveIndex(scrollEl: HTMLDivElement, idx: number): void {
    const items = scrollEl.querySelectorAll<HTMLDivElement>('.dtw-item')
    for (let i = 0; i < items.length; i++) items[i].classList.toggle('active', i === idx)
  }

  // Old center value morphs out, new morphs in — only on actual index change.
  function morphActiveItem(scrollEl: HTMLDivElement, newIdx: number): void {
    const items = scrollEl.querySelectorAll<HTMLDivElement>('.dtw-item')
    if (!items.length) return
    let oldIdx = -1
    for (let i = 0; i < items.length; i++) {
      if (items[i].classList.contains('active')) { oldIdx = i; break }
    }
    if (oldIdx === newIdx) return
    if (oldIdx >= 0) {
      const oldItem = items[oldIdx]
      oldItem.classList.remove('active', 'dtw-morph-in')
      oldItem.classList.add('dtw-morph-out')
      const t1 = setTimeout(() => { oldItem.classList.remove('dtw-morph-out') }, Math.round(160 * animMult))
      allTimers.push(t1)
    }
    for (let i = 0; i < items.length; i++) {
      if (i === newIdx) {
        items[i].classList.remove('dtw-morph-out')
        items[i].classList.add('active', 'dtw-morph-in')
        const t2 = setTimeout(() => { items[i].classList.remove('dtw-morph-in') }, Math.round(210 * animMult))
        allTimers.push(t2)
      } else if (i !== oldIdx) {
        items[i].classList.remove('active')
      }
    }
  }

  // ── Depth fade (centerIndex = scrollTop / ROW_H — do NOT add PADDING) ──────
  function fadePass(scrollEl: HTMLDivElement): void {
    const items = scrollEl.querySelectorAll<HTMLDivElement>('.dtw-item')
    if (!items.length) return
    const centerIndex = scrollEl.scrollTop / ROW_H
    for (let i = 0; i < items.length; i++) {
      const dist = Math.abs(i - centerIndex)
      const slot = Math.min(Math.floor(dist), SCALE_TABLE.length - 1)
      const frac = dist - Math.floor(dist)
      const nextSlot = Math.min(slot + 1, SCALE_TABLE.length - 1)
      const scale   = SCALE_TABLE[slot]   + (SCALE_TABLE[nextSlot]   - SCALE_TABLE[slot])   * frac
      const opacity = OPACITY_TABLE[slot] + (OPACITY_TABLE[nextSlot] - OPACITY_TABLE[slot]) * frac
      items[i].style.transform = 'scale(' + scale + ')'
      items[i].style.opacity   = String(opacity)
    }
  }

  function fadeAll(): void {
    ;(['day', 'month', 'year', 'hour', 'minute'] as Unit[]).forEach((u) => fadePass(scrollFor[u]))
  }

  // ── Aligning guard (the "1 January 2000" race fix, extended to 5 wheels) ──
  let aligning = false

  function alignAll(): void {
    aligning = true
    snapNoSnap($day,    sel.day - 1)
    snapNoSnap($month,  sel.month)
    snapNoSnap($year,   sel.year - YEAR_MIN)
    snapNoSnap($hour,   sel.hour)
    snapNoSnap($minute, sel.minute)
    setActiveIndex($day,    sel.day - 1)
    setActiveIndex($month,  sel.month)
    setActiveIndex($year,   sel.year - YEAR_MIN)
    setActiveIndex($hour,   sel.hour)
    setActiveIndex($minute, sel.minute)
    updateSummary()
    const t = setTimeout(() => { aligning = false }, Math.round(220 * animMult))
    allTimers.push(t)
  }

  function alignAndFade(): void {
    alignAll()
    fadeAll()
  }

  // ── Commit (committed-index reconciliation; day clamps to month) ──────────
  function clampDayToMonth(): void {
    const maxDay = daysInMonth(sel.month, sel.year)
    if (sel.day > maxDay) {
      sel.day = maxDay
      snapTo($day, sel.day - 1)
      fadePass($day)
      setActiveIndex($day, sel.day - 1)
    }
  }

  function updateSummary(): void {
    $summary.textContent = formatSummary(sel)
  }

  function commitValue(unit: Unit, idx: number): void {
    switch (unit) {
      case 'month':
        sel.month = clamp(idx, 0, 11)
        clampDayToMonth()
        break
      case 'year':
        sel.year = clamp(idx + YEAR_MIN, YEAR_MIN, YEAR_MAX)
        clampDayToMonth()
        break
      case 'day': {
        const maxDay = daysInMonth(sel.month, sel.year)
        sel.day = clamp(idx + 1, 1, maxDay)
        break
      }
      case 'hour':
        sel.hour = clamp(idx, 0, 23)
        break
      case 'minute':
        sel.minute = clamp(idx, 0, 59)
        break
    }
    updateSummary()
  }

  // ── Settle ────────────────────────────────────────────────────────────────
  function makeSettleHandler(scrollEl: HTMLDivElement, unit: Unit): void {
    let rafId: number | null = null
    let timerId: ReturnType<typeof setTimeout> | null = null

    function onFrame(): void { fadePass(scrollEl); rafId = null }
    function scheduleFrame(): void {
      if (rafId) return
      rafId = requestAnimationFrame(onFrame)
      allRafs.push(rafId)
    }
    function applyActiveItem(): void {
      const items = scrollEl.querySelectorAll<HTMLDivElement>('.dtw-item')
      if (!items.length) return
      const idx = Math.round(scrollEl.scrollTop / ROW_H)
      morphActiveItem(scrollEl, idx)
    }
    function onSettle(): void {
      timerId = null
      if (aligning) { scrollEl.classList.remove('scrolling'); return }
      const idx = Math.round(scrollEl.scrollTop / ROW_H)
      commitValue(unit, idx)
      scrollEl.classList.remove('scrolling')
      applyActiveItem()
    }
    function onScroll(): void {
      scrollEl.classList.add('scrolling')
      scheduleFrame()
      if (timerId) clearTimeout(timerId)
      timerId = setTimeout(onSettle, Math.round(100 * animMult))
      allTimers.push(timerId)
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    if ('onscrollend' in window) {
      scrollEl.addEventListener('scrollend', function () {
        if (timerId) { clearTimeout(timerId); timerId = null }
        onSettle()
      }, { passive: true })
    }
  }

  // ── Click-to-select ───────────────────────────────────────────────────────
  function wireClickToSelect(scrollEl: HTMLDivElement, unit: Unit): void {
    scrollEl.addEventListener('click', function (e: MouseEvent) {
      const target = (e.target as HTMLElement).closest<HTMLDivElement>('.dtw-item')
      if (!target) return
      const idx = parseInt(target.dataset.idx ?? '-1', 10)
      if (idx < 0) return
      scrollEl.scrollTo({ top: idx * ROW_H, behavior: 'smooth' })
      commitValue(unit, idx)
      morphActiveItem(scrollEl, idx)
    })
  }

  // ── Sheet open / close (mounted-through-exit, scrim fades with it) ─────────
  let sheetOpen = true
  let closingTimer: ReturnType<typeof setTimeout> | null = null
  const EXIT_MS = 200

  function openSheet(): void {
    if (closingTimer) { clearTimeout(closingTimer); closingTimer = null }
    // Reset working state to the applied value each time the sheet opens.
    sel.day = applied.day; sel.month = applied.month; sel.year = applied.year
    sel.hour = applied.hour; sel.minute = applied.minute
    $scrim.classList.remove('dtw-scrim--hidden')
    $sheet.classList.remove('dtw-sheet--hidden', 'dtw-sheet--closing')
    void $sheet.offsetHeight
    $scrim.classList.add('dtw-scrim--open')
    $sheet.classList.add('dtw-sheet--open')
    sheetOpen = true
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(alignAndFade)
      allRafs.push(r2)
    })
    allRafs.push(r1)
  }

  function closeSheet(): void {
    sheetOpen = false
    $scrim.classList.remove('dtw-scrim--open')
    $sheet.classList.remove('dtw-sheet--open')
    $sheet.classList.add('dtw-sheet--closing')
    const exitDuration = Math.round(EXIT_MS * animMult * 1.1)
    closingTimer = setTimeout(() => {
      closingTimer = null
      $sheet.classList.remove('dtw-sheet--closing')
      $sheet.classList.add('dtw-sheet--hidden')
      $scrim.classList.add('dtw-scrim--hidden')
    }, exitDuration)
    allTimers.push(closingTimer)
  }

  function applyToTrigger(): void {
    applied.day = sel.day; applied.month = sel.month; applied.year = sel.year
    applied.hour = sel.hour; applied.minute = sel.minute
    trgDate!.textContent = formatDate(applied)
    trgTime!.textContent = formatTime(applied)
    // confirm-pop badge feedback
    trgBadge!.classList.remove('pop')
    void trgBadge!.offsetHeight
    trgBadge!.classList.add('pop')
  }

  function onOpenClick(): void { if (sheetOpen) closeSheet(); else openSheet() }
  function onCancelClick(): void { closeSheet() }
  function onDoneClick(): void { applyToTrigger(); closeSheet() }
  function onScrimClick(): void { closeSheet() }
  function onResetClick(): void {
    const n = new Date()
    sel.day = n.getDate(); sel.month = n.getMonth()
    sel.year = clamp(n.getFullYear(), YEAR_MIN, YEAR_MAX)
    sel.hour = n.getHours(); sel.minute = n.getMinutes()
    alignAndFade()
  }

  openBtn.addEventListener('click', onOpenClick)
  cancelBtn.addEventListener('click', onCancelClick)
  doneBtn.addEventListener('click', onDoneClick)
  resetBtn.addEventListener('click', onResetClick)
  $scrim.addEventListener('click', onScrimClick)

  ;(['day', 'month', 'year', 'hour', 'minute'] as Unit[]).forEach((u) => {
    wireClickToSelect(scrollFor[u], u)
  })

  // ── Initial render (suppress settle commits during init) ──────────────────
  aligning = true
  renderAll()
  applyToTrigger()
  updateSummary()
  trgBadge.classList.remove('pop') // no pop on first paint

  // Sheet + scrim open on mount so the wheels are reviewable immediately.
  $scrim.classList.add('dtw-scrim--open')
  $sheet.classList.add('dtw-sheet--open')

  ;(['day', 'month', 'year', 'hour', 'minute'] as Unit[]).forEach((u) => {
    makeSettleHandler(scrollFor[u], u)
  })

  let initRaf = requestAnimationFrame(() => {
    initRaf = requestAnimationFrame(alignAndFade)
    allRafs.push(initRaf)
  })
  allRafs.push(initRaf)

  // ── Cleanup ───────────────────────────────────────────────────────────────
  ;(el as PickerEl).__datetimeCleanup = () => {
    allTimers.forEach(clearTimeout)
    allRafs.forEach(cancelAnimationFrame)
    if (closingTimer) clearTimeout(closingTimer)
    openBtn!.removeEventListener('click', onOpenClick)
    cancelBtn!.removeEventListener('click', onCancelClick)
    doneBtn!.removeEventListener('click', onDoneClick)
    resetBtn!.removeEventListener('click', onResetClick)
    $scrim.removeEventListener('click', onScrimClick)
  }
}

/** Cleanup — pass to the ref's unmount branch. */
export function cleanupDatetimePicker(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as PickerEl
  e.__datetimeCleanup?.()
  delete e.__datetimeCleanup
}
