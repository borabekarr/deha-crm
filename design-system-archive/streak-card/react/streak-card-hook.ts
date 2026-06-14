/**
 * streak-card-hook.ts — encapsulates the entrance animation + RAF/timer
 * orchestration for the StreakCard component.
 *
 * NO raw useEffect anywhere in the streak-card folder.
 * The entrance animation is wired via a callback ref on the .streak element.
 * Cleanup (timers + RAF) is stored on the element itself so the ref teardown
 * can cancel everything when the element unmounts.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface StreakCardEl extends HTMLDivElement {
  __stkCleanup?: () => void
}

interface BarEl extends HTMLDivElement {
  __stkFlashTimer?: ReturnType<typeof setTimeout>
}

// ── Ring SVG helper ───────────────────────────────────────────────────────────

const RING_R = 15.2
const RING_C = 2 * Math.PI * RING_R

export function buildRingSVG(pct: number): string {
  const off = RING_C * (1 - pct)
  return (
    `<svg viewBox="0 0 35 35">` +
    `<circle cx="17.5" cy="17.5" r="${RING_R}" fill="none" stroke="var(--sc-ring-track)" stroke-width="3.4"/>` +
    `<circle class="ring-prog" cx="17.5" cy="17.5" r="${RING_R}" fill="none" stroke="#10B981" stroke-width="3.4" ` +
    `stroke-linecap="round" stroke-dasharray="${RING_C.toFixed(2)}" stroke-dashoffset="${RING_C.toFixed(2)}" ` +
    `data-off="${off.toFixed(2)}"/></svg>`
  )
}

// ── Tween helper ──────────────────────────────────────────────────────────────

export function tween(
  el: HTMLElement,
  from: number,
  to: number,
  dur: number,
  format: (v: number) => string,
  onEnd?: () => void,
): void {
  const t0 = performance.now()
  function frame(now: number) {
    const p = Math.min(1, (now - t0) / dur)
    const e = 1 - Math.pow(1 - p, 3)
    el.textContent = format(from + (to - from) * e)
    if (p < 1) requestAnimationFrame(frame)
    else if (onEnd) onEnd()
  }
  requestAnimationFrame(frame)
}

// ── Bar helpers ───────────────────────────────────────────────────────────────

export function setBarWidth(bar: HTMLElement, pct: number, withFlash: boolean): void {
  bar.style.width = pct + '%'
  if (withFlash) {
    const b = bar as BarEl
    clearTimeout(b.__stkFlashTimer)
    bar.classList.add('flash')
    b.__stkFlashTimer = setTimeout(() => { bar.classList.remove('flash') }, 520)
  }
}

export function drawRing(container: HTMLElement): void {
  const rp = container.querySelector<SVGCircleElement>('.ring-prog')
  if (rp) {
    requestAnimationFrame(() => {
      rp.style.strokeDashoffset = rp.getAttribute('data-off') ?? ''
    })
  }
}

// ── Entrance animation — callback ref ────────────────────────────────────────
//
// Called as ref={(el) => { streakCardRef(el, bar); return () => cleanupStreakCard(el) }}
// The callback adds .anim-in on mount, orchestrates the bar + ring reveal,
// then drops .anim-in after the longest child (1300 ms) to leave content in
// its visible resting state.

export function streakCardRef(
  el: HTMLDivElement | null,
  bar: HTMLDivElement | null,
): void {
  if (!el || !bar) return

  let settleTimer: ReturnType<typeof setTimeout> | null = null
  let barRevealTimer: ReturnType<typeof setTimeout> | null = null

  function runLoad() {
    if (settleTimer) clearTimeout(settleTimer)
    if (barRevealTimer) clearTimeout(barRevealTimer)

    // reset bar to zero — no transition so it snaps
    bar.style.transition = 'none'
    setBarWidth(bar, 0, false)
    // force reflow to flush the zero-width
    void bar.offsetWidth

    // trigger card entrance
    el.classList.remove('anim-in')
    void el.offsetWidth
    el.classList.add('anim-in')

    // reveal bar + ring after card animation has passed its mid-point (540 ms)
    barRevealTimer = setTimeout(() => {
      bar.style.transition = ''
      setBarWidth(bar, 68, true)   // 6825/10000 = 68%
      drawRing(el)
    }, 540)

    // drop .anim-in after longest child finishes (scFade ends at ~1060 ms;
    // add buffer → 1300 ms).  Content falls back to visible resting state.
    settleTimer = setTimeout(() => {
      el.classList.remove('anim-in')
      bar.style.transition = 'none'
      setBarWidth(bar, 68, false)
      const rp = el.querySelector<SVGCircleElement>('.ring-prog')
      if (rp) {
        rp.style.transition = 'none'
        rp.style.strokeDashoffset = rp.getAttribute('data-off') ?? ''
      }
      // restore transitions on the next frame
      requestAnimationFrame(() => {
        bar.style.transition = ''
        if (rp) (rp as SVGCircleElement & { style: CSSStyleDeclaration }).style.transition = ''
      })
    }, 1300)
  }

  // fire on mount
  runLoad()

  // expose cleanup on the element
  ;(el as StreakCardEl).__stkCleanup = () => {
    if (settleTimer) clearTimeout(settleTimer)
    if (barRevealTimer) clearTimeout(barRevealTimer)
  }
}

export function cleanupStreakCard(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as StreakCardEl
  e.__stkCleanup?.()
  delete e.__stkCleanup
}
