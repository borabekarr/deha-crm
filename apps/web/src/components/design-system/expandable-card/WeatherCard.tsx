import type { RefObject } from 'react'
import { CONDITIONS, FORECAST, cardStyle, chevStyle, innerStyle, type VariantId } from './expandable-card-shared'

// Render-only split of ExpandableCardDemo's Card 3 · Weather
// (react-doctor no-giant-component): open/variant state, the toggle/hover
// handlers and the useAutoHeight ref all stay owned by ExpandableCardDemo;
// this file only renders the card's markup. Class names, DOM order and
// inline style values are unchanged from the parent's own former inline JSX.
export function WeatherCard({
  open,
  variant,
  onToggle,
  onMouseEnter,
  onMouseLeave,
  contentRef,
}: {
  open: boolean
  variant: VariantId
  onToggle: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  contentRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <button
      type="button"
      className="shell zoom"
      aria-label="Toggle expand"
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-open={open}
      style={{
        ...cardStyle(open, variant),
        appearance: 'none',
        border: 0,
        font: 'inherit',
        color: 'inherit',
        textAlign: 'inherit',
        display: 'block',
      }}
    >
      <div className="card-inner" style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <span className="badge gci">
            <span className="material-icons msym" style={{ fontSize: '12px' }}>
              sunny
            </span>
            Sunny
          </span>
          <span className="msym" style={chevStyle(open, variant)}>
            expand_more
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginTop: '14px' }}>
          <h3 className="xc-title" style={{ margin: 0, fontSize: '17px', fontWeight: 900, letterSpacing: '-0.01em', color: '#0F172A' }}>
            Today&apos;s Weather
          </h3>
          <span className="xc-title" style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
            72°F
          </span>
        </div>
        <div
          className="xc-meta"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#64748B',
            marginTop: '4px',
          }}
        >
          <span className="msym" style={{ fontSize: '15px', color: '#F59E0B' }}>
            thermostat
          </span>
          Feels like 75°F · High 78° / Low 65°
        </div>

        <div className="xc-content" ref={contentRef}>
          <div style={innerStyle(open, variant)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '18px' }}>
              {CONDITIONS.map((c) => (
                <div
                  key={c.label}
                  className="xc-tile"
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span className="msym" style={{ fontSize: '17px', color: '#10B981' }}>
                    {c.icon}
                  </span>
                  <span className="xc-tile-v" style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A' }}>
                    {c.value}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
            <span className="pills-label" style={{ marginTop: '16px' }}>
              5-day forecast
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {FORECAST.map((d) => (
                <div key={d.day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span className="xc-day" style={{ fontSize: '12px', fontWeight: 800, color: '#334155', width: '34px' }}>
                    {d.day}
                  </span>
                  <div className="xc-track">
                    <div style={{ width: d.pct, height: '100%', borderRadius: '9999px', background: 'var(--brand-primary-500)' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', width: '34px', textAlign: 'right' }}>{d.temp}</span>
                </div>
              ))}
            </div>
            <div
              className="xc-meta"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '14px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94A3B8',
              }}
            >
              <span className="msym" style={{ fontSize: '13px' }}>
                update
              </span>
              Last updated: 5 minutes ago
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
