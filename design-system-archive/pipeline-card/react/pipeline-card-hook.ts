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

export interface AiChatData {
  typeShort: string
  finding: string
  reco?: string
  confidence: number
}

export function mountAiChat(chatEl: HTMLElement, data: AiChatData): void {
  if (chatEl.classList.contains('open')) return
  chatEl.classList.add('open')

  const q = 'Why did the AI surface this ' + data.typeShort + '?'
  chatEl.innerHTML = `
    <div class="pcx-chat-log" data-log>
      <div class="pcx-msg user"><div class="pcx-bubble">${esc(q)}</div></div>
      <div class="pcx-msg ai">
        <span class="pcx-ai-av">AI</span>
        <div class="pcx-ai-body">
          <div class="pcx-think" data-think>
            ${THINK_STEPS.map((s, i) => `<div class="pcx-think-step" data-step="${i}"><span class="pcx-think-ic"><span class="pcx-spin sm"></span></span>${esc(s)}</div>`).join('')}
          </div>
          <div class="pcx-answer" data-answer></div>
        </div>
      </div>
    </div>
    <div class="pcx-msgbox"><input placeholder="Ask a follow-up…" data-followup aria-label="Ask a follow-up"><button class="pcx-msgbox-send" data-followup-send aria-label="Send"><span class="material-symbols-outlined">arrow_upward</span></button></div>`

  const log = chatEl.querySelector('[data-log]') as HTMLElement
  const stepEls = chatEl.querySelectorAll<HTMLElement>('[data-step]')

  function scrollLog(): void { log.scrollTop = log.scrollHeight }
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
      const ans = chatEl.querySelector('[data-answer]') as HTMLElement
      const conf = Array.from({ length: 5 }, (_, k) => `<span class="pcx-conf-dot${k < data.confidence ? ' on' : ''}"></span>`).join('')
      ans.innerHTML = `<div class="pcx-bubble ai">${esc(data.finding)}${data.reco ? `<div class="pcx-answer-reco"><span class="material-symbols-outlined">tips_and_updates</span><span>${esc(data.reco)}</span></div>` : ''}<div class="pcx-conf"><span class="pcx-conf-label">Confidence</span><div class="pcx-conf-dots">${conf}</div></div></div>`
      ans.classList.add('show')
      scrollLog()
    }
  }
  setTimeout(tick, 360)

  // Follow-up chat
  const fi = chatEl.querySelector('[data-followup]') as HTMLInputElement
  const fs = chatEl.querySelector('[data-followup-send]') as HTMLElement
  let replying = false

  function aiReply(): void {
    const r = document.createElement('div')
    r.className = 'pcx-msg ai'
    r.innerHTML = '<span class="pcx-ai-av">AI</span><div class="pcx-ai-body"><div class="pcx-bubble ai">Good question — going on the signals above, acting now gives the strongest outcome. I can draft the next step or pull more detail whenever you want.</div></div>'
    log.appendChild(r)
    scrollLog()
  }

  function sendFollowup(): void {
    const text = (fi?.value || '').trim()
    if (!text || replying) return
    fi.value = ''
    const u = document.createElement('div')
    u.className = 'pcx-msg user'
    u.innerHTML = '<div class="pcx-bubble">' + esc(text) + '</div>'
    log.appendChild(u)
    scrollLog()
    replying = true
    setTimeout(() => { aiReply(); replying = false }, 560)
  }

  function pulseSend(): void {
    if (fs) {
      fs.classList.remove('act')
      void (fs as HTMLElement).offsetWidth
      fs.classList.add('act')
    }
  }

  if (fs) fs.addEventListener('click', (ev) => { ev.stopPropagation(); pulseSend(); sendFollowup() })
  if (fi) {
    fi.addEventListener('click', (ev) => ev.stopPropagation())
    fi.addEventListener('keydown', (ev) => {
      if ((ev as KeyboardEvent).key === 'Enter' && !(ev as KeyboardEvent).shiftKey) {
        ev.preventDefault(); pulseSend(); sendFollowup()
      }
    })
  }
}
