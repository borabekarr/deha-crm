/**
 * pipeline-card-hook.ts — DOM-side behavior for PipelineCard.
 *
 * NO raw useEffect anywhere in the pipeline-card/ folder.
 * All side-effects are expressed via callback refs or event handlers.
 */

// ---------------------------------------------------------------------------
// Count-up tween (wired via callback ref on elements that have data-impact / data-pot)
// ---------------------------------------------------------------------------

/** Eases t in [0..1] with a cubic ease-out curve. */
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Start a count-up tween. Returns a cleanup function. */
export function startCountUp(
  el: HTMLElement,
  from: number,
  to: number,
  duration: number,
  format: (v: number) => string,
): () => void {
  let raf: number | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  const t0 = performance.now()

  function step(now: number): void {
    const p = ease(Math.min(1, (now - t0) / duration))
    el.textContent = format(from + (to - from) * p)
    if (p < 1) {
      raf = requestAnimationFrame(step)
    }
  }
  raf = requestAnimationFrame(step)
  timer = setTimeout(() => {
    if (raf !== null) cancelAnimationFrame(raf)
    el.textContent = format(to)
  }, duration + 70)

  return () => {
    if (raf !== null) cancelAnimationFrame(raf)
    if (timer !== null) clearTimeout(timer)
  }
}

// ---------------------------------------------------------------------------
// Ripple — fires from onClick handler, no hook needed
// ---------------------------------------------------------------------------

export function spawnRipple(e: React.MouseEvent, el: HTMLElement): void {
  const r = el.getBoundingClientRect()
  const size = Math.max(r.width, r.height)
  const s = document.createElement('span')
  s.className = 'pc-ripple'
  s.style.width = s.style.height = size + 'px'
  s.style.left = e.clientX - r.left - size / 2 + 'px'
  s.style.top = e.clientY - r.top - size / 2 + 'px'
  el.appendChild(s)
  setTimeout(() => s.remove(), 500)
}

// ---------------------------------------------------------------------------
// Shell press ripple — full-card tactile ripple on click
// ---------------------------------------------------------------------------

export function spawnShellRipple(e: React.MouseEvent, shell: HTMLElement): void {
  const r = shell.getBoundingClientRect()
  const size = Math.max(r.width, r.height) * 2
  const s = document.createElement('span')
  s.className = 'pc-shell-ripple'
  s.style.width = s.style.height = size + 'px'
  s.style.left = e.clientX - r.left - size / 2 + 'px'
  s.style.top = e.clientY - r.top - size / 2 + 'px'
  shell.appendChild(s)
  setTimeout(() => s.remove(), 560)
}

// ---------------------------------------------------------------------------
// Apply button flow
// ---------------------------------------------------------------------------

export function runApply(
  btn: HTMLElement,
  onDone: () => void,
): void {
  if (btn.classList.contains('is-loading') || btn.classList.contains('is-done')) return
  btn.classList.add('is-loading')
  setTimeout(() => {
    btn.classList.remove('is-loading')
    btn.classList.add('is-done')
  }, 850)
  setTimeout(onDone, 1480)
}

// ---------------------------------------------------------------------------
// Card removal animation — wired via callback ref on shell element
// ---------------------------------------------------------------------------

export function animateRemove(shell: HTMLElement, onRemoved: () => void): void {
  shell.style.overflow = 'hidden'
  shell.style.maxHeight = shell.offsetHeight + 'px'
  shell.classList.add('is-removing')
  requestAnimationFrame(() => {
    shell.style.maxHeight = '0px'
    shell.style.marginBottom = '-22px'
  })
  setTimeout(onRemoved, 420)
}

// ---------------------------------------------------------------------------
// AI chat — mount into the pcx-chat element
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]))
}

const THINK_STEPS = ['Reading the signal data', 'Comparing with similar past cases', 'Estimating impact & confidence']

// Scripted follow-up replies (cycling, so each new message feels varied)
const SCRIPTED_REPLIES = [
  'Going on the signals above, acting now gives the strongest outcome. I can draft the next step or pull more detail whenever you want.',
  'The data points to this being the highest-leverage action right now. Want me to break down the specific risk factors?',
  'Based on the pattern match across similar cases, the confidence here is solid. I can show you the comparable situations if that helps.',
  'That is a good question. The timing is the key factor — the window is narrowest today, which is why this surfaced at the top.',
]
let _replyIdx = 0
function nextReply(): string {
  const r = SCRIPTED_REPLIES[_replyIdx % SCRIPTED_REPLIES.length]
  _replyIdx++
  return r
}

export interface AiChatData {
  typeShort: string
  finding: string
  reco?: string
  confidence: number
}

// ---------------------------------------------------------------------------
// Typing animation — streams text into targetEl one character at a time
// ---------------------------------------------------------------------------

function typeText(targetEl: HTMLElement, text: string, onDone?: () => void): void {
  let i = 0
  // Show cursor while typing
  const cursor = document.createElement('span')
  cursor.className = 'pcx-typing-cursor'
  targetEl.appendChild(cursor)

  const interval = setInterval(() => {
    if (i < text.length) {
      // Insert before cursor
      cursor.insertAdjacentText('beforebegin', text[i])
      i++
    } else {
      clearInterval(interval)
      cursor.remove()
      if (onDone) onDone()
    }
  }, 18)
}

// ---------------------------------------------------------------------------
// Append a new chat bubble with entrance animation
// ---------------------------------------------------------------------------

function appendBubble(log: HTMLElement, role: 'user' | 'ai', html: string): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = `pcx-msg ${role} entering`
  wrap.innerHTML = html
  log.appendChild(wrap)
  // Remove animation class after it plays so it does not retrigger
  setTimeout(() => wrap.classList.remove('entering'), 400)
  return wrap
}

// ---------------------------------------------------------------------------
// Thinking steps then typed answer — shared by both the inline popover and
// the RightPanel discuss chat
// ---------------------------------------------------------------------------

function runThinkThenType(
  log: HTMLElement,
  text: string,
  recoText: string | undefined,
  scrollFn: () => void,
): void {
  // Build the AI turn with think block + answer slot
  const aiWrap = document.createElement('div')
  aiWrap.className = 'pcx-msg ai entering'
  aiWrap.innerHTML = `<span class="pcx-ai-av">AI</span><div class="pcx-ai-body"><div class="pcx-think" data-think>${THINK_STEPS.map((s, i) => `<div class="pcx-think-step" data-step="${i}"><span class="pcx-think-ic"><span class="pcx-spin sm"></span></span>${esc(s)}</div>`).join('')}</div><div class="pcx-answer" data-answer></div></div>`
  log.appendChild(aiWrap)
  setTimeout(() => aiWrap.classList.remove('entering'), 400)
  scrollFn()

  const stepEls = aiWrap.querySelectorAll<HTMLElement>('[data-step]')

  function markDone(el: HTMLElement): void {
    el.classList.add('done')
    const ic = el.querySelector('.pcx-think-ic')
    if (ic) ic.innerHTML = '<span class="material-symbols-outlined">check</span>'
  }

  let idx = 0
  function tick(): void {
    if (idx < stepEls.length) {
      if (idx > 0) markDone(stepEls[idx - 1])
      stepEls[idx].classList.add('active')
      idx++
      setTimeout(tick, 660)
    } else {
      markDone(stepEls[stepEls.length - 1])
      const ansEl = aiWrap.querySelector('[data-answer]') as HTMLElement
      // Use plain text bubble (no box) for initial/follow-up messages
      const bubble = document.createElement('div')
      bubble.className = 'pcx-bubble ai-plain'
      ansEl.appendChild(bubble)
      ansEl.classList.add('show')
      scrollFn()

      typeText(bubble, text, () => {
        if (recoText) {
          const reco = document.createElement('div')
          reco.className = 'pcx-answer-reco'
          reco.innerHTML = `<span class="material-symbols-outlined">tips_and_updates</span><span>${esc(recoText)}</span>`
          bubble.appendChild(reco)
        }
        scrollFn()
      })
    }
  }
  setTimeout(tick, 360)
}

// ---------------------------------------------------------------------------
// Stub: triggered when the mini-chat panel hands off a first message.
// TODO: wire to global AI chatbot
// ---------------------------------------------------------------------------

function onTriggerGlobalChat(_message: string): void {
  // no-op placeholder — future: open the global AI chat overlay with this message
}

// ---------------------------------------------------------------------------
// fix #5 — wireDiscussInput:
//   RightPanel discuss accepts ONE first message only.
//   On send: collapse the panel (onClosePanel) + fire the global chat stub.
//   No chat history is appended; no follow-up conversation runs in this panel.
//
//   For the AskBlock / mountAiChat path (no onClosePanel), the full scripted
//   AI chat flow still runs — handled by mountAiChat which wires its own follow-up.
// ---------------------------------------------------------------------------

export function wireDiscussInput(
  fi: HTMLInputElement,
  fs: HTMLElement,
  log: HTMLElement,
  scrollFn: () => void,
  onClosePanel?: () => void,
): void {
  let sent = false

  function pulseSend(): void {
    fs.classList.remove('act')
    void (fs as HTMLElement).offsetWidth
    fs.classList.add('act')
  }

  function send(): void {
    const text = fi.value.trim()
    if (!text || sent) return
    sent = true
    fi.value = ''

    if (onClosePanel) {
      // fix #5: first-message-only path — collapse panel + hand off to global chat stub
      pulseSend()
      onTriggerGlobalChat(text)
      // small delay so the send-pulse animation completes before panel closes
      setTimeout(() => onClosePanel(), 160)
      return
    }

    // Full scripted AI reply path (used by AskBlock / mountAiChat follow-up wire)
    // Reveal the log container if hidden
    if ((log as HTMLElement).style.display === 'none') {
      ;(log as HTMLElement).style.display = 'flex'
      ;(log as HTMLElement).style.flexDirection = 'column'
      ;(log as HTMLElement).style.gap = '10px'
    }
    appendBubble(log, 'user', `<div class="pcx-bubble">${esc(text)}</div>`)
    scrollFn()

    setTimeout(() => {
      runThinkThenType(log, nextReply(), undefined, scrollFn)
      setTimeout(() => { sent = false }, 2200)
    }, 340)
  }

  fs.addEventListener('click', (ev) => { ev.stopPropagation(); pulseSend(); send() })
  fi.addEventListener('click', (ev) => ev.stopPropagation())
  fi.addEventListener('keydown', (ev) => {
    if ((ev as KeyboardEvent).key === 'Enter' && !(ev as KeyboardEvent).shiftKey) {
      ev.preventDefault(); pulseSend(); send()
    }
  })
}

export function mountAiChat(chatEl: HTMLElement, data: AiChatData): void {
  if (chatEl.classList.contains('open')) return
  chatEl.classList.add('open')

  const q = 'Why did the AI surface this ' + data.typeShort + '?'
  chatEl.innerHTML = `
    <div class="pcx-chat-log" data-log>
      <div class="pcx-msg user entering"><div class="pcx-bubble">${esc(q)}</div></div>
    </div>
    <div class="pcx-msgbox" data-msgbox><input placeholder="Ask a follow-up…" data-followup aria-label="Ask a follow-up"><button class="pcx-msgbox-send" data-followup-send aria-label="Send"><span class="material-symbols-outlined">arrow_upward</span></button></div>`

  // Remove entering class from the initial user bubble
  const initUser = chatEl.querySelector('.pcx-msg.user.entering') as HTMLElement | null
  if (initUser) setTimeout(() => initUser.classList.remove('entering'), 400)

  const log = chatEl.querySelector('[data-log]') as HTMLElement
  function scrollLog(): void { log.scrollTop = log.scrollHeight }

  // Stream the first AI answer (finding + reco)
  runThinkThenType(log, data.finding, data.reco, scrollLog)

  // Wire follow-up input
  const fi = chatEl.querySelector('[data-followup]') as HTMLInputElement
  const fs = chatEl.querySelector('[data-followup-send]') as HTMLElement
  if (fi && fs) wireDiscussInput(fi, fs, log, scrollLog)

  // fix #4: clicking anywhere on the msgbox pill (except send btn) focuses input
  const msgbox = chatEl.querySelector('[data-msgbox]') as HTMLElement | null
  if (msgbox && fi) {
    msgbox.addEventListener('click', (ev) => {
      ev.stopPropagation()
      if ((ev.target as Element).closest('[data-followup-send]')) return
      fi.focus()
    })
  }
}
