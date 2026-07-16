import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DatetimeWheelPicker.css'

import { useCallback, useRef } from 'react'
import { useProximityGroup } from '@/lib/hooks'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import {
  datetimePickerRef,
  cleanupDatetimePicker,
  formatDate,
  formatTime,
} from './datetime-wheel-picker-hook'

// ---------------------------------------------------------------------------
// DatetimeWheelPicker — five-wheel iOS date + time picker.
// Wheel mechanics reuse date-picker's snap/settle/aligning-guard discipline;
// sheet chrome (scrim, handle, Cancel/title/Done header) reuses the
// shared sheet chrome timing pattern (local-var-flip + anim-mult;
// original component now in design-system-archive/).
// NO raw useEffect — behavior lives in datetime-wheel-picker-hook.ts.
// ---------------------------------------------------------------------------

// Stable at module load; the hook re-derives "now" on mount for the wheels.
const _now = new Date()
const _sel = {
  day: _now.getDate(), month: _now.getMonth(), year: _now.getFullYear(),
  hour: _now.getHours(), minute: _now.getMinutes(),
}
const _dateLabel = formatDate(_sel)
const _timeLabel = formatTime(_sel)

export default function DatetimeWheelPicker() {
  const elRef = useRef<HTMLDivElement | null>(null)
  // Single group over the whole shell — trigger/cancel/done/reset are its
  // only wired members. The dtw-item wheel values are NOT wired: they
  // translate during scroll, which would violate the stationary-anchor rule.
  const proxRef = useProximityGroup<HTMLDivElement>()
  const triggerSquircleRef = useSquircle<HTMLButtonElement>()
  const sheetSquircleRef = useSquircle<HTMLDialogElement>()

  const shellRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      elRef.current = el
      datetimePickerRef(el)
      proxRef(el)
    } else {
      cleanupDatetimePicker(elRef.current)
      elRef.current = null
    }
  }, [proxRef])

  return (
    <div className="dtw-shell" ref={shellRef}>

      {/* Trigger card — shows the applied date + time */}
      <button type="button" className="dtw-trigger" id="dtw-open-btn" ref={triggerSquircleRef} data-proximity aria-label="Open date and time picker">
        <span className="dtw-trigger-badge material-symbols-outlined" aria-hidden="true">check</span>
        <span className="dtw-trigger-label">Scheduled for</span>
        <span className="dtw-trigger-date">{_dateLabel}</span>
        <span className="dtw-trigger-time">{_timeLabel}</span>
      </button>

      {/* Scrim — blurred backdrop behind the sheet */}
      <div className="dtw-scrim" id="dtw-scrim" aria-hidden="true" />

      {/* Bottom sheet — native dialog element, kept in layout via `open` */}
      <dialog
        className="dtw-sheet"
        id="dtw-sheet"
        ref={sheetSquircleRef}
        open
        aria-label="Select date and time"
      >
        {/* Drag handle */}
        <div className="dtw-handle" aria-hidden="true" />

        {/* iOS header: Cancel · title/summary · Done (no duplicate close) */}
        <div className="dtw-head">
          <button type="button" className="dtw-cancel" id="dtw-cancel-btn" data-proximity>Cancel</button>
          <div className="dtw-head-mid">
            <div className="dtw-title">Date &amp; Time</div>
            <div className="dtw-summary" id="dtw-summary" aria-live="polite" />
          </div>
          <button type="button" className="dtw-done" id="dtw-done-btn" data-proximity>Done</button>
        </div>

        {/* Wheels: day · month · year — divider — hour : minute */}
        <div className="dtw-wheels">
          {/* Selection band — single emerald hairline band across the row */}
          <div className="dtw-band" aria-hidden="true" />

          <div className="dtw-wheel dtw-wheel--day" data-unit="day">
            <div className="dtw-wheel-scroll" id="dtw-scroll-day" aria-label="Day" />
          </div>
          <div className="dtw-wheel dtw-wheel--month" data-unit="month">
            <div className="dtw-wheel-scroll" id="dtw-scroll-month" aria-label="Month" />
          </div>
          <div className="dtw-wheel dtw-wheel--year" data-unit="year">
            <div className="dtw-wheel-scroll" id="dtw-scroll-year" aria-label="Year" />
          </div>

          <div className="dtw-group-divider" aria-hidden="true" />

          <div className="dtw-wheel dtw-wheel--hour" data-unit="hour">
            <div className="dtw-wheel-scroll" id="dtw-scroll-hour" aria-label="Hour" />
          </div>
          <div className="dtw-colon" aria-hidden="true">:</div>
          <div className="dtw-wheel dtw-wheel--minute" data-unit="minute">
            <div className="dtw-wheel-scroll" id="dtw-scroll-minute" aria-label="Minute" />
          </div>
        </div>

        {/* Reset-to-now pill */}
        <div className="dtw-reset-row">
          <button type="button" className="dtw-reset" id="dtw-reset-btn" data-proximity>
            <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
            Reset to now
          </button>
        </div>
      </dialog>
    </div>
  )
}
