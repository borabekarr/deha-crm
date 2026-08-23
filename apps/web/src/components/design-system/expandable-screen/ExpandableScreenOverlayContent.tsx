import type { CSSProperties } from 'react'

const SYM_STYLE: CSSProperties = { fontFamily: "'Material Symbols Outlined'" }

// Render-only split of ExpandableScreenDemo's overlay waitlist content
// (react-doctor no-giant-component): the `joined` state and submit handler
// stay owned by ExpandableScreenDemo; this file only renders the form's
// markup. Class names, DOM order and inline style values are unchanged from
// the parent's own former inline JSX.
export function ExpandableScreenOverlayContent({
  submitLabel,
  submitIcon,
  onSubmit,
}: {
  submitLabel: string
  submitIcon: string
  onSubmit: () => void
}) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '560px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
        padding: '48px',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '16px',
          background: 'rgba(6,78,59,0.45)',
          border: '1px solid rgba(255,255,255,0.45)',
          fontSize: '12px',
          fontWeight: 800,
          color: '#FFFFFF',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textShadow: '0 1px 2px rgba(0,0,0,0.25)',
        }}
      >
        <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
          local_fire_department
        </span>
        Limited spots
      </span>
      <h2
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '44px',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: '#FFFFFF',
          lineHeight: 1.1,
          margin: 0,
          textShadow: '0 2px 4px rgba(0,0,0,0.28)',
        }}
      >
        <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '40px' }}>
          rocket_launch
        </span>
        You're almost in
      </h2>
      <p
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#FFFFFF',
          lineHeight: 1.6,
          margin: 0,
          maxWidth: '440px',
          textShadow: '0 1px 2px rgba(0,0,0,0.22)',
        }}
      >
        Leave your details and we'll send your invite as soon as your spot opens up.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '16px',
            background: 'rgba(6,78,59,0.4)',
            border: '1px solid rgba(255,255,255,0.35)',
            fontSize: '12px',
            fontWeight: 700,
            color: '#FFFFFF',
          }}
        >
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
            verified
          </span>
          Priority invite
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '16px',
            background: 'rgba(6,78,59,0.4)',
            border: '1px solid rgba(255,255,255,0.35)',
            fontSize: '12px',
            fontWeight: 700,
            color: '#FFFFFF',
          }}
        >
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
            science
          </span>
          Beta features
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '16px',
            background: 'rgba(6,78,59,0.4)',
            border: '1px solid rgba(255,255,255,0.35)',
            fontSize: '12px',
            fontWeight: 700,
            color: '#FFFFFF',
          }}
        >
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
            sell
          </span>
          Founder pricing
        </span>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
        <label
          htmlFor="es-full-name"
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
        >
          Full name
        </label>
        <input
          id="es-full-name"
          type="text"
          placeholder="Full name"
          className="es-input"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '15px 20px',
            borderRadius: '16px',
            color: '#FFFFFF',
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 500,
            outline: 'none',
          }}
        />
        <label
          htmlFor="es-work-email"
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
        >
          Work email
        </label>
        <input
          id="es-work-email"
          type="email"
          placeholder="Work email"
          className="es-input"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '15px 20px',
            borderRadius: '16px',
            color: '#FFFFFF',
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 500,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="es-submit-btn"
          style={{
            width: '100%',
            padding: '15px 20px',
            borderRadius: '16px',
            border: 'none',
            color: '#047857',
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '18px' }}>
            {submitIcon}
          </span>
          {submitLabel}
        </button>
      </div>

      <p
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#FFFFFF',
          margin: 0,
          textShadow: '0 1px 2px rgba(0,0,0,0.22)',
        }}
      >
        <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
          lock
        </span>
        No spam. Unsubscribe anytime.
      </p>
    </div>
  )
}
