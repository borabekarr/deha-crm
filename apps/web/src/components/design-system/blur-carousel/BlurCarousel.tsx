import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './BlurCarousel.css'

// ---------------------------------------------------------------------------
// Blur Carousel — Deha Design System
// Horizontal, snapping cover-flow carousel: the centered card is fully sharp
// (scale 1, opacity 1, no blur); cards to either side scale down, fade, and
// pick up a soft blur in proportion to how far off-center they are. One
// passive scroll listener (rAF-throttled) writes per-card transform/opacity/
// filter/z-index directly via refs each frame — no per-frame React
// re-render, matching the raw source's own imperative scroll handler.
//
// Faithful port of
// apps/web/design-system/claude-design/raw/blur-carousel/blur-carousel.html —
// byte-preserved DOM/CSS/timings/behavior per CONVERSION-SOP.md (the
// .stage/.lede/.carousel/.rail/.card/.below/.dots/.nav-row/.nav-arrow/
// .caption rule set and card data only; the raw file's bottom `.controls`
// tweaks panel — blur/scale/fade sliders, theme segmented control, accent
// color picker — is ambient dev tooling for the authoring environment, not
// part of the component, same precedent as the tweaks-panel.jsx shim
// documented in tests/pixel-parity.spec.ts). Motion tokenization happened
// inline on this pass (not deferred) because the repo's motion-token-gate
// PostToolUse hook blocks new hard-coded transition timings/easings on
// write; every substitution is value-identical to the raw literal it
// replaces (see inline comments per rule in BlurCarousel.css).
//
// The raw source directory also ships a BlurCarousel.jsx sibling — a
// generic renderItem-driven engine with no baked-in card visual (no face/
// veil/badge/glyph/grad markup at all), so it is not pixel-comparable to
// the HTML demo the gate diffs against (CONVERSION-SOP's canonical source
// path is <slug>.html, not a sibling .jsx). Its scroll-driven cover-flow
// math (clamp/smooth/foc/scale/opacity/blur formulas) is byte-identical to
// the .html's own inline script, so it was read for confirmation only; the
// implementation below follows the .html's formulas and markup directly.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'

interface CardDatum {
  cat: string
  ic: string
  title: string
  desc: string
  val: string
  delta: string
  grad: string
}

// byte-preserved card data (cat/ic/title/desc/val/delta/grad) from the raw
// source's `cards` array.
const CARDS: CardDatum[] = [
  { cat: 'Revenue', ic: 'payments', title: 'Revenue\nOverview', desc: 'Live ARR, expansion & churn in one pane.', val: '$2.41M', delta: '+12.5%', grad: 'linear-gradient(150deg,#10B981,#0E7C63)' },
  { cat: 'Pipeline', ic: 'filter_alt', title: 'Deal\nPipeline', desc: '8 active deals worth $2.4M in play.', val: '$2.40M', delta: '+6.2%', grad: 'linear-gradient(150deg,#6366F1,#3F3FA8)' },
  { cat: 'Customers', ic: 'groups', title: 'Customer\nHealth', desc: '142 accounts scored by usage & risk.', val: '94 NPS', delta: '+8 pts', grad: 'linear-gradient(150deg,#0EA5E9,#0668A8)' },
  { cat: 'Forecast', ic: 'insights', title: 'Quarterly\nForecast', desc: 'Weighted projection to end of Q3.', val: '$3.1M', delta: '+14%', grad: 'linear-gradient(150deg,#8B5CF6,#5B36B0)' },
  { cat: 'Activity', ic: 'bolt', title: 'Team\nActivity', desc: 'Calls, emails & meetings this week.', val: '1,284', delta: '+22%', grad: 'linear-gradient(150deg,#F97316,#B5470C)' },
  { cat: 'Targets', ic: 'flag', title: 'Quota\nAttainment', desc: 'Reps pacing against quarterly goals.', val: '87%', delta: '+5%', grad: 'linear-gradient(150deg,#EC4899,#A82166)' },
]

// byte-identical to raw's clamp/smooth helpers.
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)
const smooth = (t: number) => t * t * (3 - 2 * t)

// raw's --item-w / gap CSS custom props (see BlurCarousel.css .rail),
// mirrored here as constants so the scroll-math step matches without
// re-reading computed styles every frame — same numeric result raw's
// `els[0].offsetWidth + parseFloat(getComputedStyle(rail).gap || 26)` produces.
const ITEM_W = 262
const GAP = 26
const SIDE_SCALE = 0.82
const SIDE_OPACITY = 0.46
const MAX_BLUR = 9

export function BlurCarousel() {
  const railRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([])
  const ticking = useRef(false)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const [caption, setCaption] = useState(`${CARDS[0].cat} · 1 of ${CARDS.length}`)

  const update = useCallback(() => {
    ticking.current = false
    const rail = railRef.current
    if (!rail) return

    const railRect = rail.getBoundingClientRect()
    const center = railRect.left + railRect.width / 2
    const step = ITEM_W + GAP

    let nearest = 0
    let nearestDist = Infinity

    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const r = card.getBoundingClientRect()
      const cardCenter = r.left + r.width / 2
      const raw = Math.abs(cardCenter - center) / step
      const t = clamp(raw, 0, 1)
      const foc = 1 - smooth(t)

      const scale = SIDE_SCALE + (1 - SIDE_SCALE) * foc
      const opacity = SIDE_OPACITY + (1 - SIDE_OPACITY) * foc
      const blur = MAX_BLUR * (1 - foc)

      card.style.cssText += `;transform:scale(${scale.toFixed(4)});opacity:${opacity.toFixed(4)};--foc:${foc.toFixed(4)};--blur:${blur.toFixed(3)};z-index:${Math.round(foc * 100)}`

      if (raw < nearestDist) {
        nearestDist = raw
        nearest = i
      }
    })

    if (nearest !== activeRef.current) {
      activeRef.current = nearest
      setActive(nearest)
      setCaption(`${CARDS[nearest].cat} · ${nearest + 1} of ${CARDS.length}`)
    }
  }, [])

  // Completion signal for scrollToIndex's native scrollTo({behavior:'smooth'}),
  // which has no fixed duration: `data-scrolling` on the rail flips 'false'
  // when the browser's own `scrollend` event fires, with a 120ms
  // scroll-idle debounce as the fallback for engines without scrollend
  // support (reset on every scroll frame; see the mount effect below).
  //
  // Both completion paths race the rAF-throttled `update()` scheduled by the
  // final 'scroll' event: `update` runs on the next animation frame, while
  // 'scrollend' (a microtask-adjacent DOM event) and the setTimeout debounce
  // are macrotask-scheduled — under load either can fire and flip the flag
  // to 'false' one tick before that last rAF actually runs, so a caller
  // polling the flag can observe it go false while the card's transform
  // still reflects the second-to-last frame (a few percent off the true
  // resting scale, e.g. scale(0.97) instead of scale(1)). Force a
  // synchronous `update()` right before flipping the flag on both paths so
  // the transform is guaranteed current at the moment 'false' becomes
  // observable, regardless of which path won the race.
  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const markScrolling = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    rail.dataset.scrolling = 'true'
    if (scrollIdleTimer.current) clearTimeout(scrollIdleTimer.current)
    scrollIdleTimer.current = setTimeout(() => {
      update()
      rail.dataset.scrolling = 'false'
    }, 120)
  }, [update])

  const onScroll = useCallback(() => {
    markScrolling()
    if (!ticking.current) {
      ticking.current = true
      requestAnimationFrame(update)
    }
  }, [update, markScrolling])

  const scrollToIndex = useCallback((i: number) => {
    const rail = railRef.current
    const card = cardRefs.current[i]
    if (!rail || !card) return
    rail.scrollTo({ left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' })
  }, [])

  // ---- mount: initial pass + centre the first card, byte-identical to
  // raw's `update(); syncArrows(); requestAnimationFrame(() =>
  // {scrollToIndex(0); requestAnimationFrame(update)})` sequence. ----
  useEffect(() => {
    const rail = railRef.current
    update()
    const onResize = () => update()
    window.addEventListener('resize', onResize)
    const onScrollEnd = () => {
      if (!rail) return
      update()
      rail.dataset.scrolling = 'false'
    }
    rail?.addEventListener('scrollend', onScrollEnd)
    const raf1 = requestAnimationFrame(() => {
      scrollToIndex(0)
      requestAnimationFrame(update)
    })
    return () => {
      window.removeEventListener('resize', onResize)
      rail?.removeEventListener('scrollend', onScrollEnd)
      cancelAnimationFrame(raf1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- drag-to-scroll (desktop affordance), byte-identical to raw ----
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    let down = false
    let startX = 0
    let startScroll = 0
    let moved = false

    const onPointerDown = (e: PointerEvent) => {
      down = true
      moved = false
      startX = e.clientX
      startScroll = rail.scrollLeft
      rail.style.scrollSnapType = 'none'
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 3) moved = true
      rail.scrollLeft = startScroll - dx
    }
    const onPointerUp = () => {
      if (!down) return
      down = false
      rail.style.scrollSnapType = 'x mandatory'
      if (moved) scrollToIndex(activeRef.current)
    }

    rail.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      rail.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [scrollToIndex])

  const prev = () => scrollToIndex(clamp(active - 1, 0, CARDS.length - 1))
  const next = () => scrollToIndex(clamp(active + 1, 0, CARDS.length - 1))

  return (
    <>
      <div className="carousel" id="carousel">
        <div className="rail" id="rail" ref={railRef} onScroll={onScroll} data-scrolling="false">
          {CARDS.map((c, i) => (
            <button
              type="button"
              key={c.cat}
              className="card"
              data-index={i}
              ref={(el) => { cardRefs.current[i] = el }}
              style={{ '--grad': c.grad } as CSSProperties}
              aria-current={i === active}
              aria-label={c.title.replace(/\n/g, ' ')}
              onClick={() => scrollToIndex(i)}
            >
              <div className="face" />
              <div className="veil" />
              <div className="inner">
                <span className="badge">
                  <span className="material-icons">workspaces</span>
                  {c.cat}
                </span>
                <div className="glyph">
                  <span className="material-icons">{c.ic}</span>
                </div>
                <h3>
                  {c.title.split('\n').map((line, li) => (
                    <span key={line || `blank-${li}`}>
                      {li > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </h3>
                <div className="desc">{c.desc}</div>
                <div className="foot">
                  <span className="val">{c.val}</span>
                  <span className="delta">
                    <span className="material-icons">trending_up</span>
                    {c.delta}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="below">
        <div className="nav-row">
          <button
            type="button"
            className={`nav-arrow${active === CARDS.length - 1 ? ' is-cta' : ''}`}
            id="prevBtn"
            aria-label="Previous card"
            disabled={active <= 0}
            onClick={prev}
          >
            <span className="nav-arrow-inner">
              <span className="material-icons">chevron_left</span>
            </span>
          </button>
          <div className="dots" id="dots">
            {CARDS.map((_, i) => (
              <button
                key={CARDS[i].title}
                type="button"
                className={`dot${i === active ? ' on' : ''}`}
                style={{ border: 'none', padding: 0, font: 'inherit' }}
                aria-label={`Go to card ${i + 1}`}
                aria-current={i === active}
                onClick={() => scrollToIndex(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    scrollToIndex(i)
                  }
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className={`nav-arrow${active < CARDS.length - 1 ? ' is-cta' : ''}`}
            id="nextBtn"
            aria-label="Next card"
            disabled={active >= CARDS.length - 1}
            onClick={next}
          >
            <span className="nav-arrow-inner">
              <span className="material-icons">chevron_right</span>
            </span>
          </button>
        </div>
        <div className="caption" id="caption">{caption}</div>
      </div>
    </>
  )
}

// ── default demo shell ──────────────────────────────────────────────────
// Mirrors the raw source's #stage at its canonical default state: dark
// theme (the `.stage.light` toggle lives on the excluded `.controls` tweaks
// panel and is not wired here) with the default blur/scale/fade tuning
// (9px / 0.82 / 0.46 — the raw CSS custom-property defaults on `.carousel`,
// also this component's hardcoded scroll-math constants above).
//
// Root chrome (plan: ui-residuals-p1 step 5, F6): the `.shell` grey-bezel
// class (background/radius/padding/box-shadow, see _base.css) is dropped
// from the root div — it read as a boxed demo card. `.bc-shell` alone sizes
// to the parent container (width 100%, intrinsic height) so this reads as a
// native embedded section wherever a CRM page hosts it.

export default function BlurCarouselDemo() {
  return (
    <div className="bc-shell">
      <div className="stage" id="stage">
        <div className="lede">
          <div className="eyebrow">Featured</div>
          <h1>Your workspaces</h1>
        </div>
        <BlurCarousel />
      </div>
    </div>
  )
}
