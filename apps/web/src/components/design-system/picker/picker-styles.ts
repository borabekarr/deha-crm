// Non-component style helpers shared between Picker.tsx and PickerFace.tsx,
// split out so Picker.tsx only exports its default component
// (react-doctor/only-export-components -- value exports alongside a
// component defeat Fast Refresh). Values, ordering and comments are
// unchanged from Picker.tsx.
import type { CSSProperties } from 'react'

// Raw source constants (picker.html): `ITEM_H = 44`, `OPEN_W = 328`,
// `OPEN_H = 466`. The 132px spacer divs above/below each wheel's items are
// literals in the raw markup ((7 * 44 - 44) / 2), as is the 308px wheel
// height (7 * 44).
// F7: OPEN_H trimmed 466 -> 453 (13px) to equalize the confirm button's
// vertical gaps -- gap above (tray bottom -> confirm top, driven by
// `--gap-stack`) measured 16px while gap below (confirm bottom -> card
// bottom) measured 29px; shortening the card's bottom by the 13px
// difference brings both to 16px without touching the top gap.
const OPEN_W = 328
const OPEN_H = 453

const t = (ms: number) => `calc(${ms}ms * var(--anim-mult, 1))`

export const shellStyle = (open: boolean): CSSProperties => ({
  width: 'fit-content',
  borderRadius: '28px',
  padding: open ? '10px' : '0px',
  background: open ? 'var(--shell-bg)' : 'transparent',
  boxShadow: open ? '0 10px 30px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)' : 'none',
  transition: `padding ${t(500)} var(--ease-spring-pop), background-color ${t(300)} var(--ease-fade), box-shadow ${t(300)} var(--ease-fade)`,
})

// FAB-style morph styles (mirrors _fab.css timings/beziers)
export const boxStyle = (open: boolean): CSSProperties => {
  const common = `width ${t(500)} var(--ease-spring-pop), height ${t(500)} var(--ease-spring-pop), border-radius ${t(500)} var(--ease-standard), background-color ${t(300)} var(--ease-fade), border-color ${t(300)} var(--ease-fade), box-shadow ${t(300)} var(--ease-fade), transform ${t(120)} var(--ease-standard)`
  return {
    position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
    cursor: open ? 'default' : 'pointer',
    // F10: the confirmed pill keeps the SAME footprint as the unconfirmed
    // 58px button (no auto/padding growth) -- the glyph row inside morphs,
    // the box itself never resizes on confirm.
    width: open ? `${OPEN_W}px` : '58px',
    height: open ? `${OPEN_H}px` : '58px',
    borderRadius: open ? 'var(--card-radius)' : '9999px',
    backgroundColor: open ? 'var(--card-bg)' : '#10B981',
    backgroundImage: open
      ? 'none'
      : 'linear-gradient(rgba(255,255,255,0.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.13) 1px, transparent 1px)',
    backgroundSize: '9px 9px',
    border: `1px solid ${open ? 'var(--card-border)' : 'transparent'}`,
    boxShadow: open
      ? 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(15,23,42,0.04)'
      : '0 14px 34px -8px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.15)',
    transition: common,
    fontFamily: 'var(--font-display)',
  }
}

export const glyphStyle = (open: boolean): CSSProperties => ({
  position: 'absolute', inset: '0', display: 'grid', placeItems: 'center',
  color: '#fff', pointerEvents: 'none', zIndex: 2,
  opacity: open ? 0 : 1,
  transform: open ? 'rotate(45deg) scale(0.6)' : 'none',
  transition: `opacity ${t(180)} var(--ease-fade), transform ${t(280)} var(--ease-standard)`,
})

export const contentStyle = (open: boolean): CSSProperties => ({
  position: 'absolute', top: '0', left: '0',
  width: `${OPEN_W}px`, height: `${OPEN_H}px`, boxSizing: 'border-box',
  padding: 'var(--pad-card)', display: 'flex', flexDirection: 'column',
  opacity: open ? 1 : 0,
  transform: open ? 'none' : 'translateY(12px)',
  pointerEvents: open ? 'auto' : 'none',
  transition: `opacity ${t(500)} var(--ease-spring-pop), transform ${t(500)} var(--ease-spring-pop)`,
})

export const closeStyle = (open: boolean): CSSProperties => ({
  flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%',
  background: 'rgba(15,23,42,0.07)', border: 'none', cursor: 'pointer',
  display: 'grid', placeItems: 'center', color: 'var(--fg3)',
  opacity: open ? 1 : 0,
  transform: open ? 'scale(1)' : 'scale(0.5)',
  pointerEvents: open ? 'auto' : 'none',
  transition: `opacity ${t(200)} var(--ease-fade) ${open ? t(160) : '0ms'}`
    + `, transform ${t(240)} var(--ease-spring-soft) ${open ? t(160) : '0ms'}`,
})

// Static inline styles lifted verbatim from the raw markup's own
// `style="..."` attributes.
export const headerRowStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 'var(--gap-icon-text)' }
export const headerColStyle: CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }
export const titleStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 'var(--gap-icon-text)',
  fontSize: 'var(--type-h4)', fontWeight: 900, letterSpacing: '-0.015em', color: 'var(--fg1)',
}
export const selectionBarStyle: CSSProperties = {
  position: 'absolute', left: '10px', right: '10px', top: '50%', height: '44px',
  transform: 'translateY(-50%)', borderRadius: '12px',
  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
  boxShadow: '0 1px 3px rgba(15,23,42,0.08)', pointerEvents: 'none',
}
export const footerRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--gap-stack)',
}
