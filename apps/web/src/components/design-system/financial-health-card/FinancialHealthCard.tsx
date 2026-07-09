import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './FinancialHealthCard.css'

import { useRef, useState, useCallback } from 'react'
import { useAutoHeight } from '@/lib/hooks'
import {
  ZONES,
  type FhcRefs,
  fhcCardMountRef,
  fhcCardCleanupRef,
  paintActive,
  tweenScore,
  retriggerClass,
} from './financial-health-card-hook'

// ── Static content (verbatim from prototype) ─────────────────────────────────

const INITIAL_SCORE = 90
const INITIAL_MAX   = 100
const INITIAL_WHY   = 'Savings exceed goals and spending is intentional. Budgets are automated and optimized.'
const INITIAL_REC   = 'Stay consistent with your budget, spending and saving habits.'

// ── Component ─────────────────────────────────────────────────────────────────

export default function FinancialHealthCard() {
  const [score, setScore]     = useState(INITIAL_SCORE)
  const [isOpen, setIsOpen]   = useState(false)

  // Stable refs to DOM nodes — assembled into FhcRefs for hook helpers
  const cardRef   = useRef<HTMLDivElement | null>(null)
  const numRef    = useRef<HTMLDivElement | null>(null)
  const pinRef    = useRef<HTMLDivElement | null>(null)
  const pinNumRef = useRef<HTMLDivElement | null>(null)
  const zonesRef  = useRef<HTMLDivElement | null>(null)
  const tabRef    = useRef<HTMLButtonElement | null>(null)

  const scoreRef = useRef(INITIAL_SCORE)   // tracks current score for tween origin

  // measured-height spam-proof expand/collapse for the why/recommendation panel
  const { ref: infoBodyRef } = useAutoHeight<HTMLDivElement>({
    open: isOpen,
    duration: 500,
    easing: 'cubic-bezier(.34,1.56,.64,1)',
  })

  function getRefs(): FhcRefs {
    return {
      card:   cardRef.current,
      num:    numRef.current,
      pin:    pinRef.current,
      pinNum: pinNumRef.current,
      zones:  zonesRef.current,
    }
  }

  // ── callback ref for card mount → runs load animation ──────────────────────
  // React assigns refs bottom-up: child refs (num/pin/pinNum/zones) are set
  // before this parent callback fires, so all children are resolved non-null.
  // No queueMicrotask needed — call synchronously.
  const cardCallbackRef = useCallback((el: HTMLDivElement | null) => {
    cardRef.current = el
    if (el) {
      fhcCardMountRef(el, getRefs(), INITIAL_SCORE, INITIAL_MAX)
    } else {
      fhcCardCleanupRef(el)
    }
  // getRefs is stable (closes over stable refs)
   
  }, [])

  // ── replay button: re-run load animation ───────────────────────────────────
  function handleReplay() {
    if (!cardRef.current) return
    fhcCardMountRef(cardRef.current, getRefs(), scoreRef.current, INITIAL_MAX)
  }

  // ── score change button ────────────────────────────────────────────────────
  function handleSetScore(next: number) {
    next = Math.max(0, Math.min(INITIAL_MAX, next))
    const from = scoreRef.current
    scoreRef.current = next
    setScore(next)

    const refs = getRefs()
    paintActive(refs, next, INITIAL_MAX)

    // pulse pin
    if (refs.pin) {
      retriggerClass(refs.pin, 'pulse')
    }

    // tween number + elastic on completion
    if (refs.num) {
      tweenScore(refs.num, from, next, 640, () => {
        if (refs.num) {
          refs.num.textContent = String(next)
          retriggerClass(refs.num, 'elastic')
        }
      })
    }
  }

  // ── card click: toggle open + micro-pop ───────────────────────────────────
  // Double rAF defers retriggerClass until after React commits the new
  // className (fhc / fhc open), so the added 'pop' class is not overwritten.
  function handleCardClick() {
    setIsOpen(prev => !prev)
    const card = cardRef.current
    const pin  = pinRef.current
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (card) retriggerClass(card, 'pop')
        if (pin)  retriggerClass(pin, 'pulse')
      })
    })
  }

  return (
    <div className="fhc-frame">

      <div className="shell fhc-shell" style={{ borderRadius: 42 }}>
        <div
          ref={cardCallbackRef}
          className={`fhc${isOpen ? ' open' : ''}`}
          onClick={handleCardClick}
        >

          {/* Header */}
          <div className="fhc-eyebrow">
            <span className="material-symbols-outlined">monitor_heart</span>
            Financial Health
          </div>

          {/* Score */}
          <div className="fhc-score">
            <div ref={numRef} className="fhc-num">{score}</div>
            <div className="fhc-outof"><span>/ {INITIAL_MAX}</span></div>
          </div>

          {/* Health bar + pin */}
          <div className="fhc-bar-wrap">
            <div ref={pinRef} className="fhc-pin">
              <div ref={pinNumRef} className="fhc-pin-badge">{score}</div>
            </div>
            <div className="fhc-bar" />
            <div ref={zonesRef} className="fhc-zones">
              {ZONES.map((z, i) => (
                <span key={z.name} className={activeZoneIndexFromScore(score) === i ? 'on' : ''}>
                  {z.name}
                </span>
              ))}
            </div>
          </div>

          {/* Why & recommendation collapsible */}
          <div className="fhc-info">
            <button
              ref={tabRef}
              type="button"
              className="fhc-info-tab"
              aria-expanded={isOpen}
              onClick={e => { e.stopPropagation(); setIsOpen(prev => !prev); if (tabRef.current) retriggerClass(tabRef.current, 'tab-bounce') }}
            >
              <span className="fhc-info-tab-l">
                <span className="material-symbols-outlined">tips_and_updates</span>
                Why &amp; recommendation
              </span>
              <span className="material-symbols-outlined fhc-info-chev">expand_more</span>
            </button>

            <div ref={infoBodyRef} className="fhc-info-body">
              <div className="fhc-info-inner">
                <div className="fhc-sec" style={{ '--s': 0 } as React.CSSProperties}>
                  <div className="fhc-sec-h">
                    <span className="material-symbols-outlined">help_outline</span>
                    Why?
                  </div>
                  <div className="fhc-sec-p">{INITIAL_WHY}</div>
                </div>
                <div className="fhc-info-divider" />
                <div className="fhc-sec" style={{ '--s': 1 } as React.CSSProperties}>
                  <div className="fhc-sec-h">
                    <span className="material-symbols-outlined">check_circle</span>
                    Recommendation:
                  </div>
                  <div className="fhc-sec-p">{INITIAL_REC}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Demo controls (chrome — outside the component shell) */}
      <div className="fhc-controls">
        <button type="button" className="fhc-btn" onClick={handleReplay}>
          <span className="material-icons">replay</span>Replay load
        </button>
        <button type="button" className="fhc-btn" onClick={() => handleSetScore(34)}>
          <span className="material-icons">south</span>Score 34
        </button>
        <button type="button" className="fhc-btn" onClick={() => handleSetScore(62)}>
          <span className="material-icons">remove</span>Score 62
        </button>
        <button type="button" className="fhc-btn" onClick={() => handleSetScore(90)}>
          <span className="material-icons">north</span>Score 90
        </button>
      </div>

    </div>
  )
}

// small inline helper (read-only, no DOM access)
function activeZoneIndexFromScore(score: number): number {
  for (let i = 0; i < ZONES.length; i++) if (score <= ZONES[i].max) return i
  return ZONES.length - 1
}
