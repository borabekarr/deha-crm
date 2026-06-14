/**
 * chart-hook.ts — encapsulates all animation loops and RAF handles for Chart.
 *
 * NO raw useEffect anywhere in the chart/ folder.
 * All animations are wired via callback refs on the canvas-wrap element.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export interface DataSet {
  labels: string[]
  cur: number[]
  prev: number[]
  num: number
  delta: number
  period: string
  peakI: number
  avg: number
  conv: number
  peakWord: string
}

export const DS: Record<string, DataSet> = {
  D: { labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
       cur:[28,34,31,58,40,33,46], prev:[24,30,28,42,36,26,38],
       num:279, delta:12, period:'this week', peakI:3, avg:40, conv:34, peakWord:'Thu' },
  W: { labels:['W1','W2','W3','W4','W5','W6','W7'],
       cur:[32,40,36,52,44,48,50], prev:[28,34,33,40,38,42,45],
       num:1184, delta:8, period:'this quarter', peakI:3, avg:43, conv:31, peakWord:'W4' },
  M: { labels:['Feb','Mar','Apr','May','Jun','Jul','Aug'],
       cur:[30,38,34,50,45,53,57], prev:[26,32,31,44,40,48,50],
       num:5210, delta:15, period:'this year', peakI:6, avg:44, conv:38, peakWord:'Aug' },
}

export const MAXV = 60

// ---------------------------------------------------------------------------
// Pure geometry helpers (exported for use in the component)
// ---------------------------------------------------------------------------

export function yOf(v: number): number { return 90 * (1 - v / MAXV) }
export function xOf(i: number, n: number): number {
  const PAD = 6
  return n <= 1 ? 50 : PAD + (i / (n - 1)) * (100 - 2 * PAD)
}

interface Pt { x: number; y: number }

function pts(vals: number[]): Pt[] {
  const n = vals.length
  return vals.map((v, i) => ({ x: xOf(i, n), y: yOf(v) }))
}

function smooth(p: Pt[]): string {
  if (!p.length) return ''
  let d = `M${p[0].x.toFixed(2)},${p[0].y.toFixed(2)}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

export function buildLinePath(vals: number[]): string {
  return smooth(pts(vals))
}

export function buildAreaPath(vals: number[]): string {
  const pc = pts(vals)
  const fx = xOf(0, pc.length)
  const lx = xOf(pc.length - 1, pc.length)
  return smooth(pc) + ` L${lx.toFixed(2)},90 L${fx.toFixed(2)},90 Z`
}

// ---------------------------------------------------------------------------
// Mount-hook wired via callback ref on the canvas-wrap element.
// Returns a cleanup function stored on the element itself.
// ---------------------------------------------------------------------------

/** Shape stored on the DOM element for cleanup. */
interface ChartState {
  dispCur: number[]
  dispPrev: number[]
  curKey: string
  morphRaf: number | null
  dotX: number
  dotTarget: number
  dotFrom: number
  dotT0: number
  dotRaf: number | null
}

type UpdateFn = (patch: {
  linePath?: string
  areaPath?: string
  prevPath?: string
  peakLeft?: string
  peakTop?: string
  guideLeft?: string
  guideOpacity?: string
  tipLeft?: string
  tipTop?: string
  tipOpacity?: string
  tipLabel?: string
  tipVal?: string
  numVal?: number
  delta?: number
  period?: string
  peakVal?: string
  avg?: number
  conv?: number
}) => void

function ease(t: number): number { return 1 - Math.pow(1 - t, 3) }

function pointAtX(path: SVGPathElement, tx: number): { x: number; y: number } {
  const len = path.getTotalLength()
  if (!len) return { x: tx, y: 45 }
  let lo = 0, hi = len
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2
    const p = path.getPointAtLength(mid)
    if (p.x < tx) lo = mid; else hi = mid
  }
  return path.getPointAtLength((lo + hi) / 2)
}

export function mountChart(
  lineEl: SVGPathElement,
  update: UpdateFn,
): () => void {
  const state: ChartState = {
    dispCur: DS.D.cur.slice(),
    dispPrev: DS.D.prev.slice(),
    curKey: 'D',
    morphRaf: null,
    dotX: xOf(DS.D.cur.length - 1, DS.D.cur.length),
    dotTarget: xOf(DS.D.cur.length - 1, DS.D.cur.length),
    dotFrom: xOf(DS.D.cur.length - 1, DS.D.cur.length),
    dotT0: 0,
    dotRaf: null,
  }

  // ---------- render helpers ----------

  function renderPaths(cur: number[], prev: number[]): void {
    update({
      linePath: buildLinePath(cur),
      areaPath: buildAreaPath(cur),
      prevPath: buildLinePath(prev),
    })
  }

  function setDotAt(x: number): void {
    const p = pointAtX(lineEl, x)
    update({ peakLeft: `${x}%`, peakTop: `${(p.y / 90) * 100}%` })
  }

  function dotTick(ts: number): void {
    if (!state.dotT0) state.dotT0 = ts
    const p = Math.min(1, (ts - state.dotT0) / 480)
    state.dotX = state.dotFrom + (state.dotTarget - state.dotFrom) * ease(p)
    setDotAt(state.dotX)
    if (p < 1) {
      state.dotRaf = requestAnimationFrame(dotTick)
    } else {
      state.dotRaf = null
    }
  }

  function moveDotTo(x: number): void {
    if (Math.abs(x - state.dotTarget) < 0.01) return
    state.dotFrom = state.dotX
    state.dotTarget = x
    state.dotT0 = 0
    if (!state.dotRaf) state.dotRaf = requestAnimationFrame(dotTick)
  }

  // Immediate, no-easing placement -- used during pointer tracking.
  // Cancels any in-flight eased loop so the eased morph starts from the right place.
   
  function setDotImmediate(x: number): void {
    if (state.dotRaf) { cancelAnimationFrame(state.dotRaf); state.dotRaf = null }
    state.dotX = x
    state.dotTarget = x
    state.dotFrom = x
    state.dotT0 = 0
    setDotAt(x)
  }

  function animateNum(to: number, fromVal: number): void {
    let t0: number | null = null
    const dur = 600
    function step(ts: number): void {
      if (!t0) t0 = ts
      const p = Math.min(1, (ts - t0) / dur)
      update({ numVal: Math.round(fromVal + (to - fromVal) * ease(p)) })
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  function morphTo(key: string, fromNum: number): void {
    const d = DS[key]
    const fromCur = state.dispCur.slice()
    const fromPrev = state.dispPrev.slice()
    let t0: number | null = null
    const dur = 600
    if (state.morphRaf) { cancelAnimationFrame(state.morphRaf); state.morphRaf = null }
    function step(ts: number): void {
      if (!t0) t0 = ts
      const p = Math.min(1, (ts - t0) / dur)
      const e = ease(p)
      state.dispCur  = d.cur.map((v, i) => fromCur[i] + (v - fromCur[i]) * e)
      state.dispPrev = d.prev.map((v, i) => fromPrev[i] + (v - fromPrev[i]) * e)
      renderPaths(state.dispCur, state.dispPrev)
      if (p < 1) { state.morphRaf = requestAnimationFrame(step) }
      else {
        state.dispCur = d.cur.slice(); state.dispPrev = d.prev.slice(); state.morphRaf = null
        // Re-snap dot to exact line end after path morph settles.
        //
        // Why compute Y from the dataset (yOf) instead of sampling the DOM path:
        // setDotAt reads lineEl.getPointAtLength, but the path's `d` attr is set via
        // React setState (renderPaths -> update), whose DOM commit is async. At this
        // instant the DOM still holds the previous frame's `d`, so a getPointAtLength
        // read would sample a stale curve. yOf(value) is scale-correct for any dataset.
        //
        // This re-snap MUST be unconditional: all three datasets have 7 points, so the
        // x endpoint xOf(6,7) is identical (94%) across D/W/M. On a W->M switch the
        // earlier moveDotTo(ex) early-returns (target unchanged), so the dot loop never
        // fires and Y is never recomputed for the new M scale. Forcing setDot here fixes
        // the Monthly drift regardless of whether x moved.
        const dn = d.cur.length
        const endX = xOf(dn - 1, dn)
        const endTop = (yOf(d.cur[dn - 1]) / 90) * 100
        update({ peakLeft: `${endX}%`, peakTop: `${endTop}%` })
        // keep the eased-loop bookkeeping consistent so a later hover starts clean
        state.dotX = endX
        state.dotTarget = endX
        state.dotFrom = endX
      }
    }
    state.morphRaf = requestAnimationFrame(step)

    // Update x-axis labels, peak dot position, headline
    const n = d.cur.length
    const ex = xOf(n - 1, n)
    moveDotTo(ex)
    update({
      delta: d.delta,
      period: d.period,
      peakVal: `${d.peakWord} · ${d.cur[d.peakI]}`,
      avg: d.avg,
      conv: d.conv,
    })
    animateNum(d.num, fromNum)
  }

  // ---------- public API stored on element ----------

  const api = {
    state,
    morphTo,
    moveDotTo,
    setDotImmediate,
    renderPaths,
    setDotAt,
  }

  // Initial render
  renderPaths(state.dispCur, state.dispPrev)
  // Initial peak dot position
  const n0 = DS.D.cur.length
  const ex0 = xOf(n0 - 1, n0)
  // set initial after first render so lineEl has a path
  requestAnimationFrame(() => { setDotAt(ex0) })

  // Store cleanup on element for callback-ref teardown
  ;(lineEl as SVGPathElement & { __chartApi?: typeof api }).__chartApi = api

  return function cleanup() {
    if (state.morphRaf) cancelAnimationFrame(state.morphRaf)
    if (state.dotRaf) cancelAnimationFrame(state.dotRaf)
  }
}

export type ChartApi = ReturnType<typeof mountChart> & { __chartApi?: unknown }
