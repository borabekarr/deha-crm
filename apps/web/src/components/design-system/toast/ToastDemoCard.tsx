import type { CSSProperties } from 'react'
import { COLORS, type ToastSpec } from './toast-vm'
import { withUndo } from './toast-helpers'

// Render-only split of ToastStage's demo/trigger card (react-doctor
// no-giant-component): liveCount, the show() callback and dismissAll all
// stay owned by ToastStage's state machine; this file only renders the
// static card markup and the semantic/undo trigger buttons. Class names,
// DOM order and inline style values are unchanged from ToastStage's own
// former inline JSX.
export function ToastDemoCard({
  liveCount,
  onShow,
  onDismissAll,
}: {
  liveCount: string
  onShow: (spec: ToastSpec) => void
  onDismissAll: () => void
}) {
  return (
    <div
      className="shell zoom"
      // Duration/easing now the toast family tokens (motion-tokens.css
      // --toast-dur/--toast-ease, plan: motion-family-rules step 7)
      // instead of the raw source's literal 220ms/--ease-out.
      style={{ animation: 'ts-enter calc(var(--toast-dur) * var(--anim-mult, 1)) var(--toast-ease) both', cursor: 'default' }}
    >
      <div
        className="card-inner"
        style={{
          width: '460px',
          maxWidth: 'calc(100vw - 88px)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-stack)',
        }}
      >

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-icon-text)' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              className="label"
              style={{
                fontSize: 'var(--type-mini)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                color: 'var(--fg4)',
              }}
            >
              Feedback
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--gap-icon-text)',
                fontSize: 'var(--type-h4)',
                fontWeight: 900,
                letterSpacing: '-0.015em',
                color: 'var(--fg1)',
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px', color: '#10B981' }}>notifications</span>Toasts
            </span>
          </div>
          <span className="badge gci grid-texture" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <span className="material-icons" style={{ fontSize: '12px' }}>layers</span>
            <span>{liveCount}</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span
            className="label"
            style={{
              fontSize: 'var(--type-mini)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              color: 'var(--fg4)',
            }}
          >
            Semantic
          </span>
          <div style={{ display: 'flex', gap: 'var(--gap-inline)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-cta"
              style={{ height: '40px', fontSize: '13px', '--accent': '#10B981', '--ctaglow': 'rgba(16,185,129,0.5)' } as CSSProperties}
              onClick={() => onShow({ type: 'success', icon: 'check_circle', title: 'Synced data successfully.' })}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>check_circle</span>Success
            </button>
            <button
              type="button"
              className="btn-cta"
              style={{ height: '40px', fontSize: '13px', '--accent': '#EF4444', '--ctaglow': 'rgba(239,68,68,0.5)' } as CSSProperties}
              onClick={() => onShow({ type: 'error', icon: 'error', title: 'Failed to load data from server.' })}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>error</span>Error
            </button>
            <button
              type="button"
              className="btn-cta"
              style={{ height: '40px', fontSize: '13px', '--accent': '#F59E0B', '--ctaglow': 'rgba(245,158,11,0.5)' } as CSSProperties}
              onClick={() => onShow({ type: 'warning', icon: 'warning', title: 'Deprecation alert for your API usage.' })}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>warning</span>Warning
            </button>
            <button
              type="button"
              className="btn-cta"
              style={{ height: '40px', fontSize: '13px', '--accent': '#3B82F6', '--ctaglow': 'rgba(59,130,246,0.5)' } as CSSProperties}
              onClick={() => onShow({ type: 'info', icon: 'info', title: 'A new version 2.4 is available.' })}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>info</span>Info
            </button>
            <button
              type="button"
              className="btn-cta"
              style={{ height: '40px', fontSize: '13px', '--accent': COLORS.notification, '--ctaglow': 'rgba(99,102,241,0.5)' } as CSSProperties}
              onClick={() => onShow({ type: 'notification', icon: 'notifications', title: 'New comment on your task.', expandText: 'Priya left a comment: "Can we bump the due date to Friday?"' })}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>notifications</span>Notification
            </button>
            <button
              type="button"
              className="btn-cta"
              style={{ height: '40px', fontSize: '13px', '--accent': '#0F172A', '--ctaglow': 'rgba(15,23,42,0.5)' } as CSSProperties}
              onClick={() => onShow(withUndo({ type: 'success', icon: 'delete', title: 'Item deleted.' }))}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>undo</span>Undo demo
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--gap-inline)' }}>
          <button type="button" className="btn-text" onClick={onDismissAll}>
            <span className="material-icons" style={{ fontSize: '18px' }}>clear_all</span>Dismiss all
          </button>
        </div>

        <div style={{ display: 'flex' }}>
          <span className="badge tag"><span className="material-icons">sell</span>toast / stacked</span>
        </div>
      </div>
    </div>
  )
}
