/**
 * AdjustTimeframeTrack.tsx
 *
 * Render-only: pan buttons, the scrubber track (ruler, month ticks/buttons,
 * selection lens + drag handles), and the zoom pill. All state, refs, and
 * drag/zoom/pan/keyboard handlers live in the parent's controller hook;
 * this component only takes props and renders identical markup/classnames.
 */
import { fmtDate, dayWord, ZOOM_LEVELS, clamp } from './adjust-timeframe-shared'
import type { AdjustTimeframeController } from './use-adjust-timeframe-controller'

type Props = Pick<
  AdjustTimeframeController,
  | 'panGroupRef' | 'scroll' | 'minScroll' | 'maxScroll' | 'panBy'
  | 'trackCallbackRef' | 'onTrackDown' | 'anim' | 'stripW' | 'ppd' | 'rulerW' | 'months'
  | 'startIdx' | 'endIdx' | 'selectMonth' | 'selLeft' | 'selWidth' | 'days'
  | 'handleBeginDrag' | 'drag' | 'todayIdx' | 'totalDays' | 'startDate' | 'endDate' | 'endIsToday'
  | 'onHandleKey' | 'zoomLevel' | 'stepZoom' | 'canZoomIn'
>

export function AdjustTimeframeTrack({
  panGroupRef, scroll, minScroll, maxScroll, panBy,
  trackCallbackRef, onTrackDown, anim, stripW, ppd, rulerW, months,
  startIdx, endIdx, selectMonth, selLeft, selWidth, days,
  handleBeginDrag, drag, todayIdx, totalDays, startDate, endDate, endIsToday,
  onHandleKey, zoomLevel, stepZoom, canZoomIn,
}: Props) {
  return (
    <>
    <div className="tf-body" ref={panGroupRef}>
      <button
        type="button"
        className="tf-pan"
        data-proximity
        aria-label="Pan left"
        title="Pan left"
        disabled={scroll <= minScroll}
        onClick={() => panBy(-1)}
      >
        <span className="material-symbols-outlined">keyboard_double_arrow_left</span>
      </button>

      <div
        className="tf-track"
        ref={trackCallbackRef}
        onPointerDown={onTrackDown}
      >
        {/* F4: ruler/month content stays clipped in this wrapper; the
            handles below live in a second .tf-strip sibling wrapped by
            .tf-handle-clip, a boundary a few px larger than .tf-track so
            the sub-pixel grip overhang is never cut — but still bounded,
            so a scroll/pan transition can't paint the handle over the
            pan buttons — see AdjustTimeframe.css .tf-handle-clip. */}
        <div className="tf-track-clip">
          <div
            className="tf-strip"
            data-anim={anim ? 'true' : 'false'}
            /* Render-time safety clamp: `scroll` state can momentarily race
               ahead of a mid-drag daysVisible/ppd change, which would otherwise let
               the translate expose blank track past today. minScroll/
               maxScroll are recomputed fresh every render from the CURRENT
               ppd/stripW, so clamping here is always in sync — no matter
               how the underlying scroll state drifted, the painted strip
               can never fall short of the track's right edge. */
            style={{ width: stripW + 'px', transform: `translateX(${-clamp(scroll, minScroll, maxScroll)}px)` }}
          >
            <div className="tf-ruler" style={{ width: rulerW + 'px' }} />

            {months.map((m) =>
              m.startIdx === 0 ? null : (
                <span
                  key={'tick-' + m.label}
                  className="tf-monthtick"
                  style={{ left: m.startIdx * ppd + 'px' }}
                />
              ),
            )}

            {months.map((m) => {
              const mEnd   = Math.min(m.startIdx + m.days, totalDays)
              const center = ((m.startIdx + mEnd) / 2) * ppd
              const inRange = m.startIdx + m.days > startIdx && m.startIdx <= endIdx
              return (
                <button
                  key={'month-' + m.label + '-' + m.startIdx}
                  type="button"
                  className="tf-month"
                  data-in={inRange ? 'true' : 'false'}
                  style={{ left: center + 'px' }}
                  onClick={() => selectMonth(m)}
                  aria-label={`Select ${m.label}`}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="tf-handle-clip">
          <div
            className="tf-strip tf-strip-sel"
            data-anim={anim ? 'true' : 'false'}
            style={{ width: stripW + 'px', transform: `translateX(${-clamp(scroll, minScroll, maxScroll)}px)` }}
          >
            <div
              className="tf-sel"
              data-anim={anim ? 'true' : 'false'}
              style={{ left: selLeft + 'px', width: selWidth + 'px' }}
            >
              <div className="tf-lens">
                <div className="tf-daycount">{dayWord(days)}</div>
              </div>

              <div
                className="tf-lens-hit"
                onPointerDown={(e) => handleBeginDrag('move', e)}
                aria-hidden="true"
              />

              <input
                type="range"
                className="tf-handle start"
                aria-label="Start date"
                aria-valuetext={fmtDate(startDate)}
                min={0}
                max={todayIdx}
                value={startIdx}
                onChange={() => { /* controlled via pointerDown */ }}
                data-active={drag === 'start' ? 'true' : 'false'}
                onPointerDown={(e) => handleBeginDrag('start', e)}
                onKeyDown={(e) => onHandleKey('start', e)}
              />

              <input
                type="range"
                className="tf-handle end"
                aria-label="End date"
                aria-valuetext={endIsToday ? 'Today' : fmtDate(endDate)}
                min={0}
                max={todayIdx}
                value={endIdx}
                onChange={() => { /* controlled via pointerDown */ }}
                data-active={drag === 'end' ? 'true' : 'false'}
                onPointerDown={(e) => handleBeginDrag('end', e)}
                onKeyDown={(e) => onHandleKey('end', e)}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="tf-pan"
        data-proximity
        aria-label="Pan right"
        title="Pan right"
        disabled={scroll >= maxScroll}
        onClick={() => panBy(1)}
      >
        <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
      </button>
    </div>

    {/* F3: zoom pill moved out of .tf-track into its own band below the
        pan/track/pan row, so it can never overlap the month labels. */}
    <div className="tf-zoom-row">
      <div className="tf-zoom-pill" role="group" aria-label="Zoom level">
        <button
          type="button"
          className="tf-zoom-btn"
          aria-label="Zoom out"
          disabled={ZOOM_LEVELS.indexOf(zoomLevel) <= 0}
          onClick={() => stepZoom(-1)}
        >
          −
        </button>
        <span className="tf-zoom-pct">{zoomLevel}%</span>
        <button
          type="button"
          className="tf-zoom-btn"
          aria-label="Zoom in"
          /* Stop-if resolution: capability comes from the controller
             (deepest level that still contains the whole selection), not a
             raw index comparison — a wide selection can make the button
             disabled before ZOOM_LEVELS' own ceiling is reached. */
          disabled={!canZoomIn}
          onClick={() => stepZoom(1)}
        >
          +
        </button>
      </div>
    </div>
    </>
  )
}
