/**
 * multisteps-hook.ts
 *
 * All imperative DOM logic for the Multistep Onboarding indicator lives here.
 * NO raw useEffect in this folder — all DOM side-effects use callback refs.
 *
 * Responsibilities:
 *  - mountStage   : callback ref for the .ms-stage element.
 *                   Builds dot nodes, wires click handlers, and stores a
 *                   layout function on the element so the component can call
 *                   it when the step index changes.
 *  - cleanupStage : call when the stage element unmounts (ref returning null).
 *  - mountSurface : callback ref for .ms-surface — fires the entrance animation
 *                   via double-rAF (mirrors the original JS).
 *  - ripple       : imperative ripple burst for button pointerdown events.
 *  - celebrate    : imperative "finish pulse + ring" on the primary button.
 *
 * Pattern mirrors chart-hook.ts and workflow-nodes-hook.ts: pure DOM functions,
 * no React imports, cleanup stored on the element itself.
 */

// ---------------------------------------------------------------------------
// Constants — geometry (px), match the HTML prototype exactly
// ---------------------------------------------------------------------------

const H    = 38   // capsule / dot row height
const PAD  = H / 2 // half-height = horizontal padding inside capsule
const S_IN = 24   // spacing between active (absorbed) dots
const GAP  = 22   // gap between capsule right edge and first resting dot
const S_OUT= 28   // spacing between resting (upcoming) dots
const REST = 13   // resting dot diameter (used for total-width calc)

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface Geometry {
  active: number
  capW: number
  remaining: number
  total: number
}

/**
 * Compute capsule and stage geometry for step index `c` (0-based).
 * Matches the original `geometry(c)` function in the HTML prototype.
 */
function geometry(c: number, n: number): Geometry {
  const active    = c + 1                  // dots inside capsule
  const capW      = 2 * PAD + c * S_IN    // c gaps between active dots
  const remaining = n - active
  const total     = remaining > 0
    ? capW + GAP + (remaining - 1) * S_OUT + REST / 2
    : capW
  return { active, capW, remaining, total }
}

// ---------------------------------------------------------------------------
// Stage element — callback ref
// ---------------------------------------------------------------------------

/** Extended element type that stores imperative state on the DOM node itself. */
export interface StageElement extends HTMLDivElement {
  __msLayout?: (c: number, animatePop: boolean) => void
  __msDots?:   HTMLDivElement[]
  __msPrev?:   number
  __msCleanup?: () => void
}

/**
 * Callback ref for the `.ms-stage` element.
 *
 * Builds one `.ms-dot` per step, wires click-to-navigate handlers via the
 * provided `onDotClick` callback, and attaches a `__msLayout` function to
 * the element so the React component can trigger layout without useEffect.
 *
 * @param el          The stage DOM element (null on unmount).
 * @param n           Total number of steps.
 * @param onDotClick  Called with the clicked step index.
 * @param capsuleEl   Reference to the `.ms-capsule` element (for width/shadow).
 */
export function mountStage(
  el: StageElement | null,
  n: number,
  onDotClick: (idx: number) => void,
  capsuleEl: HTMLDivElement | null,
): void {
  if (!el || !capsuleEl) return

  // Prevent double-mount (StrictMode double-invoke guard)
  if (el.__msDots) return

  const dots: HTMLDivElement[] = []

  for (let i = 0; i < n; i++) {
    const d = document.createElement('div') as HTMLDivElement
    d.className = 'ms-dot intro'
    d.dataset.i = String(i)
    // Proximity hover glow (see Multisteps.css) — dots are click-navigable.
    d.setAttribute('data-proximity', '')
    // Stagger the intro animation delay (matches original prototype)
    d.style.animationDelay = `${i * 90}ms`
    const idx = i
    d.addEventListener('click', () => onDotClick(idx))
    el.appendChild(d)
    dots.push(d)
  }

  el.__msDots = dots
  el.__msPrev  = 0

  /** Reposition stage width, capsule width, and every dot — mirrors layout(c). */
  el.__msLayout = function layout(c: number, animatePop: boolean): void {
    const g = geometry(c, n)
    el.style.width         = `${g.total}px`
    capsuleEl.style.width  = `${g.capW}px`

    for (let i = 0; i < n; i++) {
      const d = dots[i]
      let x: number
      if (i <= c) {
        d.classList.add('is-active')
        x = PAD + i * S_IN
      } else {
        d.classList.remove('is-active')
        const r = i - g.active
        x = g.capW + GAP + r * S_OUT
      }
      d.style.left = `${x}px`
    }

    const prev = el.__msPrev ?? 0
    if (animatePop && c > prev) {
      // The dot just absorbed gets a spring pop
      const frontier = dots[c]
      frontier.classList.remove('pop')
      // Force reflow so the animation restarts
      void (frontier as HTMLElement).offsetWidth
      frontier.classList.add('pop')
    }
    el.__msPrev = c
  }

  el.__msCleanup = () => {
    // Remove dots from DOM on unmount
    dots.forEach(d => { try { el.removeChild(d) } catch { /* noop */ } })
    delete el.__msDots
    delete el.__msLayout
    delete el.__msPrev
    delete el.__msCleanup
  }
}

/**
 * Cleanup callback — call when the ref returns null (element unmounting).
 */
export function cleanupStage(el: StageElement | null): void {
  if (!el) return
  el.__msCleanup?.()
}

// ---------------------------------------------------------------------------
// Surface entrance animation — callback ref
// ---------------------------------------------------------------------------

export interface SurfaceElement extends HTMLDivElement {
  __msIntroTimer?: ReturnType<typeof setTimeout>
}

/**
 * Callback ref for `.ms-surface`.
 * Triggers the mount entrance animation via double-rAF (exactly as the
 * original prototype does) and removes the `intro` class from dots after
 * the stagger finishes.
 */
export function mountSurface(el: SurfaceElement | null): void {
  if (!el) return

  function addMounted(): void {
    el!.classList.add('mounted')
  }

  // Double-rAF ensures one full frame has painted before animating
  requestAnimationFrame(() => requestAnimationFrame(addMounted))

  // Belt-and-suspenders fallback (mirrors `setTimeout(mount, 80)` in prototype)
  setTimeout(addMounted, 80)

  // Strip intro class after all stagger delays have expired
  el.__msIntroTimer = setTimeout(() => {
    el.querySelectorAll<HTMLElement>('.ms-dot.intro').forEach(d =>
      d.classList.remove('intro'),
    )
  }, 1400)
}

export function cleanupSurface(el: SurfaceElement | null): void {
  if (!el) return
  if (el.__msIntroTimer != null) {
    clearTimeout(el.__msIntroTimer)
    delete el.__msIntroTimer
  }
  el.classList.remove('mounted')
}

// ---------------------------------------------------------------------------
// Ripple — imperative burst on pointer-down
// ---------------------------------------------------------------------------

/**
 * Spawn a ripple `<span>` inside `btn` at the pointer position.
 * Mirrors the original `ripple(btn, ev)` function exactly.
 */
export function ripple(btn: HTMLButtonElement, ev: PointerEvent): void {
  const r = document.createElement('span')
  r.className = 'ms-ripple'
  const rect  = btn.getBoundingClientRect()
  const size  = Math.max(rect.width, rect.height) * 1.15
  const px    = ev.clientX ? ev.clientX - rect.left : rect.width  / 2
  const py    = ev.clientY ? ev.clientY - rect.top  : rect.height / 2
  r.style.width  = `${size}px`
  r.style.height = `${size}px`
  r.style.left   = `${px}px`
  r.style.top    = `${py}px`
  btn.appendChild(r)
  setTimeout(() => { if (r.parentNode) r.parentNode.removeChild(r) }, 640)
}

// ---------------------------------------------------------------------------
// Celebrate — finish-pulse + emerald ring on the primary button
// ---------------------------------------------------------------------------

/**
 * Fires the `celebrate` class animation on `btn` and briefly applies an
 * expanded emerald ring on `capsuleEl`.  Mirrors the original finish handler.
 */
export function celebrate(
  btn: HTMLButtonElement,
  capsuleEl: HTMLDivElement,
): void {
  btn.classList.remove('celebrate')
  // Force reflow so re-adding the class restarts the animation
  void (btn as HTMLElement).offsetWidth
  btn.classList.add('celebrate')

  capsuleEl.style.boxShadow =
    '0 0 0 6px rgba(16,185,129,0.18), ' +
    'var(--shadow-emerald-glow-sm), ' +
    'inset 0 1px 0 rgba(255,255,255,0.55), ' +
    'inset 0 -2px 0 rgba(0,0,0,0.20), ' +
    'inset 0 0 0 1px rgba(255,255,255,0.15)'
  setTimeout(() => { capsuleEl.style.boxShadow = '' }, 560)
}
