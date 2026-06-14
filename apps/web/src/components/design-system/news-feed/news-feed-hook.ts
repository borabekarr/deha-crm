/**
 * news-feed-hook.ts — card interaction logic wired via callback refs.
 *
 * NO raw useEffect in the news-feed/ folder.
 * All timers and class mutations are owned here; the component wires
 * them by passing the article element into mountCard() as a callback ref.
 */

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export interface FeedItem {
  title: string
  sub: string
  date: string
}

export type Tone = 'bull' | 'bear'

export const FEEDS: Record<Tone, FeedItem[]> = {
  bull: [
    { title: 'Hong Kong Expands Cryptocurrency Market with New Exchange Approvals.', sub: 'The market is bullish today', date: 'December 5, 2024' },
    { title: 'Bitcoin ETF Inflows Hit a Record High as Institutions Pile In.',        sub: 'The market is bullish today', date: 'December 22, 2024' },
    { title: 'Ethereum Staking Yields Climb as the Network Upgrade Goes Live.',       sub: 'The market is bullish today', date: 'January 4, 2025' },
  ],
  bear: [
    { title: 'Solana Price Faces Potential Dip Below $200 After Federal Reserve Cut.', sub: 'The market is bearish today', date: 'December 19, 2024' },
    { title: 'Crypto Market Sheds $90B as a Risk-Off Sentiment Spreads.',              sub: 'The market is bearish today', date: 'January 2, 2025' },
    { title: 'XRP Slides Amid Renewed Regulatory Uncertainty in the US.',             sub: 'The market is bearish today', date: 'January 9, 2025' },
  ],
}

// ---------------------------------------------------------------------------
// Card API — returned by mountCard(), stored on the element
// ---------------------------------------------------------------------------

export interface CardApi {
  load: () => void
  skeleton: () => void
  empty: () => void
}

// Store handles on the element so callback-ref teardown can clean up
interface CardElement extends HTMLElement {
  __nfApi?: CardApi
  __nfTimers?: ReturnType<typeof setTimeout>[]
}

export function mountCard(el: CardElement): (() => void) | void {
  const tone = el.getAttribute('data-tone') as Tone | null
  if (!tone || !(tone in FEEDS)) return

  const feed = FEEDS[tone]
  let idx = 0
  let busy = false

  const titleEl = el.querySelector<HTMLElement>('.nf-title')
  const dateEl  = el.querySelector<HTMLElement>('.nf-date')
  const subEl   = el.querySelector<HTMLElement>('.nf-sub')
  const barEl   = el.querySelector<HTMLElement>('.nf-bar')
  const arrow   = el.querySelector<HTMLElement>('.nf-arrow')

  if (!titleEl || !dateEl || !subEl || !barEl || !arrow) return

  // direction mirrors the card pair (flat horizontal slide, no rotation)
  const dir = tone === 'bull' ? -38 : 38

  const timers: ReturnType<typeof setTimeout>[] = []

  function later(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms)
    timers.push(t)
    return t
  }

  // All nullable refs are guarded above — cast to non-null for internal helpers
  const title = titleEl as HTMLElement
  const date  = dateEl  as HTMLElement
  const sub   = subEl   as HTMLElement
  const bar   = barEl   as HTMLElement

  function buildBar() {
    bar.innerHTML =
      feed.map((_, i) => `<div class="nf-seg" style="--i:${i}"></div>`).join('') +
      '<div class="nf-ind"></div>'
    bar.style.setProperty('--nf-idx', String(idx))
  }

  function paintBar() {
    bar.style.setProperty('--nf-idx', String(idx))
  }

  function render() {
    const n = feed[idx]
    title.textContent = n.title
    date.textContent  = n.date
    sub.textContent   = n.sub
  }

  function next() {
    if (busy) return
    busy = true

    // Bounce the card shell on arrow click (FAB-style overshoot)
    el.classList.remove('tap')
    void el.offsetWidth
    el.classList.add('tap')

    const swapEls = [title, date]
    swapEls.forEach((n) => {
      n.style.setProperty('--swap-dir', `${dir}px`)
      n.classList.remove('nf-swap-in')
      n.classList.add('nf-swap-out')
    })
    later(() => {
      idx = (idx + 1) % feed.length
      render()
      paintBar()
      swapEls.forEach((n) => {
        n.classList.remove('nf-swap-out')
        // force reflow so the browser registers the class removal before re-adding swap-in
        void n.offsetWidth
        n.classList.add('nf-swap-in')
      })
      later(() => { busy = false }, 400)
    }, 260)
  }

  function load() {
    el.classList.remove('is-loading', 'is-empty')
    idx = 0
    render()
    buildBar()
    el.classList.remove('anim-in')
    void el.offsetWidth
    el.classList.add('anim-in')
    later(() => { el.classList.remove('anim-in') }, 1900)
  }

  function skeleton() {
    el.classList.remove('is-empty')
    el.classList.add('is-loading')
    later(() => { load() }, 1700)
  }

  function empty() {
    el.classList.remove('is-loading')
    el.classList.add('is-empty')
  }

  function onArrowClick(e: Event) {
    e.stopPropagation()
    next()
  }

  function onCardClick() {
    el.classList.remove('tap')
    void el.offsetWidth
    el.classList.add('tap')
  }

  arrow.addEventListener('click', onArrowClick)
  el.addEventListener('click', onCardClick)

  const api: CardApi = { load, skeleton, empty }
  el.__nfApi = api
  el.__nfTimers = timers

  // Auto-load on mount
  load()

  // Cleanup: remove listeners and pending timers
  return function cleanup() {
    arrow.removeEventListener('click', onArrowClick)
    el.removeEventListener('click', onCardClick)
    timers.forEach(clearTimeout)
    timers.length = 0
    delete el.__nfApi
    delete el.__nfTimers
  }
}

// ---------------------------------------------------------------------------
// Shared replay/skeleton/empty across all mounted cards (demo controls)
// ---------------------------------------------------------------------------

export function getCardApi(el: HTMLElement): CardApi | undefined {
  return (el as CardElement).__nfApi
}
