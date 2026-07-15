import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import '../../../../design-system/preview/_controls.css'
import './Controls.css'

import { segRef, cleanupSeg, swRef, cleanupSw, sliderRef, cleanupSlider } from './controls-hook'
import { useProximityGroup } from '@/lib/hooks'

export default function Controls() {
  const toggleRowRef = useProximityGroup<HTMLDivElement>()
  const segRowRef = useProximityGroup<HTMLDivElement>()
  const sliderRowRef = useProximityGroup<HTMLDivElement>()

  return (
    <div className="card">
      {/* Toggle row */}
      <div className="row" ref={toggleRowRef}>
        <div className="title">
          Toggle
          <div className="meta">switch</div>
        </div>
        <div
          className="sw-base sw-off"
          data-proximity
          ref={(el) => {
            swRef(el)
            return () => cleanupSw(el)
          }}
        />
      </div>

      {/* Segmented row */}
      <div className="row" ref={segRowRef}>
        <div className="title">
          Segmented
          <div className="meta">radio (1 of n)</div>
        </div>
        <div
          className="seg"
          ref={(el) => {
            segRef(el)
            return () => cleanupSeg(el)
          }}
        >
          <span className="seg-pill" />
          <button type="button" className="active" data-proximity>Leads</button>
          <button type="button" data-proximity>Qualified</button>
        </div>
      </div>

      {/* Slider row */}
      <div className="row" ref={sliderRowRef}>
        <div className="title">
          Slider
          <div className="meta">range input</div>
        </div>
        <div
          className="slider"
          ref={(el) => {
            sliderRef(el)
            return () => cleanupSlider(el)
          }}
        >
          <div className="fill" />
          <div className="thumb" data-proximity />
        </div>
      </div>
    </div>
  )
}
