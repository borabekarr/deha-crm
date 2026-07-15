import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DatePicker.css'

import { pickerRef, cleanupPicker, formatLabel } from './date-picker-hook'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '@/lib/hooks'

// Item 5: compute today's date at module load (stable across the component's lifetime)
const _today = new Date()
const _todayLabel = formatLabel(_today.getDate(), _today.getMonth(), _today.getFullYear())

export default function DatePicker() {
  // dp-outer/dp-panel is a natural concentric pair (28/20, gap 8) -- both
  // stay mounted at all times (visibility toggled via transform/opacity, not
  // width/height/border-radius), so squircle attaches unconditionally.
  const outerSquircleRef = useSquircle<HTMLDivElement>()
  const panelSquircleRef = useSquircle<HTMLDivElement>()
  // Single group over the whole shell — trigger/close/confirm are its only
  // wired members; the dp-item wheel values are NOT wired (they translate
  // during scroll, which would violate the stationary-anchor rule; there is
  // no separate day-grid in this component — see step report).
  const proxRef = useProximityGroup<HTMLDivElement>()
  return (
    <div
      className="dp-shell"
      ref={(el) => {
        pickerRef(el)
        proxRef(el)
        return () => cleanupPicker(el)
      }}
    >

          {/* Trigger button */}
          <button type="button" className="dp-trigger btn-green" id="dp-open-btn" data-proximity>
            <span className="material-symbols-outlined">calendar_today</span>
            <span className="dp-trigger-label">{_todayLabel}</span>
          </button>

          {/* Outer grey card wrapping the white picker panel */}
          <div className="dp-outer" ref={outerSquircleRef}>

          {/* Picker panel — panel starts hidden; hook shows/hides via style */}
          <div className="dp-panel" id="dp-panel" ref={panelSquircleRef}>

            {/* Header */}
            <div className="dp-head">
              <span className="dp-head-title">
                <span className="material-symbols-outlined">calendar_today</span>
                Select date
              </span>
              <button type="button" className="dp-head-close" id="dp-close-btn" data-proximity>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Wheels row */}
            <div className="dp-wheels">

              {/* Day column */}
              <div className="dp-wheel" data-unit="day">
                <div className="dp-wheel-label">Day</div>
                {/* Static center pill -- stays fixed; values scroll underneath */}
                <div className="dp-center-pill" aria-hidden="true" />
                <div className="dp-wheel-scroll" id="dp-scroll-day" />
                {/* Fix (2): clipped white-copy mask, clip-path'd to the pill rect;
                    date-picker-hook.ts clones content + mirrors scroll/scale */}
                <div className="dp-wheel-mask" id="dp-mask-day" aria-hidden="true">
                  <div className="dp-wheel-mask-inner" id="dp-mask-day-inner" />
                </div>
              </div>

              {/* Month column */}
              <div className="dp-wheel" data-unit="month">
                <div className="dp-wheel-label">Month</div>
                <div className="dp-center-pill" aria-hidden="true" />
                <div className="dp-wheel-scroll" id="dp-scroll-month" />
                <div className="dp-wheel-mask" id="dp-mask-month" aria-hidden="true">
                  <div className="dp-wheel-mask-inner" id="dp-mask-month-inner" />
                </div>
              </div>

              {/* Year column */}
              <div className="dp-wheel" data-unit="year">
                <div className="dp-wheel-label">Year</div>
                <div className="dp-center-pill" aria-hidden="true" />
                <div className="dp-wheel-scroll" id="dp-scroll-year" />
                <div className="dp-wheel-mask" id="dp-mask-year" aria-hidden="true">
                  <div className="dp-wheel-mask-inner" id="dp-mask-year-inner" />
                </div>
              </div>

            </div>{/* /.dp-wheels */}

            {/* Confirm button */}
            <button type="button" className="dp-confirm btn-green" id="dp-confirm-btn" data-proximity>
              <span className="material-symbols-outlined">event_available</span>
              Confirm date
            </button>

          </div>{/* /.dp-panel */}

          </div>{/* /.dp-outer */}

    </div>
  )
}
