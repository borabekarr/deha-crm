import type { CSSProperties, KeyboardEvent, RefObject } from 'react'
import { cardStyle, chevStyle, innerStyle, stop, type VariantId } from './expandable-card-shared'

// Render-only split of ExpandableCardDemo's Card 2 · Task
// (react-doctor no-giant-component): open/variant state, the toggle/hover
// handlers and the useAutoHeight ref all stay owned by ExpandableCardDemo;
// this file only renders the card's markup. Class names, DOM order and
// inline style values are unchanged from the parent's own former inline JSX.
export function TaskCard({
  open,
  variant,
  onToggle,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  contentRef,
}: {
  open: boolean
  variant: VariantId
  onToggle: () => void
  onKeyDown: (e: KeyboardEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  contentRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      className="shell zoom"
      role="presentation"
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-open={open}
      style={cardStyle(open, variant)}
    >
      <div className="card-inner" style={{ overflow: 'hidden', boxSizing: 'border-box' }}>
        <div
          role="button"
          tabIndex={0}
          aria-label="Toggle expand"
          aria-expanded={open}
          onKeyDown={onKeyDown}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <span className="badge col-tag progress">
              <span className="material-icons msym" style={{ fontSize: '13px' }}>
                bolt
              </span>
              In progress<span className="count">4</span>
            </span>
            <span className="msym" style={chevStyle(open, variant)}>
              expand_more
            </span>
          </div>
          <h3
            className="xc-title"
            style={{ margin: '14px 0 4px', fontSize: '17px', fontWeight: 900, letterSpacing: '-0.01em', color: '#0F172A' }}
          >
            Mobile app redesign
          </h3>
          <div
            className="xc-meta"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#64748B' }}
          >
            <span className="msym" style={{ fontSize: '15px', color: '#94A3B8' }}>
              flag
            </span>
            Due Friday · Sprint 12
          </div>
        </div>

        <div className="xc-content" ref={contentRef}>
          <div style={innerStyle(open, variant)}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '18px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748B',
              }}
            >
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Progress</span>
              <span style={{ color: '#10B981' }}>68%</span>
            </div>
            <div
              className="xc-track"
              style={{
                height: '8px',
                borderRadius: '9999px',
                background: '#F1F5F9',
                marginTop: '6px',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '68%',
                  height: '100%',
                  borderRadius: '9999px',
                  background: '#10B981',
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)',
                  backgroundSize: '7px 7px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.15)',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
              <span className="badge tag">
                <span className="material-icons msym">palette</span>
                Design
              </span>
              <span className="badge tag">
                <span className="material-icons msym">phone_iphone</span>
                iOS
              </span>
              <span className="badge tag">
                <span className="material-icons msym">search</span>
                Research
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn-task" onClick={stop} style={{ '--fbtn': '#0F172A' } as CSSProperties}>
                <span className="material-icons msym" style={{ fontSize: '14px' }}>
                  dashboard
                </span>
                Open board
              </button>
              <button type="button" className="btn-discuss" onClick={stop}>
                <span className="msym" style={{ fontSize: '15px' }}>
                  forum
                </span>
                Discuss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
