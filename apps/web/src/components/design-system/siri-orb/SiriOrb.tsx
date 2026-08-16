import { useCallback, useEffect, useRef, useState } from 'react'
import './SiriOrb.css'
import './proto/variants.css'
import { ProtoPicker } from './proto/ProtoPicker'

// ---------------------------------------------------------------------------
// Siri Orb — Deha Design System
// A glowing WebGL voice-assistant orb: one full-quad GLSL fragment-shader
// pass drawing an emerald -> mint domain-warped plasma disc with a breathing
// halo. Click (or Enter/Space) toggles the "listening" mode, which eases the
// plasma towards a faster, brighter, more energetic target.
//
// Canonical source per CONVERSION-SOP.md:
// apps/web/design-system/claude-design/raw/siri-orb/siri-orb.html — the
// standalone demo Bora sees on claude.ai/design (eyebrow, 300px orb, status
// row, hint line). Every GLSL line, every uniform default, the listening
// multipliers and the 0.08 per-frame lerp below are that file's inline
// script verbatim.
//
// The sibling SiriOrb.jsx in that same raw dir is a generic prop-driven API
// (size/speed/primaryColor/... /paused, no demo chrome, no listening mode,
// and a `paused`-aware accumulated-time clock instead of the HTML's
// wall-clock `time`), so it is NOT the pixel-comparable artifact the gate
// diffs against; it was read for confirmation only and its FRAG source is
// character-identical to the HTML's apart from comments. Same
// jsx-for-confirmation-only precedent as AnimatedHeaderScroll.tsx /
// ExpandableCard.tsx / BlurCarousel.tsx.
//
// The raw file's `.controls` tweak panel (Speed / Glow / Swirl / Core
// sliders + A / B color pickers) is ambient claude.ai/design authoring
// tooling, excluded here the same way every other conversion excludes it.
// Those sliders only set the BASE values, so this port fixes them at the
// literal defaults the raw source ships: speed 1, glow 1, swirl 1, core 1,
// A #10B981, B #5EEAD4.
//
// Motion is JS-timed (rAF + GL uniforms), not CSS, so nothing here is
// tokenizable; the only CSS transition (the status row's color) carries its
// exact-value token substitution in SiriOrb.css.
// ---------------------------------------------------------------------------

// Raw source: the VERT / FRAG shader strings, byte-preserved.
const VERT = `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `

const FRAG = `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;
      uniform float speed;
      uniform vec3  primaryColor;
      uniform vec3  secondaryColor;
      uniform float noiseIntensity;
      uniform float glowIntensity;
      uniform float saturation;
      uniform float brightness;
      uniform float rotationSpeed;
      uniform float noiseScale;
      uniform float coreIntensity;
      uniform float edgeSoftness;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 5; i++) {
          v += amp * noise(p);
          p = m * p;
          amp *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
        float r = length(p);
        float t = time * speed;

        float a = time * rotationSpeed;
        mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
        vec2 q = rot * p * noiseScale;

        vec2 warp = vec2(
          fbm(q + t * 0.15),
          fbm(q + vec2(5.2, 1.3) - t * 0.12)
        );
        float n = clamp(fbm(q + warp * (1.2 * noiseIntensity) + t * 0.2), 0.0, 1.0);
        float swirl = fbm(q * 1.8 + warp * 2.0 - t * 0.25);

        vec3 col = mix(primaryColor, secondaryColor, smoothstep(0.2, 0.9, n));
        col = mix(col, secondaryColor, smoothstep(0.5, 0.85, swirl) * 0.7);

        float core = exp(-r * r * 22.0) * coreIntensity;
        col += secondaryColor * core * 0.5;

        float R = 0.40;
        float edge = max(edgeSoftness, 0.001);
        float disc = 1.0 - smoothstep(R - edge, R, r);
        float plasma = pow(n, 1.3);
        float body = disc * (0.15 + 1.25 * plasma);

        float breathe = 0.85 + 0.15 * sin(time * 1.5);
        float halo  = exp(-max(r - R, 0.0) * 9.0) * glowIntensity * breathe;
        float bloom = exp(-r * r * 8.0) * glowIntensity * 0.35 * breathe;

        vec3 glowCol = mix(primaryColor, secondaryColor, 0.4);
        vec3 result = col * body * brightness;
        result += glowCol * (halo * 0.7 + bloom);

        float l = dot(result, vec3(0.299, 0.587, 0.114));
        result = mix(vec3(l), result, saturation);
        result = result / (1.0 + result * 0.25);

        float alpha = clamp(body + halo * 0.8 + bloom + core, 0.0, 1.0);
        gl_FragColor = vec4(result, alpha);
      }
    `

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [0, 0, 0]
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(sh))
  }
  return sh
}

interface OrbTarget {
  speed: number
  glow: number
  noise: number
  rotation: number
}

interface OrbOpts {
  speed: number
  glowIntensity: number
  noiseIntensity: number
  coreIntensity: number
  saturation: number
  brightness: number
  rotationSpeed: number
  noiseScale: number
  edgeSoftness: number
  primaryColor: [number, number, number]
  secondaryColor: [number, number, number]
  _target: OrbTarget
}

// Raw source: the `base` object the (excluded) sliders would write into,
// pinned at the authored slider defaults.
const BASE: OrbTarget = { speed: 1.0, glow: 1.0, noise: 1.0, rotation: 0.3 }

// prototype surface (ds-review-visuals step 2): SiriOrb now takes optional
// palette props so a variant can swap the shader's primary/secondary uniform
// colors without touching the GLSL or the rAF/reduced-motion machinery
// above. Undeclared -> the raw source's own defaults, byte-identical to the
// prior unconditional hexToRgb('#10B981')/('#5EEAD4') calls.
export interface SiriOrbProps {
  primaryColor?: string
  secondaryColor?: string
}

export function SiriOrb({ primaryColor = '#10B981', secondaryColor = '#5EEAD4' }: SiriOrbProps = {}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [listening, setListening] = useState(false)
  // Mirrors the OS reduced-motion preference into the rAF loop without
  // tearing the GL setup down and rebuilding it on change (same
  // mirror-to-ref precedent as optsRef below / BuyerBrain's rmRef).
  const reducedRef = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  // Mirrors `listening` for the rAF loop / GL setup, which must not be torn
  // down and rebuilt when the mode flips (the raw source keeps one GL
  // context for the page's whole lifetime).
  const optsRef = useRef<OrbOpts>({
    speed: 1.0,
    glowIntensity: 1.0,
    noiseIntensity: 1.0,
    coreIntensity: 1.0,
    saturation: 1.0,
    brightness: 1.0,
    rotationSpeed: 0.3,
    noiseScale: 4.0,
    edgeSoftness: 0.16,
    primaryColor: hexToRgb(primaryColor),
    secondaryColor: hexToRgb(secondaryColor),
    _target: { speed: 1, glow: 1, noise: 1, rotation: 0.3 },
  })

  // Raw source `applyMode()`: "Listening" mode is faster, brighter, more
  // energetic — driven towards the target by the render-side lerp below.
  useEffect(() => {
    optsRef.current._target = {
      speed: BASE.speed * (listening ? 1.9 : 1.0),
      glow: BASE.glow * (listening ? 1.5 : 1.0),
      noise: BASE.noise * (listening ? 1.45 : 1.0),
      rotation: BASE.rotation * (listening ? 2.2 : 1.0),
    }
  }, [listening])

  const toggle = useCallback(() => setListening((v) => !v), [])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    },
    [toggle],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const gl = canvas.getContext('webgl', {
      antialias: true,
      premultipliedAlpha: false,
      alpha: true,
      // Keeps the drawing buffer readable between rAF ticks (toDataURL /
      // getImageData / readPixels) so the behavioural probe can pixel-sample
      // it. Test-only: a production consumer never sets this window flag, so
      // it stays a per-frame no-op cost only inside the probe's own page.
      preserveDrawingBuffer: Boolean((window as unknown as Record<string, unknown>).__SIRI_ORB_PRESERVE_BUFFER__),
    })
    if (!gl) {
      console.error('WebGL not supported')
      return
    }

    const program = gl.createProgram()
    if (!program) return
    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (vs) gl.attachShader(program, vs)
    if (fs) gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const U: Record<string, WebGLUniformLocation | null> = {}
    ;[
      'resolution',
      'time',
      'speed',
      'primaryColor',
      'secondaryColor',
      'noiseIntensity',
      'glowIntensity',
      'saturation',
      'brightness',
      'rotationSpeed',
      'noiseScale',
      'coreIntensity',
      'edgeSoftness',
    ].forEach((n) => (U[n] = gl.getUniformLocation(program, n)))

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const s = wrap.clientWidth
      canvas.width = Math.round(s * dpr)
      canvas.height = Math.round(s * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize)
    resize()

    const start = performance.now()
    let raf = 0
    const frame = () => {
      const opts = optsRef.current
      const time = (performance.now() - start) / 1000
      // ease the animated params towards their target for a smooth
      // listen/idle transition
      const tg = opts._target
      opts.speed += (tg.speed - opts.speed) * 0.08
      opts.glowIntensity += (tg.glow - opts.glowIntensity) * 0.08
      opts.noiseIntensity += (tg.noise - opts.noiseIntensity) * 0.08
      opts.rotationSpeed += (tg.rotation - opts.rotationSpeed) * 0.08

      gl.uniform2f(U.resolution, canvas.width, canvas.height)
      gl.uniform1f(U.time, time)
      gl.uniform1f(U.speed, opts.speed)
      gl.uniform3fv(U.primaryColor, opts.primaryColor)
      gl.uniform3fv(U.secondaryColor, opts.secondaryColor)
      gl.uniform1f(U.noiseIntensity, opts.noiseIntensity)
      gl.uniform1f(U.glowIntensity, opts.glowIntensity)
      gl.uniform1f(U.saturation, opts.saturation)
      gl.uniform1f(U.brightness, opts.brightness)
      gl.uniform1f(U.rotationSpeed, opts.rotationSpeed)
      gl.uniform1f(U.noiseScale, opts.noiseScale)
      gl.uniform1f(U.coreIntensity, opts.coreIntensity)
      gl.uniform1f(U.edgeSoftness, opts.edgeSoftness)

      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      // Reduced motion: finish this frame (a clean, complete draw) and stop
      // scheduling further ones, so the orb rests on a valid pose instead of
      // an artifact mid-warp.
      if (!reducedRef.current) raf = requestAnimationFrame(frame)
      else raf = 0
    }
    frame()

    // Resume/pause the loop as the OS preference changes, without
    // recreating the GL context.
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onReduceChange = () => {
      reducedRef.current = reduceQuery.matches
      if (!reduceQuery.matches && raf === 0) frame()
    }
    reduceQuery.addEventListener('change', onReduceChange)

    // Teardown is packaging-only: the raw HTML source is a page-lifetime IIFE
    // that never tears down at all, so it has no counterpart to this. It
    // deliberately stops at cancelling the rAF and dropping the resize
    // listener, and does NOT call `WEBGL_lose_context.loseContext()` (which
    // the sibling raw SiriOrb.jsx does): React StrictMode mounts effects
    // twice in dev, and a lost context is unrecoverable on the same <canvas>
    // element — the second mount would re-acquire the already-killed context
    // and every shader compile would fail (observed: "Shader compile error:
    // null" x2, blank orb). The context is collected with the canvas when
    // the component unmounts.
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      reduceQuery.removeEventListener('change', onReduceChange)
    }
  }, [])

  return (
    <div className="siri-orb-root">
      <div className="stage">
        <div className="eyebrow">Siri Orb</div>
        <div
          className="orb-wrap"
          ref={wrapRef}
          role="button"
          tabIndex={0}
          aria-label="Toggle listening"
          onClick={toggle}
          onKeyDown={onKeyDown}
        >
          <canvas ref={canvasRef} />
        </div>
        <div className={listening ? 'status listening' : 'status'}>
          {listening ? 'Listening…' : 'Idle'}
        </div>
        <div className="hint">
          GLSL plasma orb · click to listen — drop it into any voice / AI surface
        </div>
      </div>
    </div>
  )
}

// ── prototype surface (ds-review-visuals step 2) ─────────────────────────
// Three presentation directions behind the prototype skill's picker; "Main"
// is step 1's reviewed/fixed result, untouched, and is the default/cherry-pick
// baseline (star). Backdrop + palette variant CSS lives entirely in
// proto/variants.css, keyed off a so-variant-<slug> class on the stage
// wrapper (so-* namespace per the tailwind-ring-class-collision lesson).
// Delete this block + proto/ to strip.
const VARIANT_SLUGS = ['main', 'aurora-veil', 'ember'] as const
const VARIANT_NAMES = ['Main', 'Aurora Veil', 'Ember']
const VARIANT_PALETTE: Record<(typeof VARIANT_SLUGS)[number], SiriOrbProps> = {
  main: {},
  'aurora-veil': {},
  ember: { primaryColor: '#F97316', secondaryColor: '#FDE68A' },
}

export default function SiriOrbDemo() {
  const [variant, setVariant] = useState(0)
  const [nonce, setNonce] = useState(0) // replay: re-mount so the shader/rAF loop re-inits
  const slug = VARIANT_SLUGS[variant]

  return (
    <div className={'so-proto-wrap so-variant-' + slug}>
      <SiriOrb key={slug + ':' + nonce} {...VARIANT_PALETTE[slug]} />
      <ProtoPicker
        names={VARIANT_NAMES}
        index={variant}
        mainIndex={0}
        onSelect={setVariant}
        onReplay={() => setNonce((n) => n + 1)}
      />
    </div>
  )
}
