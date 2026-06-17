import { useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { iconClass } from '../../../lib/iconClass'
import './Toast.css'
import {
  dismiss,
  push,
  pushPromise,
  clearAll,
  useToasts,
  type ToastData,
  type ToastType,
} from './toast-hook'

// ── Pure-React toastiva ──────────────────────────────────────────────────────
// Was a static react-native-web / Expo bundle served from /public/toastiva/ and
// embedded in an iframe (which had stopped rendering). Rewritten as a native
// React component: the canonical design from components-toast.html, made live —
// fire toasts, watch them morph / stack / auto-dismiss, drag to swipe away.
// State lives in toast-hook.ts (useSyncExternalStore); no useEffect anywhere.

const TYPE_ICON: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
  loading: 'autorenew',
}

function typeClass(type: ToastType): string {
  return type === 'loading' ? 'loading' : `t-${type}`
}

function Glyph({ name, spin }: { name: string; spin?: boolean }) {
  return (
    <span className={`${iconClass(name)}${spin ? ' tst-spin' : ''}`} aria-hidden="true">
      {name}
    </span>
  )
}

const SWIPE_THRESHOLD = 90

// ── a single live toast: handles enter, pointer-drag swipe, exit ──────────────
function LiveToast({ t }: { t: ToastData }) {
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [entered, setEntered] = useState(false)
  const startX = useRef(0)

  const leaving = t.leaving
  const loading = t.type === 'loading'

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (leaving) return
    startX.current = e.clientX
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return
    setDrag(e.clientX - startX.current)
  }
  function onPointerUp() {
    if (!dragging) return
    setDragging(false)
    if (Math.abs(drag) > SWIPE_THRESHOLD) {
      dismiss(t.id, drag < 0 ? 'left' : 'right')
    } else {
      setDrag(0)
    }
  }

  function onAnimationEnd(e: { animationName: string; target: EventTarget; currentTarget: EventTarget }) {
    if (e.target === e.currentTarget && e.animationName === 'tst-in') setEntered(true)
  }

  const leaveClass =
    leaving === 'left'
      ? 'tst-leaving-left'
      : leaving === 'right'
        ? 'tst-leaving-right'
        : leaving
          ? 'tst-leaving'
          : ''

  const cls = [
    'tst',
    typeClass(t.type),
    t.collapsed ? 'collapsed' : '',
    'tst-draggable',
    !entered && !leaving ? 'tst-enter' : '',
    dragging ? 'tst-dragging' : '',
    leaveClass,
  ]
    .filter(Boolean)
    .join(' ')

  // Inline drag transform only once the enter animation has released the element.
  const style: CSSProperties | undefined =
    entered && !leaving && (dragging || drag !== 0)
      ? {
          transform: `translateX(${drag}px) rotate(${drag * 0.02}deg)`,
          opacity: Math.max(0.4, 1 - Math.abs(drag) / 320),
        }
      : undefined

  const hasBody = !t.collapsed && (t.desc || t.showProgress || t.actions)

  return (
    <div
      className={cls}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onAnimationEnd={onAnimationEnd}
    >
      {!t.collapsed && (
        <button className="tst-x" aria-label="Dismiss" type="button" onClick={() => dismiss(t.id, 'auto')}>
          <Glyph name="close" />
        </button>
      )}
      <div className="tst-head">
        <span className="tst-ic">
          <Glyph name={TYPE_ICON[t.type]} spin={loading} />
        </span>
        <div className="tst-copy">
          <span className="tst-title">{t.title}</span>
        </div>
      </div>
      {hasBody && (
        <div className="tst-body">
          {t.desc && <span className="tst-desc">{t.desc}</span>}
          {t.showProgress && (
            <div className="tst-prog">
              <i className="tst-drain" style={{ animationDuration: `${t.duration}ms` }} />
            </div>
          )}
          {t.actions && (
            <div className="tst-actrow">
              {t.actions.map((a, i) => (
                <button
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  type="button"
                  className={`tst-act${a.ghost ? ' ghost' : ''}`}
                  onClick={() => (a.onClick ? a.onClick(t.id) : dismiss(t.id, 'auto'))}
                >
                  {a.icon && <Glyph name={a.icon} />}
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── static showcase toast (gallery states, non-interactive) ───────────────────
function StaticToast({
  type,
  icon,
  title,
  desc,
  collapsed,
  loading,
  progress,
  dismissable,
  actions,
  className,
  style,
}: {
  type?: ToastType
  icon: string
  title: string
  desc?: string
  collapsed?: boolean
  loading?: boolean
  progress?: number
  dismissable?: boolean
  actions?: React.ReactNode
  className?: string
  style?: CSSProperties
}) {
  const tc = loading ? 'loading' : type ? `t-${type}` : ''
  const hasBody = !collapsed && (desc || progress !== undefined || actions)
  return (
    <div
      className={['tst', tc, collapsed ? 'collapsed' : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      {dismissable && (
        <button className="tst-x" aria-label="Dismiss" type="button">
          <Glyph name="close" />
        </button>
      )}
      <div className="tst-head">
        <span className="tst-ic">
          <Glyph name={icon} spin={loading} />
        </span>
        <div className="tst-copy">
          <span className="tst-title">{title}</span>
        </div>
      </div>
      {hasBody && (
        <div className="tst-body">
          {desc && <span className="tst-desc">{desc}</span>}
          {progress !== undefined && (
            <div className="tst-prog">
              <i style={{ transform: `scaleX(${progress / 100})` }} />
            </div>
          )}
          {actions && <div className="tst-actrow">{actions}</div>}
        </div>
      )}
    </div>
  )
}

export default function Toast() {
  const toasts = useToasts()

  const fireStack = () => {
    push({ type: 'success', title: 'Call logged', collapsed: true })
    push({ type: 'warning', title: 'Follow-up due', collapsed: true })
    push({ type: 'info', title: 'Reminder set', collapsed: true })
  }

  return (
    <div className="tst-demo">
      {/* ── Live region ── */}
      <div className="tst-sec">
        <span className="tst-label">Live · tap to fire, drag to dismiss</span>
        <div className="tst-triggers">
          <button
            type="button"
            className="tst-trigger t-success"
            onClick={() =>
              push({ type: 'success', title: 'Deal saved', desc: 'Your pipeline changes are synced to the team.' })
            }
          >
            <Glyph name="check_circle" />
            Success
          </button>
          <button
            type="button"
            className="tst-trigger t-error"
            onClick={() =>
              push({ type: 'error', title: 'Network error', desc: 'Could not reach the server. Retry in a moment.' })
            }
          >
            <Glyph name="error" />
            Error
          </button>
          <button
            type="button"
            className="tst-trigger t-warning"
            onClick={() =>
              push({ type: 'warning', title: 'Quota almost reached', desc: 'You have used 90% of your monthly sends.' })
            }
          >
            <Glyph name="warning" />
            Warning
          </button>
          <button
            type="button"
            className="tst-trigger t-info"
            onClick={() =>
              push({ type: 'info', title: 'New lead assigned', desc: 'Mehmet Y. just entered your pipeline.' })
            }
          >
            <Glyph name="info" />
            Info
          </button>
          <button type="button" className="tst-trigger" onClick={() => push({ type: 'loading', title: 'Uploading…', collapsed: true })}>
            <Glyph name="autorenew" />
            Loading
          </button>
          <button type="button" className="tst-trigger" onClick={() => pushPromise()}>
            <Glyph name="east" />
            Promise
          </button>
          <button
            type="button"
            className="tst-trigger t-success"
            onClick={() =>
              push({
                type: 'success',
                title: 'Lead archived',
                desc: 'Removed from your active pipeline.',
                actions: [{ label: 'Undo', icon: 'undo' }, { label: 'Dismiss', ghost: true }],
              })
            }
          >
            <Glyph name="undo" />
            Action
          </button>
          <button type="button" className="tst-trigger" onClick={fireStack}>
            <Glyph name="layers" />
            Stack 3
          </button>
          <button type="button" className="tst-trigger t-clear" onClick={() => clearAll()}>
            <Glyph name="clear_all" />
            Clear
          </button>
        </div>
        <div className="tst-live">
          {toasts.map((t) => (
            <LiveToast key={t.id} t={t} />
          ))}
        </div>
      </div>

      {/* ── 1 · Collapsed pills ── */}
      <div className="tst-sec">
        <span className="tst-label">Collapsed · header only</span>
        <div className="tst-bezel">
          <StaticToast type="success" icon="check_circle" title="Saved" collapsed />
          <StaticToast type="error" icon="error" title="Upload failed" collapsed />
          <StaticToast type="warning" icon="warning" title="Verify details" collapsed />
          <StaticToast type="info" icon="info" title="New lead assigned" collapsed />
        </div>
      </div>

      {/* ── 2 · Expanded with auto-dismiss progress ── */}
      <div className="tst-sec">
        <span className="tst-label">Expanded · with auto-dismiss progress</span>
        <div className="tst-bezel">
          <StaticToast type="success" icon="check_circle" title="Deal saved" desc="Your pipeline changes are synced to the team." progress={62} dismissable />
          <StaticToast type="error" icon="error" title="Network error" desc="Could not reach the server. Retry in a moment." progress={34} dismissable />
          <StaticToast type="warning" icon="warning" title="Quota almost reached" desc="You have used 90% of your monthly sends." progress={78} dismissable />
          <StaticToast type="info" icon="info" title="New lead assigned" desc="Mehmet Y. just entered your pipeline." progress={50} dismissable />
        </div>
      </div>

      {/* ── 3 · Loading ── */}
      <div className="tst-sec">
        <span className="tst-label">Loading · spinner, no progress</span>
        <div className="tst-bezel">
          <StaticToast loading icon="autorenew" title="Uploading…" collapsed />
          <StaticToast loading icon="autorenew" title="Generating offer PDF" desc="Crunching the numbers for this lead…" />
        </div>
      </div>

      {/* ── 4 · Promise transition ── */}
      <div className="tst-sec">
        <span className="tst-label">Promise · loading resolves to success</span>
        <div className="tst-bezel">
          <div className="tst-promise">
            <StaticToast loading icon="autorenew" title="Saving lead…" collapsed style={{ width: 'auto' }} />
            <span className="tst-arrow">
              <Glyph name="east" />
            </span>
            <StaticToast type="success" icon="check_circle" title="Lead saved" collapsed style={{ width: 'auto' }} />
          </div>
        </div>
      </div>

      {/* ── 5 · Action button ── */}
      <div className="tst-sec">
        <span className="tst-label">With action</span>
        <div className="tst-bezel">
          <StaticToast
            type="success"
            icon="delete"
            title="Lead archived"
            desc="Removed from your active pipeline."
            dismissable
            actions={
              <>
                <button className="tst-act" type="button">
                  <Glyph name="undo" />
                  Undo
                </button>
                <button className="tst-act ghost" type="button">
                  Dismiss
                </button>
              </>
            }
          />
        </div>
      </div>

      {/* ── 6 · Stacking peek ── */}
      <div className="tst-sec">
        <span className="tst-label">Stacking · collapsed peek</span>
        <div className="tst-bezel">
          <div className="tst-stack">
            <span className="tst-stack-badge">3</span>
            <StaticToast type="info" icon="info" title="Reminder set" collapsed className="s2" />
            <StaticToast type="warning" icon="warning" title="Follow-up due" collapsed className="s1" />
            <StaticToast
              type="success"
              icon="check_circle"
              title="Call logged"
              desc="3 notifications. Tap to expand the stack."
              progress={70}
              className="s0"
            />
          </div>
        </div>
      </div>

      {/* ── 7 · Swipe affordance ── */}
      <div className="tst-sec">
        <span className="tst-label">Swipe / click to dismiss</span>
        <div className="tst-bezel">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <StaticToast
              type="info"
              icon="info"
              title="Swipe me away"
              desc="Drag the toast aside, or tap ✕ to dismiss."
              dismissable
              className="swiping"
            />
            <div className="tst-swipe-hint">
              <Glyph name="swipe" />
              drag horizontally to dismiss
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
