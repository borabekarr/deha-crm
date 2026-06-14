/**
 * ai-message-box-hook.ts
 *
 * Encapsulates all DOM-level side effects for AiMessageBox.
 * Manages the generating → exiting → done → done-out state machine
 * via class toggling on the .mb element.
 *
 * NO raw useEffect. All side effects triggered via callback refs and
 * event handlers called from React.
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface MbTimers {
  revertT?: ReturnType<typeof setTimeout>
  clearT?: ReturnType<typeof setTimeout>
  doneT?: ReturnType<typeof setTimeout>
  doneOutT?: ReturnType<typeof setTimeout>
}

// Store timers on the element to survive re-renders without refs
type MbElement = HTMLDivElement & MbTimers

// ── State machine ─────────────────────────────────────────────────────────────

/**
 * Kick off the generating state machine.
 * Verbatim port of the inline <script> in components-ai-message-box.html.
 */
export function mbStartGenerating(el: HTMLDivElement | null): void {
  if (!el) return
  const mb = el as MbElement

  if (mb.classList.contains('generating')) return  // guard: not clickable while generating

  clearTimeout(mb.revertT)
  clearTimeout(mb.clearT)
  clearTimeout(mb.doneT)
  clearTimeout(mb.doneOutT)

  mb.classList.remove('exiting', 'done', 'done-out')
  mb.classList.add('generating')

  // Auto-revert after 5s, playing the exit morph, then a Done badge
  mb.revertT = setTimeout(() => {
    mb.classList.remove('generating')
    mb.classList.add('exiting', 'done')

    mb.clearT = setTimeout(() => {
      mb.classList.remove('exiting')

      mb.doneT = setTimeout(() => {
        mb.classList.remove('done')
        mb.classList.add('done-out')

        mb.doneOutT = setTimeout(() => {
          mb.classList.remove('done-out')
        }, 720)
      }, 1300)
    }, 660)
  }, 5000)
}

/**
 * Cleanup: clear all pending timers when the element unmounts.
 */
export function mbCleanup(el: HTMLDivElement | null): void {
  if (!el) return
  const mb = el as MbElement
  clearTimeout(mb.revertT)
  clearTimeout(mb.clearT)
  clearTimeout(mb.doneT)
  clearTimeout(mb.doneOutT)
}
