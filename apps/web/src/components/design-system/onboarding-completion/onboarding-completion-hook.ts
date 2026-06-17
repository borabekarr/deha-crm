/**
 * onboarding-completion-hook.ts
 *
 * Encapsulates all timed state transitions for the OnboardingCompletion component.
 *
 * All timers are stored on the root DOM element and cleared on unmount via the
 * null branch of the callback ref. No side-effect imports required.
 *
 * Pattern: callback ref (DOM mount/unmount) — see no-use-effect skill.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type StepStatus = 'todo' | 'processing' | 'done'
export type StatusMap = Record<string, StepStatus>
export type SetStatus = React.Dispatch<React.SetStateAction<StatusMap>>
export type SetFire   = React.Dispatch<React.SetStateAction<boolean>>

interface OcEl extends HTMLElement {
  __ocCleanup?: () => void
}

// ── Callback ref wiring ──────────────────────────────────────────────────────

/**
 * Call this in the ref prop's mount branch (el != null).
 * Stores cleanup on the element; call cleanupOc(null) on unmount.
 */
export function ocRootRef(el: HTMLElement): void {
  const timers: ReturnType<typeof setTimeout>[] = []

  ;(el as OcEl).__ocCleanup = () => {
    timers.forEach(clearTimeout)
    timers.length = 0
  }

  // Expose timer push so the component can schedule transitions through here.
  ;(el as OcEl & { __ocPushTimer?: (id: ReturnType<typeof setTimeout>) => void }).__ocPushTimer = (id) => {
    timers.push(id)
  }
}

/**
 * Call in the ref prop's unmount branch (el == null), passing the stored ref.
 */
export function cleanupOc(el: HTMLElement | null): void {
  if (!el) return
  const e = el as OcEl
  e.__ocCleanup?.()
  delete e.__ocCleanup
}

// ── Timer helpers (used by the component to schedule processing→done) ────────

/**
 * Schedule a step to transition: todo → processing → done.
 * Pushes the timer onto the element's cleanup list.
 * When the last step completes (done count reaches totalSteps), fires confetti
 * via setFireRef.current(true) — called from a timer callback, never during render.
 */
export function scheduleComplete(
  el: HTMLElement | null,
  stepId: string,
  setStatus: SetStatus,
  delay = 0,
  totalSteps = 0,
  setFireRef?: React.MutableRefObject<SetFire>,
): void {
  if (!el) return
  const pushTimer = (el as OcEl & { __ocPushTimer?: (id: ReturnType<typeof setTimeout>) => void }).__ocPushTimer
  if (!pushTimer) return

  // Mark processing after `delay`
  const t1 = setTimeout(() => {
    setStatus((s) => s[stepId] === 'todo' ? { ...s, [stepId]: 'processing' as const } : s)

    // Mark done 760 ms later
    const t2 = setTimeout(() => {
      setStatus((s) => {
        const next: StatusMap = { ...s, [stepId]: 'done' }
        // Fire confetti exactly once when all steps land
        if (totalSteps > 0 && setFireRef) {
          const doneNow = Object.values(next).filter((v) => v === 'done').length
          if (doneNow === totalSteps) {
            setFireRef.current(true)
          }
        }
        return next
      })
    }, 760)
    pushTimer(t2)
  }, delay)
  pushTimer(t1)
}

/**
 * Clear all timers registered on the element (e.g. on reset).
 */
export function clearOcTimers(el: HTMLElement | null): void {
  if (!el) return
  const e = el as OcEl
  e.__ocCleanup?.()
  // Re-wire so the element stays usable after reset
  if (e.__ocCleanup) {
    ocRootRef(el)
  }
}
