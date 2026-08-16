import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './Dropdown.css'
import './proto/variants.css'

// ---------------------------------------------------------------------------
// Dropdown — Deha Design System
// A composable contextual menu that opens next to its trigger with smart
// auto-positioning, a spring scale+blur entrance, pointer-pan item
// highlighting, destructive items, and outside-tap / Escape dismiss.
//
// Composable API (mirrors the raw source):
//   <Dropdown>
//     <Dropdown.Trigger>…</Dropdown.Trigger>
//     <Dropdown.Content position="auto">
//       <Dropdown.Label>…</Dropdown.Label>
//       <Dropdown.Item icon shortcut onPress disabled destructive>…</Dropdown.Item>
//       <Dropdown.Separator />
//     </Dropdown.Content>
//   </Dropdown>
//
// Faithful port of
// apps/web/design-system/claude-design/raw/dropdown/dropdown.jsx —
// byte-preserved DOM/CSS per CONVERSION-SOP.md. Motion was tokenized and then
// reviewed in ds-review-overlays step 1, which deliberately departs from the
// raw timings in two places: press/release is now asymmetric (120ms press,
// 200ms release) and the menu plays a real exit leg while staying mounted
// (see `closing` below). See plans/scratch/ds-review/dropdown.md.
// ---------------------------------------------------------------------------

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { ProtoPicker } from './proto/ProtoPicker'

// ── placement math ──────────────────────────────────────────────────────

export type DropdownPosition = 'auto' | 'bottom' | 'top' | 'left' | 'right'
type Side = 'bottom' | 'top' | 'left' | 'right'

const OPPOSITE: Record<Side, Side> = { bottom: 'top', top: 'bottom', left: 'right', right: 'left' }
const ORIGIN: Record<Side, string> = {
  bottom: 'top left',
  top: 'bottom left',
  right: 'left top',
  left: 'right top',
}

/* Pick the best side + clamped coordinates for the menu given the trigger box,
   the measured menu size, the preferred side, and the viewport. */
function computePlacement(
  trig: { top: number; left: number; right: number; bottom: number },
  mw: number,
  mh: number,
  preferred: DropdownPosition,
  gap: number,
  pad: number,
): { side: Side; left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const fits: Record<Side, boolean> = {
    bottom: trig.bottom + gap + mh <= vh - pad,
    top: trig.top - gap - mh >= pad,
    right: trig.right + gap + mw <= vw - pad,
    left: trig.left - gap - mw >= pad,
  }
  const order: Side[] = ['bottom', 'top', 'right', 'left']
  let side: Side
  if (preferred === 'auto') {
    side = order.find((s) => fits[s]) || 'bottom'
  } else if (!fits[preferred]) {
    side = fits[OPPOSITE[preferred]] ? OPPOSITE[preferred] : order.find((s) => fits[s]) || preferred
  } else {
    side = preferred
  }

  let left: number
  let top: number
  if (side === 'bottom' || side === 'top') {
    left = trig.left // align left edges
    top = side === 'bottom' ? trig.bottom + gap : trig.top - gap - mh
  } else {
    top = trig.top // align top edges
    left = side === 'right' ? trig.right + gap : trig.left - gap - mw
  }
  // keep fully on-screen
  left = Math.min(Math.max(pad, left), Math.max(pad, vw - mw - pad))
  top = Math.min(Math.max(pad, top), Math.max(pad, vh - mh - pad))
  return { side, left, top }
}

/* Exit leg length in ms. Must stay in step with the `.dd-menu[data-exit="true"]`
   transition in Dropdown.css (var(--duration-150)); the runtime timer scales it
   by the live --anim-mult so JS cleanup cannot drift from the CSS. */
const EXIT_MS = 150

/* a soft haptic tick — the web analog of expo-haptics. No-op on desktop. */
function haptic() {
  try {
    navigator.vibrate && navigator.vibrate(6)
  } catch {
    /* no-op */
  }
}

// ── context ──────────────────────────────────────────────────────────────

interface DropdownCtxValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: RefObject<HTMLSpanElement | null>
  position: DropdownPosition
  duration: number
  gap: number
  padding: number
}

const DropdownCtx = createContext<DropdownCtxValue | null>(null)

// ── Dropdown ─────────────────────────────────────────────────────────────

export interface DropdownProps {
  position?: DropdownPosition
  duration?: number
  gap?: number
  padding?: number
  children?: ReactNode
}

function DropdownBase({ position = 'auto', duration = 260, gap = 8, padding = 12, children }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const ctx = useMemo<DropdownCtxValue>(
    () => ({ open, setOpen, triggerRef, position, duration, gap, padding }),
    [open, position, duration, gap, padding],
  )
  return <DropdownCtx.Provider value={ctx}>{children}</DropdownCtx.Provider>
}

// ── Trigger ──────────────────────────────────────────────────────────────
/* Unified pointer model: a plain tap toggles the menu (and leaves it open);
   pressing and dragging past a small threshold opens immediately and enters
   "pan" mode so you can slide onto an item and release to select — the click
   that would otherwise re-toggle is suppressed. */

export interface TriggerProps {
  children?: ReactNode
}

function Trigger({ children }: TriggerProps) {
  const { open, setOpen, triggerRef } = useContext(DropdownCtx)!
  const suppressClick = useRef(false)

  const onPointerDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (e.button != null && e.button !== 0) return
    const startX = e.clientX
    const startY = e.clientY
    let panning = false
    const move = (ev: PointerEvent) => {
      if (!panning && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) {
        panning = true
        suppressClick.current = true
        setOpen(true)
        window.dispatchEvent(new CustomEvent('dd:pan', { detail: { x: ev.clientX, y: ev.clientY } }))
      }
      if (panning) {
        window.dispatchEvent(new CustomEvent('dd:panmove', { detail: { x: ev.clientX, y: ev.clientY } }))
      }
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (panning) window.dispatchEvent(new CustomEvent('dd:panend', { detail: { x: ev.clientX, y: ev.clientY } }))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    setOpen(!open)
  }

  return (
    <span className="dd-trigger" ref={triggerRef} onPointerDown={onPointerDown} onClick={onClick}>
      {/* clone so an arbitrary trigger child reflects open state for styling */}
      {Children.map(children, (c) =>
        isValidElement(c) ? cloneElement(c as ReactElement<{ 'data-open'?: boolean }>, { 'data-open': open }) : c,
      )}
    </span>
  )
}

// ── Content ──────────────────────────────────────────────────────────────
/* Renders into a fixed portal. Measures itself, computes placement, then
   reveals with the spring entrance. Owns the pan-highlight bookkeeping and
   all dismissal (scrim tap, Escape, scroll/resize). */

export interface ContentProps {
  position?: DropdownPosition
  children?: ReactNode
}

function Content({ position, children }: ContentProps) {
  const ctx = useContext(DropdownCtx)!
  const { open, setOpen, triggerRef, duration, gap, padding } = ctx
  const pos = position || ctx.position

  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ side: Side; left: number; top: number } | null>(null)
  const [enter, setEnter] = useState(false)
  const [closing, setClosing] = useState(false) // mounted-through-exit window
  const [active, setActive] = useState(-1) // pan/keyboard highlighted index
  const wasOpen = useRef(false)

  // collect Item children so pan + keyboard can target them by index
  const flat = Children.toArray(children)
  const itemIdx: number[] = []
  flat.forEach((c, i) => {
    if (isValidElement(c) && c.type === Item && !(c.props as ItemProps).disabled) itemIdx.push(i)
  })

  /* Render-phase derivation, deliberately not an effect: deciding this in an
     effect would render `null` for the frame `open` flips, unmounting the menu
     before the exit leg could start (a removed node animates nothing). */
  if (open && closing) setClosing(false)
  else if (!open && wasOpen.current && !closing) setClosing(true)

  // measure + place on open; on close, hold the node mounted for the exit leg
  useLayoutEffect(() => {
    if (!open) {
      setEnter(false)
      setActive(-1)
      if (!wasOpen.current) return
      wasOpen.current = false
      // read the live multiplier so the unmount timer cannot drift from the CSS
      const menuEl = menuRef.current
      const mult = menuEl
        ? Number(getComputedStyle(menuEl).getPropertyValue('--anim-mult')) || 1
        : 1
      const t = window.setTimeout(() => {
        setClosing(false)
        setCoords(null)
      }, EXIT_MS * mult)
      return () => window.clearTimeout(t)
    }
    wasOpen.current = true
    const trig = triggerRef.current?.getBoundingClientRect()
    const menu = menuRef.current
    if (!trig || !menu) return
    const place = () => setCoords(computePlacement(trig, menu.offsetWidth, menu.offsetHeight, pos, gap, padding))
    place()
    const r = requestAnimationFrame(() => setEnter(true))
    return () => cancelAnimationFrame(r)
  }, [open, pos, gap, padding, triggerRef])

  // dismissal + reposition listeners
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => {
          const cur = itemIdx.indexOf(a)
          const next =
            e.key === 'ArrowDown'
              ? itemIdx[Math.min(itemIdx.length - 1, cur + 1)]
              : itemIdx[Math.max(0, cur - 1)]
          if (next !== a) haptic()
          return next ?? itemIdx[0]
        })
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // pan highlighting driven by the Trigger's drag, via elementFromPoint
  useEffect(() => {
    if (!open) return
    const hitTest = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)
      const row = el && el.closest && (el.closest('.dd-item') as HTMLElement | null)
      if (!row || row.hasAttribute('disabled')) {
        setActive((a) => (a !== -1 ? -1 : a))
        return
      }
      const idx = Number(row.dataset.idx)
      setActive((a) => {
        if (a !== idx) haptic()
        return idx
      })
    }
    const onMove = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail
      hitTest(x, y)
    }
    const onEnd = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail
      const el = document.elementFromPoint(x, y)
      const row = el && el.closest && (el.closest('.dd-item') as HTMLElement | null)
      if (row && !row.hasAttribute('disabled')) row.click()
      else setActive(-1)
    }
    window.addEventListener('dd:panmove', onMove)
    window.addEventListener('dd:panend', onEnd)
    return () => {
      window.removeEventListener('dd:panmove', onMove)
      window.removeEventListener('dd:panend', onEnd)
    }
  }, [open])

  if (!open && !closing) return null

  const select = (onPress?: () => void) => {
    setOpen(false)
    onPress && onPress()
  }

  const menu = (
    <div className="dd-portal" data-exit={closing ? 'true' : 'false'}>
      <div className="dd-scrim" onClick={() => setOpen(false)} />
      <div
        ref={menuRef}
        className="dd-menu"
        role="menu"
        data-enter={enter}
        data-exit={closing ? 'true' : 'false'}
        data-side={coords?.side}
        onMouseLeave={() => setActive(-1)}
        style={
          {
            '--dd-dur': duration + 'ms',
            left: coords ? coords.left : -9999,
            top: coords ? coords.top : -9999,
            transformOrigin: coords ? ORIGIN[coords.side] : 'top left',
            visibility: coords ? 'visible' : 'hidden',
          } as CSSProperties
        }
      >
        {flat.map((c, i) => {
          if (!isValidElement(c)) return c
          if (c.type === Item) {
            return cloneElement(c as ReactElement<ItemProps>, {
              key: i,
              _idx: i,
              _active: active === i,
              _onActivate: () => setActive(i),
              _select: select,
            })
          }
          return cloneElement(c, { key: i })
        })}
      </div>
    </div>
  )
  return createPortal(menu, document.body)
}

// ── Item ─────────────────────────────────────────────────────────────────

export interface ItemProps {
  icon?: string
  shortcut?: string
  children?: ReactNode
  onPress?: () => void
  disabled?: boolean
  destructive?: boolean
  _idx?: number
  _active?: boolean
  _onActivate?: () => void
  _select?: (onPress?: () => void) => void
}

function Item({
  icon,
  shortcut,
  children,
  onPress,
  disabled = false,
  destructive = false,
  _idx,
  _active,
  _onActivate,
  _select,
}: ItemProps) {
  return (
    <button
      className={'dd-item' + (destructive ? ' is-destructive' : '')}
      type="button"
      role="menuitem"
      data-idx={_idx}
      data-active={_active ? 'true' : 'false'}
      disabled={disabled}
      onMouseEnter={() => !disabled && _onActivate && _onActivate()}
      onClick={() => !disabled && _select && _select(onPress)}
    >
      {icon && (
        <span className="ic msym" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="dd-item-label">{children}</span>
      {shortcut && <span className="dd-item-shortcut">{shortcut}</span>}
    </button>
  )
}

// ── Label / Separator ───────────────────────────────────────────────────

function Label({ children }: { children?: ReactNode }) {
  return <div className="dd-label">{children}</div>
}

function Separator() {
  return <div className="dd-sep" role="separator" />
}

// attach sub-components (composable namespace API)
export const Dropdown = Object.assign(DropdownBase, { Trigger, Content, Item, Label, Separator })

// ── icon ─────────────────────────────────────────────────────────────────

function Sym({ name }: { name: string }) {
  return (
    <span className="msym" aria-hidden="true">
      {name}
    </span>
  )
}

// ── default demo shell ──────────────────────────────────────────────────
// Mirrors the raw source's Demo()/App() at its canonical TW-default state:
// position: 'auto', speed: 260, shortcuts: true, dark: false. The raw
// source's tweaks panel is authoring-only tooling (never checked into the
// repo, see pixel-gate harness) and is not part of the converted component.

function Demo() {
  const shortcuts = true
  return (
    <div className="dd-stage">
      <div className="demo-card">
        <span className="demo-thumb msym" aria-hidden="true">
          folder_open
        </span>
        <span className="demo-meta">
          <span className="demo-title">Q3 Launch Assets</span>
          <span className="demo-sub">Edited 2h ago · 48 files</span>
        </span>

        <Dropdown position="auto" duration={260}>
          <Dropdown.Trigger>
            <button className="dd-iconbtn" aria-label="More actions">
              <Sym name="more_horiz" />
            </button>
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Label>Actions</Dropdown.Label>
            <Dropdown.Item icon="edit" shortcut={shortcuts ? '⌘E' : undefined} onPress={() => {}}>
              Rename
            </Dropdown.Item>
            <Dropdown.Item icon="content_copy" shortcut={shortcuts ? '⌘D' : undefined} onPress={() => {}}>
              Duplicate
            </Dropdown.Item>
            <Dropdown.Item icon="drive_file_move" onPress={() => {}}>
              Move to…
            </Dropdown.Item>
            <Dropdown.Item icon="archive" onPress={() => {}}>
              Archive
            </Dropdown.Item>
            <Dropdown.Separator />
            <Dropdown.Item icon="delete" destructive shortcut={shortcuts ? '⌫' : undefined} onPress={() => {}}>
              Delete
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown>
      </div>

      <span className="dd-hint">
        <Sym name="ads_click" />
        Tap ⋯ — or press &amp; drag over the items
      </span>
    </div>
  )
}

// ── prototype surface (ds-review-overlays step 2) ────────────────────────
// Three divergent directions behind the prototype skill's picker; "Main" is
// the shipped component untouched and is the designated cherry-pick baseline
// (star in the picker). Variant styling lives entirely in proto/variants.css,
// keyed off a .ddv-<slug> class on <html> because the menu portals to <body>.
// Delete this block + proto/ to strip the prototypes.

const VARIANT_SLUGS = ['main', 'assembled', 'glass', 'weighted'] as const
const VARIANT_NAMES = ['Main', 'Assembled', 'Glass', 'Weighted']

export default function DropdownDemo() {
  const [variant, setVariant] = useState(0)
  const [nonce, setNonce] = useState(0) // replay: re-mount so entrances re-run
  const slug = VARIANT_SLUGS[variant]

  useEffect(() => {
    const cls = 'ddv-' + slug
    document.documentElement.classList.add(cls)
    return () => document.documentElement.classList.remove(cls)
  }, [slug])

  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      <div className={'dd-proto-root ddv-' + slug} data-variant={slug} key={slug + ':' + nonce}>
        <Demo />
      </div>
      <ProtoPicker
        names={VARIANT_NAMES}
        index={variant}
        mainIndex={0}
        onSelect={setVariant}
        onReplay={() => setNonce((n) => n + 1)}
      />
    </div>
  )
}
