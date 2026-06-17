import '../../../../design-system/preview/_base.css'
import '../../../../design-system/preview/_darkmode.css'
import './StackedList.css'

import { useMemo, useState, useRef } from 'react'
import { dirSearchRef, cleanupDirSearch } from './stacked-list-hook'

/* ----------------------------- data ----------------------------- */
const ROLES = {
  pm:       { label: 'Project Manager', icon: 'work',     tone: 'pm' },
  designer: { label: 'Designer',        icon: 'palette',  tone: 'designer' },
  data:     { label: 'Data Specialist', icon: 'database', tone: 'data' },
  creator:  { label: 'Creator',         icon: 'stylus',   tone: 'creator' },
} as const

type RoleKey = keyof typeof ROLES

interface Member {
  id: string
  name: string
  initials: string
  online: boolean
  status: string
  role: RoleKey
  color: string
}

const MEMBERS: Member[] = [
  { id: '01', name: 'Oliver Smith',  initials: 'OS', online: true,  status: 'Online',  role: 'pm',       color: '#059669' },
  { id: '02', name: 'Sophie Chen',   initials: 'SC', online: false, status: '17m ago', role: 'designer', color: '#475569' },
  { id: '03', name: 'Noah Wilson',   initials: 'NW', online: false, status: '29m ago', role: 'data',     color: '#F59E0B' },
  { id: '04', name: 'Emma Davis',    initials: 'ED', online: false, status: '48m ago', role: 'creator',  color: '#F97316' },
  { id: '05', name: 'Leo Garcia',    initials: 'LG', online: true,  status: 'Online',  role: 'designer', color: '#047857' },
  { id: '06', name: 'Mia Thompson',  initials: 'MT', online: true,  status: 'Online',  role: 'pm',       color: '#64748B' },
  { id: '07', name: 'Ethan Wright',  initials: 'EW', online: false, status: '5h ago',  role: 'data',     color: '#334155' },
]

/* ----------------------------- sub-components ----------------------------- */
function RoleBadge({ role }: { role: RoleKey }) {
  const r = ROLES[role]
  return (
    <span className="sl-badge" data-tone={r.tone}>
      <span className="material-symbols-outlined">{r.icon}</span>
      <span className="sl-badge-lbl">{r.label}</span>
    </span>
  )
}

interface MemberItemProps {
  m: Member
  sweep?: boolean
  delay?: number
}

function MemberItem({ m, sweep = false, delay = 0 }: MemberItemProps) {
  return (
    <div
      className={'sl-item' + (sweep ? ' sl-sweep' : '')}
      style={sweep ? { animationDelay: `calc(${delay}ms * var(--anim-mult,1))` } : undefined}
    >
      <div className="sl-ava-wrap">
        <div className="sl-ava" style={{ backgroundColor: m.color }}>{m.initials}</div>
        {m.online && <span className="sl-online" />}
      </div>
      <div className="sl-meta">
        <div className="sl-name">{m.name}</div>
        <div className={'sl-status ' + (m.online ? 'is-online' : 'is-off')}>
          {m.online && <span className="dot" />}
          <span>{m.status}</span>
        </div>
      </div>
      <RoleBadge role={m.role} />
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="sl-empty">
      <span className="material-symbols-outlined">person_search</span>
      No teammates match &ldquo;{label}&rdquo;.
    </div>
  )
}

/* ----------------------------- main component ----------------------------- */
export interface StackedListProps {
  /** Start with the directory dock open. Prop is initial state only — no ongoing sync. */
  startOpen?: boolean
  /** Show only online members in the top panel. */
  onlineOnly?: boolean
  /** Render role badges in monochrome style. */
  mono?: boolean
}

function matches(m: Member, q: string): boolean {
  const lq = q.trim().toLowerCase()
  if (!lq) return true
  return m.name.toLowerCase().includes(lq) || ROLES[m.role].label.toLowerCase().includes(lq)
}

export default function StackedList({
  startOpen = false,
  onlineOnly = true,
  mono = false,
}: StackedListProps) {
  // useEffect #1 replacement: startOpen is initial state only; no prop-sync effect needed.
  // In a real consumer the parent re-mounts with a key prop if it needs to reset.
  const [expanded, setExpanded] = useState(startOpen)

  // Search queries — driven by input change handlers (no debounce useEffect needed;
  // useMemo filtering is cheap on 7 members so we update synchronously).
  const [activeQuery, setActiveQuery] = useState('')
  const [dirQuery, setDirQuery] = useState('')

  // useEffect #2 & #3 replacement: search debounce via change handler + ref-held timer.
  // Timers are stored in refs so they survive renders without causing re-renders.
  const activeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleActiveSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value
    if (activeTimer.current !== null) clearTimeout(activeTimer.current)
    activeTimer.current = setTimeout(() => {
      setActiveQuery(value)
      activeTimer.current = null
    }, 120)
  }

  function handleDirSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value
    if (dirTimer.current !== null) clearTimeout(dirTimer.current)
    dirTimer.current = setTimeout(() => {
      setDirQuery(value)
      dirTimer.current = null
    }, 120)
  }

  /* useMemo filtering — allowed by the no-use-effect rule */
  const activeBase = useMemo(
    () => (onlineOnly ? MEMBERS.filter((m) => m.online) : MEMBERS),
    [onlineOnly],
  )
  const activeList = useMemo(
    () => activeBase.filter((m) => matches(m, activeQuery)),
    [activeBase, activeQuery],
  )
  const dirList = useMemo(
    () => MEMBERS.filter((m) => matches(m, dirQuery)),
    [dirQuery],
  )

  const stack = MEMBERS.slice(0, 3)
  const remaining = MEMBERS.length - stack.length

  return (
    <div className={'sl-panel' + (mono ? ' is-mono' : '')}>

      {/* ---------- base view: active members ---------- */}
      <div className="sl-active">
        <div className="sl-active-head">
          <div className="sl-top">
            <div className="sl-title">
              {onlineOnly ? 'Active Members' : 'All Members'}
              <span className="sl-count">{activeBase.length}</span>
            </div>
            <button type="button" className="sl-add" aria-label="Add member">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <div className="sl-search">
            <span className="material-symbols-outlined">search</span>
            <input
              aria-label="Search teammates"
              placeholder="Search teammates…"
              defaultValue=""
              onChange={handleActiveSearch}
            />
          </div>
        </div>
        <div className="sl-list">
          {activeList.length > 0
            ? activeList.map((m) => <MemberItem key={'a-' + m.id} m={m} />)
            : <EmptyState label={activeQuery} />}
        </div>
      </div>

      {/* ---------- floating directory dock ---------- */}
      <div
        className={'sl-bar' + (expanded ? ' is-expanded' : '')}
        onClick={() => { if (!expanded) setExpanded(true) }}
      >
        <div className="sl-bar-head">
          <div className="sl-bar-left">
            <div className="sl-bar-icon">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <div className="sl-bar-titles">
              <h4>Member Directory</h4>
              <p>{MEMBERS.length} Members Registered</p>
            </div>
          </div>
          <div className="sl-bar-right">
            <div className="sl-stack">
              {stack.map((m) => (
                <div key={'s-' + m.id} className="sl-mini" style={{ backgroundColor: m.color }}>
                  {m.initials}
                </div>
              ))}
              {remaining > 0 && <div className="sl-more">+{remaining}</div>}
            </div>
            <button
              type="button"
              className="sl-close"
              aria-label="Close directory"
              onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="sl-bar-body">
          <div className="sl-bar-search">
            <div className="sl-search sl-search--sm">
              <span className="material-symbols-outlined">search</span>
              {/* Callback ref handles focus side-effect when node mounts — no useEffect */}
              <input
                aria-label="Search members"
                placeholder="Search members…"
                defaultValue=""
                onChange={handleDirSearch}
                ref={(el) => {
                  dirSearchRef(el)
                  return () => cleanupDirSearch(el)
                }}
              />
            </div>
          </div>
          <div className="sl-bar-list">
            {expanded && (dirList.length > 0
              ? dirList.map((m, i) => (
                  <MemberItem key={'d-' + m.id} m={m} sweep delay={i * 45} />
                ))
              : <EmptyState label={dirQuery} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
