// Render-only split of BuyerBrain's `.bbq-detail` panel (react-doctor
// no-giant-component). Class names, DOM order and markup are unchanged from
// the parent; all state, timers and refs stay in BuyerBrain and arrive here
// as props.
import type { BlurbPhase, Region } from './BuyerBrain'
import { CARD_ORIGIN } from './buyer-brain-shared'

interface BuyerBrainDetailCardProps {
  cardRegion: Region | null
  cardLight: boolean
  selectedId: string | null
  phase: BlurbPhase
  typed: string
  reducedMotion: boolean
  onBack: () => void
}

export function BuyerBrainDetailCard({
  cardRegion,
  cardLight,
  selectedId,
  phase,
  typed,
  reducedMotion,
  onBack,
}: BuyerBrainDetailCardProps) {
  return (
    <div className="bbq-detail" id="detail">
      {cardRegion && (
        <div
          className={
            'bbq-detail-card' + (cardLight ? ' lighttext' : '') + (!selectedId ? ' closing' : '')
          }
          style={{
            ['--acc' as string]: cardRegion.acc,
            transformOrigin: CARD_ORIGIN[cardRegion.side],
          }}
        >
          <button type="button" className="bbq-back" aria-label="Back to brain" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="bbq-band">
            <div className="bbq-band-ic">
              <span className="material-symbols-outlined">{cardRegion.icon}</span>
            </div>
            <div className="bbq-band-tx">
              <div className="kicker">AI Profiling</div>
              <div className="ttl">{cardRegion.title}</div>
            </div>
          </div>
          <div className="bbq-detail-body">
            <div className="bbq-blurb" id="blurb">
              {phase === 'think' && (
                <span className="bbq-think">
                  <span />
                  <span />
                  <span />
                </span>
              )}
              {phase === 'typing' && (
                <>
                  <span id="bt">{typed}</span>
                  <span className="bbq-caret" />
                </>
              )}
              {phase === 'done' && cardRegion.blurb}
            </div>
            <div
              className="bbq-chips"
              id="chips"
              style={{ visibility: phase === 'done' ? 'visible' : 'hidden' }}
            >
              {phase === 'done' &&
                cardRegion.chips.map((c, i) => (
                  <span
                    key={c}
                    className="bbq-chip"
                    style={{ animationDelay: (reducedMotion ? 0 : i * 45) + 'ms' }}
                  >
                    {c}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
