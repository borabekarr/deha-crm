import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './SpringShowcase.css'

import { useCallback, useMemo, useRef } from 'react'
import { LazyMotion, domMax, m, useMotionValue } from 'framer-motion'
import { animate } from 'framer-motion/dom'
import { usePillSpring } from '@/lib/motion-spring'
import { useSpringLab, motionDisabled, type Preset, type LabParams } from './spring-showcase-hook'

// SpringShowcase — "Spring Lab" (Step 4). Tune stiffness/damping/mass on a
// live spring, read zeta/settle/overshoot/first-peak, preview a slide/scale
// demo + one flick ball, and copy the spring out as JS or CSS linear().
// Physics: `@/lib/spring-math`. DOM side-effects: callback refs only
// (spring-showcase-hook.ts) — no effect hooks anywhere in this folder.

const SLIDER_DEFS: Array<{ key: 'stiffness' | 'damping' | 'mass'; label: string; min: number; max: number; step: number }> = [
  { key: 'stiffness', label: 'Stiffness', min: 1, max: 1500, step: 1 },
  { key: 'damping', label: 'Damping', min: 0, max: 200, step: 1 },
  { key: 'mass', label: 'Mass', min: 0.1, max: 20, step: 0.1 },
]

const PRESET_ORDER: Array<{ key: Preset; label: string }> = [
  { key: 'pill', label: 'Pill' },
  { key: 'elegant', label: 'Elegant' },
  { key: 'bouyant', label: 'Bouyant' },
  { key: 'pop', label: 'Pop' },
  { key: 'custom', label: 'Custom' },
]
// Matches `.ss-presets` box model in SpringShowcase.css (fills the 280px
// `.ss-controls` column, padding 3px) so the fill's x/width are derived
// analytically — no DOM measurement, no extra state, no callback-ref timing.
const PRESETS_PAD = 3
const PRESETS_WIDTH = 280
const PRESET_COL_W = (PRESETS_WIDTH - PRESETS_PAD * 2) / PRESET_ORDER.length

const PLOT_W = 420
const PLOT_H = 140
const TRACK_MAX = 176 // flick track width (220) minus ball diameter (44)

function FlickBall({ params }: { params: LabParams }) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)

  const settle = useCallback((target: number) => {
    animate(x, target, motionDisabled() ? { duration: 0 } : { type: 'spring', ...params })
  }, [params, x])

  return (
    <div className="ss-flick-lane">
      <div className="ss-flick-track" ref={trackRef} data-testid="ss-track">
        <m.div
          className="ss-ball" drag="x" dragConstraints={trackRef} dragElastic={0.12} dragMomentum={false}
          style={{ x }} onDragEnd={() => settle(x.get() > TRACK_MAX / 2 ? TRACK_MAX : 0)}
        />
      </div>
      <span className="ss-flick-caption">Flick — current params</span>
    </div>
  )
}

export default function SpringShowcase() {
  const { state, params, samples, metrics, exportJs, exportCss, dispatch, slideRef, scaleRef, onCopy } = useSpringLab()

  const pillIndex = PRESET_ORDER.findIndex((p) => p.key === state.preset)
  const pillFillRef = usePillSpring<HTMLSpanElement>(PRESETS_PAD + pillIndex * PRESET_COL_W, PRESET_COL_W)

  const plot = useMemo(() => {
    const { t, x } = samples
    const domainSec = Math.max(0.05, metrics.settleSec * 1.1)
    let maxIdx = t.length - 1
    for (let i = 0; i < t.length; i++) { if (t[i] > domainSec) { maxIdx = i; break } }
    let maxY = 1.3
    for (let i = 0; i <= maxIdx; i++) { if (x[i] > maxY) maxY = x[i] }
    const toPt = (i: number) => `${((t[i] / domainSec) * PLOT_W).toFixed(1)},${(PLOT_H - (x[i] / maxY) * PLOT_H).toFixed(1)}`
    const stride = Math.max(1, Math.floor(maxIdx / 96))
    const pts: string[] = []
    for (let i = 0; i <= maxIdx; i += stride) pts.push(toPt(i))
    if (maxIdx % stride !== 0) pts.push(toPt(maxIdx))
    let peak: { cx: number; cy: number } | null = null
    if (metrics.firstPeakSec != null) {
      const idx = Math.min(t.length - 1, Math.max(0, Math.round(metrics.firstPeakSec / (t[1] - t[0]))))
      peak = { cx: (t[idx] / domainSec) * PLOT_W, cy: PLOT_H - (x[idx] / maxY) * PLOT_H }
    }
    return { points: pts.join(' '), oneLineY: PLOT_H - (1 / maxY) * PLOT_H, gridX: (metrics.settleSec / domainSec) * PLOT_W, peak }
  }, [samples, metrics])

  return (
    <LazyMotion features={domMax} strict>
      <div className="ss-lab">
        <div className="ss-controls">
          <div className="ss-presets">
            <span className="ss-pill-fill" ref={pillFillRef} style={{ transition: 'none' }} />
            {PRESET_ORDER.map((p) => (
              <button
                key={p.key} type="button" className="ss-preset-pill"
                aria-pressed={state.preset === p.key} disabled={p.key === 'custom'}
                onClick={() => { if (p.key !== 'custom') dispatch({ type: 'preset', preset: p.key }) }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {SLIDER_DEFS.map((def) => (
            <div className="ss-slider" key={def.key}>
              <label className="ss-slider-label" htmlFor={`ss-range-${def.key}`}>{def.label}</label>
              <input
                id={`ss-range-${def.key}`} type="range" className="ss-range"
                min={def.min} max={def.max} step={def.step}
                value={state.params[def.key]} aria-label={def.label}
                onChange={(e) => dispatch({ type: 'param', key: def.key, value: Number(e.target.value) })}
              />
              <output className="ss-slider-val" htmlFor={`ss-range-${def.key}`} data-testid={`ss-val-${def.key}`}>
                {def.key === 'mass' ? state.params.mass.toFixed(1) : state.params[def.key]}
              </output>
            </div>
          ))}

          <button type="button" className="ss-replay" onClick={() => dispatch({ type: 'replay' })}>Replay</button>
        </div>

        <div className="ss-stage">
          <svg className="ss-plot" viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} aria-hidden="true">
            <line className="ss-plot-oneline" x1={0} y1={plot.oneLineY} x2={PLOT_W} y2={plot.oneLineY} />
            <line className="ss-plot-gridline" x1={plot.gridX} y1={0} x2={plot.gridX} y2={PLOT_H} />
            <polyline className="ss-plot-line" points={plot.points} />
            {plot.peak && <circle className="ss-plot-peak" cx={plot.peak.cx} cy={plot.peak.cy} r={3.5} />}
          </svg>

          <div className="ss-readouts">
            <div className="ss-readout"><span className="ss-readout-label">ζ</span><span className="ss-readout-val" data-testid="ss-zeta">{params.zeta.toFixed(2)}</span></div>
            <div className="ss-readout"><span className="ss-readout-label">Settle</span><span className="ss-readout-val" data-testid="ss-settle">{Math.round(metrics.settleSec * 1000)}ms</span></div>
            <div className="ss-readout"><span className="ss-readout-label">Overshoot</span><span className="ss-readout-val" data-testid="ss-overshoot">{metrics.overshootPct.toFixed(1)}%</span></div>
            <div className="ss-readout">
              <span className="ss-readout-label">First peak</span>
              <span className="ss-readout-val" data-testid="ss-peak">{metrics.firstPeakSec == null ? '—' : `${Math.round(metrics.firstPeakSec * 1000)}ms`}</span>
            </div>
          </div>

          <div className="ss-demos">
            <div className="ss-demo-card">
              <div className="ss-demo-slide-track"><div className="ss-demo-slide" ref={slideRef} /></div>
              <span className="ss-demo-caption">Slide</span>
            </div>
            <div className="ss-demo-card">
              <div className="ss-demo-scale" ref={scaleRef} />
              <span className="ss-demo-caption">Scale</span>
            </div>
            <FlickBall params={state.params} />
          </div>

          <div className="ss-export">
            <div className="ss-export-block">
              <div className="ss-export-head">
                <span className="ss-export-title">JS spring</span>
                <button type="button" className="ss-copy-btn" onClick={() => onCopy('js')}>{state.copied === 'js' ? 'Copied' : 'Copy'}</button>
              </div>
              <pre className="ss-export-pre" data-testid="ss-export-js">{exportJs}</pre>
            </div>
            <div className="ss-export-block">
              <div className="ss-export-head">
                <span className="ss-export-title">CSS linear()</span>
                <button type="button" className="ss-copy-btn" onClick={() => onCopy('css')}>{state.copied === 'css' ? 'Copied' : 'Copy'}</button>
              </div>
              <pre className="ss-export-pre" data-testid="ss-export-css">{exportCss}</pre>
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  )
}
