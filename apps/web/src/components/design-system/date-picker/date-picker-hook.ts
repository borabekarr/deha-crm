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

const SCALE_TABLE   = [1,    0.92, 0.85, 0.78, 0.70]
const OPACITY_TABLE = [1,    0.60, 0.35, 0.15, 0.05]

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function formatLabel(d: number, m: number, y: number): string {
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

/** Callback ref for the .dp-frame element. Wires all wheel picker behavior. */
export function pickerRef(el: HTMLDivElement | null): void {
  if (!el) return

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

  // ── Selected state (default: 12 June 2026) ────────────────────────────────
  const sel = { day: 12, month: 5, year: 2026 } // month is 0-based

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderColumn(scrollEl: HTMLDivElement, values: Array<number | string>, selectedValue: number | string): void {
    scrollEl.innerHTML = ''
    scrollEl.appendChild(makeSpacer())

    for (let i = 0; i < values.length; i++) {
      const item = document.createElement('div')
      item.className = 'dp-item'
      item.textContent = String(values[i])
      if (values[i] == selectedValue) {
        item.classList.add('active')
      }
      scrollEl.appendChild(item)
    }

    scrollEl.appendChild(makeSpacer())
  }

  function getDayValues(): number[] {
    const n = daysInMonth(sel.month, sel.year)
    const arr: number[] = []
    for (let i = 1; i <= n; i++) arr.push(i)
    return arr
  }

  function getYearValues(): number[] {
    const arr: number[] = []
    for (let y = 2000; y <= 2050; y++) arr.push(y)
    return arr
  }

  function renderAll(): void {
    renderColumn($day,   getDayValues(),  sel.day)
    renderColumn($month, MONTHS,          MONTHS[sel.month])
    renderColumn($year,  getYearValues(), sel.year)
  }

  function snapTo(scrollEl: HTMLDivElement, index: number): void {
    scrollEl.scrollTop = index * ROW_H
  }

  function alignAll(): void {
    snapTo($day,   sel.day - 1)      // days are 1-based
    snapTo($month, sel.month)
    snapTo($year,  sel.year - 2000)
  }

  // ── Depth-fade pass ───────────────────────────────────────────────────────
  // FIX: centerIndex = scrollTop / ROW_H (NOT (scrollTop + PADDING) / ROW_H)
  // The original HTML used (scrollTop + PADDING) / ROW_H which was off by
  // PADDING/ROW_H ≈ 2.4 rows, causing the active item to sit above the band.
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
      for (let i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', i === idx)
      }
    }

    // Track whether we already cleared .active mid-scroll so we skip the DOM
    // query on every subsequent scroll frame until the next settle.
    let cleared = false

    function onSettle(): void {
      timerId = null
      cleared = false
      const idx = Math.round(scrollEl.scrollTop / ROW_H)
      commitValue(unit, idx)
      scrollEl.classList.remove('scrolling')
      applyActiveItem()
    }

    function onScroll(): void {
      scrollEl.classList.add('scrolling')
      // On the first scroll event after a settle, strip .active from all items
      // so the watermark is invisible while the wheel is moving.
      if (!cleared) {
        const active = scrollEl.querySelectorAll<HTMLDivElement>('.dp-item.active')
        for (let i = 0; i < active.length; i++) {
          active[i].classList.remove('active')
        }
        cleared = true
      }
      scheduleFrame()
      if (timerId) clearTimeout(timerId)
      timerId = setTimeout(onSettle, 100)
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

  function recomputeDayColumn(): void {
    const maxDay = daysInMonth(sel.month, sel.year)
    if (sel.day > maxDay) {
      sel.day = maxDay
    }
    renderColumn($day, getDayValues(), sel.day)
    snapTo($day, sel.day - 1)
    fadePass($day)
  }

  function updateLabel(): void {
    $label.textContent = formatLabel(sel.day, sel.month, sel.year)
  }

  function commitValue(unit: 'day' | 'month' | 'year', idx: number): void {
    if (unit === 'month') {
      sel.month = clamp(idx, 0, 11)
      recomputeDayColumn()
    } else if (unit === 'year') {
      sel.year = clamp(idx + 2000, 2000, 2050)
      recomputeDayColumn()
    } else if (unit === 'day') {
      const maxDay = daysInMonth(sel.month, sel.year)
      sel.day = clamp(idx + 1, 1, maxDay)
    }
    updateLabel()
  }

  // ── Panel open / close ────────────────────────────────────────────────────
  // The user explicitly chose: panel starts OPEN by default on mount (no click).
  // A hidden element can't be measured/scrolled, so the panel stays visible and
  // the initial align + fade pass runs via rAF below once layout is ready.

  let panelOpen = true

  function alignAndFade(): void {
    alignAll()
    fadePass($day)
    fadePass($month)
    fadePass($year)
  }

  function openPanel(): void {
    $panel.style.display = ''
    panelOpen = true
    requestAnimationFrame(alignAndFade)
  }

  function closePanel(): void {
    $panel.style.display = 'none'
    panelOpen = false
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

  // ── Wire settle handlers ──────────────────────────────────────────────────

  makeSettleHandler(scrollDay,   'day')
  makeSettleHandler(scrollMonth, 'month')
  makeSettleHandler(scrollYear,  'year')

  // ── Initial render ────────────────────────────────────────────────────────

  renderAll()
  updateLabel()

  // Panel is OPEN on mount. Defer two rAF ticks so the browser finishes its
  // first layout pass (the scroll viewports must be measurable/scrollable)
  // before we set scrollTop and run the depth-fade — guarantees the active
  // item in each wheel is dead-centered on the .dp-band without any click.
  let initRaf = requestAnimationFrame(() => {
    initRaf = requestAnimationFrame(alignAndFade)
    allRafs.push(initRaf)
  })
  allRafs.push(initRaf)

  // ── Cleanup stored on element ─────────────────────────────────────────────

  ;(el as PickerEl).__pickerCleanup = () => {
    allTimers.forEach(clearTimeout)
    allRafs.forEach(cancelAnimationFrame)
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
