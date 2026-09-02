import { useState, type CSSProperties } from 'react'
import { Button } from '../buttons/Buttons'
import '../pills/Pills.css'

const SYM_STYLE: CSSProperties = { fontFamily: "'Material Symbols Outlined'" }

// Render-only split of ExpandableScreenDemo's overlay waitlist content
// (react-doctor no-giant-component): the `joined` state and submit handler
// stay owned by ExpandableScreenDemo; this file only renders the form's
// markup. DOM order is unchanged from the parent's own former inline JSX;
// class names and colors were restyled white/near-black + gamified in plan
// step 6 (F37) — see the report for what changed and why.
export function ExpandableScreenOverlayContent({
  submitLabel,
  submitIcon,
  onSubmit,
}: {
  submitLabel: string
  submitIcon: string
  onSubmit: () => void
}) {
  // Real local state, not an invented completion percentage: tracks whether
  // the two fields have been filled and whether the parent has flipped to
  // the "joined" icon (submitIcon mirrors ExpandableScreen.tsx's `joined`
  // boolean 1:1, same derivation the parent already uses for the label/icon
  // swap). Drives the progress fill below.
  const [nameFilled, setNameFilled] = useState(false)
  const [emailFilled, setEmailFilled] = useState(false)
  const joined = submitIcon === 'check_circle'
  const stepsDone = (nameFilled ? 1 : 0) + (emailFilled ? 1 : 0) + (joined ? 1 : 0)

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
          borderRadius: '9999px',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--brand-primary-500, #10b981)',
          fontSize: '12px',
          fontWeight: 800,
          color: 'var(--brand-primary-500, #10b981)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
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
          color: 'var(--fg1, #0a0a0a)',
          lineHeight: 1.1,
          margin: 0,
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
          color: 'var(--fg2, #232323)',
          lineHeight: 1.6,
          margin: 0,
          maxWidth: '440px',
        }}
      >
        Leave your details and we'll send your invite as soon as your spot opens up.
      </p>
      {/* Real design-system pill, not a local one-off (F37): imports
          pills/Pills.css and reuses .pill-tab as-is (white bg, house border/
          radius/text tokens) instead of the former inline green badges. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
        <span className="pill-tab">
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
            verified
          </span>
          Priority invite
        </span>
        <span className="pill-tab">
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
            science
          </span>
          Beta features
        </span>
        <span className="pill-tab">
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px' }}>
            sell
          </span>
          Founder pricing
        </span>
      </div>

      {/* Gamified addition (F37): quiet progress fill over 3 real steps
          (name filled, email filled, joined) — see the CSS comment in
          ExpandableScreen.css for the transform/token rationale. */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="es-progress-track">
          <div
            className="es-progress-fill"
            style={{ transform: `scaleX(${stepsDone / 3})` }}
          />
        </div>
        <span
          className="es-progress-done"
          data-visible={String(joined)}
          style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary-500, #10b981)' }}
        >
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>
            check_circle
          </span>
          You're on the list
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
          aria-label="Full name"
          className="es-input"
          onChange={(e) => setNameFilled(e.target.value.trim().length > 0)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '15px 20px',
            color: 'var(--fg1, #0a0a0a)',
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
          aria-label="Work email"
          className="es-input"
          onChange={(e) => setEmailFilled(e.target.value.trim().length > 0)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '15px 20px',
            color: 'var(--fg1, #0a0a0a)',
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 500,
            outline: 'none',
          }}
        />
        {/* Real design-system button (F37), not a local .es-submit-btn one-off:
            <Button variant="primary"> inherits house radius/shadow/hover/press
            motion from buttons/Buttons.css. */}
        <Button variant="primary" onClick={onSubmit} style={{ width: '100%', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ ...SYM_STYLE, fontSize: '18px' }}>
            {submitIcon}
          </span>
          {submitLabel}
        </Button>
      </div>

      <p
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--fg3, #6b6b6b)',
          margin: 0,
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
