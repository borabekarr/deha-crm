import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './DisclosureGroup.css'
import './variants.css'
import { VariantPicker } from './VariantPicker'

// ---------------------------------------------------------------------------
// Disclosure Group — Deha Design System
// A composable, expandable section (accordion-style). Tap the Trigger to
// reveal the Items; height is measured height + CSS transition on .dg-clip
// (grid-template-rows 0fr -> 1fr), the chevron rotates 180deg, and the
// content can optionally sharpen out of a blur as it opens. Items are
// pressable rows with a subtle scale-on-press. Wrap several groups in
// <Accordion> to make them mutually exclusive.
//
// Faithful port of
// apps/web/design-system/claude-design/raw/disclosure-group/disclosure-group.jsx —
// byte-preserved DOM/CSS/timings per CONVERSION-SOP.md. No motion
// tokenization in this pass (deferred to a later value-identical pass).
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

// ── contexts ─────────────────────────────────────────────────────────────

interface DisclosureCtxValue {
  open: boolean
  toggle: () => void
  dur: number
  ease: string
}

interface AccordionCtxValue {
  openId: string | null
  setOpen: (id: string, next: boolean) => void
}

const DisclosureCtx = createContext<DisclosureCtxValue | null>(null) // per-group: { open, toggle, dur, ease }
const AccordionCtx = createContext<AccordionCtxValue | null>(null) // optional coordinator: { openId, setOpen }

// ── Accordion (optional) ────────────────────────────────────────────────

export interface AccordionProps {
  defaultOpenId?: string | null
  children?: ReactNode
}

export function Accordion({ defaultOpenId = null, children }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId)
  const value = useMemo<AccordionCtxValue>(
    () => ({
      openId,
      setOpen: (id, next) => setOpenId((cur) => (next ? id : cur === id ? null : cur)),
    }),
    [openId],
  )
  return <AccordionCtx.Provider value={value}>{children}</AccordionCtx.Provider>
}

// ── DisclosureGroup ─────────────────────────────────────────────────────

export interface DisclosureGroupProps {
  id?: string
  defaultOpen?: boolean
  duration?: number
  easing?: string
  children?: ReactNode
}

export function DisclosureGroupBase({ id, defaultOpen = false, duration = 380, easing, children }: DisclosureGroupProps) {
  const autoId = useId()
  const gid = id || autoId
  const ease = easing || 'cubic-bezier(.22,1,.36,1)'

  // If inside an <Accordion>, the coordinator owns open-state; otherwise local.
  const acc = useContext(AccordionCtx)
  const [localOpen, setLocalOpen] = useState(defaultOpen)

  // Seed the accordion with this group's defaultOpen the first time.
  useEffect(() => {
    if (acc && defaultOpen) acc.setOpen(gid, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const open = acc ? acc.openId === gid : localOpen
  const toggle = useCallback(() => {
    if (acc) acc.setOpen(gid, !(acc.openId === gid))
    else setLocalOpen((v) => !v)
  }, [acc, gid])

  const ctx = useMemo<DisclosureCtxValue>(() => ({ open, toggle, dur: duration, ease }), [open, toggle, duration, ease])

  return (
    <DisclosureCtx.Provider value={ctx}>
      <div
        className="dg"
        data-open={open}
        style={{ '--dg-dur': duration + 'ms', '--dg-ease': ease } as CSSProperties}
      >
        {children}
      </div>
    </DisclosureCtx.Provider>
  )
}

// ── Trigger ──────────────────────────────────────────────────────────────

export interface TriggerProps {
  icon?: string
  title?: ReactNode
  subtitle?: ReactNode
  showChevron?: boolean
  chevronColor?: string
}

export function Trigger({ icon, title, subtitle, showChevron = true, chevronColor }: TriggerProps) {
  const { open, toggle } = useContext(DisclosureCtx)!
  return (
    <button className="dg-trigger" onClick={toggle} aria-expanded={open} type="button">
      {icon && (
        <span className="dg-tile msym" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="dg-head-text">
        <span className="dg-title">{title}</span>
        {subtitle && <span className="dg-sub">{subtitle}</span>}
      </span>
      {showChevron && (
        <span
          className="dg-chevron msym"
          aria-hidden="true"
          style={chevronColor ? { color: chevronColor } : undefined}
        >
          expand_more
        </span>
      )}
    </button>
  )
}

// ── Items ────────────────────────────────────────────────────────────────

export interface ItemsProps {
  children?: ReactNode
  maxHeight?: number
  scrollable?: boolean
  useBlur?: boolean
  blurAmount?: number
  style?: CSSProperties
}

export function Items({ children, maxHeight = 400, scrollable = true, useBlur = false, blurAmount = 8, style }: ItemsProps) {
  const { open } = useContext(DisclosureCtx)!
  return (
    // `inert` (not aria-hidden alone): the collapsed panel keeps focusable
    // buttons in the DOM, and focusable content inside an aria-hidden subtree
    // is an a11y violation — inert removes them from focus + AT together.
    <div className="dg-clip" aria-hidden={!open} inert={!open}>
      <div className="dg-items">
        <div
          className="dg-scroll"
          style={
            {
              maxHeight: scrollable ? maxHeight : 'none',
              overflowY: scrollable ? 'auto' : 'hidden',
              '--dg-blur': useBlur && !open ? blurAmount + 'px' : '0px',
              ...style,
            } as CSSProperties
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Item ─────────────────────────────────────────────────────────────────

export interface ItemProps {
  icon?: string
  children?: ReactNode
  value?: ReactNode
  dotColor?: string
  onPress?: () => void
  disabled?: boolean
  style?: CSSProperties
}

export function Item({ icon, children, value, dotColor, onPress, disabled = false, style }: ItemProps) {
  return (
    <button className="dg-item" type="button" disabled={disabled} style={style} onClick={disabled ? undefined : onPress}>
      {dotColor && <span className="dg-dot" style={{ background: dotColor }} aria-hidden="true" />}
      {icon && (
        <span className="ic msym" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="dg-item-label">{children}</span>
      {value != null && (
        <span className="dg-item-val">
          {value}
          <span className="msym" aria-hidden="true">
            chevron_right
          </span>
        </span>
      )}
    </button>
  )
}

// ── default demo shell ──────────────────────────────────────────────────
// Mirrors the raw source's App()/SettingsPanel() at its canonical TW-default
// state: accordion: true, blur: true, chevron: true, dark: false. The raw
// source's tweaks panel is authoring-only tooling (never checked into the
// repo, see pixel-gate harness) and is not part of the converted component.

// Review fix (ds-review-expandables step 5): the raw source's 600ms demo
// expansion is well past the craft bar for a UI reveal (and dragged the
// chevron + hover tint with it). Back to the primitive's own 380ms default,
// which is the container-expansion budget for a panel this size.
const SETTINGS_GROUP_PROPS = { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }

function SettingsPanel({ accordion, blur, chevron }: { accordion: boolean; blur: boolean; chevron: boolean }) {
  const groupProps = SETTINGS_GROUP_PROPS
  const itemsProps = { useBlur: blur, maxHeight: 230 }

  const groups = (
    <>
      <DisclosureGroupBase id="account" defaultOpen {...groupProps}>
        <Trigger icon="account_circle" title="Account" subtitle="Profile, login & security" showChevron={chevron} />
        <Items {...itemsProps}>
          <Item icon="badge" value="Dana Holloway" onPress={() => {}}>
            Profile
          </Item>
          <Item icon="mail" value="dana@deha.co" onPress={() => {}}>
            Email
          </Item>
          <Item icon="lock" value="••••••••" onPress={() => {}}>
            Password
          </Item>
          <Item icon="verified_user" value="On" onPress={() => {}}>
            Two-factor auth
          </Item>
        </Items>
      </DisclosureGroupBase>

      <DisclosureGroupBase id="notify" {...groupProps}>
        <Trigger icon="notifications" title="Notifications" subtitle="3 channels enabled" showChevron={chevron} />
        <Items {...itemsProps}>
          <Item icon="smartphone" value="On" onPress={() => {}}>
            Push
          </Item>
          <Item icon="forum" value="Mentions" onPress={() => {}}>
            Email digest
          </Item>
          <Item icon="alternate_email" value="All" onPress={() => {}}>
            Mentions
          </Item>
          <Item icon="do_not_disturb_on" value="22:00" onPress={() => {}}>
            Quiet hours
          </Item>
        </Items>
      </DisclosureGroupBase>

      <DisclosureGroupBase id="appearance" {...groupProps}>
        <Trigger icon="palette" title="Appearance" subtitle="Theme & display" showChevron={chevron} />
        <Items {...itemsProps}>
          <Item icon="dark_mode" value="Light" onPress={() => {}}>
            Theme
          </Item>
          <Item icon="format_size" value="Medium" onPress={() => {}}>
            Text size
          </Item>
          <Item dotColor="var(--brand-primary)" value="Emerald" onPress={() => {}}>
            Accent color
          </Item>
          <Item icon="grid_view" value="Comfortable" disabled>
            Density
          </Item>
        </Items>
      </DisclosureGroupBase>
    </>
  )

  return <div className={'dg-list' + (accordion ? ' is-accordion' : '')}>{accordion ? <Accordion defaultOpenId="account">{groups}</Accordion> : groups}</div>
}

// ── prototype variant surface (ds-review-expandables step 6) ────────────
// `main` is the step-5 result and carries NO CSS deltas; the other two are
// [data-variant] overrides in variants.css. The grid-template-rows reveal is
// retained in every direction.
const VARIANTS = [
  { id: 'main', label: 'main' },
  { id: 'cascade', label: 'cascade' },
  { id: 'ledger', label: 'ledger' },
] as const

export default function DisclosureGroupDemo() {
  // Picker selection persisted via `?v=N` (falls back to 1 = main). Read lazily
  // and written in the click handler, so the component gains no new effect;
  // the picker's own listeners live in VariantPicker.
  const [variantIndex, setVariantIndex] = useState(() => {
    const raw = Number.parseInt(new URLSearchParams(window.location.search).get('v') ?? '', 10)
    return raw >= 1 && raw <= VARIANTS.length ? raw - 1 : 0
  })
  const variant = VARIANTS[variantIndex].id
  const selectVariant = useCallback((i: number) => {
    setVariantIndex(i)
    const url = new URL(window.location.href)
    url.searchParams.set('v', String(i + 1))
    window.history.replaceState(null, '', url)
  }, [])

  return (
    // .dg-root is `display: contents` — it carries data-variant and nothing else,
    // so the default render's box tree stays byte-identical to step 5.
    <div className="dg-root" data-variant={variant}>
      {/* remount the panel per variant so open-state seeds cleanly and the
          reveal choreography re-runs on switch, same as the raw source's App()
          remount on mode flip (key={t.accordion ? 'acc' : 'multi'}) */}
      <SettingsPanel key={variant} accordion blur chevron />
      <VariantPicker labels={VARIANTS.map((v) => v.label)} index={variantIndex} onSelect={selectVariant} />
    </div>
  )
}
