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
  icon: string
}

export const STAGES: StageDef[] = [
  { name: 'Prospect',      color: '#EF4444', icon: 'person_search'   },
  { name: 'Qualification', color: '#F97316', icon: 'checklist'       },
  { name: 'Onboarding',   color: '#EAB308', icon: 'handshake'       },
  { name: 'Moderate',     color: '#84CC16', icon: 'trending_up'     },
  { name: 'Urgent',       color: '#10B981', icon: 'bolt'            },
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
 * Plays the entrance/replay sequence for all bars as a left-to-right wave morph.
 *
 * ROOT CAUSE of the "collapse" bug (fixed here):
 *   The previous impl snapped ALL 52 bars to scaleY(0.4) simultaneously with
 *   transition:none, then staggered only the spring-back. The global snap caused
 *   the entire bar group to visually collapse to 40% height before any animation
 *   started — exactly the compact/zero effect the user reported.
 *
 * FIX: each bar runs its own independent squash → spring cycle, staggered per-bar.
 *   At t = STAGGER_MS * i, bar[i] starts squashing (150ms ease-in).
 *   At t = STAGGER_MS * i + SQUASH_MS, bar[i] springs back (340ms spring).
 *   No global state change: at any moment most bars are at full height; only
 *   the 1-2 bars currently in their squash phase are below full height.
 *   The bar group NEVER collapses — only a travelling dimple passes through.
 *
 * Called from event handler or callback ref. No useEffect.
 */
export function playBars(barsEl: HTMLElement, _sweepEl: HTMLElement): void {
  const bars = barsEl.children as HTMLCollectionOf<HTMLElement>
  const STAGGER_MS = 18   // ms between each successive bar starting its cycle
  const SQUASH_MS  = 120  // squash-down duration per bar (ease-in)
  const SPRING_MS  = 320  // spring-back duration per bar (overshoot spring)

  // Read --anim-mult from the root so timing respects the slow-down toggle
  const animMult = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--anim-mult').trim() || '1'
  ) || 1

  const squashDur = Math.round(SQUASH_MS * animMult)
  const springDur = Math.round(SPRING_MS * animMult)

  for (let i = 0; i < bars.length; i++) {
    const startDelay = Math.round(STAGGER_MS * i * animMult)

    // Phase 1: squash this single bar down
    setTimeout(() => {
      bars[i].style.transition = `transform ${squashDur}ms cubic-bezier(.4,0,1,1), opacity ${squashDur}ms ease-in`
      bars[i].style.transform = 'scaleY(0.45)'
      bars[i].style.opacity = '0.40'
    }, startDelay)

    // Phase 2: spring this bar back to full height
    setTimeout(() => {
      bars[i].style.transition = `transform ${springDur}ms cubic-bezier(.34,1.56,.64,1), opacity ${Math.round(springDur * 0.5)}ms ease-out`
      bars[i].style.transform = 'scaleY(1)'
      bars[i].style.opacity = '1'
    }, startDelay + squashDur)
  }

  // Hard-finalize: clear all inline styles after last bar fully springs back
  const lastBarStart   = Math.round(STAGGER_MS * (bars.length - 1) * animMult)
  const totalDur       = lastBarStart + squashDur + springDur
  setTimeout(() => {
    for (let i = 0; i < bars.length; i++) {
      bars[i].style.transition = ''
      bars[i].style.transform = ''
      bars[i].style.opacity = ''
    }
  }, totalDur + 60)
}
