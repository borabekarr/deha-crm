/**
 * WorkflowAddElements.tsx
 *
 * Right-click canvas → Add Elements popup + Nodes flyout.
 * Converted from apps/web/design-system/preview/components-workflow-add-elements.html.
 *
 * Interaction model (mirrors the source prototype):
 *  - Right-click anywhere on the dot-grid canvas → Add Elements panel appears
 *    at the cursor, clamped to viewport.
 *  - Hovering a category row → Nodes flyout appears to the right.
 *  - Tab switching (General / Integrations) → filters the category list.
 *  - Search input → filters categories by name.
 *  - Escape or clicking outside → closes everything.
 *  - "✦ AI Recommendations" button → no-op placeholder (matches source).
 *
 * NO raw useEffect in this file. All DOM measurements are done in callback refs
 * or event handlers. The shared segRef from controls-hook.ts wires the seg pill.
 */

import { useState, useCallback, useRef } from 'react'
import './WorkflowAddElements.css'
import { iconClass } from '../../../lib/iconClass'
import { useProximityGroup } from '../../../lib/hooks'
import { segRef, cleanupSeg, clampAEPosition, clampNodesPosition } from './workflow-add-elements-hook'

// ---------------------------------------------------------------------------
// Data (verbatim from source)
// ---------------------------------------------------------------------------

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface NodeItem {
  name: string
  icon: string
  color: string
}

const GENERAL_CATS: Category[] = [
  { id: 'input',     name: 'Input',           icon: 'login',         color: '#4F46E5' },
  { id: 'output',    name: 'Output',          icon: 'logout',        color: 'var(--brand-primary-500)' },
  { id: 'llm',       name: 'LLM',             icon: 'psychology',    color: '#8B5CF6' },
  { id: 'action',    name: 'Action',          icon: 'bolt',          color: '#F59E0B' },
  { id: 'kb',        name: 'Knowledge Base',  icon: 'folder_open',   color: '#232323' },
  { id: 'database',  name: 'Database',        icon: 'storage',       color: '#EF4444' },
  { id: 'docreader', name: 'Document Reader', icon: 'description',   color: '#D97706' },
  { id: 'logic',     name: 'Logic',           icon: 'call_split',    color: '#F97316' },
  { id: 'utils',     name: 'Utilities',       icon: 'grid_view',     color: '#0D9488' },
]

const INTEGRATION_CATS: Category[] = [
  { id: 'notion',   name: 'Notion',        icon: 'article',       color: '#000000' },
  { id: 'slack',    name: 'Slack',         icon: 'chat',          color: '#4A154B' },
  { id: 'stripe',   name: 'Stripe',        icon: 'credit_card',   color: '#635BFF' },
  { id: 'airtable', name: 'Airtable',      icon: 'table_chart',   color: '#EF4444' },
  { id: 'gmail',    name: 'Gmail',         icon: 'email',         color: '#EA4335' },
  { id: 'sheets',   name: 'Google Sheets', icon: 'grid_on',       color: '#0F9D58' },
  { id: 'github',   name: 'GitHub',        icon: 'code',          color: '#24292E' },
  { id: 'hubspot',  name: 'HubSpot',       icon: 'hub',           color: '#FF7A59' },
]

const NODES: Record<string, NodeItem[]> = {
  input:     [{ name: 'Text Prompt',     icon: 'notes',           color: '#4F46E5' }, { name: 'URL Fetcher',     icon: 'link',            color: '#4F46E5' }, { name: 'File Upload',     icon: 'upload_file',     color: '#4F46E5' }, { name: 'Audio Upload',    icon: 'mic',             color: '#4F46E5' }, { name: 'Image Upload',    icon: 'image',           color: '#4F46E5' }, { name: 'Form Input',      icon: 'edit_note',       color: '#4F46E5' }, { name: 'Webhook',         icon: 'webhook',         color: '#4F46E5' }, { name: 'Database Query',  icon: 'storage',         color: '#4F46E5' }],
  output:    [{ name: 'Text Output',     icon: 'text_fields',     color: 'var(--brand-primary-600)' }, { name: 'Audio Output',    icon: 'graphic_eq',      color: 'var(--brand-primary-600)' }, { name: 'Image Output',    icon: 'image',           color: 'var(--brand-primary-600)' }, { name: 'Email Send',      icon: 'send',            color: 'var(--brand-primary-600)' }, { name: 'Slack Message',   icon: 'chat',            color: 'var(--brand-primary-600)' }, { name: 'Webhook Push',    icon: 'webhook',         color: 'var(--brand-primary-600)' }],
  llm:       [{ name: 'Claude',          icon: 'smart_toy',       color: '#7C3AED' }, { name: 'GPT-4o',          icon: 'smart_toy',       color: '#7C3AED' }, { name: 'Gemini 2.0',      icon: 'neurology',    color: '#7C3AED' }, { name: 'Mistral',         icon: 'psychology',      color: '#7C3AED' }, { name: 'Llama 3',         icon: 'memory',          color: '#7C3AED' }],
  action:    [{ name: 'Write to Notion', icon: 'edit',            color: '#D97706' }, { name: 'Send Email',      icon: 'email',           color: '#D97706' }, { name: 'HTTP Request',    icon: 'http',            color: '#D97706' }, { name: 'Create Record',   icon: 'add_circle',      color: '#D97706' }, { name: 'Slack Post',      icon: 'chat_bubble',     color: '#D97706' }],
  kb:        [{ name: 'Vector Search',   icon: 'manage_search',   color: '#232323' }, { name: 'Embed Document',  icon: 'upload_file',     color: '#232323' }, { name: 'Semantic Search', icon: 'travel_explore',  color: '#232323' }, { name: 'Hybrid Search',   icon: 'search',          color: '#232323' }],
  database:  [{ name: 'Query',           icon: 'search',          color: '#DC2626' }, { name: 'Insert Row',      icon: 'add',             color: '#DC2626' }, { name: 'Update Row',      icon: 'edit',            color: '#DC2626' }, { name: 'Delete Row',      icon: 'delete',          color: '#DC2626' }],
  docreader: [{ name: 'PDF Reader',      icon: 'picture_as_pdf',  color: '#B45309' }, { name: 'Word Document',   icon: 'article',         color: '#B45309' }, { name: 'CSV Parser',      icon: 'table_chart',     color: '#B45309' }, { name: 'HTML Scraper',    icon: 'code',            color: '#B45309' }],
  logic:     [{ name: 'If / Else',       icon: 'call_split',      color: '#EA580C' }, { name: 'Loop',            icon: 'loop',            color: '#EA580C' }, { name: 'Switch',          icon: 'alt_route',       color: '#EA580C' }, { name: 'Filter',          icon: 'filter_list',     color: '#EA580C' }],
  utils:     [{ name: 'Delay',           icon: 'timer',           color: '#0F766E' }, { name: 'Transform',       icon: 'transform',       color: '#0F766E' }, { name: 'Format Date',     icon: 'calendar_today',  color: '#0F766E' }, { name: 'JSON Parse',      icon: 'data_object',     color: '#0F766E' }],
  notion:    [{ name: 'Write Page',      icon: 'article',         color: '#000' },    { name: 'Read Database',   icon: 'table_chart',     color: '#000' },    { name: 'Create Entry',    icon: 'add',             color: '#000' }],
  slack:     [{ name: 'Send Message',    icon: 'chat',            color: '#4A154B' }, { name: 'DM User',         icon: 'person',          color: '#4A154B' }, { name: 'Post to Channel', icon: 'campaign',        color: '#4A154B' }],
  stripe:    [{ name: 'Create Customer', icon: 'person_add',      color: '#635BFF' }, { name: 'Charge Card',     icon: 'credit_card',     color: '#635BFF' }, { name: 'Create Invoice',  icon: 'receipt',         color: '#635BFF' }],
  airtable:  [{ name: 'Query Records',   icon: 'search',          color: '#EF4444' }, { name: 'Create Record',   icon: 'add',             color: '#EF4444' }, { name: 'Update Record',   icon: 'edit',            color: '#EF4444' }],
  gmail:     [{ name: 'Send Email',      icon: 'send',            color: '#EA4335' }, { name: 'Read Inbox',      icon: 'inbox',           color: '#EA4335' }, { name: 'Create Draft',    icon: 'drafts',          color: '#EA4335' }],
  sheets:    [{ name: 'Append Row',      icon: 'add',             color: '#0F9D58' }, { name: 'Read Range',      icon: 'table_rows',      color: '#0F9D58' }, { name: 'Update Cell',     icon: 'edit',            color: '#0F9D58' }],
  github:    [{ name: 'Create Issue',    icon: 'bug_report',      color: '#24292E' }, { name: 'Open PR',         icon: 'merge',           color: '#24292E' }, { name: 'Push Commit',     icon: 'commit',          color: '#24292E' }],
  hubspot:   [{ name: 'Create Contact',  icon: 'person_add',      color: '#FF7A59' }, { name: 'Update Deal',     icon: 'handshake',       color: '#FF7A59' }, { name: 'Send Email',      icon: 'email',           color: '#FF7A59' }],
}

// ---------------------------------------------------------------------------
// State types
// ---------------------------------------------------------------------------

type Tab = 'general' | 'integrations'

interface MenuState {
  aeVisible: boolean
  aeLeft: number
  aeTop: number
  nodesVisible: boolean
  nodesLeft: number
  nodesTop: number
  hoveredId: string | null
  activeTab: Tab
  search: string
  /** Item 1+6: search results panel is mounted through exit animation. */
  searchPanelMounted: boolean
  /** Item 1: search results panel is playing exit animation (wae-search-leaving). */
  searchPanelLeaving: boolean
}

// Category ids whose brand color is near-black and becomes unreadable in dark mode.
// These get wae-badge--ink so the dark-mode CSS can lighten the square.
const DARK_BADGE_IDS = new Set(['notion', 'github', 'kb', 'slack'])

// Known near-black color values used in node data (same dark categories).
const INK_COLORS = new Set(['#000000', '#000', '#24292e', '#232323', '#4a154b'])

/** Returns true when the hex color is near-black (unreadable on a dark background). */
function isInkColor(color: string): boolean {
  return INK_COLORS.has(color.toLowerCase())
}

const INITIAL: MenuState = {
  aeVisible: false,
  aeLeft: 0,
  aeTop: 0,
  nodesVisible: false,
  nodesLeft: 0,
  nodesTop: 0,
  hoveredId: null,
  activeTab: 'general',
  search: '',
  searchPanelMounted: false,
  searchPanelLeaving: false,
}

// Coords-only reset — preserves last aeLeft/aeTop so the panel
// fades out in place rather than jumping to 0,0 (close-spawn-left bug).
function closedState(s: MenuState): MenuState {
  return {
    ...s,
    aeVisible: false,
    nodesVisible: false,
    hoveredId: null,
    search: '',
    searchPanelMounted: false,
    searchPanelLeaving: false,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkflowAddElements() {
  const [state, setState] = useState<MenuState>(INITIAL)

  // DOM refs for positioning — accessed in event handlers (no useEffect needed)
  const shellRef     = useRef<HTMLDivElement | null>(null)
  const aeOuterRef   = useRef<HTMLDivElement | null>(null)
  const nodesOuterRef = useRef<HTMLDivElement | null>(null)
  // Map of category id → item DOM element (for nodes flyout positioning)
  const itemEls = useRef<Map<string, HTMLDivElement>>(new Map())
  // Timer for nodes hide delay
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Timer for search-panel exit animation before unmounting (Item 1)
  const searchLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Proximity group: only the AI Recommendations footer button carries
  // data-proximity now (Step 18); category/node rows use plain background
  // hover instead. Shell ref stays wired (no-op for rows).
  const proximityRef = useProximityGroup<HTMLDivElement>()

  // ── Derived data ──────────────────────────────────────────────────────────
  const allCats = state.activeTab === 'general' ? GENERAL_CATS : INTEGRATION_CATS
  const filter = state.search.toLowerCase()
  const visibleCats = filter
    ? allCats.filter((c) => c.name.toLowerCase().includes(filter))
    : allCats

  // When search is active: group matching nodes by their parent category,
  // split into General vs Integrations columns for the two-column search view.
  // When search is empty: show only the hovered category's nodes (hover-to-preview).
  interface SearchGroup { cat: Category; nodes: NodeItem[] }
  interface SearchGroups { general: SearchGroup[]; integrations: SearchGroup[] }

  const searchGroups: SearchGroups = filter
    ? {
        general: GENERAL_CATS.reduce<SearchGroup[]>((acc, cat) => {
          const matched = (NODES[cat.id] ?? []).filter((n) =>
            n.name.toLowerCase().includes(filter)
          )
          if (matched.length > 0) acc.push({ cat, nodes: matched })
          return acc
        }, []),
        integrations: INTEGRATION_CATS.reduce<SearchGroup[]>((acc, cat) => {
          const matched = (NODES[cat.id] ?? []).filter((n) =>
            n.name.toLowerCase().includes(filter)
          )
          if (matched.length > 0) acc.push({ cat, nodes: matched })
          return acc
        }, []),
      }
    : { general: [], integrations: [] }

  const activeNodes: NodeItem[] =
    !filter && state.hoveredId != null ? (NODES[state.hoveredId] ?? []) : []

  // ── Handlers ─────────────────────────────────────────────────────────────

  function closeAll() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (searchLeaveTimer.current) clearTimeout(searchLeaveTimer.current)
    // Use closedState (not INITIAL) to preserve aeLeft/aeTop so the fade-out
    // stays in place instead of jumping to the viewport left edge.
    setState((s) => closedState(s))
  }

  /** Item 1+6: clear search input and play reverse morph before unmounting panel. */
  const handleSearchClear = useCallback(() => {
    if (searchLeaveTimer.current) clearTimeout(searchLeaveTimer.current)
    // Trigger exit animation
    setState((s) => ({ ...s, search: '', searchPanelLeaving: true, hoveredId: null, nodesVisible: false }))
    // Unmount panel after exit animation completes (220ms * anim-mult; use 300ms as safe upper bound)
    searchLeaveTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, searchPanelMounted: false, searchPanelLeaving: false }))
    }, 300)
  }, [])

  /** Item 1: search input change — mount panel and trigger enter morph when text is typed. */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val) {
      if (searchLeaveTimer.current) clearTimeout(searchLeaveTimer.current)
      setState((s) => ({ ...s, search: val, hoveredId: null, nodesVisible: false, searchPanelMounted: true, searchPanelLeaving: false }))
    } else {
      handleSearchClear()
    }
  }, [handleSearchClear])

  function hideNodes() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setState((s) => ({ ...s, nodesVisible: false, hoveredId: null }))
  }

  /** Open the Add Elements panel clamped to the right-click position. */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const x = e.clientX
    const y = e.clientY
    const shell = shellRef.current

    // Convert viewport coords to shell-relative coords immediately so the panel
    // is never placed at shell-relative 0,0 (top-left) on the first render.
    // The shell is position:relative; the panel is position:absolute inside it.
    const shellRect = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 }
    const initialLeft = x - shellRect.left
    const initialTop  = y - shellRect.top

    // Show the panel at the shell-relative coordinates first so the element gets layout.
    // Then clamp in a rAF once the panel has real dimensions.
    setState((s) => ({
      ...s,
      aeVisible: true,
      aeLeft: initialLeft,
      aeTop: initialTop,
      nodesVisible: false,
      hoveredId: null,
      search: '',
      activeTab: s.activeTab,
    }))

    // Clamp after layout is computed (panel must be in DOM for offsetWidth/Height)
    requestAnimationFrame(() => {
      const outer = aeOuterRef.current
      if (!outer) return
      const pos = clampAEPosition(x, y, outer, shellRef.current)
      setState((s) => ({ ...s, aeLeft: pos.left, aeTop: pos.top }))
    })
  }, [])

  /** Click outside both panels → close everything. */
  const handleDocMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const ae = aeOuterRef.current
      const no = nodesOuterRef.current
      if (
        ae && !ae.contains(e.target as Node) &&
        no && !no.contains(e.target as Node)
      ) {
        closeAll()
      } else if (
        ae && !ae.contains(e.target as Node) &&
        !no
      ) {
        closeAll()
      }
    },
    [],
  )

  /** Escape key → close everything. */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeAll()
  }, [])

  /** Hover over a category row → show the nodes flyout. */
  function handleCatMouseEnter(cat: Category) {
    if (hideTimer.current) clearTimeout(hideTimer.current)

    const aeOuter = aeOuterRef.current
    const nodesOuter = nodesOuterRef.current
    const itemEl = itemEls.current.get(cat.id)
    if (!aeOuter || !nodesOuter || !itemEl) {
      // Nodes panel not in DOM yet; show with placeholder position and let rAF fix it
      setState((s) => ({
        ...s,
        nodesVisible: true,
        hoveredId: cat.id,
        nodesLeft: 0,
        nodesTop: 0,
      }))
      return
    }

    // Compute position synchronously — all elements are in the DOM
    const pos = clampNodesPosition(aeOuter, itemEl, nodesOuter, shellRef.current)
    setState((s) => ({
      ...s,
      nodesVisible: true,
      hoveredId: cat.id,
      nodesLeft: pos.left,
      nodesTop: pos.top,
    }))
  }

  /** Mouse leaves nodes flyout → hide with a short delay (allows re-entry). */
  function handleNodesMouseLeave(e: React.MouseEvent) {
    const ae = aeOuterRef.current
    if (ae && ae.contains(e.relatedTarget as Node)) return
    hideTimer.current = setTimeout(hideNodes, 90)
  }

  /** Mouse re-enters nodes flyout → cancel pending hide. */
  function handleNodesMouseEnter() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  /** After nodes panel mounts/updates with a new hoveredId, clamp its position. */
  // This is a callback ref on the nodes outer element that fires on each render.
  const nodesOuterCallbackRef = useCallback((el: HTMLDivElement | null) => {
    nodesOuterRef.current = el
    if (!el) return
    const aeOuter = aeOuterRef.current
    if (!aeOuter) return

    // Hover-driven positioning: align flyout to the hovered category row.
    // Search-driven positioning: align to the top of the AE panel (no hovered row).
    const shell = shellRef.current
    const hovId = state.hoveredId
    if (hovId) {
      const itemEl = itemEls.current.get(hovId)
      if (!itemEl) return
      const pos = clampNodesPosition(aeOuter, itemEl, el, shell)
      // Apply directly to DOM to avoid a second setState render cycle
      el.style.left = `${pos.left}px`
      el.style.top = `${pos.top}px`
    } else if (state.search) {
      // No hovered row — Search Results always sit to the RIGHT of the AE card,
      // top-aligned. All coords are shell-relative (position: absolute inside shell).
      // Item 1 fix: ALWAYS write the best-known final position to el.style FIRST,
      // before any setState/early-return. The old code returned early when the AE
      // card needed to slide left, leaving the flyout at its stale inline-style
      // coords (state.nodesLeft/Top, often 0 or a prior hover row) for a full
      // render cycle — that is the "results appear at the bottom, then snap" jump
      // on the very first typed letter. Now the flyout is correctly placed on the
      // same frame; the AE shift is recomputed against the new aeLeft in a rAF.
      const placeRight = () => {
        const aeRect = aeOuter.getBoundingClientRect()
        const shellRect = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 }
        const shInner = shell ? shell.offsetHeight : window.innerHeight
        const nh = el.offsetHeight
        let nx = (aeRect.right - shellRect.left) + 8
        if (nx < 10) nx = 10
        let ny = aeRect.top - shellRect.top
        if (ny + nh > shInner - 10) ny = shInner - nh - 10
        if (ny < 10) ny = 10
        el.style.left = `${nx}px`
        el.style.top = `${ny}px`
      }

      // Place the flyout at its final position on this frame (no jump).
      placeRight()

      // If the right-placed flyout overflows the shell, slide the AE card left so
      // the flyout still fits to its right — never flip the flyout to the left.
      const aeRect = aeOuter.getBoundingClientRect()
      const shellRect = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 }
      const sw = shell ? shell.offsetWidth : window.innerWidth
      const nw = el.offsetWidth
      const aeLeftShell = aeRect.left - shellRect.left
      const nx0 = (aeRect.right - shellRect.left) + 8
      const overflow = nx0 + nw - (sw - 10)
      if (overflow > 0.5) {
        const newAeLeft = Math.max(10, aeLeftShell - overflow)
        if (Math.abs(newAeLeft - aeLeftShell) > 0.5) {
          setState((s) => ({ ...s, aeLeft: newAeLeft }))
          // Re-place the flyout against the shifted AE card next frame so it
          // tracks the new right edge — the flyout never visibly jumps because
          // placeRight() above already set a valid position for this frame.
          requestAnimationFrame(placeRight)
        }
      }
    }
  }, [state.hoveredId, state.search])

  /** Callback ref for the segmented control — wires the sliding pill. */
  const segCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      segRef(el)
    } else {
      cleanupSeg(el)
    }
  }, [])

  /** After tab or search change we need to re-position the seg pill. */
  const segRerenderRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    segRef(el)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Outer shell: full viewport canvas with dot grid
     
    <div
      ref={(el) => { shellRef.current = el; proximityRef(el) }}
      className="wae-shell"
      onContextMenu={handleContextMenu}
      onMouseDown={handleDocMouseDown}
      onKeyDown={handleKeyDown}
      // tabIndex makes the div focusable so keydown fires without a focused child
      tabIndex={-1}
    >
      {/* Dot-grid canvas */}
      <div className="wae-canvas">
        <div className="wae-canvas-hint">
          <span className="material-icons">mouse</span>
          Right-click anywhere to add elements
        </div>
      </div>

      {/* ── Add Elements panel ────────────────────────────────────────────── */}
      <div
        ref={aeOuterRef}
        className={`wae-pop-outer${state.aeVisible ? ' visible' : ''}`}
        style={{ left: state.aeLeft, top: state.aeTop }}
      >
        <div className="wae-pop-inner wae-ae-inner">
          <div className="wae-ae-header">
            <div className="wae-ae-title">
              <span className="material-icons">widgets</span>
              Add Elements
            </div>

            {/* Segmented control — shared .seg from _controls.css */}
            <div
              ref={state.aeVisible ? segCallbackRef : segRerenderRef}
              className="seg fill wae-seg-wrap"
              data-seg-managed
            >
              <span className="seg-pill" />
              <button
                type="button"
                className={state.activeTab === 'general' ? 'active' : ''}
                onClick={() => {
                  setState((s) => ({ ...s, activeTab: 'general', hoveredId: null, nodesVisible: false }))
                }}
              >
                <span className="material-icons">apps</span>
                General
              </button>
              <button
                type="button"
                className={state.activeTab === 'integrations' ? 'active' : ''}
                onClick={() => {
                  setState((s) => ({ ...s, activeTab: 'integrations', hoveredId: null, nodesVisible: false }))
                }}
              >
                <span className="material-icons">hub</span>
                Integrations
              </button>
            </div>

            {/* Search */}
            <div className="wae-ae-search" data-has-text={state.search ? 'true' : 'false'}>
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Search..."
                autoComplete="off"
                aria-label="Search workflow elements"
                value={state.search}
                onChange={handleSearchChange}
              />
              {/* Item 6: clear button — visible only when text entered */}
              <button
                type="button"
                className="wae-ae-search-clear"
                aria-label="Clear search"
                onClick={handleSearchClear}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
          </div>

          {/* Category list — key={activeTab} remounts on tab switch so the whole
              list morphs in as one unit (wae-list-morph-in) instead of rows spawning. */}
          <div className="wae-ae-list" key={state.activeTab}>
            {visibleCats.map((cat) => (
              <div
                key={cat.id}
                ref={(el) => {
                  if (el) itemEls.current.set(cat.id, el)
                  else itemEls.current.delete(cat.id)
                }}
                className={`wae-ae-item${state.hoveredId === cat.id ? ' hovered' : ''}`}
                onMouseEnter={() => handleCatMouseEnter(cat)}
              >
                <div
                  className={`wae-badge-icon wae-badge-lg${DARK_BADGE_IDS.has(cat.id) ? ' wae-badge--ink' : ''}`}
                  style={{ backgroundColor: cat.color }}
                >
                  <span className="material-icons">{cat.icon}</span>
                </div>
                <span className="wae-ae-name">{cat.name}</span>
                <span className="material-icons wae-ae-chevron">chevron_right</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="wae-ae-sep" />
          <div className="wae-ae-footer">
            <button type="button" className="btn-green" data-proximity>
              <span className={iconClass('neurology')}>neurology</span>
              AI Recommendations
            </button>
          </div>
        </div>
      </div>

      {/* ── Nodes flyout panel ────────────────────────────────────────────── */}
      {/* Show on hover (nodesVisible) OR when search panel is mounted (includes leaving animation).
          Item 1: searchPanelMounted = mounted-through-exit so reverse morph plays before unmount. */}
      {(state.nodesVisible || state.searchPanelMounted) && (
        <div
          ref={nodesOuterCallbackRef}
          className={[
            'wae-pop-outer',
            (state.nodesVisible || (state.searchPanelMounted && !state.searchPanelLeaving)) ? 'visible' : '',
            filter && !state.searchPanelLeaving ? 'wae-search-entering' : '',
            state.searchPanelLeaving ? 'wae-search-leaving' : '',
          ].filter(Boolean).join(' ')}
          style={{ left: state.nodesLeft, top: state.nodesTop }}
          onMouseEnter={handleNodesMouseEnter}
          onMouseLeave={handleNodesMouseLeave}
        >
          <div className={`wae-pop-inner wae-nodes-inner${(filter || state.searchPanelMounted) ? ' wae-search-mode' : ''}`}>
            <div className="wae-nodes-header">
              <span className="material-icons">widgets</span>
              {filter ? 'Search Results' : 'Nodes'}
            </div>

            {filter ? (
              /* Two-column grouped search view */
              <div className="wae-search-cols">
                {/* General column */}
                <div className="wae-search-col">
                  {searchGroups.general.map(({ cat, nodes }) => (
                    <div key={cat.id} className="wae-search-cat-card">
                      <div className="wae-search-cat-header">
                        <div
                          className={`wae-badge-icon wae-badge-lg${DARK_BADGE_IDS.has(cat.id) ? ' wae-badge--ink' : ''}`}
                          style={{ backgroundColor: cat.color }}
                        >
                          <span className="material-icons">{cat.icon}</span>
                        </div>
                        <span className="wae-search-cat-name">{cat.name}</span>
                      </div>
                      <div className="wae-search-cat-nodes">
                        {nodes.map((node, i) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <div key={`${node.name}-${i}`} className="wae-node-item">
                            <div
                              className={`wae-badge-icon wae-badge-sm${isInkColor(node.color) ? ' wae-badge--ink' : ''}`}
                              style={{ backgroundColor: node.color }}
                            >
                              <span className={iconClass(node.icon)}>{node.icon}</span>
                            </div>
                            <span className="wae-node-name">{node.name}</span>
                            <div className="wae-node-add-btn">
                              <span className="material-icons">add</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vertical separator */}
                <div className="wae-search-col-sep" aria-hidden="true" />

                {/* Integrations column */}
                <div className="wae-search-col">
                  {searchGroups.integrations.map(({ cat, nodes }) => (
                    <div key={cat.id} className="wae-search-cat-card">
                      <div className="wae-search-cat-header">
                        <div
                          className={`wae-badge-icon wae-badge-lg${DARK_BADGE_IDS.has(cat.id) ? ' wae-badge--ink' : ''}`}
                          style={{ backgroundColor: cat.color }}
                        >
                          <span className="material-icons">{cat.icon}</span>
                        </div>
                        <span className="wae-search-cat-name">{cat.name}</span>
                      </div>
                      <div className="wae-search-cat-nodes">
                        {nodes.map((node, i) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <div key={`${node.name}-${i}`} className="wae-node-item">
                            <div
                              className={`wae-badge-icon wae-badge-sm${isInkColor(node.color) ? ' wae-badge--ink' : ''}`}
                              style={{ backgroundColor: node.color }}
                            >
                              <span className={iconClass(node.icon)}>{node.icon}</span>
                            </div>
                            <span className="wae-node-name">{node.name}</span>
                            <div className="wae-node-add-btn">
                              <span className="material-icons">add</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Single-column hover-preview view (unchanged) */
              <div className="wae-nodes-list">
                {activeNodes.map((node, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={`${node.name}-${i}`} className="wae-node-item">
                    <div
                      className={`wae-badge-icon wae-badge-sm${isInkColor(node.color) ? ' wae-badge--ink' : ''}`}
                      style={{ backgroundColor: node.color }}
                    >
                      <span className={iconClass(node.icon)}>{node.icon}</span>
                    </div>
                    <span className="wae-node-name">{node.name}</span>
                    <div className="wae-node-add-btn">
                      <span className="material-icons">add</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
