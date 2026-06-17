import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DatePicker.css'

import { pickerRef, cleanupPicker } from './date-picker-hook'

export default function DatePicker() {
  return (
    <div className="card">
      <div className="shell zoom">
        <div
          className="dp-frame"
          ref={(el) => {
            pickerRef(el)
            return () => cleanupPicker(el)
          }}
        >

          {/* Trigger button */}
          <button type="button" className="dp-trigger btn-green" id="dp-open-btn">
            <span className="material-symbols-outlined">calendar_today</span>
            <span className="dp-trigger-label">12 June 2026</span>
          </button>

          {/* Picker panel — panel starts hidden; hook shows/hides via style */}
          <div className="dp-panel" id="dp-panel">

            {/* Header */}
            <div className="dp-head">
              <span className="dp-head-title">
                <span className="material-symbols-outlined">calendar_today</span>
                Select date
              </span>
              <button type="button" className="dp-head-close" id="dp-close-btn">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Wheels row */}
            <div className="dp-wheels">

              {/* Selection highlight band */}
              <div className="dp-band" />

              {/* Day column */}
              <div className="dp-wheel" data-unit="day">
                <div className="dp-wheel-label">Day</div>
                <div className="dp-wheel-scroll" id="dp-scroll-day" />
              </div>

              {/* Month column */}
              <div className="dp-wheel" data-unit="month">
                <div className="dp-wheel-label">Month</div>
                <div className="dp-wheel-scroll" id="dp-scroll-month" />
              </div>

              {/* Year column */}
              <div className="dp-wheel" data-unit="year">
                <div className="dp-wheel-label">Year</div>
                <div className="dp-wheel-scroll" id="dp-scroll-year" />
              </div>

            </div>{/* /.dp-wheels */}

            {/* Confirm button */}
            <button type="button" className="dp-confirm btn-green" id="dp-confirm-btn">
              <span className="material-symbols-outlined">event_available</span>
              Confirm date
            </button>

          </div>{/* /.dp-panel */}

        </div>{/* /.dp-frame */}
      </div>{/* /.shell.zoom */}
    </div>
  )
}
