/**
 * statistics-graph-card-hook.ts
 *
 * NO raw useEffect anywhere in this folder.
 * All animation and DOM wiring is done via callback refs on the card elements.
 *
 * Exports:
 *   - sgcCardRef   — callback ref for each .sg-card element; wires all listeners + animations
 *   - sgcCleanup   — cleans up listeners stored on the element
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface SgCardData {
  stage: 'good' | 'warn' | 'risk'
  use: string
  initials?: string
  icon?: string
  name: string
  sub: string
  vlabel: string
  value: number
  unit: string
  dir: 'up' | 'down'
  delta: string
  period: string
  likeLabel: string
  like: number
  cta: string
  ctaIcon: string
  _series?: number[]
  _rangeLabel?: string
}

// ── Internal helpers ─────────────────────────────────────────────────────────

const ACCENTS: Record<string, string> = {
  good: '#10B981',
  warn: '#EAB308',
  risk: '#EF4444',
}

const RANGE_PTS: Record<string, number> = {
  Today: 24,
  Weekly: 7,
  Monthly: 30,
  Quarterly: 13,
  Yearly: 12,
}

function qs<T extends Element>(sel: string, root: Element): T | null {
  return root.querySelector<T>(sel)
}

function fmtMoney(n: number, unit: string): string {
  const rounded = Math.round(n).toLocaleString('en-US')
  return unit === '$' ? '$' + rounded : rounded + (unit || '')
}

function genSeries(n: number, dir: number): number[] {
  const a: number[] = []
  let v = 50
  const drift = dir * 1.5
  for (let i = 0; i < n; i++) {
    v += drift + (Math.random() - 0.5) * 7
    a.push(v)
  }
  return a
}

function buildChart(card: HTMLElement, d: SgCardData): void {
  const W = 312, H = 364
  const TOP = 58, BAND = 92
  const acc = ACCENTS[d.stage] ?? ACCENTS.good
  const data = d._series ?? []
  if (!data.length) return
  const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = TOP + (1 - (v - min) / rng) * BAND
    return [x, y] as [number, number]
  })
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')
  const area = line + ` L${W},${H} L0,${H} Z`
  const last = pts[pts.length - 1]
  const gid = 'sgg-' + Math.random().toString(36).slice(2, 8)
  const chartEl = qs<HTMLElement>('.sg-chart', card)
  if (!chartEl) return
  chartEl.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${acc}" stop-opacity="0.24"/>
      <stop offset="55%" stop-color="${acc}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${acc}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#${gid})" class="sg-area"/>
    <path d="${line}" class="sg-line" stroke="${acc}"/>
  </svg>`
  const lineEl = qs<SVGPathElement>('.sg-line', card)
  const areaEl = qs<SVGPathElement>('.sg-area', card)
  if (!lineEl || !areaEl) return
  const len = lineEl.getTotalLength()
  lineEl.style.transition = 'none'
  lineEl.style.strokeDasharray = String(len)
  lineEl.style.strokeDashoffset = String(len)
  areaEl.style.opacity = '0'
  setTimeout(() => {
    lineEl.style.transition = 'stroke-dashoffset 900ms cubic-bezier(.33,1,.68,1)'
    lineEl.style.strokeDashoffset = '0'
    areaEl.style.transition = 'opacity 700ms ease 200ms'
    areaEl.style.opacity = '1'
  }, 40)
  setTimeout(() => {
    lineEl.style.transition = 'none'
    lineEl.style.strokeDasharray = 'none'
    lineEl.style.strokeDashoffset = '0'
    areaEl.style.transition = 'none'
    areaEl.style.opacity = '1'
  }, 1150)
  const dot = qs<HTMLElement>('.sg-dot', card)
  if (dot) {
    dot.style.left = (last[0] / W * 100) + '%'
    dot.style.top = (last[1] / H * 100) + '%'
  }
}

function tweenValue(card: HTMLElement, from: number, d: SgCardData): void {
  const to = d.value
  const elOrNull = qs<HTMLElement>('[data-value]', card)
  if (!elOrNull) return
  const valueEl: HTMLElement = elOrNull
  const t0 = performance.now()
  let raf: number
  function step(now: number) {
    let p = Math.min(1, (now - t0) / 750)
    p = 1 - Math.pow(1 - p, 3)
    valueEl.textContent = fmtMoney(from + (to - from) * p, d.unit)
    if (p < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
  setTimeout(() => {
    cancelAnimationFrame(raf)
    valueEl.textContent = fmtMoney(to, d.unit)
  }, 810)
}

function setDelta(card: HTMLElement, d: SgCardData): void {
  const pill = qs<HTMLElement>('.sg-delta-pill', card)
  if (!pill) return
  const up = d.dir === 'up'
  pill.className = 'sg-delta-pill ' + (up ? 'up' : 'down')
  pill.innerHTML = `<span class="material-icons">${up ? 'trending_up' : 'trending_down'}</span>${d.delta}`
  const period = qs<HTMLElement>('.sg-period', card)
  if (period) period.textContent = d.period
}

function setMeter(card: HTMLElement, d: SgCardData): void {
  const val = qs<HTMLElement>('.sg-meter-val', card)
  if (val) val.textContent = d.like + '%'
  const fill = qs<HTMLElement>('.sg-meter-fill', card)
  if (!fill) return
  fill.style.width = '0%'
  void fill.offsetWidth // reflow → gives the transition a start point
  fill.style.width = Math.max(3, Math.min(100, d.like)) + '%'
}

function ripple(e: MouseEvent, el: HTMLElement): void {
  const r = el.getBoundingClientRect()
  const size = Math.max(r.width, r.height)
  const s = document.createElement('span')
  s.className = 'sg-ripple'
  s.style.width = s.style.height = size + 'px'
  s.style.left = ((e.clientX || r.left + r.width / 2) - r.left - size / 2) + 'px'
  s.style.top = ((e.clientY || r.top + r.height / 2) - r.top - size / 2) + 'px'
  el.appendChild(s)
  setTimeout(() => s.remove(), 540)
}

function runThinking(cta: HTMLElement, d: SgCardData): void {
  if (cta.classList.contains('thinking') || cta.classList.contains('done')) return
  const steps = ['Analyzing trend', 'Scoring signals', 'Modeling scenarios', 'Drafting report']
  const original = cta.innerHTML
  cta.classList.add('thinking')
  cta.setAttribute('aria-busy', 'true')
  cta.innerHTML = '<span class="sg-spin"></span><span class="sg-step morph">' + steps[0] + '</span>'
  const stepEl = qs<HTMLElement>('.sg-step', cta)
  let i = 0
  const STEP_MS = 3000
  const timer = setInterval(() => {
    i++
    if (i < steps.length) {
      if (stepEl) {
        stepEl.classList.remove('morph')
        void stepEl.offsetWidth
        stepEl.textContent = steps[i]
        stepEl.classList.add('morph')
      }
    } else {
      clearInterval(timer)
      cta.classList.remove('thinking')
      cta.classList.add('done')
      cta.innerHTML = '<span class="sg-check"><span class="material-symbols-outlined">check</span></span><span class="sg-step morph">Report ready</span>'
      showToast('Optimization report ready · ' + d.name)
      setTimeout(() => {
        cta.classList.remove('done')
        cta.removeAttribute('aria-busy')
        cta.innerHTML = original
      }, 1500)
    }
  }, STEP_MS)
}

// Toast singleton — managed via DOM so it works across multiple cards
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(msg: string): void {
  const t = document.querySelector<HTMLElement>('.sgc-toast')
  const msgEl = document.querySelector<HTMLElement>('#sgcToastMsg')
  if (!t || !msgEl) return
  msgEl.textContent = msg
  t.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('show'), 1700)
}

// ── Public API ────────────────────────────────────────────────────────────────

type CardCleanup = () => void

/**
 * Callback ref for each .sg-card element.
 * Wires all event listeners and kicks off initial animations.
 * Returns a cleanup function stored on the element.
 */
export function sgcCardRef(elOrNull: HTMLElement | null, d: SgCardData): void {
  if (!elOrNull) return
  const el: HTMLElement = elOrNull

  // Guard against React re-calling the ref callback on the same element
  // (happens when parent re-renders). Re-attaching without removing the old
  // listeners doubles up the toggleFilters calls, causing open+close in one click.
  const typed = el as HTMLElement & { __sgcInitialized?: boolean }
  if (typed.__sgcInitialized) return
  typed.__sgcInitialized = true

  // Init series
  d._series = genSeries(26, d.dir === 'up' ? 1 : -1)
  d._rangeLabel = 'Monthly'

  setDelta(el, d)
  setMeter(el, d)
  buildChart(el, d)
  setTimeout(() => tweenValue(el, 0, d), 60)

  const cta = qs<HTMLElement>('[data-cta]', el)
  const syncBtn = qs<HTMLElement>('[data-sync]', el)
  const seg = qs<HTMLElement>('.seg.vert', el)
  const chip = qs<HTMLElement>('[data-rangechip]', el)
  const pop = qs<HTMLElement>('[data-rangepop]', el)
  const pill0 = seg?.querySelector<HTMLElement>('.seg-pill')

  function moveVert(): void {
    if (!seg || !pill0) return
    const a = seg.querySelector<HTMLElement>('button.active')
    if (!a) return
    pill0.style.top = a.offsetTop + 'px'
    pill0.style.height = a.offsetHeight + 'px'
  }

  function openFilters(): void { el.classList.add('filters-open'); moveVert() }
  function closeFilters(): void { el.classList.remove('filters-open') }
  function toggleFilters(): void { if (el.classList.contains('filters-open')) { closeFilters() } else { openFilters() } }

  // Initial pill placement without animating
  if (pill0) {
    pill0.style.transition = 'none'
    moveVert()
    setTimeout(() => { pill0.style.transition = ''; moveVert() }, 60)
  }

  function onSegClick(e: MouseEvent): void {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
    if (!b || !seg?.contains(b)) return
    e.stopPropagation()
    if (pop?.classList.contains('loading')) return
    seg?.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b))
    moveVert()
    b.classList.remove('just-picked')
    void b.offsetWidth
    b.classList.add('just-picked')
    const label = (b.dataset as { r?: string }).r ?? 'Monthly'
    pop?.classList.add('loading')
    setTimeout(() => {
      pop?.classList.remove('loading')
      if (chip?.firstChild) (chip.firstChild as Text).textContent = label
      d._rangeLabel = label
      d._series = genSeries(RANGE_PTS[label] ?? 26, d.dir === 'up' ? 1 : -1)
      buildChart(el, d)
      closeFilters()
    }, 760)
  }

  function onChipClick(e: MouseEvent): void { e.stopPropagation(); toggleFilters() }

  function onCtaClick(e: MouseEvent): void {
    e.stopPropagation()
    if (cta) { ripple(e, cta); runThinking(cta, d) }
  }

  function onSyncClick(e: MouseEvent): void {
    e.stopPropagation()
    if (!syncBtn) return
    syncBtn.classList.add('spin')
    setTimeout(() => syncBtn.classList.remove('spin'), 700)
    d._series = genSeries(26, d.dir === 'up' ? 1 : -1)
    buildChart(el, d)
    tweenValue(el, Math.round(d.value * 0.99), d)
    const updEl = qs<HTMLElement>('.sg-upd', el)
    if (updEl) updEl.textContent = 'just now'
    showToast('Synced · ' + d.name)
  }

  function onCardClick(e: MouseEvent): void {
    const target = e.target as HTMLElement
    if (target.closest('[data-rangepop],[data-rangechip],[data-cta],[data-sync]')) return
    toggleFilters()
  }

  function onCardKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFilters() }
  }

  seg?.addEventListener('click', onSegClick)
  chip?.addEventListener('click', onChipClick)
  cta?.addEventListener('click', onCtaClick)
  syncBtn?.addEventListener('click', onSyncClick)
  el.addEventListener('click', onCardClick)
  el.addEventListener('keydown', onCardKeyDown)

  const cleanup: CardCleanup = () => {
    seg?.removeEventListener('click', onSegClick)
    chip?.removeEventListener('click', onChipClick)
    cta?.removeEventListener('click', onCtaClick)
    syncBtn?.removeEventListener('click', onSyncClick)
    el.removeEventListener('click', onCardClick)
    el.removeEventListener('keydown', onCardKeyDown)
  }

  ;(el as HTMLElement & { __sgcCleanup?: CardCleanup }).__sgcCleanup = cleanup
}

/** Call when the element unmounts to remove all listeners. */
export function sgcCleanup(el: HTMLElement | null): void {
  if (!el) return
  const e = el as HTMLElement & { __sgcCleanup?: CardCleanup; __sgcInitialized?: boolean }
  e.__sgcCleanup?.()
  delete e.__sgcCleanup
  delete e.__sgcInitialized
}

/** Document-level outside-click handler — wire once on the container mount. */
export function sgcDocumentClickRef(el: HTMLElement | null): void {
  if (!el) return

  function onDocClick(e: MouseEvent): void {
    document.querySelectorAll<HTMLElement>('.sg-card.filters-open').forEach(card => {
      if (!card.contains(e.target as Node)) card.classList.remove('filters-open')
    })
  }

  document.addEventListener('click', onDocClick)
  ;(el as HTMLElement & { __sgcDocCleanup?: () => void }).__sgcDocCleanup = () => {
    document.removeEventListener('click', onDocClick)
  }
}

export function sgcDocumentClickCleanup(el: HTMLElement | null): void {
  if (!el) return
  const e = el as HTMLElement & { __sgcDocCleanup?: () => void }
  e.__sgcDocCleanup?.()
  delete e.__sgcDocCleanup
}
