/**
 * financial-health-card-hook.ts
 *
 * Encapsulates all DOM-level side effects for FinancialHealthCard:
 *  - Load animation (anim-in class) on mount via callback ref
 *  - Score tween (ease-out cubic via rAF)
 *  - Pin colour + position update
 *  - Elastic / pulse animation triggers
 *
 * NO raw useEffect anywhere in this folder.
 * All side effects are triggered through callback refs or imperative helpers
 * called from React event handlers.
 */

// ── constants ────────────────────────────────────────────────────────────────

export const ZONES = [
  { name: 'Bad',   max: 30 },
  { name: 'Fair',  max: 50 },
  { name: 'Good',  max: 80 },
  { name: 'Great', max: 100 },
]

export const ZONE_HEX  = { red:'#EF4444', yellow:'#EAB308', blue:'#3B82F6', green:'#10B981' }
export const ZONE_GLOW = { red:'var(--g-red)', yellow:'var(--g-yellow)', blue:'var(--g-blue)', green:'var(--g-green)' }
export const ZONE_HALO = { red:'rgba(239,68,68,0.16)', yellow:'rgba(234,179,8,0.16)', blue:'rgba(59,130,246,0.16)', green:'rgba(16,185,129,0.18)' }
export const ZONE_KEYS = ['red','yellow','blue','green'] as const

export type ZoneKey = typeof ZONE_KEYS[number]

export interface FhcRefs {
  card:   HTMLDivElement | null
  num:    HTMLDivElement | null
  pin:    HTMLDivElement | null
  pinNum: HTMLDivElement | null
  zones:  HTMLDivElement | null
}

// ── helpers ──────────────────────────────────────────────────────────────────

export function activeZoneIndex(score: number): number {
  for (let i = 0; i < ZONES.length; i++) if (score <= ZONES[i].max) return i
  return ZONES.length - 1
}

/** Update pin CSS vars + position; highlight active zone label */
export function paintActive(refs: FhcRefs, score: number, max: number): void {
  const { pin, pinNum, zones } = refs
  if (!pin || !pinNum || !zones) return

  const az  = activeZoneIndex(score)
  const key = ZONE_KEYS[az]
  pin.style.setProperty('--pin-c',    ZONE_HEX[key])
  pin.style.setProperty('--pin-g',    ZONE_GLOW[key])
  pin.style.setProperty('--pin-halo', ZONE_HALO[key])

  const pct = Math.max(0, Math.min(100, (score / max) * 100))
  pin.style.left = Math.max(4, Math.min(96, pct)) + '%'
  pinNum.textContent = String(score)

  const spans = zones.children
  for (let z = 0; z < spans.length; z++) {
    spans[z].classList.toggle('on', z === az)
  }
}

/** Ease-out cubic tween for the score counter */
export function tweenScore(
  numEl: HTMLDivElement,
  from: number,
  to: number,
  dur: number,
  onEnd?: () => void,
): void {
  const t0 = performance.now()
  function frame(now: number) {
    const p = Math.min(1, (now - t0) / dur)
    const e = 1 - Math.pow(1 - p, 3)
    numEl.textContent = String(Math.round(from + (to - from) * e))
    if (p < 1) requestAnimationFrame(frame)
    else onEnd?.()
  }
  requestAnimationFrame(frame)
}

/** Force-retrigger a CSS animation by removing + re-adding class */
export function retriggerClass(el: HTMLElement, cls: string): void {
  el.classList.remove(cls)
  void el.offsetWidth   // reflow
  el.classList.add(cls)
}

// ── mount callback ref ───────────────────────────────────────────────────────

interface MountState {
  __fhcTimer?: ReturnType<typeof setTimeout>
}

/**
 * Callback ref for the .fhc card element.
 * Runs the full load animation once the element mounts.
 */
export function fhcCardMountRef(
  el: HTMLDivElement | null,
  refs: FhcRefs,
  score: number,
  max: number,
): void {
  if (!el) {
    // cleanup on unmount
    const s = el as unknown as MountState | null
    clearTimeout(s?.__fhcTimer)
    return
  }

  const s = el as HTMLDivElement & MountState
  clearTimeout(s.__fhcTimer)

  // populate zone spans
  if (refs.zones) {
    refs.zones.innerHTML = ZONES.map(z => `<span>${z.name}</span>`).join('')
  }
  paintActive(refs, score, max)

  retriggerClass(el, 'anim-in')

  // drop anim-in after longest child finishes (1600ms)
  s.__fhcTimer = setTimeout(() => {
    el.classList.remove('anim-in')
  }, 1600)
}

export function fhcCardCleanupRef(el: HTMLDivElement | null): void {
  if (!el) return
  const s = el as HTMLDivElement & MountState
  clearTimeout(s.__fhcTimer)
  delete s.__fhcTimer
}
