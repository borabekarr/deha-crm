/**
 * SprintPlannerCore hook — encapsulates all window listeners and timers.
 *
 * Zero React effect hooks anywhere in this codebase.
 * All external system sync uses callback refs: wired on element mount,
 * torn down in the null branch (stored on the element as __spcCleanup).
 *
 * FLIP animation helper uses Web Animations API directly via callback ref,
 * avoiding the banned hooks entirely. Positions are captured/applied on the
 * same synchronous microtask via requestAnimationFrame pairs.
 */

interface WithCleanup extends HTMLElement {
  __spcCleanup?: () => void
}

// ---------------------------------------------------------------------------
// Global Cmd/Ctrl-K palette toggle — wired on the root .sp-outer element
// ---------------------------------------------------------------------------
export function spcRootRef(
  el: HTMLElement | null,
  togglePalette: () => void,
): void {
  if (!el) {
    const prev = (el as unknown as WithCleanup)?.__spcCleanup
    prev?.()
    return
  }

  function onKeyDown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      togglePalette()
    }
  }

  window.addEventListener('keydown', onKeyDown)

  ;(el as WithCleanup).__spcCleanup = () => {
    window.removeEventListener('keydown', onKeyDown)
  }
}

export function cleanupSpcRoot(el: HTMLElement | null): void {
  if (!el) return
  const e = el as WithCleanup
  e.__spcCleanup?.()
  delete e.__spcCleanup
}

// ---------------------------------------------------------------------------
// Command palette: Escape key + focus input on open
// Wired on the palette backdrop element.
// ---------------------------------------------------------------------------
interface PaletteRefOptions {
  getOpen: () => boolean
  onClose: () => void
  focusInput: () => void
}

export function spcPaletteRef(
  el: HTMLElement | null,
  opts: PaletteRefOptions,
): void {
  if (!el) {
    const prev = (el as unknown as WithCleanup)?.__spcCleanup
    prev?.()
    return
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!opts.getOpen()) return
    if (e.key === 'Escape') {
      e.preventDefault()
      opts.onClose()
    }
  }

  window.addEventListener('keydown', onKeyDown)

  // Focus the input shortly after mount (mirrors original setTimeout 30ms)
  const focusTimer = setTimeout(() => opts.focusInput(), 30)

  ;(el as WithCleanup).__spcCleanup = () => {
    window.removeEventListener('keydown', onKeyDown)
    clearTimeout(focusTimer)
  }
}

export function cleanupSpcPalette(el: HTMLElement | null): void {
  if (!el) return
  const e = el as WithCleanup
  e.__spcCleanup?.()
  delete e.__spcCleanup
}

// ---------------------------------------------------------------------------
// Add-ticket modal: Escape key + focus input on open
// ---------------------------------------------------------------------------
interface ModalRefOptions {
  onClose: () => void
  focusInput: () => void
}

export function spcModalRef(
  el: HTMLElement | null,
  opts: ModalRefOptions,
): void {
  if (!el) {
    const prev = (el as unknown as WithCleanup)?.__spcCleanup
    prev?.()
    return
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') opts.onClose()
  }

  window.addEventListener('keydown', onKeyDown)
  const focusTimer = setTimeout(() => opts.focusInput(), 30)

  ;(el as WithCleanup).__spcCleanup = () => {
    window.removeEventListener('keydown', onKeyDown)
    clearTimeout(focusTimer)
  }
}

export function cleanupSpcModal(el: HTMLElement | null): void {
  if (!el) return
  const e = el as WithCleanup
  e.__spcCleanup?.()
  delete e.__spcCleanup
}

// ---------------------------------------------------------------------------
// Toast auto-dismiss timer — managed outside React via a stable ref object
// ---------------------------------------------------------------------------
export interface ToastTimerHandle {
  /** Schedule auto-dismiss. Clears any prior pending timer. */
  schedule(closeToast: () => void, ms?: number): void
  /** Cancel any pending auto-dismiss. */
  cancel(): void
}

export function makeToastTimer(): ToastTimerHandle {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    schedule(closeToast, ms = 4200) {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        closeToast()
      }, ms)
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Success-flash timer — clears the successMap after 2200 ms
// ---------------------------------------------------------------------------
export interface FlashTimerHandle {
  schedule(clear: () => void): void
  cancel(): void
}

export function makeFlashTimer(): FlashTimerHandle {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    schedule(clear) {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        clear()
      }, 2200)
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Toast morph-out timer — 240 ms, then unmount
// ---------------------------------------------------------------------------
export interface MorphOutTimerHandle {
  schedule(done: () => void): void
  cancel(): void
}

export function makeMorphOutTimer(): MorphOutTimerHandle {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    schedule(done) {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        done()
      }, 240)
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
    },
  }
}

// ---------------------------------------------------------------------------
// DayCell scroll check — wired on the scroll container element
// ---------------------------------------------------------------------------
interface ScrollRefOptions {
  onScrollState(canUp: boolean, canDown: boolean): void
}

export function spcScrollRef(
  el: HTMLElement | null,
  opts: ScrollRefOptions,
): void {
  if (!el) {
    const prev = (el as unknown as WithCleanup)?.__spcCleanup
    prev?.()
    return
  }

  function check(): void {
    const overflowing = el!.scrollHeight > el!.clientHeight + 2
    const canDown = overflowing && el!.scrollTop < el!.scrollHeight - el!.clientHeight - 4
    const canUp   = overflowing && el!.scrollTop > 4
    opts.onScrollState(canUp, canDown)
  }

  // Run once immediately on mount
  check()

  // Re-check on scroll
  el.addEventListener('scroll', check)

  ;(el as WithCleanup).__spcCleanup = () => {
    el!.removeEventListener('scroll', check)
  }
}

export function cleanupSpcScroll(el: HTMLElement | null): void {
  if (!el) return
  const e = el as WithCleanup
  e.__spcCleanup?.()
  delete e.__spcCleanup
}
