import type { CSSProperties, RefObject } from 'react'
import { ATTENDEES, cardStyle, chevStyle, innerStyle, stop, type VariantId } from './expandable-card-shared'

// Render-only split of ExpandableCardDemo's Card 1 · Meeting
// (react-doctor no-giant-component): open/variant state, the toggle/hover
// handlers and the useAutoHeight ref all stay owned by ExpandableCardDemo;
// this file only renders the card's markup. Class names, DOM order and
// inline style values are unchanged from the parent's own former inline JSX.
export function MeetingCard({
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
    <div
      className="shell zoom"
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-open={open}
      style={cardStyle(open, variant)}
    >
      <div className="card-inner" style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
        <button
          type="button"
          aria-label="Toggle expand"
          aria-expanded={open}
          style={{
            appearance: 'none',
            background: 'none',
            border: 0,
            padding: 0,
            margin: 0,
            font: 'inherit',
            color: 'inherit',
            textAlign: 'inherit',
            display: 'block',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <span className="badge time">
              <span className="msym" style={{ fontSize: '12px' }}>
                schedule
              </span>
              In 15 mins
            </span>
            <span className="msym" style={chevStyle(open, variant)}>
              expand_more
            </span>
          </div>
          <h3
            className="xc-title"
            style={{ margin: '14px 0 4px', fontSize: '17px', fontWeight: 900, letterSpacing: '-0.01em', color: '#0F172A' }}
          >
            Design Sync
          </h3>
          <div
            className="xc-meta"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}
          >
            <span className="msym" style={{ fontSize: '15px', color: '#94A3B8' }}>
              calendar_today
            </span>
            1:30PM <span style={{ color: '#94A3B8' }}>→</span> 2:30PM
          </div>
        </button>

        <div className="xc-content" ref={contentRef}>
          <div style={innerStyle(open, variant)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '18px' }}>
              <div style={{ display: 'flex' }}>
                {ATTENDEES.map((a) => (
                  <span
                    key={a.i}
                    className="xc-avatar"
                    style={{ '--xc-avatar-bg': a.bg } as CSSProperties}
                  >
                    {a.i}
                  </span>
                ))}
              </div>
              <span className="badge tag">
                <span className="material-icons msym">videocam</span>
                Zoom
              </span>
            </div>
            <p
              className="xc-meta"
              style={{ margin: '14px 0 0', fontSize: '12.5px', fontWeight: 600, color: '#64748B', lineHeight: 1.55 }}
            >
              Weekly sync on the expandable card system — review spring motion, collapsed sizes and the reveal stagger.
            </p>
            <button type="button" className="btn-green" onClick={stop} style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
              <span className="msym" style={{ fontSize: '16px' }}>
                videocam
              </span>
              Join meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
