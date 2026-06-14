// index-bar-hook.ts — animation helpers for IndexBar (no useEffect)

export interface MetricDef {
  title: string
  value: number
  fmt: 'int' | 'pct'
  delta: string
  dir: 'up' | 'down'
  trend: 'up' | 'down'
  icon: string
}

export const METRICS: MetricDef[] = [
  { title: 'Total Leads',     value: 2847, fmt: 'int', delta: '0.50%',  dir: 'up',   trend: 'up',   icon: 'groups'     },
  { title: 'New Leads (MTD)', value: 318,  fmt: 'int', delta: '11.24%', dir: 'down', trend: 'down', icon: 'person_add' },
  { title: 'Conversion Rate', value: 24.6, fmt: 'pct', delta: '0.05%',  dir: 'down', trend: 'down', icon: 'percent'    },
]

export interface StageDef {
  name: string
  color: string
}

export const STAGES: StageDef[] = [
  { name: 'Prospect',      color: '#EF4444' },
  { name: 'Qualification', color: '#F97316' },
  { name: 'Onboarding',   color: '#EAB308' },
  { name: 'Moderate',     color: '#84CC16' },
  { name: 'Urgent',       color: '#10B981' },
]

export const N_BARS = 52
export const ACTIVE_BAR = Math.round(N_BARS * 0.70)

const COLOR_STOPS: [number, string][] = [
  [0,    '#EF4444'],
  [0.28, '#F97316'],
  [0.5,  '#EAB308'],
  [0.72, '#84CC16'],
  [1,    '#10B981'],
]

function hexToRgb(c: string): [number, number, number] {
  return [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ]
}

export function lerpColor(t: number): string {
  let a = COLOR_STOPS[0]
  let b = COLOR_STOPS[COLOR_STOPS.length - 1]
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (t >= COLOR_STOPS[i][0] && t <= COLOR_STOPS[i + 1][0]) {
      a = COLOR_STOPS[i]
      b = COLOR_STOPS[i + 1]
      break
    }
  }
  const span = (b[0] - a[0]) || 1
  const k = (t - a[0]) / span
  const ca = hexToRgb(a[1])
  const cb = hexToRgb(b[1])
  const r  = Math.round(ca[0] + (cb[0] - ca[0]) * k)
  const g  = Math.round(ca[1] + (cb[1] - ca[1]) * k)
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * k)
  return `rgb(${r},${g},${bl})`
}

export function fmtVal(m: MetricDef, n: number): string {
  return m.fmt === 'pct' ? n.toFixed(1) + '%' : Math.round(n).toLocaleString('en-US')
}

export function genSeries(n: number, dir: 'up' | 'down'): number[] {
  const a: number[] = []
  let v = 50
  const drift = dir === 'up' ? 1.6 : -1.4
  for (let i = 0; i < n; i++) {
    v += drift + (Math.random() - 0.5) * 8
    a.push(v)
  }
  return a
}

export function buildSparkPath(data: number[], W: number, H: number): string {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const rng = (max - min) || 1
  const PAD = 8
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = PAD + (1 - (v - min) / rng) * (H - PAD * 2)
    return (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1)
  }).join(' ')
}

/**
 * Tweens a metric value element from 0 to target.
 * Uses requestAnimationFrame — called from a callback ref, not useEffect.
 */
export function tweenValue(el: HTMLElement, m: MetricDef): () => void {
  const to = m.value
  const t0 = performance.now()
  let rafId: number
  function step(now: number) {
    let p = Math.min(1, (now - t0) / 780)
    p = 1 - Math.pow(1 - p, 3)
    el.textContent = fmtVal(m, to * p)
    if (p < 1) rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
  const tid = setTimeout(() => {
    cancelAnimationFrame(rafId)
    el.textContent = fmtVal(m, to)
  }, 840)
  return () => { cancelAnimationFrame(rafId); clearTimeout(tid) }
}

/**
 * Draws and animates a sparkline path.
 * Called from a callback ref, not useEffect.
 */
export function drawSpark(pathEl: SVGPathElement, m: MetricDef): void {
  const series = genSeries(34, m.trend === 'up' ? 'up' : 'down')
  const d = buildSparkPath(series, 180, 62)
  pathEl.setAttribute('d', d)
  const len = pathEl.getTotalLength()
  pathEl.style.transition = 'none'
  pathEl.style.strokeDasharray = String(len)
  pathEl.style.strokeDashoffset = String(len)
  void pathEl.getBoundingClientRect()
  setTimeout(() => {
    pathEl.style.transition = 'stroke-dashoffset 900ms cubic-bezier(.33,1,.68,1)'
    pathEl.style.strokeDashoffset = '0'
  }, 60)
  setTimeout(() => {
    pathEl.style.transition = 'none'
    pathEl.style.strokeDasharray = 'none'
    pathEl.style.strokeDashoffset = '0'
  }, 1050)
}

/**
 * Plays the entrance sequence for all bars.
 * Called from event handler or callback ref.
 */
export function playBars(barsEl: HTMLElement, sweepEl: HTMLElement): void {
  const bars = barsEl.children as HTMLCollectionOf<HTMLElement>

  // hide all
  for (let i = 0; i < bars.length; i++) {
    bars[i].style.transition = 'none'
    bars[i].classList.add('hidden')
  }
  void barsEl.getBoundingClientRect()

  // stagger reveal
  for (let i = 0; i < bars.length; i++) {
    setTimeout(() => {
      bars[i].style.transition = ''
      bars[i].classList.remove('hidden')
    }, 200 + i * 11)
  }

  // sweep animation
  sweepEl.classList.remove('go')
  void sweepEl.offsetWidth
  sweepEl.classList.add('go')

  // hard finalize
  const total = 200 + bars.length * 11
  setTimeout(() => {
    for (let i = 0; i < bars.length; i++) {
      bars[i].style.transition = 'none'
      bars[i].classList.remove('hidden')
      void bars[i].offsetWidth
      bars[i].style.transition = ''
    }
  }, total + 600)
}
