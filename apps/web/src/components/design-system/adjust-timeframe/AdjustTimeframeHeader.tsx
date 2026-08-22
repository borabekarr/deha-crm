/**
 * AdjustTimeframeHeader.tsx
 *
 * Render-only: the range display + the segmented preset pill track with its
 * sliding glider. All state (bumpKey, activeId, gliderStyle) and the
 * applyPreset handler live in the parent's controller hook; this component
 * only takes props and renders identical markup/classnames.
 */
import { fmtDate } from './adjust-timeframe-shared'
import type { AdjustTimeframeController } from './use-adjust-timeframe-controller'

type Props = Pick<
  AdjustTimeframeController,
  'bumpKey' | 'startDate' | 'endDate' | 'endIsToday' | 'presetsCallbackRef' | 'activeId' | 'gliderStyle' | 'presets' | 'applyPreset'
>

export function AdjustTimeframeHeader({
  bumpKey, startDate, endDate, endIsToday, presetsCallbackRef, activeId, gliderStyle, presets, applyPreset,
}: Props) {
  return (
    <fieldset className="tf-head">
      {/* Item 2: plain Montserrat 900 header — no pill chrome */}
      <div className="tf-range-group">
        <span className="material-symbols-outlined tf-range-icon" aria-hidden="true">calendar_month</span>
        <div
          className={'tf-range' + (bumpKey ? ' bump' : '')}
          key={bumpKey}
          aria-live="polite"
        >
          <span className="tf-seg start">{fmtDate(startDate)}</span>
          <span className="tf-dash">–</span>
          <span className="tf-seg end">{endIsToday ? 'Today' : fmtDate(endDate)}</span>
        </div>
      </div>

      {/* Item 1: segmented pill track with sliding glider */}
      <fieldset
        className="tf-presets"
        aria-label="Quick ranges"
        ref={presetsCallbackRef}
      >
        <span
          className="tf-preset-glider"
          aria-hidden="true"
          data-on={activeId ? 'true' : 'false'}
          style={{ left: gliderStyle.left + 'px', width: gliderStyle.width + 'px' }}
        />
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            data-id={p.id}
            data-proximity
            className={`tf-preset${activeId === p.id ? ' active' : ''}`}
            aria-pressed={activeId === p.id ? 'true' : 'false'}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </fieldset>
    </fieldset>
  )
}
