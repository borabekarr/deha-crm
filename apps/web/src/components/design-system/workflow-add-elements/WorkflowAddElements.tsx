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
 * or event handlers. The seg pill is driven by usePillSpring (motion-spring.ts).
 */

import { useState, useCallback, useRef } from 'react'
import './WorkflowAddElements.css'
// Ask Jeru button (Item 2): reuse the buttons-page .btn-apply class verbatim,
// same import precedent as DeleteModal.tsx.
import '../buttons/Buttons.css'
import { iconClass } from '../../../lib/iconClass'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { usePanelDirection } from '../../../lib/hooks/use-panel-direction'
import { usePillSpring } from '../../../lib/motion-spring'
import { clampAEPosition, clampNodesPositionForRow } from './workflow-add-elements-hook'

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
  output:    [{ name: 'Text Output',     icon: 'text_fields',     color: 'var(--brand-primary-500)' }, { name: 'Audio Output',    icon: 'graphic_eq',      color: 'var(--brand-primary-500)' }, { name: 'Image Output',    icon: 'image',           color: 'var(--brand-primary-500)' }, { name: 'Email Send',      icon: 'send',            color: 'var(--brand-primary-500)' }, { name: 'Slack Message',   icon: 'chat',            color: 'var(--brand-primary-500)' }, { name: 'Webhook Push',    icon: 'webhook',         color: 'var(--brand-primary-500)' }],
  llm:       [{ name: 'Claude',          icon: 'smart_toy',       color: '#8B5CF6' }, { name: 'GPT-4o',          icon: 'smart_toy',       color: '#8B5CF6' }, { name: 'Gemini 2.0',      icon: 'neurology',    color: '#8B5CF6' }, { name: 'Mistral',         icon: 'psychology',      color: '#8B5CF6' }, { name: 'Llama 3',         icon: 'memory',          color: '#8B5CF6' }],
  action:    [{ name: 'Write to Notion', icon: 'edit',            color: '#F59E0B' }, { name: 'Send Email',      icon: 'email',           color: '#F59E0B' }, { name: 'HTTP Request',    icon: 'http',            color: '#F59E0B' }, { name: 'Create Record',   icon: 'add_circle',      color: '#F59E0B' }, { name: 'Slack Post',      icon: 'chat_bubble',     color: '#F59E0B' }],
  kb:        [{ name: 'Vector Search',   icon: 'manage_search',   color: '#232323' }, { name: 'Embed Document',  icon: 'upload_file',     color: '#232323' }, { name: 'Semantic Search', icon: 'travel_explore',  color: '#232323' }, { name: 'Hybrid Search',   icon: 'search',          color: '#232323' }],
  database:  [{ name: 'Query',           icon: 'search',          color: '#EF4444' }, { name: 'Insert Row',      icon: 'add',             color: '#EF4444' }, { name: 'Update Row',      icon: 'edit',            color: '#EF4444' }, { name: 'Delete Row',      icon: 'delete',          color: '#EF4444' }],
  docreader: [{ name: 'PDF Reader',      icon: 'picture_as_pdf',  color: '#D97706' }, { name: 'Word Document',   icon: 'article',         color: '#D97706' }, { name: 'CSV Parser',      icon: 'table_chart',     color: '#D97706' }, { name: 'HTML Scraper',    icon: 'code',            color: '#D97706' }],
  logic:     [{ name: 'If / Else',       icon: 'call_split',      color: '#F97316' }, { name: 'Loop',            icon: 'loop',            color: '#F97316' }, { name: 'Switch',          icon: 'alt_route',       color: '#F97316' }, { name: 'Filter',          icon: 'filter_list',     color: '#F97316' }],
  utils:     [{ name: 'Delay',           icon: 'timer',           color: '#0D9488' }, { name: 'Transform',       icon: 'transform',       color: '#0D9488' }, { name: 'Format Date',     icon: 'calendar_today',  color: '#0D9488' }, { name: 'JSON Parse',      icon: 'data_object',     color: '#0D9488' }],
  notion:    [{ name: 'Write Page',      icon: 'article',         color: '#000000' }, { name: 'Read Database',   icon: 'table_chart',     color: '#000000' }, { name: 'Create Entry',    icon: 'add',             color: '#000000' }],
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
  /** Fix 5: a query changed while the results panel was already open — briefly
   *  blur+shimmer the stale result set instead of snapping to the new layout. */
  searchPending: boolean
  /** Fix 3: outgoing tab, kept mounted (as a ghost layer) through its exit animation. */
  listLeavingTab: Tab | null
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
  searchPending: false,
  listLeavingTab: null,
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
    searchPending: false,
    listLeavingTab: null,
  }
}

// Direction-aware tab order for the seg switch (Fix 3): index difference sign
// gives the travel direction, mirroring motion-tabs' index-based `dir`.
const TAB_ORDER: Tab[] = ['general', 'integrations']

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
  // Item 1: last-hovered category row, mirrored outside state so the mount-time
  // placement callback (nodesOuterCallbackRef) can read it without a stale closure.
  const hoveredRowRef = useRef<HTMLDivElement | null>(null)
  // Timer for nodes hide delay
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Timer for search-panel exit animation before unmounting (Item 1)
  const searchLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Fix 5: timer that closes the brief pending/shimmer window on each keystroke.
  const searchPendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Fix 3: timer that unmounts the outgoing tab's ghost list after its exit plays.
  const listLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Step 2 fix: mirrors "search results are showing" outside of state so the
  // mount-time placement callback (nodesOuterCallbackRef, empty deps array)
  // never reads a stale `filter`/`searchPanelMounted` closure — it decides
  // row-center vs. top-align off this ref instead.
  const searchModeRef = useRef(false)
  // F9: handleDocMouseDown/handleKeyDown are useCallback([]) and must stay
  // stable, but closeAll is redefined every render and closes over fresh
  // `state`. Route them through a ref updated at render time (not an effect,
  // per no-use-effect) so the blank-click/Escape path always calls the
  // CURRENT closeAll instead of the first render's stale closure.
  const closeAllRef = useRef<() => void>(() => {})

  // Proximity group registered on the shell: every descendant carrying
  // data-proximity (category rows, node rows, the footer button) gets the
  // proximity ramp from a single shared listener.
  const proximityRef = useProximityGroup<HTMLDivElement>()

  // Fix 3 (Step 3 migration): direction-aware category-list enter/exit, driven
  // by the shared hook instead of a hand-rolled listDir/dir-fwd/dir-back pair —
  // mirrors MotionTabs.tsx's usePanelDirection(viewIndex) consumption.
  const listPanelState = usePanelDirection(TAB_ORDER.indexOf(state.activeTab))

  // Fix 4: seg pill geometry, measured off the wrapper (buttons are `flex: 1`
  // so both are always equal width — no per-label width table needed) and
  // driven by usePillSpring instead of the shared CSS-transition segRef.
  const [pillGeo, setPillGeo] = useState({ x: 0, w: 0 })
  const segWrapRef = useRef<HTMLDivElement | null>(null)
  const measurePill = useCallback((tab: Tab) => {
    const wrap = segWrapRef.current
    if (!wrap) return
    const inner = wrap.clientWidth - 6 // 3px padding each side (.seg rule)
    const w = inner / 2
    setPillGeo({ x: 3 + TAB_ORDER.indexOf(tab) * w, w })
  }, [])
  const segSpringCallbackRef = useCallback((el: HTMLDivElement | null) => {
    segWrapRef.current = el
    if (el) measurePill(el.dataset.activeTab as Tab)
  }, [measurePill])
  const segPillRef = usePillSpring<HTMLSpanElement>(pillGeo.x, pillGeo.w)

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
    if (searchPendingTimer.current) clearTimeout(searchPendingTimer.current)
    if (listLeaveTimer.current) clearTimeout(listLeaveTimer.current)
    hoveredRowRef.current = null
    searchModeRef.current = false

    // F9: when the search flyout is on screen, closeAll must not unmount it
    // instantly — reuse the flyout's OWN mounted-through-exit close animation
    // (searchPanelLeaving / wae-search-leaving, the same reverse-morph path
    // handleSearchClear already drives) instead of writing a new one. Both
    // popovers then close in the same frame: the AE panel via its existing
    // .visible transition (it stays mounted, so removing the class alone
    // animates it) and the flyout via its reverse morph.
    const wasSearching = state.searchPanelMounted && !state.searchPanelLeaving
    if (wasSearching) {
      setState((s) => ({
        ...closedState(s),
        searchPanelMounted: true,
        searchPanelLeaving: true,
      }))
      searchLeaveTimer.current = setTimeout(() => {
        setState((s) => ({ ...s, searchPanelMounted: false, searchPanelLeaving: false }))
      }, 300)
    } else {
      // Use closedState (not INITIAL) to preserve aeLeft/aeTop so the fade-out
      // stays in place instead of jumping to the viewport left edge.
      setState((s) => closedState(s))
    }
  }
  closeAllRef.current = closeAll

  /** Item 1+6: clear search input and play reverse morph before unmounting panel. */
  const handleSearchClear = useCallback(() => {
    if (searchLeaveTimer.current) clearTimeout(searchLeaveTimer.current)
    if (searchPendingTimer.current) clearTimeout(searchPendingTimer.current)
    searchModeRef.current = false
    // Trigger exit animation
    setState((s) => ({ ...s, search: '', searchPanelLeaving: true, hoveredId: null, nodesVisible: false, searchPending: false }))
    // Unmount panel after exit animation completes (220ms * anim-mult; use 300ms as safe upper bound)
    searchLeaveTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, searchPanelMounted: false, searchPanelLeaving: false }))
    }, 300)
  }, [])

  /** Item 1: search input change — mount panel and trigger enter morph when text is typed.
   *  Fix 5: a query change while the panel is ALREADY open never unmounts the results —
   *  it instead gets a brief pending window (blur + shimmer over the current layout),
   *  which masks the result-set/height swap per the "blur masks imperfect transitions"
   *  pattern instead of animating height/width per keystroke. */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val) {
      if (searchLeaveTimer.current) clearTimeout(searchLeaveTimer.current)
      if (searchPendingTimer.current) clearTimeout(searchPendingTimer.current)
      // Search mode always top-aligns with the AE panel — a stale hovered-row
      // ref from before typing must not leak into the placement callback.
      hoveredRowRef.current = null
      searchModeRef.current = true
      setState((s) => ({
        ...s,
        search: val,
        hoveredId: null,
        nodesVisible: false,
        searchPanelMounted: true,
        searchPanelLeaving: false,
        searchPending: s.searchPanelMounted, // skip pending on the very first keystroke (entering morph covers it)
      }))
      searchPendingTimer.current = setTimeout(() => {
        setState((s) => ({ ...s, searchPending: false }))
      }, 200)
    } else {
      handleSearchClear()
    }
  }, [handleSearchClear])

  function hideNodes() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hoveredRowRef.current = null
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

    // Bug (F7): reopening the AE panel elsewhere previously left the search/nodes
    // flyout mounted with its stale timers still running — an orphaned popover
    // that kept the OLD position (wrong corner) or lingered as a blur ghost.
    // Reopening must fully reset that group, same as closeAll()/closedState().
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (searchLeaveTimer.current) clearTimeout(searchLeaveTimer.current)
    if (searchPendingTimer.current) clearTimeout(searchPendingTimer.current)
    hoveredRowRef.current = null
    searchModeRef.current = false

    // Show the panel at the shell-relative coordinates first so the element gets layout.
    // Then clamp in a rAF once the panel has real dimensions.
    setState((s) => ({
      ...s,
      aeVisible: true,
      aeLeft: initialLeft,
      aeTop: initialTop,
      nodesVisible: false,
      nodesLeft: 0,
      nodesTop: 0,
      hoveredId: null,
      search: '',
      searchPanelMounted: false,
      searchPanelLeaving: false,
      searchPending: false,
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
        closeAllRef.current()
      } else if (
        ae && !ae.contains(e.target as Node) &&
        !no
      ) {
        closeAllRef.current()
      }
    },
    [],
  )

  /** Escape key → close everything. */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeAllRef.current()
  }, [])

  /** Hover over a category row → show the nodes flyout, anchored to the AE panel. */
  function handleCatMouseEnter(cat: Category) {
    if (hideTimer.current) clearTimeout(hideTimer.current)

    const row = itemEls.current.get(cat.id) ?? null
    hoveredRowRef.current = row

    const aeOuter = aeOuterRef.current
    const nodesOuter = nodesOuterRef.current
    if (!aeOuter || !nodesOuter || !row) {
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

    // Item 1: align to the hovered row (proportional position), not always the
    // AE panel's top — compute position synchronously, all elements are in the DOM.
    const pos = clampNodesPositionForRow(row, aeOuter, nodesOuter, shellRef.current)
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

  /** After nodes panel mounts/updates, keep it pinned immediately right of and
   *  top-aligned with the AE panel — hover- and search-driven content share the
   *  same anchor now (Fix 1: a per-row anchor drifted the flyout down the page). */
  // This is a callback ref on the nodes outer element that fires on each render.
  const nodesOuterCallbackRef = useCallback((el: HTMLDivElement | null) => {
    nodesOuterRef.current = el
    if (!el) return
    const aeOuter = aeOuterRef.current
    if (!aeOuter) return
    const shell = shellRef.current

    // ALWAYS write the best-known final position to el.style FIRST, before any
    // setState/early-return, so the flyout is correctly placed on this very
    // frame instead of showing a stale position for a full render cycle.
    const placeRight = () => {
      // F7: aeOuter and el are both direct, position:absolute children of the
      // position:relative shell, so aeOuter.offsetTop/offsetLeft are the
      // shell-relative LAYOUT box — unaffected by the entrance
      // scale()/translateY() transform on .wae-pop-outer.visible. Reading
      // getBoundingClientRect() here instead bakes in whatever fraction of
      // that transform hasn't settled yet when search opens mid-animation
      // (the stress-timing case), drifting the flyout's top a few px below
      // the AE panel's true top. offsetTop/offsetWidth/offsetHeight are
      // always the settled values, so alignment holds at every moment.
      const shellRect = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 }
      const shInner = shell ? shell.offsetHeight : window.innerHeight
      const nh = el.offsetHeight
      let nx = aeOuter.offsetLeft + aeOuter.offsetWidth + 8
      if (nx < 10) nx = 10
      // Item 1: on first mount (no nodesTop state yet), center on the hovered
      // row when known; fall back to top-aligned with the AE panel otherwise
      // (e.g. search mode, which has no single hovered row).
      // F7: search mode is ALWAYS top-aligned, even if a hoveredRowRef survives
      // from before the search started — searchModeRef is the source of truth.
      const row = searchModeRef.current ? null : hoveredRowRef.current
      let ny: number
      if (row) {
        const rowRect = row.getBoundingClientRect()
        ny = rowRect.top + rowRect.height / 2 - shellRect.top - nh / 2
      } else {
        ny = aeOuter.offsetTop
      }
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
  }, [])

  /** Fix 3 (migrated to usePanelDirection, Step 3): switch the General/Integrations
   *  pill — direction-aware, sequenced exit/enter for the category list, mirroring
   *  motion-tabs' usePanelDirection consumption (see MotionTabs.tsx onTab). The
   *  outgoing tab stays mounted as a ghost layer until its exit animation completes;
   *  the hook derives dir from the activeTab index change below. */
  function switchTab(tab: Tab) {
    if (tab === state.activeTab) return
    if (listLeaveTimer.current) clearTimeout(listLeaveTimer.current)
    setState((s) => ({
      ...s,
      activeTab: tab,
      listLeavingTab: s.activeTab,
      hoveredId: null,
      nodesVisible: false,
    }))
    measurePill(tab)
    // Unmount the ghost layer once its exit animation (180ms * anim-mult) settles.
    listLeaveTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, listLeavingTab: null }))
    }, 260)
  }

  /** Fix 2: category rows. `interactive=false` renders a non-interactive ghost
   *  copy for the outgoing tab's exit layer (Fix 3) — no proximity/hover/refs. */
  function renderCatItems(cats: Category[], interactive: boolean) {
    return cats.map((cat) => (
      <div
        key={cat.id}
        {...(interactive
          ? {
              ref: (el: HTMLDivElement | null) => {
                if (el) itemEls.current.set(cat.id, el)
                else itemEls.current.delete(cat.id)
              },
              onMouseEnter: () => handleCatMouseEnter(cat),
              'data-proximity': true,
            }
          : {})}
        className={`wae-ae-item${interactive && state.hoveredId === cat.id ? ' hovered' : ''}`}
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
    ))
  }

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
        {/* Step 4: data-compact drives the footer collapse (spring/bounce) below —
            the card compacts whenever the search field holds any text, and
            re-expands the same way the moment it's cleared. */}
        <div className="wae-pop-inner wae-ae-inner" data-compact={state.search ? 'true' : undefined}>
          <div className="wae-ae-header">
            <div className="wae-ae-title">
              <span className="material-icons">widgets</span>
              Add Elements
            </div>

            {/* Segmented control — .seg/.seg.fill sizing from _controls.css, but the
                pill itself is driven by usePillSpring (Fix 4), not the shared segRef,
                so data-seg-managed still opts this instance out of _controls.js auto-init. */}
            <div
              ref={segSpringCallbackRef}
              className="seg fill wae-seg-wrap"
              data-seg-managed
              data-active-tab={state.activeTab}
            >
              {/* GOTCHA: the spring writes inline `transform`, so any hover polish on
                  this pill must live on the CSS `scale` property, never `transform`. */}
              <span className="seg-pill" ref={segPillRef} style={{ transition: 'none' }} />
              <button
                type="button"
                className={state.activeTab === 'general' ? 'active' : ''}
                onClick={() => switchTab('general')}
              >
                <span className="material-icons">apps</span>
                General
              </button>
              <button
                type="button"
                className={state.activeTab === 'integrations' ? 'active' : ''}
                onClick={() => switchTab('integrations')}
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

          {/* Category list — direction-aware exit/enter on tab switch (Fix 3), driven by
              usePanelDirection + the global [data-panel-state] keyframes, mirroring
              motion-tabs: the outgoing tab plays a ghost exit layer while the incoming
              tab (key={activeTab} remount) enters from the opposite side. Options inside
              register as a proximity group via data-proximity (Fix 2, default engine
              mapping — the group itself is registered once, on the shell). */}
          <div className="wae-ae-list-wrap">
            {state.listLeavingTab && (
              <div
                className="wae-ae-list wae-ae-list-exit"
                data-panel-state={listPanelState(TAB_ORDER.indexOf(state.listLeavingTab))}
                aria-hidden="true"
              >
                {renderCatItems(
                  (state.listLeavingTab === 'general' ? GENERAL_CATS : INTEGRATION_CATS).filter(
                    (c) => !filter || c.name.toLowerCase().includes(filter)
                  ),
                  false
                )}
              </div>
            )}
            <div
              className="wae-ae-list wae-ae-list-enter"
              data-panel-state={listPanelState(TAB_ORDER.indexOf(state.activeTab))}
              key={state.activeTab}
            >
              {renderCatItems(visibleCats, true)}
            </div>
          </div>

          {/* Footer — wrapped so its max-height can spring-collapse in search mode. */}
          <div className="wae-ae-footer-wrap">
            <div className="wae-ae-sep" />
            <div className="wae-ae-footer">
              {/* Item 2: exact copy of the buttons-page Ask Jeru button, unchanged. */}
              <button type="button" className="btn-green btn-apply" data-proximity>
                <span className="material-symbols-outlined btn-apply-icon">neurology</span>
                AI Recommendations
              </button>
            </div>
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
          <div
            className={`wae-pop-inner wae-nodes-inner${(filter || state.searchPanelMounted) ? ' wae-search-mode' : ''}`}
            data-pending={state.searchPending ? 'true' : undefined}
          >
            <div className="wae-nodes-header">
              <span className="material-icons">widgets</span>
              {filter ? 'Search Results' : 'Nodes'}
            </div>

            {/* Fix 5: pending window — blur+dim the stale result set behind a
                shimmer placeholder instead of snapping the layout on each keystroke. */}
            {state.searchPending && (
              <div className="wae-search-shimmer" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="wae-shimmer-row" style={{ animationDelay: `${i * 60}ms` }} />
                ))}
              </div>
            )}

            {filter ? (
              /* Two-column grouped search view */
              <div className="wae-search-cols">
                {/* General column */}
                <div className="wae-search-col">
                  {searchGroups.general.map(({ cat, nodes }) => (
                    <div key={cat.id} className="wae-search-cat-card">
                      {/* Item 4: theme by the category's own tag color. */}
                      <div
                        className="wae-search-cat-header"
                        style={{ '--wae-cat-color': cat.color } as React.CSSProperties}
                      >
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
                          <div key={`${node.name}-${i}`} className="wae-node-item" style={{ animationDelay: `${Math.min(i, 6) * 24}ms` }}>
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
                      {/* Item 4: theme by the category's own tag color. */}
                      <div
                        className="wae-search-cat-header"
                        style={{ '--wae-cat-color': cat.color } as React.CSSProperties}
                      >
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
                          <div key={`${node.name}-${i}`} className="wae-node-item" style={{ animationDelay: `${Math.min(i, 6) * 24}ms` }}>
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
                  <div key={`${node.name}-${i}`} className="wae-node-item" style={{ animationDelay: `${Math.min(i, 6) * 24}ms` }}>
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
