/* =========================================================================
   Deha CRM -- Leads Table React component
   Step 7A: table + data + interactions (ported from _leads-table-render.js)
   Step 7B will wire the lead-details popover -- see onOpenLead prop below.
   ========================================================================= */

import { useState, useMemo, useCallback, useRef } from 'react'
import '../../../../design-system/preview/_leads-table.css'
import './LeadsTable.css'
import { useProximityGroup } from '@/lib/hooks'
import type { Lead, LeadStage, SourceKey } from './leadsData'
import LeadPopover from './LeadPopover'
import {
  LEADS,
  STAGES,
  SOURCES,
  fmtTL,
  rel,
  health,
  healthClr,
  healthAv,
  esc,
} from './leadsData'

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'score' | 'value' | 'sentiment' | 'last'
type SortDir = 'asc' | 'desc'
type QFKey = 'hot' | 'value' | 'earn' | null

export interface LeadsTableProps {
  // 7B: optionally receive open-lead callback from parent; popover is managed internally
  onOpenLead?: (lead: Lead) => void
}

// ── Constants (from render JS) ────────────────────────────────────────────────

const STAGE_ICONS: Record<LeadStage, string> = {
  lead: 'person_add', qualified: 'verified', proposal: 'description',
  negotiation: 'handshake', closing: 'task_alt',
}
const SRC_COLORS: Record<string, string> = {
  paid: '#F59E0B', organic: '#3B82F6', referral: '#14B8A6',
}

const INITIAL_VISIBLE = 4
const PER_PAGE = 8

// ── Helper: score bar + avatar cell ──────────────────────────────────────────

function ScoreCell({ lead }: { lead: Lead }) {
  const h = health(lead.score)
  const clr = healthClr(h)
  const perfect = lead.score >= 100
  return (
    <div className="lt-td col-num">
      <div className="lt-score-v" style={{ color: clr }}>
        {lead.score}%
        {perfect && <span className="material-symbols-outlined">check_circle</span>}
      </div>
      <span className="lt-bar">
        <span className="lt-bar-fill" style={{ width: `${lead.score}%`, background: clr }} />
      </span>
    </div>
  )
}

function SentimentCell({ lead }: { lead: Lead }) {
  const s = lead.sentiment
  let emoji: string, label: string, bg: string, lite = false
  if (s >= 75)      { emoji = '😄'; label = 'Happy';    bg = 'var(--brand-primary-500)' }
  else if (s >= 60) { emoji = '🙂'; label = 'Positive'; bg = 'var(--brand-primary-500)' }
  else if (s >= 45) { emoji = '😐'; label = 'Neutral';  bg = '#EAB308'; lite = true }
  else              { emoji = '🙁'; label = 'Unhappy';  bg = '#EF4444' }
  return (
    <div className="lt-td">
      <span className={`lt-tag${lite ? ' lite' : ''}`} style={{ background: bg }}>
        <span className="lt-emoji">{emoji}</span>{label}
      </span>
    </div>
  )
}

function LeadRow({ lead, isActive, onClick }: { lead: Lead; isActive: boolean; onClick: () => void }) {
  const h = health(lead.score)
  const st = STAGES[lead.stage]
  const src = SOURCES[lead.source as SourceKey]
  const stale = lead.last >= 7 * 1440
  const whenTxt = lead.last < 50 ? 'today' : rel(lead.last)
  const stLite = lead.stage === 'proposal'
  const srcLite = src.kind === 'paid'
  const tempBg = lead.temp === 'hot' ? '#F97316' : lead.temp === 'warm' ? '#EAB308' : '#6B6B6B'
  const tempIcon = lead.temp === 'hot' ? 'local_fire_department' : lead.temp === 'warm' ? 'thermostat' : 'ac_unit'

  return (
    <div className={`lt-rowwrap${isActive ? ' active' : ''}`} data-id={lead.id}>
      <div className="lt-row lt-grid" data-proximity onClick={onClick} style={{ cursor: 'pointer' }}>
        {/* Lead cell */}
        <div className="lt-td lt-lead">
          <span className="lt-av" style={{ background: healthAv(h) }} />
          <span className="lt-lead-meta">
            <span className="lt-lead-name">{esc(lead.name)}</span>
            <span className="lt-lead-co">{esc(lead.co)}</span>
          </span>
        </div>

        {/* AI Score */}
        <ScoreCell lead={lead} />

        {/* Value */}
        <div className="lt-td lt-value">
          <span className="vv">
            {lead.value ? fmtTL(lead.value) : <span className="dash">--</span>}
          </span>
          {lead.value ? (
            <span className="vl">
              <span className="material-symbols-outlined">savings</span>
              LTV {fmtTL(lead.ltv)}
            </span>
          ) : (
            <span className="vl">no value yet</span>
          )}
        </div>

        {/* Stage */}
        <div className="lt-td">
          <span
            className={`lt-tag${stLite ? ' lite' : ''}`}
            style={{ background: st.dot }}
          >
            <span className="material-symbols-outlined">{STAGE_ICONS[lead.stage]}</span>
            {st.label}
          </span>
        </div>

        {/* Sentiment */}
        <SentimentCell lead={lead} />

        {/* Source */}
        <div className="lt-td">
          <span
            className={`lt-tag${srcLite ? ' lite' : ''}`}
            style={{ background: SRC_COLORS[src.kind] }}
          >
            <span className="material-symbols-outlined">{src.icon}</span>
            {src.label}
          </span>
        </div>

        {/* Last Contact */}
        <div className="lt-td">
          <span className={`lt-when${stale ? ' stale' : ''}`}>{whenTxt}</span>
        </div>

        {/* Temp */}
        <div className="lt-td">
          <span
            className={`lt-tag${lead.temp === 'warm' ? ' lite' : ''}`}
            style={{ background: tempBg }}
          >
            <span className="material-symbols-outlined">{tempIcon}</span>
            {lead.temp}
          </span>
        </div>
      </div>
    </div>
  )
}

// SkeletonRows is kept for future use (e.g. real async data fetch) but not
// rendered while data is synchronous.

// ── CSV export helper ─────────────────────────────────────────────────────────

function exportCSV(rows: Lead[]) {
  const headers = ['Name','Company','AI Score','Value','LTV','Stage','Sentiment','Source','Last Contact (min)','Temp']
  const lines = rows.map(l => [
    l.name, l.co, l.score, l.value ?? '', l.ltv,
    STAGES[l.stage].label, l.sentiment,
    SOURCES[l.source as SourceKey].label, l.last, l.temp
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'leads-export.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LeadsTable({ onOpenLead }: LeadsTableProps) {
  const [search, setSearch]       = useState('')
  const [qf, setQf]               = useState<QFKey>(null)
  const [sortKey, setSortKey]     = useState<SortKey>('score')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')
  const [expanded, setExpanded]   = useState(false)
  const [page, setPage]           = useState(1)
  const [compact, setCompact]     = useState(false)
  const [openId, setOpenId]       = useState<number | null>(null)
  const mainProxRef = useProximityGroup<HTMLDivElement>()
  // 7B: selected lead for the details popover
  const [popoverLead, setPopoverLead] = useState<Lead | null>(null)
  const [toast, setToast]         = useState<string | null>(null)
  const toastRef                  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Resizable columns: null = use CSS defaults; non-null = px widths for all 8 columns
  const [colWidths, setColWidths] = useState<number[] | null>(null)
  const theadRef                  = useRef<HTMLDivElement | null>(null)

  // Data is synchronous -- no artificial loading skeleton needed.
  // The skeleton markup (SkeletonRows) is kept but never rendered.

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2800)
  }, [])

  // ── Derived: filtered + sorted rows ────────────────────────────────────────

  const filteredRows = useMemo(() => {
    let rows = LEADS.filter(l => {
      if (qf === 'hot'   && l.temp !== 'hot') return false
      if (qf === 'value' && (!l.value || l.value < 1800000)) return false
      if (qf === 'earn'  && l.score < 65) return false
      if (search) {
        const q = search.toLowerCase()
        if (!l.name.toLowerCase().includes(q) &&
            !l.co.toLowerCase().includes(q) &&
            !STAGES[l.stage].label.toLowerCase().includes(q) &&
            !l.temp.includes(q)) return false
      }
      return true
    })
    const dir = sortDir === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      let av: number, bv: number
      if (sortKey === 'value')     { av = a.value ?? -1; bv = b.value ?? -1 }
      else if (sortKey === 'last') { av = -a.last; bv = -b.last }  // recent first desc
      else                         { av = a[sortKey] as number; bv = b[sortKey] as number }
      return (av - bv) * dir
    })
    return rows
  }, [search, qf, sortKey, sortDir])

  const filterActive = qf !== null
  const total = filteredRows.length

  const shownRows = useMemo(() => {
    if (filterActive) return filteredRows
    if (!expanded)    return filteredRows.slice(0, INITIAL_VISIBLE)
    const start = (page - 1) * PER_PAGE
    return filteredRows.slice(start, start + PER_PAGE)
  }, [filteredRows, filterActive, expanded, page])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return prev
      }
      setSortDir('desc')
      return key
    })
    setOpenId(null)
  }, [])

  const handleQf = useCallback((f: string) => {
    setQf(prev => prev === f ? null : f as QFKey)
    setPage(1)
    setOpenId(null)
  }, [])

  const clearAll = useCallback(() => {
    setQf(null)
    setSearch('')
    setPage(1)
    setOpenId(null)
  }, [])

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    setPage(1)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => setOpenId(null), 140)
  }, [])

  const handleRowClick = useCallback((lead: Lead) => {
    if (openId === lead.id) {
      setOpenId(null)
      setPopoverLead(null)
      return
    }
    setOpenId(lead.id)
    setPopoverLead(lead)
    // notify parent if handler is provided
    if (onOpenLead) onOpenLead(lead)
  }, [openId, onOpenLead])

  const handleViewMore = useCallback(() => {
    setExpanded(true)
    setPage(1)
  }, [])

  // ── Column resize handler (imperative, no useEffect) ───────────────────────

  const handleResizePointerDown = useCallback((e: React.PointerEvent, colIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const thead = theadRef.current
    if (!thead) return

    // Measure all 8 header cells at drag-start to initialize concrete px widths
    const cells = Array.from(thead.querySelectorAll<HTMLElement>('.lt-th'))
    const measuredWidths = cells.map(c => c.getBoundingClientRect().width)

    // Initialize colWidths from measured values if not yet set (first drag)
    setColWidths(measuredWidths)

    const startX = e.clientX
    const startW = measuredWidths[colIndex]

    const onMove = (me: PointerEvent) => {
      const newW = Math.max(72, startW + (me.clientX - startX))
      setColWidths(prev => {
        const base = prev ?? measuredWidths
        const next = [...base]
        next[colIndex] = newW
        return next
      })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  // ── Pagination helpers ──────────────────────────────────────────────────────

  const pages = Math.max(1, Math.ceil(total / PER_PAGE))
  const safePage = Math.min(page, pages)
  const pageStart = (safePage - 1) * PER_PAGE

  // Page number list with ellipsis
  const pageNums: (number | '...')[] = []
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || (p >= safePage - 1 && p <= safePage + 1)) {
      pageNums.push(p)
    } else if (pageNums[pageNums.length - 1] !== '...') {
      pageNums.push('...')
    }
  }

  // Show clear button when filter or search is active
  const showClear = !!qf || !!search

  // Sort indicator class helper
  const thClass = (key: SortKey) => {
    const sorted = sortKey === key
    return `lt-th num sortable${sorted ? ' sorted' : ''}${sorted && sortDir === 'asc' ? ' desc' : ''}`
  }
  const thClassReg = (key: SortKey) => {
    const sorted = sortKey === key
    return `lt-th sortable${sorted ? ' sorted' : ''}${sorted && sortDir === 'asc' ? ' desc' : ''}`
  }

  // Derive CSS variable track string from colWidths state
  const trackStr = colWidths ? colWidths.map(w => w + 'px').join(' ') : undefined
  const tableStyle = trackStr ? { ['--lt-cols' as string]: trackStr } : undefined

  return (
    <div className={`lt-app${compact ? ' compact' : ''}`} data-screen-label="Leads table">
      <div className="lt-main" ref={mainProxRef}>

        {/* Header */}
        <div className="lt-header">
          <div>
            <div className="lt-title">
              <span className="material-symbols-outlined">groups</span>
              Leads
            </div>
            <div className="lt-subtitle">
              Your pipeline, scored and triaged by AI -- start where it matters today.
            </div>
          </div>
          <div className="lt-head-actions">
            <button
              type="button"
              className="lt-iconbtn"
              aria-label="Row density"
              title="Row density"
              data-proximity
              onClick={() => { setCompact(c => !c); showToast('Density toggled') }}
            >
              <span className="material-symbols-outlined">density_medium</span>
            </button>
            <button
              type="button"
              className="lt-iconbtn"
              aria-label="Columns"
              title="Configure columns"
              data-proximity
              onClick={() => showToast('Column picker -- coming soon')}
            >
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>

        {/* Controls: search + quick filters */}
        <div className="lt-controls">
          <div className="lt-searchbar">
            <div className="lt-search">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                id="ltSearch"
                placeholder={'Ask AI -- “hot leads in negotiation”'}
                aria-label="Search leads"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="lt-btn"
              data-proximity
              onClick={() => search ? showToast(`AI parsing: "${search}"...`) : document.getElementById('ltSearch')?.focus()}
            >
              <span className="material-symbols-outlined">filter_alt</span>Filter
            </button>
            <button
              type="button"
              className="lt-btn lt-btn-ai"
              data-proximity
              onClick={() => showToast('Running full pipeline analysis...')}
            >
              <span className="material-symbols-outlined">bolt</span>Ask AI
            </button>
          </div>

          <div className="lt-quick">
            <button
              type="button"
              className={`lt-qf${qf === 'hot' ? ' on' : ''}`}
              data-qf="hot"
              data-proximity
              style={{ '--qf-c': '#F97316' } as React.CSSProperties}
              onClick={() => handleQf('hot')}
            >
              <span className="material-symbols-outlined">local_fire_department</span>
              <span className="lt-qf-tx">
                <span className="qf-lb">Sicak adaylar</span>
                <span className="qf-sub">Hot leads</span>
              </span>
            </button>
            <button
              type="button"
              className={`lt-qf${qf === 'value' ? ' on' : ''}`}
              data-qf="value"
              data-proximity
              style={{ '--qf-c': 'var(--brand-primary-500)' } as React.CSSProperties}
              onClick={() => handleQf('value')}
            >
              <span className="material-symbols-outlined">apartment</span>
              <span className="lt-qf-tx">
                <span className="qf-lb">Yuksek degerli</span>
                <span className="qf-sub">≥ ₺1.8M</span>
              </span>
            </button>
            <button
              type="button"
              className={`lt-qf${qf === 'earn' ? ' on' : ''}`}
              data-qf="earn"
              data-proximity
              style={{ '--qf-c': '#EAB308' } as React.CSSProperties}
              onClick={() => handleQf('earn')}
            >
              <span className="material-symbols-outlined">bolt</span>
              <span className="lt-qf-tx">
                <span className="qf-lb">Earn today</span>
                <span className="qf-sub">score ≥ 65</span>
              </span>
            </button>
            <button
              type="button"
              className={`lt-clear${showClear ? ' show' : ''}`}
              id="ltClear"
              data-proximity
              onClick={clearAll}
            >
              <span className="material-symbols-outlined">close</span>Clear
            </button>
            <span className="lt-result-ct" id="ltResultCt">
              {(qf || search) && total > 0 && (
                <><b>{total}</b> lead{total === 1 ? '' : 's'}</>
              )}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="lt-table" style={tableStyle}>
          <div className="lt-thead lt-grid" ref={theadRef}>
            <div className="lt-th">
              <span className="lt-th-ic material-symbols-outlined">person</span>Lead
              <span className="lt-resize" onPointerDown={e => handleResizePointerDown(e, 0)} />
            </div>
            <div className={thClass('score')} data-sort="score" onClick={() => handleSort('score')}>
              <span className="lt-th-ic material-symbols-outlined">target</span>
              AI Score
              <span className="lt-sort">
                <span className="material-symbols-outlined">arrow_downward</span>
              </span>
              <span className="lt-resize" onPointerDown={e => handleResizePointerDown(e, 1)} />
            </div>
            <div className={thClassReg('value')} data-sort="value" onClick={() => handleSort('value')}>
              <span className="lt-th-ic material-symbols-outlined">payments</span>
              Value
              <span className="lt-sort">
                <span className="material-symbols-outlined">arrow_downward</span>
              </span>
              <span className="lt-resize" onPointerDown={e => handleResizePointerDown(e, 2)} />
            </div>
            <div className="lt-th">
              <span className="lt-th-ic material-symbols-outlined">flag</span>Stage
              <span className="lt-resize" onPointerDown={e => handleResizePointerDown(e, 3)} />
            </div>
            <div className={thClass('sentiment')} data-sort="sentiment" onClick={() => handleSort('sentiment')}>
              <span className="lt-th-ic material-symbols-outlined">mood</span>
              Sentiment
              <span className="lt-sort">
                <span className="material-symbols-outlined">arrow_downward</span>
              </span>
              <span className="lt-resize" onPointerDown={e => handleResizePointerDown(e, 4)} />
            </div>
            <div className="lt-th">
              <span className="lt-th-ic material-symbols-outlined">hub</span>Source
              <span className="lt-resize" onPointerDown={e => handleResizePointerDown(e, 5)} />
            </div>
            <div className={thClassReg('last')} data-sort="last" onClick={() => handleSort('last')}>
              <span className="lt-th-ic material-symbols-outlined">schedule</span>
              Last Contact
              <span className="lt-sort">
                <span className="material-symbols-outlined">arrow_downward</span>
              </span>
              <span className="lt-resize" onPointerDown={e => handleResizePointerDown(e, 6)} />
            </div>
            <div className="lt-th">
              <span className="lt-th-ic material-symbols-outlined">thermostat</span>Temp
            </div>
          </div>

          {/* Body */}
          <div className="lt-body" id="ltBody">
            {shownRows.length === 0 ? (
              <div className="lt-empty">
                <div className="lt-empty-ic">
                  <span className="material-symbols-outlined">person_search</span>
                </div>
                <div className="lt-empty-t">No leads match this filter</div>
                <div className="lt-empty-s">
                  Try a different quick filter or clear your search to see the full pipeline.
                </div>
                <div className="lt-empty-btns">
                  <button type="button" className="lt-btn" onClick={clearAll}>
                    <span className="material-symbols-outlined">filter_alt_off</span>Clear filters
                  </button>
                  <button type="button" className="lt-btn lt-btn-ai" onClick={() => showToast('Asking AI to surface leads...')}>
                    <span className="material-symbols-outlined">bolt</span>Ask AI
                  </button>
                </div>
              </div>
            ) : (
              shownRows.map(lead => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isActive={openId === lead.id}
                  onClick={() => handleRowClick(lead)}
                />
              ))
            )}
          </div>

          {/* View more */}
          {!filterActive && !expanded && total > INITIAL_VISIBLE && (
            <div className="lt-viewmore-wrap" id="ltViewMoreWrap">
              <div className="lt-fade" />
              <button type="button" className="lt-viewmore" onClick={handleViewMore}>
                View more (<span id="ltViewMoreCount">{total - INITIAL_VISIBLE} of {total}</span>)
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer: pagination or filter count */}
        {(filterActive || expanded) && (
          <div className="lt-foot" id="ltFoot" style={{ display: 'flex' }}>
            <div className="lt-foot-info" id="ltFootInfo">
              {filterActive ? (
                <>Showing <b>{total}</b> matching lead{total === 1 ? '' : 's'}</>
              ) : (
                <><b>{pageStart + 1}--{Math.min(pageStart + PER_PAGE, total)}</b> of <b>{total}</b> leads</>
              )}
            </div>
            {!filterActive && pages > 1 && (
              <div className="lt-pages" id="ltPages">
                <button
                  type="button"
                  className="lt-pg nav"
                  disabled={safePage === 1}
                  onClick={() => { if (safePage > 1) setPage(safePage - 1) }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {pageNums.map((p, i) =>
                  p === '...' ? (
                    <button key={'ell-before-' + String(pageNums[i + 1] ?? 'end')} type="button" className="lt-pg ell" disabled>...</button>
                  ) : (
                    <button
                      type="button"
                      key={p}
                      className={`lt-pg${p === safePage ? ' cur' : ''}`}
                      onClick={() => { if (p !== safePage) { setPage(p as number); setOpenId(null) } }}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  className="lt-pg nav"
                  disabled={safePage === pages}
                  onClick={() => { if (safePage < pages) setPage(safePage + 1) }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* CSV export button (source subtitle promises it) */}
        <div style={{ padding: '0 28px 16px', display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="lt-btn"
            onClick={() => { exportCSV(filteredRows); showToast(`Exporting ${filteredRows.length} leads to CSV...`) }}
          >
            <span className="material-symbols-outlined">download</span>Export CSV
          </button>
        </div>
      </div>

      {/* Toast */}
      <div className={`lt-toast${toast ? ' show' : ''}`} id="ltToast">
        <span className="material-symbols-outlined">neurology</span>
        <span id="ltToastMsg">{toast}</span>
      </div>

      {/* Lead details popover -- mounted at table root; open/close managed here.
          key={popoverLead.id} remounts per lead so popover state resets
          naturally (no-use-effect Rule 5: reset state via key, not an effect). */}
      {popoverLead && (
        <LeadPopover
          key={popoverLead.id}
          lead={popoverLead}
          onClose={() => { setPopoverLead(null); setOpenId(null) }}
        />
      )}
    </div>
  )
}
