/**
 * GithubCalendar hook — wires the entrance animation via a callback ref.
 *
 * NO raw useEffect anywhere in GithubCalendar.tsx.
 * The pop-in animation is triggered by setting data-anim="in" on the card
 * element once it mounts, using requestAnimationFrame so the browser has
 * painted the initial frame first. Cleanup cancels the pending rAF.
 */

/**
 * Callback ref for the .gc-card element.
 * Sets data-anim="in" on the next animation frame to trigger gcPop keyframes.
 * Stores the rAF id on the element so cleanupGcCard can cancel it.
 */
export function gcCardRef(el: HTMLElement | null): void {
  if (!el) return

  const id = requestAnimationFrame(() => {
    el.dataset['anim'] = 'in'
  })

  ;(el as HTMLElement & { __gcRafId?: number }).__gcRafId = id
}

export function cleanupGcCard(el: HTMLElement | null): void {
  if (!el) return
  const e = el as HTMLElement & { __gcRafId?: number }
  if (e.__gcRafId !== undefined) {
    cancelAnimationFrame(e.__gcRafId)
    delete e.__gcRafId
  }
}
