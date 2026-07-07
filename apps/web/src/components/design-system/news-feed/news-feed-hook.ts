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

  const titleEl  = el.querySelector<HTMLElement>('.nf-title')
  const dateEl   = el.querySelector<HTMLElement>('.nf-date')
  const subEl    = el.querySelector<HTMLElement>('.nf-sub')
  const barEl    = el.querySelector<HTMLElement>('.nf-bar')
  const arrowNext = el.querySelector<HTMLElement>('.nf-arrow-next')
  const arrowPrev = el.querySelector<HTMLElement>('.nf-arrow-prev')
  const shellEl   = el.closest<HTMLElement>('.nf-shell')

  // subEl and arrowPrev are optional — graceful no-op if absent.
  if (!titleEl || !dateEl || !barEl || !arrowNext) return

  const timers: ReturnType<typeof setTimeout>[] = []

  function later(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms)
    timers.push(t)
    return t
  }

  // All nullable refs are guarded above — cast to non-null for internal helpers
  const title = titleEl as HTMLElement
  const date  = dateEl  as HTMLElement
  const sub   = subEl   as HTMLElement | null
  const bar   = barEl   as HTMLElement

  function buildBar() {
    bar.innerHTML =
      feed.map((_, i) => `<div class="nf-seg" style="--i:${i}"></div>`).join('') +
      '<div class="nf-ind"></div>' +
      '<div class="nf-ind nf-ind-ghost" aria-hidden="true"></div>'
    bar.style.setProperty('--nf-idx', String(idx))
    bar.style.setProperty('--nf-ghost-idx', String(idx))
  }

  function paintBar(prevIdx: number) {
    const lastIdx = feed.length - 1
    const isWrap        = prevIdx === lastIdx && idx === 0
    // Edge reversal: clicking PREV at first item wraps to last — mirror the animation direction
    const isReverseWrap = prevIdx === 0 && idx === lastIdx

    if (isWrap) {
      const primary = bar.querySelector<HTMLElement>('.nf-ind:not(.nf-ind-ghost)')
      const ghost   = bar.querySelector<HTMLElement>('.nf-ind-ghost')
      if (!primary || !ghost) {
        bar.style.setProperty('--nf-idx', String(idx))
        return
      }

      // Phase 1: primary exits to the right (one segment-step beyond last)
      primary.classList.add('nf-ind--exit-right')

      // Phase 2: ghost snaps to idx 0 (no transition) then enters from left
      // Set ghost position to idx 0 without transition via nf-ind--no-transition,
      // then on the next frame add the enter animation class
      ghost.classList.add('nf-ind--no-transition')
      bar.style.setProperty('--nf-ghost-idx', '0')
      // Force reflow so the snap takes effect before adding the animation
      void ghost.offsetWidth
      ghost.classList.remove('nf-ind--no-transition')
      ghost.classList.add('nf-ind--enter-left')

      // After animation completes: reset primary to idx 0, remove animation classes
      const dur = 300 * (parseFloat(
        getComputedStyle(bar).getPropertyValue('--anim-mult') || '1'
      ) || 1)
      later(() => {
        primary.classList.remove('nf-ind--exit-right')
        ghost.classList.remove('nf-ind--enter-left')
        bar.style.setProperty('--nf-idx', '0')
        bar.style.setProperty('--nf-ghost-idx', '0')
      }, dur + 20)
    } else if (isReverseWrap) {
      const primary = bar.querySelector<HTMLElement>('.nf-ind:not(.nf-ind-ghost)')
      const ghost   = bar.querySelector<HTMLElement>('.nf-ind-ghost')
      if (!primary || !ghost) {
        bar.style.setProperty('--nf-idx', String(idx))
        return
      }

      // Phase 1: primary at position 0 exits to the LEFT (reversed direction)
      primary.classList.add('nf-ind--exit-left')

      // Phase 2: ghost snaps to lastIdx (no transition) then enters from the RIGHT
      ghost.classList.add('nf-ind--no-transition')
      bar.style.setProperty('--nf-ghost-idx', String(lastIdx))
      void ghost.offsetWidth
      ghost.classList.remove('nf-ind--no-transition')
      ghost.classList.add('nf-ind--enter-right')

      // After animation completes: reset primary to lastIdx, remove animation classes
      const dur = 300 * (parseFloat(
        getComputedStyle(bar).getPropertyValue('--anim-mult') || '1'
      ) || 1)
      later(() => {
        primary.classList.remove('nf-ind--exit-left')
        ghost.classList.remove('nf-ind--enter-right')
        bar.style.setProperty('--nf-idx', String(lastIdx))
        bar.style.setProperty('--nf-ghost-idx', String(lastIdx))
      }, dur + 20)
    } else {
      bar.style.setProperty('--nf-idx', String(idx))
    }
  }

  function render() {
    const n = feed[idx]
    title.textContent = n.title
    date.textContent  = n.date
    if (sub) sub.textContent = n.sub
  }

  // navDir: +1 = NEXT (positive translateX, left->right motion)
  //         -1 = PREV (negative translateX, right->left motion)
  function doSwap(navDir: 1 | -1) {
    if (busy) return
    busy = true

    // Advance index and update bar synchronously — indicator starts sliding instantly
    const prevIdx = idx
    idx = (idx + navDir + feed.length) % feed.length
    paintBar(prevIdx)

    const swapDir = navDir * 38
    const swapEls = [title, date]
    swapEls.forEach((n) => {
      n.style.setProperty('--swap-dir', `${swapDir}px`)
      n.classList.remove('nf-swap-in')
      n.classList.add('nf-swap-out')
    })
    later(() => {
      render()
      swapEls.forEach((n) => {
        n.classList.remove('nf-swap-out')
        // force reflow so the browser registers the class removal before re-adding swap-in
        void n.offsetWidth
        n.classList.add('nf-swap-in')
      })
      later(() => { busy = false }, 260)
    }, 180)
  }

  function next() { doSwap(1) }
  function prev() { doSwap(-1) }

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

  function onNextClick(e: Event) {
    e.stopPropagation()
    next()
  }

  function onPrevClick(e: Event) {
    e.stopPropagation()
    prev()
  }

  function onCardClick() {
    const shell = shellEl ?? el
    shell.classList.remove('tap')
    void shell.offsetWidth
    shell.classList.add('tap')
  }

  arrowNext.addEventListener('click', onNextClick)
  if (arrowPrev) arrowPrev.addEventListener('click', onPrevClick)
  el.addEventListener('click', onCardClick)

  const api: CardApi = { load, skeleton, empty }
  el.__nfApi = api
  el.__nfTimers = timers

  // Auto-load on mount
  load()

  // Cleanup: remove listeners and pending timers
  return function cleanup() {
    arrowNext.removeEventListener('click', onNextClick)
    if (arrowPrev) arrowPrev.removeEventListener('click', onPrevClick)
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
