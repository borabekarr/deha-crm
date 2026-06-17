/**
 * model-selection-sheet-hook.ts — wires entrance animation, model navigation,
 * badge morphing, logo morph, text morph, and confirm done-state.
 *
 * NO raw useEffect anywhere in the model-selection-sheet folder.
 * All DOM mutation is coordinated via a callback ref on the .sheet element.
 * Cleanup (timers + RAF) is stored on the element itself so the ref teardown
 * can cancel everything when the element unmounts.
 */

// ── Types ──────────────────────────────────────────────────────────────────

interface ModelSheetEl extends HTMLDivElement {
  __mssCleanup?: () => void
}

interface MetricData {
  v: number
  label: string
  tone: 'good' | 'neutral' | 'cost'
}

export interface ModelDef {
  name: string
  vendor: string
  glyph: string
  accent: string
  speed: MetricData
  iq: MetricData
  price: MetricData
  privacy: MetricData
}

export const MODELS: ModelDef[] = [
  { name: 'Atlas Pro', vendor: 'Deha Labs', glyph: 'neurology', accent: '#10B981',
    speed:   { v: 0.66, label: 'FAST',     tone: 'good' },
    iq:      { v: 0.90, label: 'GENIUS',   tone: 'good' },
    price:   { v: 0.50, label: 'STANDARD', tone: 'neutral' },
    privacy: { v: 0.82, label: 'HIGH',     tone: 'good' } },
  { name: 'Nimbus Flash', vendor: 'Northwind AI', glyph: 'bolt', accent: '#F97316',
    speed:   { v: 0.96, label: 'INSTANT', tone: 'good' },
    iq:      { v: 0.58, label: 'SHARP',   tone: 'neutral' },
    price:   { v: 0.26, label: 'LOW',     tone: 'good' },
    privacy: { v: 0.80, label: 'HIGH',    tone: 'good' } },
  { name: 'Sage Max', vendor: 'Meridian', glyph: 'neurology', accent: '#EAB308',
    speed:   { v: 0.40, label: 'STEADY',   tone: 'neutral' },
    iq:      { v: 1.00, label: 'PROFOUND', tone: 'good' },
    price:   { v: 0.92, label: 'PREMIUM',  tone: 'cost' },
    privacy: { v: 0.95, label: 'MAX',      tone: 'good' } },
]

const KEYS: (keyof Pick<ModelDef, 'speed' | 'iq' | 'price' | 'privacy'>)[] = [
  'speed', 'iq', 'price', 'privacy',
]

// ── Colour helpers ─────────────────────────────────────────────────────────

const TONE_COLOR: Record<string, string> = {
  good: '#10B981',
  neutral: '#64748B',
  cost: '#FACC15',
}

function toneColor(tone: string): string {
  return TONE_COLOR[tone] ?? TONE_COLOR.neutral
}

function badgeIsLight(col: string): boolean {
  const m = col.match(/\d+/g)
  if (!m) return false
  return 0.299 * Number(m[0]) + 0.587 * Number(m[1]) + 0.114 * Number(m[2]) > 150
}

function paintBadge(badge: HTMLElement, col: string) {
  badge.style.background = col
  if (badgeIsLight(col)) {
    badge.style.color = '#42320a'
    badge.style.textShadow = 'none'
  } else {
    badge.style.color = '#fff'
    badge.style.textShadow = '0 1px 2px rgba(0,0,0,0.22)'
  }
}

// ── Timing helpers — read shared CSS vars so JS and CSS never drift ────────

/** Read --mss-exit-raw (ms) from the .sheet element at runtime. */
function readExitMs(sheetEl: HTMLElement): number {
  const raw = getComputedStyle(sheetEl).getPropertyValue('--mss-exit-raw').trim()
  return parseFloat(raw) || 140
}

/** Read --mss-enter-raw (ms) from the .sheet element at runtime. */
function readEnterMs(sheetEl: HTMLElement): number {
  const raw = getComputedStyle(sheetEl).getPropertyValue('--mss-enter-raw').trim()
  return parseFloat(raw) || 200
}

// ── Text morph helpers ─────────────────────────────────────────────────────

function setMorphText(host: HTMLElement, text: string) {
  let cur = host.querySelector<HTMLElement>('.morph-cur')
  if (!cur) {
    cur = document.createElement('span')
    cur.className = 'morph-cur'
    host.innerHTML = ''
    host.appendChild(cur)
  }
  cur.textContent = text
}

function morphText(host: HTMLElement, text: string, sheetEl: HTMLElement) {
  const exitMs = readExitMs(sheetEl)
  const enterMs = readEnterMs(sheetEl)
  let cur = host.querySelector<HTMLElement>('.morph-cur')
  if (!cur) { setMorphText(host, ''); cur = host.querySelector<HTMLElement>('.morph-cur')! }
  if (cur.textContent === text) return
  cur.classList.remove('morph-in', 'morph-out')
  void cur.offsetWidth
  cur.classList.add('morph-out')
  const timer = setTimeout(() => {
    cur!.textContent = text
    cur!.classList.remove('morph-out')
    void cur!.offsetWidth
    cur!.classList.add('morph-in')
    setTimeout(() => { cur!.classList.remove('morph-in') }, enterMs)
  }, exitMs)
  return timer
}

// ── Render ─────────────────────────────────────────────────────────────────

function render(el: HTMLElement, idx: number, animate: boolean): ReturnType<typeof setTimeout>[] {
  const m = MODELS[idx]
  const timers: ReturnType<typeof setTimeout>[] = []
  const enterMs = readEnterMs(el)
  const exitMs = readExitMs(el)

  // dots
  el.querySelectorAll<HTMLElement>('.dot').forEach((d, i) =>
    d.classList.toggle('on', i === idx)
  )

  // identity
  const logo = el.querySelector<HTMLElement>('.logo')!
  const mName = el.querySelector<HTMLElement>('.ident-name.morph-host')!
  const mVendor = el.querySelector<HTMLElement>('.ident-vendor.morph-host')!
  const logoGlyph = el.querySelector<HTMLElement>('.logo-glyph')!
  const specsText = el.querySelector<HTMLElement>('#mss-specsText')

  const applyMeta = () => {
    logoGlyph.textContent = m.glyph
    logo.style.setProperty('--accent', m.accent)
    if (specsText) specsText.textContent = 'View Full Specs: ' + m.name
  }

  if (animate) {
    const t1 = morphText(mName, m.name, el)
    const t2 = morphText(mVendor, m.vendor, el)
    if (t1) timers.push(t1)
    if (t2) timers.push(t2)
    logo.classList.remove('pulsing')
    void logo.offsetWidth
    logo.classList.add('pulsing')
    // swap glyph/accent at midpoint of exit (half exit duration)
    const t3 = setTimeout(applyMeta, exitMs / 2)
    timers.push(t3)
  } else {
    setMorphText(mName, m.name)
    setMorphText(mVendor, m.vendor)
    applyMeta()
  }

  // metrics
  KEYS.forEach((k) => {
    const data = m[k]
    const badge = el.querySelector<HTMLElement>(`[data-badge="${k}"]`)!
    const fill = el.querySelector<HTMLElement>(`[data-fill="${k}"]`)!
    const col = toneColor(data.tone)
    fill.style.setProperty('--barcolor', col)

    let cur = badge.querySelector<HTMLElement>('.m-badge-txt')
    if (!cur) {
      badge.innerHTML = '<span class="m-badge-txt"></span>'
      cur = badge.querySelector<HTMLElement>('.m-badge-txt')!
    }

    if (animate) {
      const startW = badge.offsetWidth
      const ghost = document.createElement('span')
      ghost.className = 'm-badge-ghost'
      ghost.textContent = cur.textContent
      badge.appendChild(ghost)

      cur.textContent = data.label
      badge.className = 'm-badge'
      paintBadge(badge, col)
      void badge.offsetWidth
      badge.classList.add('morphing')

      badge.style.width = 'auto'
      const endW = badge.offsetWidth
      badge.style.width = startW + 'px'
      void badge.offsetWidth
      badge.style.width = endW + 'px'

      // keep ghost mounted through exit + enter, then clean up
      const t = setTimeout(() => {
        if (ghost.parentNode) ghost.remove()
        badge.classList.remove('morphing')
        badge.style.width = ''
      }, exitMs + enterMs)
      timers.push(t)

      fill.style.setProperty('--w', (data.v * 100).toFixed(1) + '%')
      fill.style.width = 'var(--w)'
    } else {
      cur.textContent = data.label
      badge.className = 'm-badge'
      paintBadge(badge, col)
      fill.style.setProperty('--w', (data.v * 100).toFixed(1) + '%')
      fill.style.width = 'var(--w)'
    }
  })

  return timers
}

// ── Callback ref ────────────────────────────────────────────────────────────

export function modelSelectionSheetRef(el: HTMLDivElement | null): void {
  if (!el) return
  const sheetEl: HTMLElement = el

  let idx = 0
  const activeTimers: ReturnType<typeof setTimeout>[] = []
  let confirmTimer: ReturnType<typeof setTimeout> | null = null

  // initial render — populate resting state, then add .intro class once
  activeTimers.push(...render(sheetEl, idx, false))
  sheetEl.classList.add('intro')
  sheetEl.querySelectorAll<HTMLElement>('.m-badge').forEach(b => b.classList.add('morphing'))
  const introTimer = setTimeout(() => {
    sheetEl.classList.remove('intro')
    sheetEl.querySelectorAll<HTMLElement>('.m-badge').forEach(b => b.classList.remove('morphing'))
  }, 1300)
  activeTimers.push(introTimer)

  // navigation
  function go(dir: number) {
    idx = (idx + dir + MODELS.length) % MODELS.length
    activeTimers.push(...render(sheetEl, idx, true))
  }

  const prevBtn = sheetEl.querySelector<HTMLButtonElement>('#mss-prevBtn')!
  const nextBtn = sheetEl.querySelector<HTMLButtonElement>('#mss-nextBtn')!
  const confirmBtn = sheetEl.querySelector<HTMLButtonElement>('#mss-confirmBtn')!
  const confirmText = sheetEl.querySelector<HTMLSpanElement>('#mss-confirmText')!
  const confirmIcon = sheetEl.querySelector<HTMLElement>('#mss-confirmIcon')!

  const onPrev = () => go(-1)
  const onNext = () => go(1)
  prevBtn.addEventListener('click', onPrev)
  nextBtn.addEventListener('click', onNext)

  // Read --mss-confirm-morph-raw from the sheet element so CSS and JS stay in sync
  function readConfirmMorphMs(): number {
    const raw = getComputedStyle(sheetEl).getPropertyValue('--mss-confirm-morph-raw').trim()
    return parseFloat(raw) || 220
  }

  const onConfirm = () => {
    if (confirmBtn.classList.contains('is-morphing')) return
    const morphMs = readConfirmMorphMs()
    // entering green: compact → grow → done
    confirmBtn.classList.remove('is-done')
    void confirmBtn.offsetWidth
    confirmBtn.classList.add('is-morphing', 'is-compact')
    const t1 = setTimeout(() => {
      confirmBtn.classList.remove('is-compact')
      confirmBtn.classList.add('is-done')
      confirmText.textContent = 'Selected'
      confirmIcon.textContent = 'check_circle'
    }, morphMs)
    const t2 = setTimeout(() => {
      confirmBtn.classList.remove('is-morphing')
    }, morphMs * 2)
    activeTimers.push(t1, t2)

    if (confirmTimer) clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      // exiting green: compact → grow → normal (same morph duration, symmetric)
      confirmBtn.classList.add('is-morphing', 'is-compact')
      const t3 = setTimeout(() => {
        confirmBtn.classList.remove('is-compact', 'is-done')
        confirmText.textContent = 'Confirm Selection'
        confirmIcon.textContent = 'check'
      }, morphMs)
      const t4 = setTimeout(() => {
        confirmBtn.classList.remove('is-morphing')
      }, morphMs * 2)
      activeTimers.push(t3, t4)
    }, 1600)
  }
  confirmBtn.addEventListener('click', onConfirm)

  // specs — no-op demo
  const specsBtn = sheetEl.querySelector<HTMLButtonElement>('#mss-specsBtn')!
  const onSpecs = (e: Event) => e.preventDefault()
  specsBtn.addEventListener('click', onSpecs)

  // store cleanup on the element
  ;(el as ModelSheetEl).__mssCleanup = () => {
    activeTimers.forEach(t => clearTimeout(t))
    if (confirmTimer) clearTimeout(confirmTimer)
    prevBtn.removeEventListener('click', onPrev)
    nextBtn.removeEventListener('click', onNext)
    confirmBtn.removeEventListener('click', onConfirm)
    specsBtn.removeEventListener('click', onSpecs)
  }
}

export function cleanupModelSelectionSheet(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as ModelSheetEl
  e.__mssCleanup?.()
  delete e.__mssCleanup
}
