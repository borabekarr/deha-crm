/**
 * DatePicker hook — encapsulates all DOM-side behavior for the iOS wheel date picker.
 *
 * NO raw useEffect anywhere in this folder.
 * All side-effects are expressed via callback refs (ref prop on JSX elements).
 * The returned ref-setter is stable — it wires/unwires on mount/unmount.
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface PickerEl extends HTMLDivElement {
  __pickerCleanup?: () => void
}

// ── Constants ────────────────────────────────────────────────────────────────

const ROW_H = 38
const VIEWPORT_H = 220
const PADDING = (VIEWPORT_H - ROW_H) / 2 // 91px — centers first/last item

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Static day list 1–31 (item 2: built once, never re-rendered)
const DAY_VALUES: number[] = []
for (let d = 1; d <= 31; d++) DAY_VALUES.push(d)

const SCALE_TABLE   = [1,    0.92, 0.85, 0.78, 0.70]
const OPACITY_TABLE = [1,    0.60, 0.35, 0.15, 0.05]

// Animation duration for panel close timeout (item 4); enter is CSS-driven
const PANEL_EXIT_MS  = 300

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

export function formatLabel(d: number, m: number, y: number): string {
  return d + ' ' + MONTHS[m] + ' ' + y
}

function makeSpacer(): HTMLDivElement {
  const div = document.createElement('div')
  div.style.height = PADDING + 'px'
  div.style.flexShrink = '0'
  div.setAttribute('aria-hidden', 'true')
  return div
}

// ── Callback ref ─────────────────────────────────────────────────────────────

/** Callback ref for the .dp-shell element. Wires all wheel picker behavior. */
export function pickerRef(el: HTMLDivElement | null): void {
  if (!el) return

  // Guard: if a previous pickerRef wired this same element (e.g. React StrictMode
  // double-invoke or ref detach/reattach), tear it down first so its scroll
  // listeners don't interfere with the new instance's aligning window.
  cleanupPicker(el)

  // Item 1: read --anim-mult so JS timers stay in sync with 4x CSS slowdown.
  // Fallback to 1 if the property is absent or non-numeric.
  const rawMult = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult')
  const animMult = parseFloat(rawMult) || 1

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const scrollDay   = el.querySelector<HTMLDivElement>('#dp-scroll-day')
  const scrollMonth = el.querySelector<HTMLDivElement>('#dp-scroll-month')
  const scrollYear  = el.querySelector<HTMLDivElement>('#dp-scroll-year')
  const panel       = el.querySelector<HTMLDivElement>('#dp-panel')
  const openBtn     = el.querySelector<HTMLButtonElement>('#dp-open-btn')
  const closeBtn    = el.querySelector<HTMLButtonElement>('#dp-close-btn')
  const confirmBtn  = el.querySelector<HTMLButtonElement>('#dp-confirm-btn')

  if (!scrollDay || !scrollMonth || !scrollYear || !panel || !openBtn || !closeBtn || !confirmBtn) return

  const triggerLabel = openBtn.querySelector<HTMLSpanElement>('.dp-trigger-label')
  if (!triggerLabel) return

  // Non-null narrowed aliases for use inside inner functions
  const $day   = scrollDay
  const $month = scrollMonth
  const $year  = scrollYear
  const $panel = panel
  const $label = triggerLabel

  // ── Selected state (item 5: default to today) ─────────────────────────────
  const today = new Date()
  const sel = {
    day:   today.getDate(),
    month: today.getMonth(),   // 0-based
    year:  today.getFullYear(),
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderColumn(scrollEl: HTMLDivElement, values: Array<number | string>, selectedValue: number | string): void {
    scrollEl.innerHTML = ''
    scrollEl.appendChild(makeSpacer())

    for (let i = 0; i < values.length; i++) {
      const item = document.createElement('div')
      item.className = 'dp-item'
      item.textContent = String(values[i])
      item.dataset.idx = String(i)
      if (values[i] == selectedValue) {
        item.classList.add('active')
      }
      scrollEl.appendChild(item)
    }

    scrollEl.appendChild(makeSpacer())
  }

  function getYearValues(): number[] {
    const arr: number[] = []
    for (let y = 2000; y <= 2050; y++) arr.push(y)
    return arr
  }

  function renderAll(): void {
    // Item 2: day wheel uses static DAY_VALUES (1–31) — rendered once, never rebuilt
    renderColumn($day,   DAY_VALUES, sel.day)
    renderColumn($month, MONTHS,     MONTHS[sel.month])
    renderColumn($year,  getYearValues(), sel.year)
  }

  function snapTo(scrollEl: HTMLDivElement, index: number): void {
    scrollEl.scrollTop = index * ROW_H
  }

  // True while alignAll is programmatically positioning the wheels. The settle
  // handler must NOT commit scroll-derived values during this window, otherwise
  // an early settle (fired while scrollTop is still 0, before/while we snap)
  // overwrites sel with index-0 values → the "1 January 2000" default-label race.
  let aligning = false

  function setActiveIndex(scrollEl: HTMLDivElement, idx: number): void {
    const items = scrollEl.querySelectorAll<HTMLDivElement>('.dp-item')
    for (let i = 0; i < items.length; i++) items[i].classList.toggle('active', i === idx)
  }

  // (d) Active-value morph — old center value morphs out, new morphs in.
  // Only fires on actual index change; keeps callback-ref pattern (no useEffect).
  function morphActiveItem(scrollEl: HTMLDivElement, newIdx: number): void {
    const items = scrollEl.querySelectorAll<HTMLDivElement>('.dp-item')
    if (!items.length) return

    // Find the currently active item
    let oldIdx = -1
    for (let i = 0; i < items.length; i++) {
      if (items[i].classList.contains('active')) { oldIdx = i; break }
    }

    if (oldIdx === newIdx) return // no change — skip animation

    // Morph out the old active item
    if (oldIdx >= 0) {
      const oldItem = items[oldIdx]
      oldItem.classList.remove('active', 'dp-morph-in')
      oldItem.classList.add('dp-morph-out')
      const t1 = setTimeout(() => { oldItem.classList.remove('dp-morph-out') }, Math.round(160 * animMult))
      allTimers.push(t1)
    }

    // Morph in the new active item and all others
    for (let i = 0; i < items.length; i++) {
      if (i === newIdx) {
        items[i].classList.remove('dp-morph-out')
        items[i].classList.add('active', 'dp-morph-in')
        const t2 = setTimeout(() => { items[i].classList.remove('dp-morph-in') }, Math.round(210 * animMult))
        allTimers.push(t2)
      } else if (i !== oldIdx) {
        items[i].classList.remove('active')
      }
    }
  }

  // Programmatic snap that defeats CSS scroll-snap (mandatory) snapping the
  // target scrollTop back to 0: disable snap, set scrollTop, restore next frame.
  function snapNoSnap(scrollEl: HTMLDivElement, index: number): void {
    const prev = scrollEl.style.scrollSnapType
    scrollEl.style.scrollSnapType = 'none'
    scrollEl.scrollTop = index * ROW_H
    const r = requestAnimationFrame(() => { scrollEl.style.scrollSnapType = prev })
    allRafs.push(r)
  }

  function alignAll(): void {
    aligning = true
    snapNoSnap($day,   sel.day - 1)   // days are 1-based; index = day - 1
    snapNoSnap($month, sel.month)
    snapNoSnap($year,  sel.year - 2000)
    // Authoritatively reflect sel (today, by default) — do not wait on settle.
    setActiveIndex($day,   sel.day - 1)
    setActiveIndex($month, sel.month)
    setActiveIndex($year,  sel.year - 2000)
    updateLabel()
    const t = setTimeout(() => { aligning = false }, Math.round(220 * animMult)) // > 100ms settle window
    allTimers.push(t)
  }

  // ── Depth-fade pass ───────────────────────────────────────────────────────
  // FIX: centerIndex = scrollTop / ROW_H (NOT (scrollTop + PADDING) / ROW_H)
  function fadePass(scrollEl: HTMLDivElement): void {
    const items = scrollEl.querySelectorAll<HTMLDivElement>('.dp-item')
    if (!items.length) return
    const centerIndex = scrollEl.scrollTop / ROW_H  // FIXED: removed + PADDING

    for (let i = 0; i < items.length; i++) {
      const dist = Math.abs(i - centerIndex)
      const slot = Math.min(Math.floor(dist), SCALE_TABLE.length - 1)
      const frac = dist - Math.floor(dist)
      const nextSlot = Math.min(slot + 1, SCALE_TABLE.length - 1)
      const scale   = SCALE_TABLE[slot]   + (SCALE_TABLE[nextSlot]   - SCALE_TABLE[slot])   * frac
      const opacity = OPACITY_TABLE[slot] + (OPACITY_TABLE[nextSlot] - OPACITY_TABLE[slot]) * frac

      items[i].style.transform = 'scale(' + scale + ')'
      items[i].style.opacity   = String(opacity)
      // Active class is NOT toggled during scroll -- applied only on settle.
    }
  }

  // ── Settle logic ──────────────────────────────────────────────────────────

  const allTimers: ReturnType<typeof setTimeout>[] = []
  const allRafs:   number[] = []

  function makeSettleHandler(scrollEl: HTMLDivElement, unit: 'day' | 'month' | 'year'): void {
    let rafId: number | null = null
    let timerId: ReturnType<typeof setTimeout> | null = null

    function onFrame(): void {
      fadePass(scrollEl)
      rafId = null
    }

    function scheduleFrame(): void {
      if (rafId) return
      rafId = requestAnimationFrame(onFrame)
      allRafs.push(rafId)
    }

    function applyActiveItem(): void {
      const items = scrollEl.querySelectorAll<HTMLDivElement>('.dp-item')
      if (!items.length) return
      const idx = Math.round(scrollEl.scrollTop / ROW_H)
      // (d) morph the active center value on settle
      morphActiveItem(scrollEl, idx)
    }

    function onSettle(): void {
      timerId = null
      // Skip scroll-derived commits while alignAll is positioning the wheels —
      // sel/label are already authoritative (see alignAll).
      if (aligning) { scrollEl.classList.remove('scrolling'); return }
      const idx = Math.round(scrollEl.scrollTop / ROW_H)
      commitValue(unit, idx)
      scrollEl.classList.remove('scrolling')
      applyActiveItem()
    }

    function onScroll(): void {
      scrollEl.classList.add('scrolling')
      // Do NOT strip .active during scroll -- the band is a static visual indicator
      // and the active item highlight must remain visible while the wheel is moving.
      scheduleFrame()
      if (timerId) clearTimeout(timerId)
      timerId = setTimeout(onSettle, Math.round(100 * animMult))
      allTimers.push(timerId)
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })

    if ('onscrollend' in window) {
      scrollEl.addEventListener('scrollend', function () {
        if (timerId) {
          clearTimeout(timerId)
          timerId = null
        }
        onSettle()
      }, { passive: true })
    }
  }

  // ── Commit a settled value ────────────────────────────────────────────────

  // Item 2: recomputeDayColumn no longer rebuilds DOM — only clamps sel.day and re-snaps.
  function clampDayToMonth(): void {
    const maxDay = daysInMonth(sel.month, sel.year)
    if (sel.day > maxDay) {
      sel.day = maxDay
      snapTo($day, sel.day - 1)
      fadePass($day)
      // Re-apply active class to the clamped item
      const items = $day.querySelectorAll<HTMLDivElement>('.dp-item')
      for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', i === sel.day - 1)
      }
    }
  }

  function updateLabel(): void {
    $label.textContent = formatLabel(sel.day, sel.month, sel.year)
  }

  function commitValue(unit: 'day' | 'month' | 'year', idx: number): void {
    if (unit === 'month') {
      sel.month = clamp(idx, 0, 11)
      clampDayToMonth()  // Item 2: no DOM rebuild, only clamp+snap if needed
    } else if (unit === 'year') {
      sel.year = clamp(idx + 2000, 2000, 2050)
      clampDayToMonth()  // Item 2: no DOM rebuild, only clamp+snap if needed
    } else if (unit === 'day') {
      const maxDay = daysInMonth(sel.month, sel.year)
      sel.day = clamp(idx + 1, 1, maxDay)
    }
    updateLabel()
  }

  // ── Click-to-select (item 3) ──────────────────────────────────────────────
  // Attach to a wheel scroll container; on item click → smooth-snap + commit.
  function wireClickToSelect(scrollEl: HTMLDivElement, unit: 'day' | 'month' | 'year'): void {
    scrollEl.addEventListener('click', function (e: MouseEvent) {
      const target = (e.target as HTMLElement).closest<HTMLDivElement>('.dp-item')
      if (!target) return
      const idx = parseInt(target.dataset.idx ?? '-1', 10)
      if (idx < 0) return
      // Smooth-scroll to the clicked item position
      scrollEl.scrollTo({ top: idx * ROW_H, behavior: 'smooth' })
      // Commit the value immediately (the settle handler will re-commit on
      // scrollend as well, but committing here gives instant label update)
      commitValue(unit, idx)
      // (d) morph active value for instant visual feedback on click
      morphActiveItem(scrollEl, idx)
    })
  }

  // ── Panel open / close (item 4) ───────────────────────────────────────────
  // Mounted-through-exit: panel stays in DOM. Classes drive the animation.
  // .dp-panel-closing added on close → CSS exit transition → then hidden class.
  // Mirrors PrizeSheet .ps-modal-shell pattern (scale + opacity spring).

  let panelOpen = true
  let closingTimer: ReturnType<typeof setTimeout> | null = null

  function alignAndFade(): void {
    alignAll()
    fadePass($day)
    fadePass($month)
    fadePass($year)
  }

  function openPanel(): void {
    // Remove hidden/closing states and add open
    if (closingTimer) {
      clearTimeout(closingTimer)
      closingTimer = null
    }
    $panel.classList.remove('dp-panel--hidden', 'dp-panel--closing')
    // Trigger reflow so the open class transition fires from the base state
    void $panel.offsetHeight
    $panel.classList.add('dp-panel--open')
    panelOpen = true
    // Two-rAF settle (preserved from original) so wheels are scrollable
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(alignAndFade)
      allRafs.push(r2)
    })
    allRafs.push(r1)
  }

  function closePanel(): void {
    panelOpen = false
    $panel.classList.remove('dp-panel--open')
    $panel.classList.add('dp-panel--closing')
    // After exit transition completes, hide the panel
    const exitDuration = Math.round(PANEL_EXIT_MS * animMult * 1.1) // slight buffer, scaled by --anim-mult
    closingTimer = setTimeout(() => {
      closingTimer = null
      $panel.classList.remove('dp-panel--closing')
      $panel.classList.add('dp-panel--hidden')
    }, exitDuration)
    allTimers.push(closingTimer)
  }

  function onOpenClick(): void {
    if (panelOpen) closePanel(); else openPanel()
  }
  function onCloseClick(): void {
    closePanel()
  }
  function onConfirmClick(): void {
    updateLabel()
    closePanel()
  }

  openBtn.addEventListener('click', onOpenClick)
  closeBtn.addEventListener('click', onCloseClick)
  confirmBtn.addEventListener('click', onConfirmClick)

  // ── Wire click-to-select on all three wheels (item 3) ────────────────────

  wireClickToSelect($day,   'day')
  wireClickToSelect($month, 'month')
  wireClickToSelect($year,  'year')

  // ── Initial render ────────────────────────────────────────────────────────

  // Block scroll-settle commits during init: populating scroll containers with
  // DOM items (renderAll) and the subsequent CSS snap alignment can fire scroll
  // and scrollend events before alignAll runs, overwriting sel with index-0
  // values ("1 January 2000"). Set aligning=true early to suppress those commits.
  aligning = true

  renderAll()
  updateLabel()

  // Panel is OPEN on mount (add open class without transition to avoid flash).
  $panel.classList.add('dp-panel--open')

  // Wire settle handlers AFTER the initial DOM is in place so they don't
  // fire on DOM-insertion scroll events. (click-to-select is already wired above.)
  makeSettleHandler(scrollDay,   'day')
  makeSettleHandler(scrollMonth, 'month')
  makeSettleHandler(scrollYear,  'year')

  // Defer two rAF ticks so the browser finishes its first layout pass before
  // setting scrollTop and running the depth-fade.
  let initRaf = requestAnimationFrame(() => {
    initRaf = requestAnimationFrame(alignAndFade)
    allRafs.push(initRaf)
  })
  allRafs.push(initRaf)

  // ── Cleanup stored on element ─────────────────────────────────────────────

  ;(el as PickerEl).__pickerCleanup = () => {
    allTimers.forEach(clearTimeout)
    allRafs.forEach(cancelAnimationFrame)
    if (closingTimer) clearTimeout(closingTimer)
    openBtn!.removeEventListener('click', onOpenClick)
    closeBtn!.removeEventListener('click', onCloseClick)
    confirmBtn!.removeEventListener('click', onConfirmClick)
  }
}

/** Cleanup — pass to the ref's unmount branch. */
export function cleanupPicker(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as PickerEl
  e.__pickerCleanup?.()
  delete e.__pickerCleanup
}
