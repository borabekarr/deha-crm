import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './SprintPlannerCore.css'
import { useState, useRef, useMemo, useCallback } from 'react'
import { iconClass } from '@/lib/iconClass'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '@/lib/hooks'
import {
  spcRootRef,
  cleanupSpcRoot,
  spcPaletteRef,
  cleanupSpcPalette,
  spcModalRef,
  cleanupSpcModal,
  spcScrollRef,
  cleanupSpcScroll,
  makeToastTimer,
  makeFlashTimer,
  makeMorphOutTimer,
} from './sprint-planner-core-hook'

// ---------------------------------------------------------------------------
// AI STUB
// The original prototype called a cloud AI completion API to route
// free-text commands. We stub this with a deterministic
// local function that returns a canned planner suggestion so the command
// palette is fully interactive without a backend.
// ---------------------------------------------------------------------------
async function stubClaudeComplete(prompt: string): Promise<string> {
  // Pick a reasonable default based on keyword matching
  const lower = prompt.toLowerCase()
  let action = 'rebalance'
  if (lower.includes('p0') && (lower.includes('monday') || lower.includes('mon'))) action = 'p0_to_mon'
  else if (lower.includes('p0') && lower.includes('earliest')) action = 'p0_earliest'
  else if (lower.includes('fill')) action = 'fill'
  else if (lower.includes('p2') || lower.includes('low priority')) action = 'remove_p2'
  else if (lower.includes('shift') || lower.includes('push')) action = 'shift_right'
  else if (lower.includes('buffer')) action = 'add_buffer'
  else if (lower.includes('clear') || lower.includes('empty')) action = 'clear'
  return JSON.stringify({ action, echo: 'Rebalancing the sprint.' })
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const WEEK1_DATES = [18, 19, 20, 21, 22]
const WEEK2_DATES = [25, 26, 27, 28, 29]
const TODAY_INDEX = 2 // Wed of week 1 in the reference shot

const PRIORITY: Record<string, { color: string; bg: string; label: string; rank: number }> = {
  P0: { color: '#EF4444', bg: '#FEF2F2', label: 'P0', rank: 0 },
  P1: { color: '#F97316', bg: '#FFF7ED', label: 'P1', rank: 1 },
  P2: { color: 'var(--brand-primary-500)', bg: 'var(--brand-primary-50)', label: 'P2', rank: 2 },
}

interface TicketData {
  id: string
  title: string
  priority: string
  day: number
}

const initialTickets = (): TicketData[] => [
  { id: 't1', title: 'Fix dark mode flicker on initial load', priority: 'P0', day: 0 },
  { id: 't2', title: 'Audit a11y on settings page', priority: 'P1', day: 1 },
  { id: 't3', title: 'Add keyboard nav to command bar', priority: 'P1', day: 1 },
  { id: 't4', title: 'Migrate to Geist Mono for code blocks', priority: 'P2', day: 2 },
  { id: 't5', title: 'Ship inline comments on diff review', priority: 'P0', day: 4 },
  { id: 't6', title: 'Update onboarding copy', priority: 'P2', day: 4 },
  { id: 't7', title: 'Investigate slow query on /agents endpoint', priority: 'P0', day: 5 },
  { id: 't8', title: 'Quarterly retro deck', priority: 'P1', day: 7 },
]

const SAMPLE_FILL = [
  { title: 'Refactor billing webhook handler', priority: 'P1' },
  { title: 'Write incident runbook for outage', priority: 'P2' },
  { title: 'Spike: streaming SSR for dashboard', priority: 'P2' },
  { title: 'Patch CVE-2026-0419 in auth lib', priority: 'P0' },
  { title: 'Triage backlog with PM', priority: 'P2' },
  { title: 'Update SDK type definitions', priority: 'P1' },
  { title: 'Polish empty states across app', priority: 'P2' },
  { title: 'Migrate logs to OpenTelemetry', priority: 'P1' },
  { title: 'Add rate limiting to /export', priority: 'P0' },
  { title: 'Document plugin contract v2', priority: 'P2' },
]

let _uid = 1000
const newId = () => `t${++_uid}`

// ---------------------------------------------------------------------------
// AI action engine (deterministic, no backend needed)
// ---------------------------------------------------------------------------
function runAction(actionId: string, state: TicketData[]): { state: TicketData[]; msg: string } {
  const ts = state.map((t) => ({ ...t }))
  switch (actionId) {
    case 'rebalance': {
      const sorted = [...ts].sort((a, b) => (PRIORITY[a.priority]?.rank ?? 9) - (PRIORITY[b.priority]?.rank ?? 9))
      sorted.forEach((t, i) => { t.day = i % 10 })
      return { state: sorted, msg: `Rebalanced ${sorted.length} tickets across all 10 days` }
    }
    case 'p0_to_mon': {
      let moved = 0
      ts.forEach((t) => { if (t.priority === 'P0' && t.day !== 0) { t.day = 0; moved++ } })
      return { state: ts, msg: `Moved ${moved} P0 ticket${moved === 1 ? '' : 's'} to Monday of Week 1` }
    }
    case 'p0_earliest': {
      const p0s = ts.filter((t) => t.priority === 'P0')
      p0s.forEach((t, i) => { t.day = i })
      return { state: ts, msg: `Front-loaded ${p0s.length} P0 ticket${p0s.length === 1 ? '' : 's'} to days 1–${p0s.length}` }
    }
    case 'fill': {
      const counts = Array(10).fill(0)
      ts.forEach((t) => counts[t.day]++)
      const empty = counts.map((c, i) => ({ c, i })).filter((x) => x.c === 0).map((x) => x.i)
      const added: TicketData[] = []
      empty.forEach((d, i) => {
        const sample = SAMPLE_FILL[i % SAMPLE_FILL.length]
        added.push({ id: newId(), title: sample.title, priority: sample.priority, day: d })
      })
      return { state: [...ts, ...added], msg: added.length ? `Filled ${added.length} empty day${added.length === 1 ? '' : 's'} with sample tickets` : 'No empty days to fill' }
    }
    case 'remove_p2': {
      const before = ts.length
      const next = ts.filter((t) => t.priority !== 'P2')
      return { state: next, msg: `Removed ${before - next.length} P2 ticket${before - next.length === 1 ? '' : 's'}` }
    }
    case 'shift_right': {
      let dropped = 0
      const next: TicketData[] = []
      ts.forEach((t) => {
        if (t.day + 1 > 9) dropped++
        else next.push({ ...t, day: t.day + 1 })
      })
      return { state: next, msg: `Shifted ${next.length} ticket${next.length === 1 ? '' : 's'} forward by 1 day${dropped ? ` (${dropped} dropped off the end)` : ''}` }
    }
    case 'add_buffer': {
      const counts = Array(10).fill(0)
      ts.forEach((t) => counts[t.day]++)
      const empty = counts.map((c, i) => ({ c, i })).filter((x) => x.c === 0).map((x) => x.i)
      const added = empty.map((d) => ({
        id: newId(),
        title: 'Buffer day — protected time for unknowns',
        priority: 'BUFFER',
        day: d,
      }))
      return { state: [...ts, ...added], msg: added.length ? `Added ${added.length} buffer day${added.length === 1 ? '' : 's'}` : 'No empty days for buffers' }
    }
    case 'clear':
      return { state: [], msg: `Cleared ${ts.length} ticket${ts.length === 1 ? '' : 's'}` }
    default:
      return { state: ts, msg: 'Nothing changed' }
  }
}

// ---------------------------------------------------------------------------
// Free-text → action (uses local stub, no live AI backend)
// ---------------------------------------------------------------------------
async function interpretWithClaude(query: string, currentState: TicketData[]): Promise<{ action: string; echo: string }> {
  const actions = SUGGESTIONS.map((s) => `${s.id}: ${s.label}`).join('\n')
  const summary = `${currentState.length} tickets across 10 days. P0: ${currentState.filter((t) => t.priority === 'P0').length}, P1: ${currentState.filter((t) => t.priority === 'P1').length}, P2: ${currentState.filter((t) => t.priority === 'P2').length}.`
  const prompt = `You are an AI assistant for a sprint planner. Given a user request, pick the SINGLE best matching action from this list:\n\n${actions}\n\nCurrent sprint: ${summary}\nUser request: "${query}"\n\nReply with ONLY a JSON object on one line: {"action":"<action_id>","echo":"<short echo>"}`
  try {
    const text = await stubClaudeComplete(prompt)
    const m = text.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0]) as { action: string; echo: string }
  } catch { /* fall through */ }
  return { action: 'rebalance', echo: 'Rebalancing the sprint.' }
}

// ---------------------------------------------------------------------------
// Suggestion list
// ---------------------------------------------------------------------------
const SUGGESTIONS = [
  { id: 'rebalance',   label: 'Rebalance the sprint',         hint: 'Spread tickets evenly across all 10 days' },
  { id: 'p0_to_mon',  label: 'Move all P0s to Monday',        hint: 'Pile every P0 onto Mon of Week 1' },
  { id: 'p0_earliest',label: 'Move all P0s to earliest days', hint: 'Front-load P0 work to the start of the sprint' },
  { id: 'fill',        label: 'Fill remaining capacity',       hint: 'Add sample tickets to empty days' },
  { id: 'remove_p2',  label: 'Remove low priority tickets',   hint: 'Drop everything marked P2' },
  { id: 'shift_right', label: 'Shift all tickets by 1 day',   hint: 'Push everything one day to the right' },
  { id: 'add_buffer',  label: 'Add buffer days',               hint: 'Insert buffer chips on every empty day' },
  { id: 'clear',       label: 'Clear all tickets',             hint: 'Empty the entire sprint' },
]

// ---------------------------------------------------------------------------
// kbd style constant
// ---------------------------------------------------------------------------
const kbd: React.CSSProperties = {
  display: 'inline-grid', placeItems: 'center',
  minWidth: 18, height: 18, padding: '0 5px',
  background: 'var(--sp-kbd-bg)', border: '1px solid var(--sp-sep)',
  borderRadius: 4, fontSize: 10, fontWeight: 700, color: 'var(--sp-fg2)',
  fontFamily: 'Montserrat',
}

// ---------------------------------------------------------------------------
// Ticket card
// ---------------------------------------------------------------------------
function Ticket({ ticket, onDragStart, onDragEnd, dragging, onDelete, successKind }: {
  ticket: TicketData
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  dragging: boolean
  onDelete: (id: string) => void
  successKind?: string
}) {
  const p = PRIORITY[ticket.priority] ?? { color: '#A1A1A1', bg: '#F5F5F5', label: ticket.priority || '—', rank: 9 }
  const isBuffer = ticket.priority === 'BUFFER'
  const successClass = successKind ? `success-${successKind.toLowerCase()}` : ''
  return (
    <div
      data-flip-id={ticket.id}
      draggable
      onDragStart={(e) => onDragStart(e, ticket.id)}
      onDragEnd={onDragEnd}
      className={`ticket ${dragging ? 'dragging' : ''} ${successClass}`}
      style={{
        position: 'relative',
        background: 'var(--sp-card-bg)',
        border: '1px dashed var(--sp-card-border)',
        borderRadius: 10,
        padding: '9px 9px 8px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <button
        type="button"
        className="sp-del"
        data-proximity
        onClick={() => onDelete(ticket.id)}
        title="Remove"
        aria-label="Remove ticket"
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 20, height: 20, padding: 0,
          background: 'transparent', border: 'none',
          color: '#A1A1A1', cursor: 'pointer',
          borderRadius: 6, display: 'grid', placeItems: 'center',
        }}
      >
        <span className={iconClass('close')} style={{ fontSize: 14, lineHeight: 1 }}>close</span>
      </button>

      <div style={{
        fontSize: 11.5, fontWeight: 600, lineHeight: 1.3,
        color: 'var(--sp-fg1)', marginBottom: 8,
        paddingRight: 14,
        textWrap: 'pretty' as React.CSSProperties['textWrap'],
      }}>
        {ticket.title}
      </div>
      {isBuffer ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, color: 'var(--sp-fg3)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          <span className={iconClass('schedule')} style={{ fontSize: 13, color: '#A1A1A1', lineHeight: 1 }}>schedule</span>
          Buffer
        </div>
      ) : (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: p.color, display: 'inline-block',
            boxShadow: `0 0 0 3px ${p.bg}`,
          }} />
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: p.color,
            letterSpacing: '0.02em',
          }}>{p.label}</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Day cell
// ---------------------------------------------------------------------------
function DayCell({ idx, dayLabel, date, isToday, tickets, onDragStart, onDragEnd, onDropTicket, onDelete, draggingId, onAdd, successMap }: {
  idx: number
  dayLabel: string
  date: number
  isToday: boolean
  tickets: TicketData[]
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onDropTicket: (idx: number) => void
  onDelete: (id: string) => void
  draggingId: string | null
  onAdd: (idx: number) => void
  successMap: Map<string, string>
}) {
  const [over, setOver] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const dayCellRef = useProximityGroup<HTMLDivElement>()

  // Callback ref for scroll-state init (replaces DOM-measure-on-mount pattern)
  const scrollCallbackRef = useCallback((el: HTMLElement | null) => {
    if (el) {
      spcScrollRef(el, {
        onScrollState(canUp, canDown) {
          setCanScrollUp(canUp)
          setCanScrollDown(canDown)
        },
      })
    } else {
      cleanupSpcScroll(el)
    }
  }, [])

  return (
    <div
      ref={dayCellRef}
      className={`day-cell ${over ? 'drop-target' : ''} ${isToday ? 'today' : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDropTicket(idx) }}
      style={{
        background: 'var(--sp-cell-bg)',
        border: '1px solid var(--sp-cell-border)',
        borderRadius: 12,
        padding: 10,
        height: 212,
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 10,
        overflow: 'hidden',
      }}
    >
      {/* Day header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 800,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: isToday ? 'var(--sp-today-fg)' : 'var(--sp-fg4)',
            fontFamily: 'Montserrat',
          }}>{dayLabel}</span>
          <span style={{
            fontSize: 14, fontWeight: 800,
            color: isToday ? 'var(--sp-today-fg)' : 'var(--sp-fg1)',
            letterSpacing: '-0.01em',
            fontFamily: 'Montserrat',
          }}>{date}</span>
        </div>
        <button
          type="button"
          onClick={() => onAdd(idx)}
          title="Add ticket"
          aria-label="Add ticket"
          data-proximity
          style={{
            width: 22, height: 22, padding: 0,
            background: 'transparent', border: '1px solid transparent',
            color: '#D4D4D4', cursor: 'pointer',
            borderRadius: 6, display: 'grid', placeItems: 'center',
            transition: 'color 150ms, border-color 150ms, background 150ms, scale calc(var(--duration-instant) * var(--anim-mult, 1)) linear, filter calc(var(--duration-instant) * var(--anim-mult, 1)) linear',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-primary-500)'; e.currentTarget.style.background = 'var(--sp-addhover-bg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sp-faint)'; e.currentTarget.style.background = 'transparent' }}
        >
          <span className={iconClass('add')} style={{ fontSize: 16, lineHeight: 1 }}>add</span>
        </button>
      </div>

      {/* Scrollable ticket area */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, marginRight: -8 }}>
        <div
          ref={scrollCallbackRef}
          className="sp-day-scroll"
          style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            overflowY: 'auto',
            height: '100%',
            padding: '4px 8px 4px 2px',
          }}
        >
          {tickets.map((t) => (
            <Ticket
              key={t.id}
              ticket={t}
              dragging={draggingId === t.id}
              successKind={successMap.get(t.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDelete={onDelete}
            />
          ))}
        </div>

        {/* Top scroll-fade */}
        {canScrollUp && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 28,
              background: 'linear-gradient(to bottom, var(--sp-fade-solid) 0%, var(--sp-fade-mid) 40%, var(--sp-fade1) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Bottom scroll-fade */}
        {canScrollDown && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: 44,
              background: 'linear-gradient(to bottom, var(--sp-fade1) 0%, var(--sp-fade-mid) 60%, var(--sp-fade-solid) 100%)',
              pointerEvents: 'none',
              borderRadius: '0 0 10px 10px',
            }}
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Week section
// ---------------------------------------------------------------------------
function WeekSection({ label, range, dates, todayIdx, tickets, weekIndex, successMap, ...rest }: {
  label: string
  range: string
  dates: number[]
  todayIdx: number
  tickets: TicketData[]
  weekIndex: number
  successMap: Map<string, string>
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onDropTicket: (idx: number) => void
  onDelete: (id: string) => void
  draggingId: string | null
  onAdd: (idx: number) => void
}) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, paddingLeft: 2 }}>
        <span style={{
          fontSize: 9, fontWeight: 800,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#A1A1A1',
          fontFamily: 'Montserrat',
        }}>{label}</span>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--sp-faint)', fontFamily: 'Montserrat' }}>{range}</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 8,
      }}>
        {DAYS.map((d, i) => {
          const idx = weekIndex * 5 + i
          return (
            <DayCell
              key={idx}
              idx={idx}
              dayLabel={d}
              date={dates[i]}
              isToday={todayIdx === idx}
              tickets={tickets.filter((t) => t.day === idx)}
              successMap={successMap}
              {...rest}
            />
          )
        })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Command palette — always mounted, toggled via data-open + visibility/opacity
// ---------------------------------------------------------------------------
function CommandPalette({ open, onClose, onRun, tickets }: {
  open: boolean
  onClose: () => void
  onRun: (actionId: string) => { msg: string }
  tickets: TicketData[]
}) {
  // Track last-seen `open` value to detect transitions without refs during render.
  // React-recommended pattern: store the previous prop in state, reset derived
  // state synchronously when the stored value differs from the current prop.
  const [prevOpen, setPrevOpen] = useState(open)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  // item 11: loading row id while click delay plays
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const paletteDialogRef = useSquircle<HTMLDialogElement>()
  const paletteProxRef = useProximityGroup<HTMLDivElement>()

  // Detect open→true transition during render; reset all input state in the same batch.
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setQuery('')
      setActive(0)
      setLoadingId(null)
    }
  }

  const focusInput = useCallback(() => { inputRef.current?.focus() }, [])

  // Callback ref wires Escape keydown + focus-on-open
  const paletteCallbackRef = useCallback((el: HTMLElement | null) => {
    if (el) {
      spcPaletteRef(el, { getOpen: () => open, onClose, focusInput })
    } else {
      cleanupSpcPalette(el)
    }
  }, [open, onClose, focusInput])

  const visibleSuggestions = useMemo(() => {
    if (!query.trim()) return SUGGESTIONS
    const q = query.toLowerCase()
    return SUGGESTIONS.filter((s) =>
      s.label.toLowerCase().includes(q) || s.hint.toLowerCase().includes(q) || s.id.includes(q)
    )
  }, [query])

  // item 11: show brief loading animation on click, then close + run
  const triggerSuggestion = (s: typeof SUGGESTIONS[number]) => {
    if (loadingId) return // already loading
    setLoadingId(s.id)
    // short visual delay so user sees the loading state
    setTimeout(() => {
      setLoadingId(null)
      onClose()
      setTimeout(() => {
        onRun(s.id)
      }, 250) // allow palette fade-out (180ms) + buffer
    }, 420)
  }

  const triggerFreeText = async () => {
    if (!query.trim()) return
    const { action } = await interpretWithClaude(query, tickets)
    // Close first, then mutate
    onClose()
    setTimeout(() => {
      onRun(action)
    }, 250)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, visibleSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (query.trim() && visibleSuggestions.length === 0) {
        void triggerFreeText()
      } else if (visibleSuggestions[active]) {
        triggerSuggestion(visibleSuggestions[active])
      } else if (query.trim()) {
        void triggerFreeText()
      }
    }
  }

  return (
    <div
      ref={(el) => { paletteCallbackRef(el); paletteProxRef(el) }}
      className="palette-backdrop sp-palette-centered"
      data-open={open ? 'true' : 'false'}
      onClick={(e) => {
        const t = e.target as HTMLElement
        if (t.classList.contains('palette-backdrop') || t.classList.contains('sp-palette-centered')) onClose()
      }}
    >
      {/* item 13: inner-card look via sp-palette-dialog class */}
      <dialog
        ref={paletteDialogRef}
        open={open}
        aria-label="Ask AI"
        className="sp-palette-dialog"
        style={{
          width: 'min(640px, 92vw)',
          overflow: 'hidden',
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          animation: open ? `paletteInCentered calc(220ms * var(--anim-mult, 1)) cubic-bezier(.22,1,.36,1)` : 'none',
          margin: 0, padding: 0,
        }}
      >
        {/* Input row — items 12 + 14: smaller font + Montserrat */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 18px',
          borderBottom: visibleSuggestions.length > 0 ? '1px solid var(--sp-hairline)' : '1px solid transparent',
        }}>
          <span className={iconClass('neurology')} style={{ fontSize: 17, lineHeight: 1, color: 'var(--brand-primary-500)', flexShrink: 0 }}>neurology</span>
          {/* item 12: smaller input text */}
          <input
            id="sp-palette-input"
            ref={inputRef}
            type="text"
            aria-label="Sprint planner command"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={onKeyDown}
            placeholder="Tell me what to change…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: 'var(--font-display, Montserrat)', fontSize: 13.5, fontWeight: 500,
              color: 'var(--sp-fg1)', background: 'transparent',
              letterSpacing: '-0.005em',
            }}
          />
          <button type="button" onClick={onClose} data-proximity style={{
            fontFamily: 'var(--font-display, Montserrat)', fontSize: 11, fontWeight: 700,
            color: '#6B6B6B', background: 'var(--sp-chip)',
            border: 'none', padding: '4px 10px', borderRadius: 6,
            cursor: 'pointer', letterSpacing: '0.04em',
          }}>Esc</button>
        </div>

        {/* Suggestions — items 10 + 11 + 14 */}
        <div style={{ padding: '8px 6px 10px' }}>
          {visibleSuggestions.length === 0 && (
            <div style={{
              padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-display, Montserrat)', fontSize: 12, color: 'var(--sp-fg3)',
            }}>
              <span className={iconClass('keyboard_return')} style={{ fontSize: 16, color: '#A1A1A1', lineHeight: 1 }}>keyboard_return</span>
              Press Enter to ask Claude to interpret <strong style={{ color: 'var(--sp-fg1)', fontWeight: 700 }}>"{query}"</strong>
            </div>
          )}
          {visibleSuggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`sugg-row ${i === active ? 'active' : ''} ${loadingId === s.id ? 'is-loading' : ''}`}
              data-proximity
              onMouseEnter={() => !loadingId && setActive(i)}
              onClick={() => triggerSuggestion(s)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 12px',
                background: 'transparent', border: 'none',
                borderRadius: 10, cursor: loadingId ? 'default' : 'pointer', textAlign: 'left',
                position: 'relative',
              }}
            >
              {/* item 11: show spinner when this row is loading, else circle dot */}
              {loadingId === s.id
                ? <span className="sugg-row-spinner" />
                : <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: '#D4D4D4', display: 'inline-block',
                  }} />
              }
              {/* item 14: Montserrat labels */}
              <span style={{
                fontFamily: 'var(--font-display, Montserrat)', fontSize: 13.5, fontWeight: 600, color: 'var(--sp-fg1)',
                letterSpacing: '-0.005em',
              }}>{s.label}</span>
              <span style={{
                marginLeft: 'auto', fontFamily: 'var(--font-display, Montserrat)', fontSize: 11.5, color: '#A1A1A1', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: '50%',
              }}>{s.hint}</span>
            </button>
          ))}
        </div>

        {/* Footer hint — item 14: Montserrat */}
        <div style={{
          borderTop: '1px solid var(--sp-hairline)',
          padding: '9px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
          fontFamily: 'var(--font-display, Montserrat)', fontSize: 10.5, color: '#A1A1A1', fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <kbd style={kbd}>&#8593;&#8595;</kbd> Navigate
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <kbd style={kbd}>&#8629;</kbd> Run
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
            Type anything &amp; press <kbd style={kbd}>&#8629;</kbd> to ask Claude
          </span>
        </div>
      </dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({ message, kind = 'success', onUndo, onClose, phase, stackOffset = 0 }: {
  message: string
  kind?: 'success' | 'danger' | 'info'
  onUndo?: (() => void) | null
  onClose: () => void
  phase: 'in' | 'out'
  stackOffset?: number
}) {
  const toastRef = useProximityGroup<HTMLOutputElement>()
  if (!message) return null
  const cfg = {
    success: { bg: 'var(--brand-primary-500)', label: 'Done',    icon: 'check_circle' },
    danger:  { bg: '#EF4444', label: 'Removed', icon: 'delete' },
    info:    { bg: '#3B82F6', label: 'Update',  icon: 'info' },
  }[kind] ?? { bg: 'var(--brand-primary-500)', label: 'Done', icon: 'check_circle' }

  return (
    <output
      ref={toastRef}
      className={`sp-toast ${phase === 'out' ? 'sp-toast-out' : 'sp-toast-in'}`}
      style={{
        marginBottom: stackOffset > 0 ? stackOffset * 8 : 0,
        background: cfg.bg,
        backgroundImage: [
          'radial-gradient(ellipse at top right, rgba(255,255,255,0.14) 0%, transparent 55%)',
          'linear-gradient(to right,  rgba(255,255,255,0.07) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: 'cover, 24px 24px, 24px 24px',
        borderRadius: 14,
        padding: '8px 8px 8px 12px',
        boxShadow: [
          `0 8px 22px -8px ${cfg.bg}AA`,
          '0 2px 6px rgba(17,17,17,0.18)',
          'inset 0 1px 0 rgba(255,255,255,0.5)',
          'inset 0 -2px 0 rgba(0,0,0,0.22)',
          'inset 0 0 0 1px rgba(255,255,255,0.15)',
        ].join(', '),
        display: 'flex', alignItems: 'center', gap: 12,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,255,255,0.95)',
        color: cfg.bg,
        padding: '3px 10px 3px 7px',
        borderRadius: 9999,
        fontSize: 10.5, fontWeight: 800,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}>
        <span className={iconClass(cfg.icon)} style={{ fontSize: 13, color: cfg.bg, lineHeight: 1 }}>{cfg.icon}</span>
        {cfg.label}
      </span>

      <span style={{
        fontSize: 13, fontWeight: 700, color: '#fff',
        letterSpacing: '-0.005em',
        textShadow: '0 1px 2px rgba(0,0,0,0.18)',
      }}>
        {message}
      </span>

      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          data-proximity
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#111111',
            color: '#fff',
            border: 'none',
            padding: '6px 11px 6px 9px',
            borderRadius: 8,
            fontFamily: 'Montserrat',
            fontSize: 11, fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 0 rgba(0,0,0,0.40), 0 2px 6px rgba(0,0,0,0.18)',
          }}
        >
          <span className={iconClass('undo')} style={{ fontSize: 14, lineHeight: 1 }}>undo</span>
          Undo
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        data-proximity
        style={{
          width: 22, height: 22, padding: 0, flexShrink: 0,
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 8, color: 'rgba(255,255,255,0.85)',
          cursor: 'pointer', display: 'grid', placeItems: 'center',
        }}
      >
        <span className={iconClass('close')} style={{ fontSize: 13, lineHeight: 1 }}>close</span>
      </button>
    </output>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
function SprintHeader({ range, onAskAI }: {
  range: string
  onAskAI: () => void
}) {
  const headerProxRef = useProximityGroup<HTMLElement>()
  return (
    <header ref={headerProxRef} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2px',
      marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 style={{
          margin: 0, fontSize: 19, fontWeight: 900,
          letterSpacing: '-0.025em', color: 'var(--sp-fg1)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span className={iconClass('directions_run')} style={{ fontSize: 20, lineHeight: 1, color: 'var(--sp-fg1)' }}>directions_run</span>
          Sprint
        </h1>
        {/* item 9: hairline separator between title group and date range (item 8: badge removed) */}
        <span aria-hidden="true" style={{
          width: 1, alignSelf: 'stretch',
          background: 'var(--sp-sep)', borderRadius: 1, flexShrink: 0,
          margin: '0 2px',
        }} />
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#A1A1A1',
          letterSpacing: '-0.005em',
        }}>{range}</span>
      </div>

      <button onClick={onAskAI} className="sp-ask-ai" type="button" data-proximity>
        <span className={iconClass('neurology')} style={{ fontSize: 14, lineHeight: 1 }}>neurology</span>
        Ask AI
        <span className="kbd-pill">&#8984;K</span>
      </button>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------
function StatsRow({ tickets }: { tickets: TicketData[] }) {
  const total = tickets.length
  const p0 = tickets.filter((t) => t.priority === 'P0').length
  const p1 = tickets.filter((t) => t.priority === 'P1').length
  const p2 = tickets.filter((t) => t.priority === 'P2').length
  const buf = tickets.filter((t) => t.priority === 'BUFFER').length
  const filled = new Set(tickets.map((t) => t.day)).size
  const capacity = Math.round(filled / 10 * 100)

  const sep = (
    <span aria-hidden="true" style={{
      width: 1, alignSelf: 'stretch',
      background: 'var(--sp-sep)', borderRadius: 1, flexShrink: 0,
      margin: '2px 2px',
    }} />
  )

  return (
    <div style={{
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      marginBottom: 22, marginLeft: 2,
    }}>
      <span className="sp-stat-badge kind-neutral"><span className={iconClass('list_alt')} style={{ fontSize: 13, lineHeight: 1 }}>list_alt</span>Total<span className="value">{total}</span></span>
      {sep}
      <span className="sp-stat-badge kind-danger"><span className={iconClass('priority_high')} style={{ fontSize: 13, lineHeight: 1 }}>priority_high</span>P0<span className="value">{p0}</span></span>
      <span className="sp-stat-badge kind-hot"><span className={iconClass('flag')} style={{ fontSize: 13, lineHeight: 1 }}>flag</span>P1<span className="value">{p1}</span></span>
      <span className="sp-stat-badge kind-success"><span className={iconClass('outlined_flag')} style={{ fontSize: 13, lineHeight: 1 }}>outlined_flag</span>P2<span className="value">{p2}</span></span>
      {buf > 0 && <span className="sp-stat-badge kind-neutral"><span className={iconClass('hourglass_empty')} style={{ fontSize: 13, lineHeight: 1 }}>hourglass_empty</span>Buffer<span className="value">{buf}</span></span>}
      {sep}
      <span className="sp-stat-badge kind-success"><span className={iconClass('bolt')} style={{ fontSize: 13, lineHeight: 1 }}>bolt</span>Capacity<span className="value">{`${capacity}%`}</span></span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add ticket modal — always mounted, toggled via data-open + visibility/opacity
// ---------------------------------------------------------------------------
function AddTicketModal({ open, day, onClose, onSubmit }: {
  open: boolean
  day: number
  onClose: () => void
  onSubmit: (ticket: TicketData) => void
}) {
  // Derive reset from open transition via state (same pattern as CommandPalette)
  const [prevOpen, setPrevOpen] = useState(open)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('P1')
  const inputRef = useRef<HTMLInputElement>(null)
  const focusInput = useCallback(() => { inputRef.current?.focus() }, [])
  const modalDialogRef = useSquircle<HTMLDialogElement>()
  const modalProxRef = useProximityGroup<HTMLDivElement>()

  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setTitle('')
      setPriority('P1')
    }
  }

  // Callback ref for Escape + focus-on-open
  const modalCallbackRef = useCallback((el: HTMLElement | null) => {
    if (el) {
      spcModalRef(el, { onClose, focusInput })
    } else {
      cleanupSpcModal(el)
    }
  }, [onClose, focusInput])

  const dayName = day != null ? `${DAYS_FULL[day % 5]}, Week ${day < 5 ? 1 : 2}` : ''
  const submit = () => {
    if (!title.trim()) return
    onSubmit({ id: newId(), title: title.trim(), priority, day })
    onClose()
  }

  return (
    <div
      ref={(el) => { modalCallbackRef(el); modalProxRef(el) }}
      className="sp-modal-backdrop"
      data-open={open ? 'true' : 'false'}
      onClick={(e) => { if ((e.target as HTMLElement).classList.contains('sp-modal-backdrop')) onClose() }}
    >
      {/* item 4: dialog centered on the component via translate(-50%,-50%), inner-card look */}
      <dialog
        ref={modalDialogRef}
        open={open}
        aria-label={`Add ticket to ${dayName}`}
        className="sp-modal-dialog"
        style={{
          width: 'min(480px, 92vw)',
          padding: 22,
          animation: open ? 'paletteIn calc(220ms * var(--anim-mult, 1)) cubic-bezier(.22,1,.36,1)' : 'none',
          margin: 0,
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* item 6: Montserrat black eyebrow label */}
        <div aria-hidden="true" style={{
          fontSize: 9.5, fontWeight: 900,
          fontFamily: 'var(--font-display, Montserrat)',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#A1A1A1', marginBottom: 6,
        }}>New ticket &middot; {dayName}</div>
        {/* item 7: title textbox — text anchored to bottom edge, minimized font */}
        <input
          id="sp-modal-title"
          ref={inputRef}
          type="text"
          aria-label={`New ticket for ${dayName}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="Describe the work…"
          style={{
            width: '100%', boxSizing: 'border-box',
            border: 'none', outline: 'none',
            padding: '0 0 10px',          /* text sits at bottom of the box */
            display: 'block',
            fontFamily: 'var(--font-display, Montserrat)', fontSize: 13.5, fontWeight: 700,
            color: 'var(--sp-fg1)', borderBottom: '1px solid var(--sp-hairline)',
            marginBottom: 14, background: 'transparent',
            lineHeight: 1.4,
          }}
        />

        {/* item 5: priority pills match default view */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          {(['P0', 'P1', 'P2'] as const).map((p) => (
            <button key={p} type="button" onClick={() => setPriority(p)} data-proximity style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 9999,
              border: '1px solid ' + (priority === p ? PRIORITY[p].color : 'var(--sp-sep)'),
              background: priority === p ? PRIORITY[p].bg : 'var(--sp-card-bg)',
              color: priority === p ? PRIORITY[p].color : 'var(--sp-fg3)',
              fontFamily: 'var(--font-display, Montserrat)', fontSize: 11.5, fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: 'pointer', transition: 'all calc(150ms * var(--anim-mult, 1))',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY[p].color }} />
              {p}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {/* item 9: Cancel button with leading icon */}
          <button type="button" onClick={onClose} data-proximity style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', border: '1px solid var(--sp-sep)', background: 'var(--sp-card-bg)',
            color: 'var(--sp-fg3)', fontFamily: 'var(--font-display, Montserrat)', fontSize: 12, fontWeight: 800,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: 9999,
          }}>
            <span className={iconClass('close')} style={{ fontSize: 13, lineHeight: 1 }}>close</span>
            Cancel
          </button>
          {/* item 8: "Add ticket" button — grid background + icon (mirrors pc-apply) */}
          <button type="button" onClick={submit} disabled={!title.trim()} data-proximity className="sp-add-ticket-btn">
            <span className={iconClass('add_task')} style={{ fontSize: 14, lineHeight: 1 }}>add_task</span>
            Add ticket
          </button>
        </div>
      </dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SprintPlannerCore() {
  const [tickets, setTickets] = useState<TicketData[]>(initialTickets)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addDay, setAddDay] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const panelRef = useSquircle<HTMLDivElement>()
  const outerSquircleRef = useSquircle<HTMLDivElement>()
  // item 3: toast stack — array of active toasts, newest on top
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; kind: 'success' | 'danger' | 'info'; undo: boolean; phase: 'in' | 'out' }>>([])
  const [successMap, setSuccessMap] = useState<Map<string, string>>(new Map())

  const undoRef = useRef<TicketData[] | null>(null)

  // item 5: per-toast timer map (id → {autoTimer, morphOutTimer})
  const toastTimersRef = useRef<Map<string, { auto: ReturnType<typeof makeToastTimer>; morphOut: ReturnType<typeof makeMorphOutTimer> }>>(new Map())
  const flashTimerRef  = useRef(makeFlashTimer())

  // Close a single toast by id: morph out then remove from stack
  const closeToast = useCallback((id: string) => {
    const timers = toastTimersRef.current.get(id)
    if (timers) timers.auto.cancel()
    setToasts((ts) => ts.map((t) => t.id === id ? { ...t, phase: 'out' as const } : t))
    const morphOut = timers?.morphOut ?? makeMorphOutTimer()
    morphOut.schedule(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id))
      toastTimersRef.current.delete(id)
    })
  }, [])

  // Flash priority-colored success wash on changed tickets
  const flashSuccess = useCallback((entries: [string, string][]) => {
    setSuccessMap(new Map(entries))
    flashTimerRef.current.schedule(() => setSuccessMap(new Map()))
  }, [])

  const showToast = useCallback((next: { message: string; kind: 'success' | 'danger' | 'info'; undo: boolean } | null) => {
    if (!next) return
    const id = `toast-${Date.now()}-${Math.random()}`
    const auto = makeToastTimer()
    const morphOut = makeMorphOutTimer()
    toastTimersRef.current.set(id, { auto, morphOut })
    setToasts((ts) => [...ts, { ...next, id, phase: 'in' as const }])
    auto.schedule(() => closeToast(id))
  }, [closeToast])

  // Cmd/Ctrl-K: wired via callback ref on .sp-outer
  const togglePalette = useCallback(() => setPaletteOpen((o) => !o), [])
  const rootCallbackRef = useCallback((el: HTMLElement | null) => {
    if (el) {
      spcRootRef(el, togglePalette)
    } else {
      cleanupSpcRoot(el)
    }
  }, [togglePalette])

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  const onDragEnd = () => setDraggingId(null)

  const onDropTicket = (dayIdx: number) => {
    if (!draggingId) return
    const ticket = tickets.find((t) => t.id === draggingId)
    if (!ticket) { setDraggingId(null); return }
    const moved = ticket.day !== dayIdx
    if (moved) {
      undoRef.current = tickets
      // item 10: place moved ticket at the TOP of the destination day
      setTickets((ts) => {
        const movedTicket = { ...ts.find((t) => t.id === draggingId)!, day: dayIdx }
        const rest = ts.filter((t) => t.id !== draggingId)
        // Insert movedTicket before the first ticket on dayIdx (front of that day's group)
        const firstDayIdx = rest.findIndex((t) => t.day === dayIdx)
        if (firstDayIdx === -1) return [...rest, movedTicket]
        return [...rest.slice(0, firstDayIdx), movedTicket, ...rest.slice(firstDayIdx)]
      })
      flashSuccess([[draggingId, (ticket.priority || 'p2').toLowerCase()]])
      const dayName = `${DAYS_FULL[dayIdx % 5]} · Week ${dayIdx < 5 ? 1 : 2}`
      const title = ticket.title.length > 36 ? ticket.title.slice(0, 36) + '…' : ticket.title
      showToast({ message: `”${title}” → ${dayName}`, kind: 'success', undo: true })
    }
    setDraggingId(null)
  }

  const onDelete = (id: string) => {
    const removed = tickets.find((t) => t.id === id)
    setTickets((ts) => ts.filter((t) => t.id !== id))
    if (removed) {
      undoRef.current = tickets
      const title = removed.title.length > 42 ? removed.title.slice(0, 42) + '…' : removed.title
      showToast({ message: `Removed “${title}”`, kind: 'danger', undo: true })
    }
  }

  const onAdd = (day: number) => { setAddDay(day); setAddOpen(true) }

  const onAddSubmit = (ticket: TicketData) => {
    undoRef.current = tickets
    setTickets((ts) => [...ts, ticket])
    flashSuccess([[ticket.id, (ticket.priority || 'p2').toLowerCase()]])
    const dayName = `${DAYS_FULL[ticket.day % 5]} · Week ${ticket.day < 5 ? 1 : 2}`
    const title = ticket.title.length > 38 ? ticket.title.slice(0, 38) + '…' : ticket.title
    showToast({ message: `Added “${title}” to ${dayName}`, kind: 'success', undo: true })
  }

  const runAI = useCallback((actionId: string): { msg: string } => {
    undoRef.current = tickets
    const { state, msg } = runAction(actionId, tickets)
    setTickets(state)
    const prevById = new Map(tickets.map((t) => [t.id, t]))
    const flashEntries = state
      .filter((t) => {
        const prev = prevById.get(t.id)
        return !prev || prev.day !== t.day
      })
      .map((t): [string, string] => [t.id, (t.priority || 'p2').toLowerCase()])
    if (flashEntries.length) flashSuccess(flashEntries)
    showToast({ message: msg, kind: 'success', undo: true })
    return { msg }
  }, [tickets, flashSuccess, showToast])

  // item 15: undo instantly removes the triggering toast, then shows "undone" toast
  const makeUndo = useCallback((fromToastId: string) => () => {
    if (undoRef.current) {
      // Immediately remove the toast that triggered undo (no morph-out delay)
      const timers = toastTimersRef.current.get(fromToastId)
      if (timers) timers.auto.cancel()
      setToasts((ts) => ts.filter((t) => t.id !== fromToastId))
      toastTimersRef.current.delete(fromToastId)
      // Apply undo
      setTickets(undoRef.current)
      undoRef.current = null
      showToast({ message: 'Undone', kind: 'info', undo: false })
    }
  }, [showToast])

  const outerRef = useCallback((el: HTMLDivElement | null) => {
    outerSquircleRef(el)
    rootCallbackRef(el)
  }, [outerSquircleRef, rootCallbackRef])

  return (
    <div ref={outerRef} className="sp-outer" data-squircle="on" style={{ '--corner-radius': '28px' } as React.CSSProperties}>
      <div ref={panelRef} className="sp-panel" style={{ padding: '18px 18px 18px' }}>
        <SprintHeader
          range="May 18 — May 29"
          onAskAI={() => setPaletteOpen(true)}
        />

        <StatsRow tickets={tickets} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <WeekSection
            weekIndex={0}
            label="Week 1"
            range="May 18 — May 22"
            dates={WEEK1_DATES}
            todayIdx={TODAY_INDEX}
            tickets={tickets}
            successMap={successMap}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropTicket={onDropTicket}
            onDelete={onDelete}
            draggingId={draggingId}
            onAdd={onAdd}
          />
          <WeekSection
            weekIndex={1}
            label="Week 2"
            range="May 25 — May 29"
            dates={WEEK2_DATES}
            todayIdx={TODAY_INDEX}
            tickets={tickets}
            successMap={successMap}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropTicket={onDropTicket}
            onDelete={onDelete}
            draggingId={draggingId}
            onAdd={onAdd}
          />
        </div>

        {/* Command palette — mounted permanently, toggled via data-open */}
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onRun={runAI}
          tickets={tickets}
        />

        {/* Add ticket modal — mounted permanently, toggled via data-open */}
        <AddTicketModal
          open={addOpen}
          day={addDay}
          onClose={() => setAddOpen(false)}
          onSubmit={onAddSubmit}
        />

        {/* Toast layer — item 3: vertical stack, newest on top via flex-direction: column-reverse */}
        <div className={`sp-toast-layer ${toasts.length > 0 ? 'visible' : ''}`}>
          {toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              kind={t.kind}
              phase={t.phase}
              onUndo={t.undo ? makeUndo(t.id) : null}
              onClose={() => closeToast(t.id)}
              stackOffset={0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
