import './ThemePaletteLab.css'

// Static reference page comparing the bookmarked neutral palette proposal
// against the current slate stack. No global theme reads/writes: both
// light and dark panels render simultaneously via local wrapper classes.

interface Swatch {
  role: string
  // Name of the local --tpl-* custom prop (defined on .tpl-root in the CSS
  // file) that holds this swatch's hex fill. Painting via the var keeps the
  // literal hex out of JSX while still resolving to the exact hex/rgb the
  // spec calls for (not the oklch string, which the browser would resolve
  // to a slightly different rgb).
  varName: string
  hex: string
  oklch: string
}

const NEW_DARK: Swatch[] = [
  { role: 'bg', varName: '--tpl-new-dark-bg', hex: '#111111', oklch: 'oklch(0.178 0 0)' },
  { role: 'surface', varName: '--tpl-new-dark-surface', hex: '#1C1C1C', oklch: 'oklch(0.227 0 0)' },
  { role: 'menu', varName: '--tpl-new-dark-menu', hex: '#232323', oklch: 'oklch(0.256 0 0)' },
  { role: 'text', varName: '--tpl-new-dark-text', hex: '#EDEDED', oklch: 'oklch(0.946 0 0)' },
  { role: 'muted', varName: '--tpl-new-dark-muted', hex: '#A1A1A1', oklch: 'oklch(0.709 0 0)' },
  { role: 'selected fg', varName: '--tpl-new-dark-selected-fg', hex: '#FFFFFF', oklch: 'oklch(1 0 0)' },
  { role: 'selected bg', varName: '--tpl-new-dark-selected-bg', hex: '#0A0A0A', oklch: 'oklch(0.145 0 0)' },
]

const NEW_LIGHT: Swatch[] = [
  { role: 'bg', varName: '--tpl-new-light-bg', hex: '#FFFFFF', oklch: 'oklch(1 0 0)' },
  { role: 'surface', varName: '--tpl-new-light-surface', hex: '#ECECEC', oklch: 'oklch(0.943 0 0)' },
  { role: 'menu', varName: '--tpl-new-light-menu', hex: '#FFFFFF', oklch: 'oklch(1 0 0)' },
  { role: 'text', varName: '--tpl-new-light-text', hex: '#0A0A0A', oklch: 'oklch(0.145 0 0)' },
  { role: 'muted', varName: '--tpl-new-light-muted', hex: '#6B6B6B', oklch: 'oklch(0.528 0 0)' },
  { role: 'selected fg', varName: '--tpl-new-light-selected-fg', hex: '#0A0A0A', oklch: 'oklch(0.145 0 0)' },
  { role: 'selected bg', varName: '--tpl-new-light-selected-bg', hex: '#FFFFFF', oklch: 'oklch(1 0 0)' },
]

// Current-stack values pulled from apps/web/design-system/colors_and_type.css
const CUR_LIGHT: Swatch[] = [
  { role: 'bg-app', varName: '--tpl-cur-light-bg-app', hex: '#FFFFFF', oklch: 'oklch(1 0 0)' },
  { role: 'bg-card-solid', varName: '--tpl-cur-light-bg-card-solid', hex: '#FFFFFF', oklch: 'oklch(1 0 0)' },
  { role: 'fg1', varName: '--tpl-cur-light-fg1', hex: '#0F172A', oklch: 'oklch(0.208 0.040 265.8)' },
  { role: 'fg3', varName: '--tpl-cur-light-fg3', hex: '#64748B', oklch: 'oklch(0.554 0.041 257.4)' },
  { role: 'border-hairline', varName: '--tpl-cur-light-border-hairline', hex: '#E2E8F0', oklch: 'oklch(0.929 0.013 255.5)' },
]

const CUR_DARK: Swatch[] = [
  { role: 'bg-app', varName: '--tpl-cur-dark-bg-app', hex: '#0F172A', oklch: 'oklch(0.208 0.040 265.8)' },
  { role: 'bg-card-solid', varName: '--tpl-cur-dark-bg-card-solid', hex: '#1E293B', oklch: 'oklch(0.279 0.037 260.0)' },
  { role: 'fg1', varName: '--tpl-cur-dark-fg1', hex: '#F1F5F9', oklch: 'oklch(0.968 0.007 247.9)' },
  { role: 'fg3', varName: '--tpl-cur-dark-fg3', hex: '#94A3B8', oklch: 'oklch(0.711 0.035 256.8)' },
  { role: 'border-hairline', varName: '--tpl-cur-dark-border-hairline', hex: '#334155', oklch: 'oklch(0.372 0.039 257.3)' },
]

function SwatchRow({ s, testId }: { s: Swatch; testId?: string }) {
  return (
    <div className="tpl-swatch">
      <span
        className="tpl-swatch-chip"
        style={{ background: `var(${s.varName})` }}
        data-testid={testId}
      />
      <div className="tpl-swatch-meta">
        <span className="tpl-swatch-role">{s.role}</span>
        <span className="tpl-swatch-hex">{s.hex}</span>
        <span className="tpl-swatch-oklch">{s.oklch}</span>
      </div>
    </div>
  )
}

function RadiusDemo({ label }: { label: string }) {
  return (
    <div className="tpl-radius-demo">
      <span className="tpl-chip-pill">full-pill chip</span>
      <div className="tpl-menu-mock">
        <div className="tpl-menu-row">Row one</div>
        <div className="tpl-menu-row">Row two</div>
        <div className="tpl-menu-row tpl-menu-row--selected">Selected row</div>
      </div>
      <span className="tpl-radius-caption">{label}: 18px menu, 11px rows, 9999px pill</span>
    </div>
  )
}

export default function ThemePaletteLab() {
  return (
    <div className="tpl-root">
      <header className="tpl-header">
        <h1 className="tpl-title">Theme Palette Lab</h1>
        <p className="tpl-subtitle">
          Comparison reference: bookmarked neutral palette vs. the current slate
          stack. Both panels render simultaneously via local wrapper classes;
          the global theme is untouched.
        </p>
      </header>

      <section className="tpl-panel tpl-panel--new-dark">
        <h2 className="tpl-panel-title">New palette — dark</h2>
        <div className="tpl-swatch-grid">
          {NEW_DARK.map((s) => (
            <SwatchRow key={s.role} s={s} testId={s.role === 'bg' ? 'tpl-new-dark-bg' : undefined} />
          ))}
        </div>
        <RadiusDemo label="new-dark" />
      </section>

      <section className="tpl-panel tpl-panel--new-light">
        <h2 className="tpl-panel-title">New palette — light</h2>
        <div className="tpl-swatch-grid">
          {NEW_LIGHT.map((s) => (
            <SwatchRow key={s.role} s={s} />
          ))}
        </div>
        <RadiusDemo label="new-light" />
      </section>

      <section className="tpl-panel tpl-panel--cur-dark">
        <h2 className="tpl-panel-title">Current stack — dark</h2>
        <div className="tpl-swatch-grid">
          {CUR_DARK.map((s) => (
            <SwatchRow key={s.role} s={s} />
          ))}
        </div>
      </section>

      <section className="tpl-panel tpl-panel--cur-light">
        <h2 className="tpl-panel-title">Current stack — light</h2>
        <div className="tpl-swatch-grid">
          {CUR_LIGHT.map((s) => (
            <SwatchRow key={s.role} s={s} />
          ))}
        </div>
      </section>

      <section className="tpl-notes">
        <h2 className="tpl-panel-title">Comparison notes</h2>
        <p>
          These are open conflicts to be aware of, not resolutions applied here:
        </p>
        <ul>
          <li>
            The bookmarked palette&apos;s neutrals are chroma-0 (pure grayscale),
            which conflicts with the current design-system rule that neutrals
            must carry at least 0.01 chroma.
          </li>
          <li>
            The bookmarked spec calls for a full 9999px pill radius on chips
            and swatches, which conflicts with the existing{' '}
            <code>--radius-pill: 16px</code> token.
          </li>
        </ul>
      </section>
    </div>
  )
}
