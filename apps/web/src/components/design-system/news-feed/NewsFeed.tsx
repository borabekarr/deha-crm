import '../../../../design-system/preview/_base.css'
import './NewsFeed.css'

import { useCallback, useRef } from 'react'
import { mountCard, getCardApi } from './news-feed-hook'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CleanupFn = (() => void) | void

// ---------------------------------------------------------------------------
// Single news card — wired via callback ref
// ---------------------------------------------------------------------------

interface NfCardProps {
  tone: 'bull' | 'bear'
  kicker: string
  sub: string
  defaultTitle: string
  defaultDate: string
  emptyLabel: string
  icon: string
  'data-comment-anchor'?: string
}

function NfCard({
  tone,
  kicker,
  sub,
  defaultTitle,
  defaultDate,
  emptyLabel,
  icon,
  'data-comment-anchor': anchor,
}: NfCardProps) {
  const cleanupRef = useRef<CleanupFn>(undefined)

  const cardRef = useCallback((el: HTMLElement | null) => {
    // Teardown previous mount
    if (typeof cleanupRef.current === 'function') {
      cleanupRef.current()
      cleanupRef.current = undefined
    }
    if (!el) return
    cleanupRef.current = mountCard(el)
  }, [])

  return (
    <div className="shell nf-shell">
      <article
        ref={cardRef}
        className={`nf-card nf--${tone}`}
        data-tone={tone}
        data-screen-label={`News card (${tone === 'bull' ? 'bullish' : 'bearish'})`}
        data-comment-anchor={anchor}
      >
        <div className="nf-glow" />
        <div className="nf-grid" />
        <div className="nf-real" style={{ display: 'contents' }}>
          <header className="nf-head">
            <span className="nf-head-ic">
              <span className="material-icons">{icon}</span>
            </span>
            <div className="nf-head-txt">
              <div className="nf-kicker">{kicker}</div>
              <div className="nf-sub">{sub}</div>
            </div>
            <button type="button" className="nf-arrow" aria-label="Next story">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </button>
          </header>
          <div className="nf-title-wrap">
            <h2 className="nf-title">{defaultTitle}</h2>
          </div>
          <div className="nf-date">{defaultDate}</div>
          <div className="nf-bar" />
        </div>
        <div className="nf-skeleton">
          <div className="sk" style={{ width: '46%', height: '14px' }} />
          <div className="sk" style={{ width: '62%', height: '11px', marginTop: '9px' }} />
          <div className="sk" style={{ width: '90%', height: '24px', marginTop: '42px' }} />
          <div className="sk" style={{ width: '82%', height: '24px', marginTop: '12px' }} />
          <div className="sk" style={{ width: '55%', height: '24px', marginTop: '12px' }} />
          <div className="sk" style={{ width: '40%', height: '13px', marginTop: 'auto' }} />
        </div>
        <div className="nf-empty">
          <span className="material-icons">inbox</span>
          <div className="nf-empty-t">No stories yet</div>
          <div className="nf-empty-s">{emptyLabel}</div>
        </div>
      </article>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Demo controls — replay / skeleton / empty across both cards
// ---------------------------------------------------------------------------

function NfControls({ rowRef }: { rowRef: React.RefObject<HTMLDivElement | null> }) {
  function callAll(method: 'load' | 'skeleton' | 'empty') {
    if (!rowRef.current) return
    rowRef.current.querySelectorAll<HTMLElement>('.nf-card').forEach((el) => {
      const api = getCardApi(el)
      if (api) api[method]()
    })
  }

  return (
    <div className="nf-controls">
      <button type="button" className="nf-btn" onClick={() => { callAll('load') }}>
        <span className="material-icons">replay</span>Replay load
      </button>
      <button type="button" className="nf-btn" onClick={() => { callAll('skeleton') }}>
        <span className="material-icons">hourglass_empty</span>Loading state
      </button>
      <button type="button" className="nf-btn" onClick={() => { callAll('empty') }}>
        <span className="material-icons">inbox</span>Empty state
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export default function NewsFeed() {
  const rowRef = useRef<HTMLDivElement>(null)

  return (
    <div className="card nf-page">
      <div className="frame" data-comment-anchor="decae93298-div">
        <div className="nf-row" id="row" ref={rowRef}>
          <NfCard
            tone="bull"
            kicker="Today's News"
            sub="The market is bullish today"
            defaultTitle="Hong Kong Expands Cryptocurrency Market with New Exchange Approvals."
            defaultDate="December 5, 2024"
            emptyLabel="Bullish headlines will appear here."
            icon="trending_up"
            data-comment-anchor="nf-bull"
          />
          <NfCard
            tone="bear"
            kicker="Today's News"
            sub="The market is bearish today"
            defaultTitle="Solana Price Faces Potential Dip Below $200 After Federal Reserve Cut."
            defaultDate="December 19, 2024"
            emptyLabel="Bearish headlines will appear here."
            icon="trending_down"
            data-comment-anchor="nf-bear"
          />
        </div>
        <NfControls rowRef={rowRef} />
      </div>
    </div>
  )
}
