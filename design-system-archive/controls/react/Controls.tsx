import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import '../../../../design-system/preview/_controls.css'
import './Controls.css'

import { segRef, cleanupSeg, swRef, cleanupSw, sliderRef, cleanupSlider } from './controls-hook'

export default function Controls() {
  return (
    <div className="card">
      {/* Toggle row */}
      <div className="row">
        <div className="title">
          Toggle
          <div className="meta">switch</div>
        </div>
        <div
          className="sw-base sw-off"
          ref={(el) => {
            if (el) swRef(el)
            else cleanupSw(el)
          }}
        />
        <div
          className="sw-base sw-on"
          ref={(el) => {
            if (el) swRef(el)
            else cleanupSw(el)
          }}
        />
      </div>

      {/* Segmented row */}
      <div className="row">
        <div className="title">
          Segmented
          <div className="meta">radio (1 of n)</div>
        </div>
        <div
          className="seg"
          ref={(el) => {
            if (el) segRef(el)
            else cleanupSeg(el)
          }}
        >
          <span className="seg-pill" />
          <button className="active">Leads</button>
          <button>Qualified</button>
        </div>
      </div>

      {/* Slider row */}
      <div className="row">
        <div className="title">
          Slider
          <div className="meta">range input</div>
        </div>
        <div
          className="slider"
          ref={(el) => {
            if (el) sliderRef(el)
            else cleanupSlider(el)
          }}
        >
          <div className="fill" />
          <div className="thumb" />
        </div>
      </div>
    </div>
  )
}
