/**
 * model-selection-sheet-hook.ts — wires entrance animation, model navigation,
 * badge morphing, logo morph, text morph, and confetti burst.
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

function morphText(host: HTMLElement, text: string) {
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
    setTimeout(() => { cur!.classList.remove('morph-in') }, 380)
  }, 220)
  return timer
}

// ── Render ─────────────────────────────────────────────────────────────────

function render(el: HTMLElement, idx: number, animate: boolean): ReturnType<typeof setTimeout>[] {
  const m = MODELS[idx]
  const timers: ReturnType<typeof setTimeout>[] = []

  // dots
  el.querySelectorAll<HTMLElement>('.dot').forEach((d, i) =>
    d.classList.toggle('on', i === idx)
  )

  // identity
  const logo = el.querySelector<HTMLElement>('.logo')!
  const mName = el.querySelector<HTMLElement>('.ident-name.morph-host')!
  const mVendor = el.querySelector<HTMLElement>('.ident-vendor.morph-host')!
  const logoGlyph = el.querySelector<HTMLElement>('.logo-glyph')!
  const specsBtn = el.querySelector<HTMLElement>('.specs-btn')!

  const applyMeta = () => {
    logoGlyph.textContent = m.glyph
    logo.style.setProperty('--accent', m.accent)
    if (specsBtn) specsBtn.textContent = 'View Full Specs: ' + m.name
  }

  if (animate) {
    const t1 = morphText(mName, m.name)
    const t2 = morphText(mVendor, m.vendor)
    if (t1) timers.push(t1)
    if (t2) timers.push(t2)
    logo.classList.remove('pulsing')
    void logo.offsetWidth
    logo.classList.add('pulsing')
    const t3 = setTimeout(applyMeta, 200)
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

      const t = setTimeout(() => {
        if (ghost.parentNode) ghost.remove()
        badge.classList.remove('morphing')
        badge.style.width = ''
      }, 440)
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

// ── Confetti ───────────────────────────────────────────────────────────────

interface ConfettiParticle {
  x: number; y: number; vx: number; vy: number
  g: number; w: number; h: number; a: number
  rot: number; vr: number; color: string
  life: number; ttl: number
}

interface ConfettiInstance {
  burst: () => void
  size: () => void
  destroy: () => void
}

function makeConfetti(canvas: HTMLCanvasElement): ConfettiInstance {
  const ctx = canvas.getContext('2d')!
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let parts: ConfettiParticle[] = []
  let raf: number | null = null

  function size() {
    const r = canvas.getBoundingClientRect()
    canvas.width = r.width * dpr
    canvas.height = r.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.life++; p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr
      const fade = p.life > p.ttl - 22 ? Math.max(0, (p.ttl - p.life) / 22) : 1
      ctx.save()
      ctx.globalAlpha = fade * p.a
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
      if (p.life >= p.ttl) parts.splice(i, 1)
    }
    if (parts.length) {
      raf = requestAnimationFrame(tick)
    } else {
      raf = null
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  function burst() {
    size()
    const r = canvas.getBoundingClientRect()
    const ox = r.width / 2, oy = r.height - 46
    const COLORS = ['#FFFFFF', '#D1FAE5', '#A7F3D0', '#6EE7B7']
    for (let i = 0; i < 34; i++) {
      const ang = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 0.9
      const sp = 3.4 + Math.random() * 4.2
      parts.push({
        x: ox + (Math.random() - 0.5) * 150, y: oy,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - Math.random() * 2,
        g: 0.13 + Math.random() * 0.05,
        w: 3 + Math.random() * 4, h: 3 + Math.random() * 5, a: 0.9,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0, ttl: 64 + Math.random() * 40,
      })
    }
    if (!raf) raf = requestAnimationFrame(tick)
  }

  function destroy() {
    if (raf) { cancelAnimationFrame(raf); raf = null }
    parts = []
  }

  return { burst, size, destroy }
}

// ── Callback ref ────────────────────────────────────────────────────────────

export function modelSelectionSheetRef(el: HTMLDivElement | null): void {
  if (!el) return
  const sheetEl: HTMLElement = el

  let idx = 0
  const activeTimers: ReturnType<typeof setTimeout>[] = []
  let confirmTimer: ReturnType<typeof setTimeout> | null = null

  const canvas = sheetEl.querySelector<HTMLCanvasElement>('.confetti')!
  const cf = makeConfetti(canvas)

  const onResize = () => cf.size()
  window.addEventListener('resize', onResize)

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

  const onConfirm = () => {
    confirmBtn.classList.remove('flash')
    void confirmBtn.offsetWidth
    confirmBtn.classList.add('flash')
    cf.burst()
    confirmText.textContent = 'Selected'
    confirmIcon.textContent = 'check_circle'
    if (confirmTimer) clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      confirmText.textContent = 'Confirm Selection'
      confirmIcon.textContent = 'check'
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
    window.removeEventListener('resize', onResize)
    cf.destroy()
  }
}

export function cleanupModelSelectionSheet(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as ModelSheetEl
  e.__mssCleanup?.()
  delete e.__mssCleanup
}
