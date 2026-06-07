/**
 * Controls hook — encapsulates all DOM-side behavior for .seg, .sw-base, and .slider.
 *
 * NO raw useEffect anywhere in this folder.
 * All side-effects are expressed via callback refs (ref prop on JSX elements).
 * The returned ref-setters are stable — they wire/unwire on mount/unmount.
 */

// ── Segmented control ────────────────────────────────────────────────────────

/** Callback ref for a .seg element. Wires the sliding-pill behavior. */
export function segRef(el: HTMLDivElement | null): void {
  if (!el) return

  const pill = el.querySelector<HTMLSpanElement>('.seg-pill')
  if (!pill) return

  // Previous pill left in px. null until after the initial silent placement →
  // squash is skipped on page load and only fires on real user-driven changes.
  let prevLeft: number | null = null

  function move(animate = true): void {
    const active = el!.querySelector<HTMLButtonElement>('button.active')
    if (!active) return

    const nextLeft = active.offsetLeft
    const nextWidth = active.offsetWidth

    pill!.style.left = nextLeft + 'px'
    pill!.style.width = nextWidth + 'px'

    // Trigger squash only on real positional change after the initial measure.
    if (animate && prevLeft !== null && prevLeft !== nextLeft) {
      const movedRight = nextLeft > prevLeft
      pill!.style.transformOrigin = movedRight ? 'right center' : 'left center'
      const name = 'seg-squash'
      // Re-trigger reliably: clear → force reflow → set animation string.
      pill!.style.animation = 'none'
      void pill!.offsetWidth
      pill!.style.animation = `${name} calc(260ms * var(--anim-mult)) cubic-bezier(.22,1,.36,1)`
    }

    prevLeft = nextLeft
  }

  // Initial placement without transition (no squash on load).
  pill.style.transition = 'none'
  move(false)
  const resumeTimer = setTimeout(() => {
    pill.style.transition = ''
    move(false)
  }, 60)

  function onResize(): void { move(false) }
  window.addEventListener('resize', onResize)

  function onClick(e: Event): void {
    const btn = (e.target as Element).closest('button')
    if (!btn || !el!.contains(btn)) return
    el!.querySelectorAll('button').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    move()
  }
  el.addEventListener('click', onClick)

  // Cleanup stored on the element so the ref can unwire on unmount
  ;(el as HTMLDivElement & { __segCleanup?: () => void }).__segCleanup = () => {
    clearTimeout(resumeTimer)
    window.removeEventListener('resize', onResize)
    el!.removeEventListener('click', onClick)
  }
}

/** Cleanup — pass to the ref's unmount branch. */
export function cleanupSeg(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as HTMLDivElement & { __segCleanup?: () => void }
  e.__segCleanup?.()
  delete e.__segCleanup
}

// ── Toggle switch ────────────────────────────────────────────────────────────

/** Callback ref for a .sw-base element. Wires on/off toggle. */
export function swRef(el: HTMLDivElement | null): void {
  if (!el) return

  function onClick(): void {
    // Arm the squash animation on first user interaction so it never fires on
    // initial page load (initial markup is `sw-base sw-off`).
    el!.classList.add('sw-armed')
    const isOn = el!.classList.toggle('sw-on')
    el!.classList.toggle('sw-off', !isOn)
  }
  el.addEventListener('click', onClick)

  ;(el as HTMLDivElement & { __swCleanup?: () => void }).__swCleanup = () => {
    el!.removeEventListener('click', onClick)
  }
}

export function cleanupSw(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as HTMLDivElement & { __swCleanup?: () => void }
  e.__swCleanup?.()
  delete e.__swCleanup
}

// ── Slider ───────────────────────────────────────────────────────────────────

/** Callback ref for a .slider element. Wires pointer-based drag. */
export function sliderRef(el: HTMLDivElement | null): void {
  if (!el) return

  const fill = el.querySelector<HTMLDivElement>('.fill')
  const thumb = el.querySelector<HTMLDivElement>('.thumb')
  if (!fill || !thumb) return

  let pressed = false

  function setFromClientX(clientX: number): void {
    const rect = el!.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const pctStr = (pct * 100).toFixed(1) + '%'
    fill!.style.width = pctStr
    thumb!.style.left = pctStr
  }

  function onDown(e: PointerEvent): void {
    pressed = true
    el!.classList.add('dragging')
    el!.setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }
  function onMove(e: PointerEvent): void {
    if (!pressed) return
    setFromClientX(e.clientX)
  }
  function onUp(e: PointerEvent): void {
    if (!pressed) return
    pressed = false
    el!.classList.remove('dragging')
    try { el!.releasePointerCapture(e.pointerId) } catch (_) { /* noop */ }
  }

  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)

  ;(el as HTMLDivElement & { __sliderCleanup?: () => void }).__sliderCleanup = () => {
    el!.removeEventListener('pointerdown', onDown)
    el!.removeEventListener('pointermove', onMove)
    el!.removeEventListener('pointerup', onUp)
    el!.removeEventListener('pointercancel', onUp)
  }
}

export function cleanupSlider(el: HTMLDivElement | null): void {
  if (!el) return
  const e = el as HTMLDivElement & { __sliderCleanup?: () => void }
  e.__sliderCleanup?.()
  delete e.__sliderCleanup
}
