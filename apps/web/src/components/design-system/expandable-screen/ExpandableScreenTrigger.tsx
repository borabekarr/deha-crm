import type { CSSProperties, RefObject } from 'react'

const SYM_STYLE: CSSProperties = { fontFamily: "'Material Symbols Outlined'" }

// Render-only split of ExpandableScreenDemo's trigger card
// (react-doctor no-giant-component): the FLIP phase state machine, the
// triggerElRef used to measure the FLIP `from` rect and the expand handler
// all stay owned by ExpandableScreenDemo; this file only renders the card's
// markup. Class names, DOM order and inline style values are unchanged from
// the parent's own former inline JSX.
export function ExpandableScreenTrigger({
  wrapStyle,
  onExpand,
  triggerRef,
}: {
  wrapStyle: CSSProperties
  onExpand: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <div style={wrapStyle}>
      <div
        className="card-glass"
        style={{
          maxWidth: '620px',
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <span className="pill pill--success" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
            bolt
          </span>
          Early access
        </span>
        <h1
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '36px',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#0F172A',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '34px', color: '#10B981' }}>
            rocket_launch
          </span>
          Join the waitlist
        </h1>
        <p style={{ fontSize: '15px', fontWeight: 500, color: '#64748B', lineHeight: 1.6, margin: 0, maxWidth: '460px' }}>
          Be among the first to experience our next-generation platform. Get early access to exclusive
          features and help shape the future of productivity.
        </p>
        <button
          type="button"
          className="btn-primary"
          data-testid="es-expand-trigger"
          onClick={onExpand}
          ref={triggerRef}
          style={{ marginTop: '8px', padding: '14px 28px', borderRadius: '100px', fontSize: '15px' }}
        >
          Get early access
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '18px' }}>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  )
}
