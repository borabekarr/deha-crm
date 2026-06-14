/**
 * prize-sheet-hook.ts — confetti engine + open/close/claim lifecycle
 * for the PrizeSheet component.
 *
 * NO raw useEffect anywhere in the prize-sheet folder.
 * All imperative logic is wired via callback refs on the panel elements.
 * Cleanup (timers + RAF + event listeners) is stored on element properties
 * so teardown happens in the ref cleanup path.
 */

// ── Types ──────────────────────────────────────────────────────────────────

interface ConfettiPart {
  x: number; y: number; vx: number; vy: number; g: number;
  w: number; h: number; rot: number; vr: number; color: string;
  life: number; ttl: number; shape: 'rect' | 'strip';
}

interface ConfettiEngine {
  burst: (count: number, power: number) => void
  size: () => void
  stop: () => void
}

interface ScopeEl extends HTMLElement {
  __psCleanup?: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────

const COLORS = ['#10B981', '#22D3EE', '#A3E635', '#34D399', '#67E8F9', '#FFFFFF']
const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)

// ── Confetti engine ────────────────────────────────────────────────────────

export function makeConfetti(canvas: HTMLCanvasElement): ConfettiEngine {
  const ctx = canvas.getContext('2d')!
  let parts: ConfettiPart[] = []
  let raf: number | null = null

  function size() {
    const r = canvas.getBoundingClientRect()
    canvas.width = r.width * DPR
    canvas.height = r.height * DPR
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]
      p.life++
      p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr
      const fade = p.life > p.ttl - 26 ? Math.max(0, (p.ttl - p.life) / 26) : 1
      ctx.save()
      ctx.globalAlpha = fade
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      if (p.shape === 'strip') ctx.fillRect(-p.w / 2, -p.h / 4, p.w, p.h / 2)
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
      if (p.life >= p.ttl || p.y > canvas.height / DPR + 30) parts.splice(i, 1)
    }
    if (parts.length) {
      raf = requestAnimationFrame(tick)
    } else {
      raf = null
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  function burst(count: number, power: number) {
    size()
    const r = canvas.getBoundingClientRect()
    const ox = r.width / 2
    const oy = r.height * 0.30
    for (let i = 0; i < count; i++) {
      const ang = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 1.25
      const sp = (2.6 + Math.random() * 4.2) * power
      parts.push({
        x: ox + (Math.random() - 0.5) * 40,
        y: oy + (Math.random() - 0.5) * 20,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - Math.random() * 2,
        g: 0.12 + Math.random() * 0.06,
        w: 5 + Math.random() * 6,
        h: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 0,
        ttl: 90 + Math.random() * 50,
        shape: Math.random() > 0.5 ? 'rect' : 'strip',
      })
    }
    if (!raf) raf = requestAnimationFrame(tick)
  }

  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null }
    parts = []
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return { burst, size, stop }
}

// ── Scope setup — callback ref ─────────────────────────────────────────────
// Called once per panel element (sheet or modal) via callback ref.
// Returns a cleanup function stored on the element.

export interface ScopeOpts {
  /** The outer frame that receives the open class (ps-device or ps-desktop) */
  getFrame: () => HTMLElement | null
  /** Class added to frame when open */
  openClass: string
  /** Whether to wire drag-to-dismiss (mobile sheet) */
  isMobile: boolean
  /** Setter for the "is-open" class on the panel — drives CSS entrance animations */
  setIsOpen: (open: boolean) => void
  /** Setter for the "claimed" class on the panel */
  setClaimed: (claimed: boolean) => void
}

export function setupPanelScope(
  panel: HTMLElement,
  opts: ScopeOpts,
): () => void {
  const { getFrame, openClass, isMobile, setIsOpen, setClaimed } = opts
  const canvas = panel.querySelector<HTMLCanvasElement>('.confetti')!
  const cf = makeConfetti(canvas)
  const claimBtn = panel.querySelector<HTMLButtonElement>('[data-claim]')!
  let openTimer: ReturnType<typeof setTimeout> | null = null
  let dismissTimer: ReturnType<typeof setTimeout> | null = null

  function open() {
    const frame = getFrame()
    if (!frame) return
    // reset
    panel.classList.remove('claimed')
    panel.style.transform = ''
    frame.classList.add(openClass)
    setIsOpen(true)
    if (openTimer) clearTimeout(openTimer)
    openTimer = setTimeout(() => cf.burst(26, 1), 260)
    setTimeout(() => cf.burst(20, 0.85), 480)
  }

  function dismiss() {
    const frame = getFrame()
    if (!frame) return
    frame.classList.remove(openClass)
    setIsOpen(false)
    if (dismissTimer) clearTimeout(dismissTimer)
    dismissTimer = setTimeout(() => setClaimed(false), 560)
  }

  function claim() {
    claimBtn.classList.add('pressed')
    cf.burst(70, 1.5)
    setTimeout(() => cf.burst(40, 1.2), 180)
    setTimeout(() => {
      claimBtn.classList.remove('pressed')
      setClaimed(true)
      cf.burst(30, 1)
    }, 220)
    setTimeout(dismiss, 2600)
  }

  // Hover burst
  function onPanelEnter() {
    if (panel.classList.contains('is-open') && !panel.classList.contains('claimed')) {
      cf.burst(6, 0.7)
    }
  }

  claimBtn.addEventListener('click', claim)
  panel.addEventListener('mouseenter', onPanelEnter)

  // expose open/dismiss for external wiring (fab, overlay, x button, escape)
  ;(panel as ScopeEl & { __psOpen?: () => void; __psDismiss?: () => void }).__psOpen = open
  ;(panel as ScopeEl & { __psOpen?: () => void; __psDismiss?: () => void }).__psDismiss = dismiss

  // drag-to-dismiss (mobile bottom sheet only)
  let dragCleanup: (() => void) | null = null
  if (isMobile) {
    let dragging = false
    let startY = 0
    let curY = 0
    const grip = panel.querySelector<HTMLElement>('[data-grip]')!
    const H = () => panel.getBoundingClientRect().height

    function onDown(e: MouseEvent | TouchEvent) {
      const frame = getFrame()
      if (!frame?.classList.contains(openClass)) return
      dragging = true
      startY = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY
      curY = 0
      frame.classList.add('dragging')
    }
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging) return
      const y = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY
      curY = Math.max(0, y - startY)
      panel.style.transform = `translateY(${curY}px)`
      if (e.cancelable) e.preventDefault()
    }
    function onUp() {
      if (!dragging) return
      dragging = false
      const frame = getFrame()
      frame?.classList.remove('dragging')
      if (curY > H() * 0.32) dismiss()
      else panel.style.transform = ''
    }

    grip.addEventListener('mousedown', onDown)
    panel.addEventListener('touchstart', onDown as EventListener, { passive: true })
    window.addEventListener('mousemove', onMove as EventListener)
    window.addEventListener('touchmove', onMove as EventListener, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)

    dragCleanup = () => {
      grip.removeEventListener('mousedown', onDown)
      panel.removeEventListener('touchstart', onDown as EventListener)
      window.removeEventListener('mousemove', onMove as EventListener)
      window.removeEventListener('touchmove', onMove as EventListener)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }

  // canvas resize
  const onResize = () => cf.size()
  window.addEventListener('resize', onResize)

  return function cleanup() {
    if (openTimer) clearTimeout(openTimer)
    if (dismissTimer) clearTimeout(dismissTimer)
    cf.stop()
    claimBtn.removeEventListener('click', claim)
    panel.removeEventListener('mouseenter', onPanelEnter)
    window.removeEventListener('resize', onResize)
    dragCleanup?.()
  }
}
