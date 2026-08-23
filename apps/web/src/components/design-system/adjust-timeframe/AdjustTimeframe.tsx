import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import '../../../../design-system/preview/_shared-feedback.css'
import './AdjustTimeframe.css'

import { useAdjustTimeframeController } from './use-adjust-timeframe-controller'
import { AdjustTimeframeHeader } from './AdjustTimeframeHeader'
import { AdjustTimeframeTrack } from './AdjustTimeframeTrack'

export default function AdjustTimeframe() {
  // Destructured into individually-named bindings (not kept as one `const c`
  // object read via `c.foo`) so eslint-plugin-react-hooks' ref-taint
  // analysis can track each value independently instead of treating the
  // whole hook-return object as ref-shaped because a few of its fields are
  // callback refs.
  const {
    accent, months, presets,
    startIdx, endIdx, zoomLevel, drag, bumpKey, anim,
    scroll,
    ppd, stripW, maxScroll, minScroll, rulerW,
    selLeft, selWidth, days, startDate, endDate, endIsToday, todayIdx, totalDays,
    activeId, gliderStyle, canZoomIn,
    panGroupRef, shellSquircleRef, cardSquircleRef, presetsCallbackRef, trackCallbackRef,
    handleBeginDrag, onTrackDown, applyPreset, stepZoom, panBy, handleShellKey, selectMonth, onHandleKey,
  } = useAdjustTimeframeController()

  return (
    <div className="tf-shell" ref={shellSquircleRef} role="group" aria-label="Timeframe range" tabIndex={0} onKeyDown={handleShellKey}>
      <div
        className="tf-card"
        ref={cardSquircleRef}
        style={{ '--ppd': ppd + 'px', '--tf-accent': accent } as React.CSSProperties}
        data-dragging={drag ? 'true' : 'false'}
        data-moving={drag === 'move' ? 'true' : 'false'}
      >
        <AdjustTimeframeHeader
          bumpKey={bumpKey}
          startDate={startDate}
          endDate={endDate}
          endIsToday={endIsToday}
          presetsCallbackRef={presetsCallbackRef}
          activeId={activeId}
          gliderStyle={gliderStyle}
          presets={presets}
          applyPreset={applyPreset}
        />

        <div className="tf-divider" />

        <AdjustTimeframeTrack
          panGroupRef={panGroupRef}
          scroll={scroll}
          minScroll={minScroll}
          maxScroll={maxScroll}
          panBy={panBy}
          trackCallbackRef={trackCallbackRef}
          onTrackDown={onTrackDown}
          anim={anim}
          stripW={stripW}
          ppd={ppd}
          rulerW={rulerW}
          months={months}
          startIdx={startIdx}
          endIdx={endIdx}
          selectMonth={selectMonth}
          selLeft={selLeft}
          selWidth={selWidth}
          days={days}
          handleBeginDrag={handleBeginDrag}
          drag={drag}
          todayIdx={todayIdx}
          totalDays={totalDays}
          startDate={startDate}
          endDate={endDate}
          endIsToday={endIsToday}
          onHandleKey={onHandleKey}
          zoomLevel={zoomLevel}
          stepZoom={stepZoom}
          canZoomIn={canZoomIn}
        />
      </div>
    </div>
  )
}
