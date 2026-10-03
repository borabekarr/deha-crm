import type { MouseEvent, PointerEvent } from 'react'
import { useAutoHeight } from '@/lib/hooks/use-auto-height'
import { EXPAND_DURATION_MS, EXPAND_HEIGHT_EASING, type ToastVm } from './toast-vm'

// One stacked toast's card. Owns the expand region's height via
// useAutoHeight (duration/easing mirrored from ExpandableCard's main
// variant), so mount stays permanent through collapse -- only visibility
// changes -- per the mounted-through-exit-css-animations lesson.
//
// Render-only split of ToastStage (react-doctor no-giant-component): the
// state machine, phase transitions, timers and swipe gesture stay owned by
// ToastStage; this file only consumes the already-computed ToastVm and
// forwards callbacks. Class names, DOM order and inline style values are
// unchanged from ToastStage's own former inline JSX.
export function ToastCard({
  t,
  isExpanded,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPress,
  onDismiss,
}: {
  t: ToastVm
  isExpanded: boolean
  onPointerDown: (e: PointerEvent<HTMLElement>) => void
  onPointerMove: (e: PointerEvent<HTMLElement>) => void
  onPointerUp: (e: PointerEvent<HTMLElement>) => void
  onPress: () => void
  onDismiss: () => void
}) {
  const { ref } = useAutoHeight<HTMLDivElement>({
    open: isExpanded,
    duration: EXPAND_DURATION_MS,
    easing: EXPAND_HEIGHT_EASING,
  })
  return (
    <div
      style={t.wrapStyle}
      className="ts-wrap"
      data-ts-base={String(t.wrapStyle.transform)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      // onPointerDown below calls el.setPointerCapture on this element, which
      // per spec retargets the resulting synthetic click's dispatch path to
      // this captured element -- a click listener on any descendant (e.g.
      // the surfaceStyle div) never receives it. The tap handler has to live
      // here, on the capturing element itself, for the browser to deliver it.
      onClick={onPress}
    >
      <div className="shell" style={{ padding: '7px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)' }}>
        <div style={t.surfaceStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-icon-text)', padding: '12px 14px' }}>
            <div className="ts-icon-chip" style={t.iconBoxStyle}>
              {/* F11: geometric centring only -- lineHeight: 1 keeps the
                  inline-block's box equal to its font-size em-square so
                  placeItems: center on the parent centres the glyph exactly;
                  no per-glyph transform nudge (removed on purpose, see
                  toast-vm.ts). F16: .ts-icon-chip (Toast.css) locks the chip
                  to a full-round circle and clips any layer that could
                  otherwise protrude past its silhouette. */}
              <span className="material-icons ts-icon-glyph" style={{ fontSize: '18px', lineHeight: 1, display: 'inline-block' }}>{t.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={t.titleStyle}>{t.title}</span>
              {t.message ? <span style={t.messageStyle}>{t.message}</span> : null}
            </div>
            {t.hasAction ? (
              <button
                type="button"
                className="ts-pill-btn"
                style={t.actionStyle}
                onClick={(e: MouseEvent) => {
                  e.stopPropagation()
                  t.actionOnAction?.()
                  onDismiss()
                }}
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>{t.actionIcon}</span>
                {t.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              className="ts-close-btn"
              style={t.closeStyle}
              onClick={(e: MouseEvent) => {
                e.stopPropagation()
                onDismiss()
              }}
            >
              <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
            </button>
          </div>
          {t.hasExpand ? (
            <div className="ts-content" ref={ref}>
              <div style={t.expandStyle}>
                <div style={{ padding: '0 14px 12px 14px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={t.expandBodyStyle}>{t.expandText}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="ts-pill-btn"
                      style={t.actionStyle}
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        onDismiss()
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '14px' }}>close</span>Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
