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
 * All non-component data + imperative DOM logic (react-doctor no-giant-component
 * split) live in workflow-add-elements-shared.ts / workflow-add-elements-hook.ts;
 * this file keeps state/refs and thin wrappers around them.
 */

import { useState, useCallback, useRef, useLayoutEffect } from 'react'
import './WorkflowAddElements.css'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { usePanelDirection } from '../../../lib/hooks/use-panel-direction'
import { usePillSpring } from '../../../lib/motion-spring'
import { tokenMs } from '@/lib/token-ms'
import {
  type Category,
  type Tab,
  GENERAL_CATS,
  INTEGRATION_CATS,
  NODES,
  INITIAL,
  TAB_ORDER,
  buildSearchGroups,
} from './workflow-add-elements-shared'
import {
  clampNodesPositionForRow,
  placeNodesFlyout,
  closeAllMenus,
  openContextMenu,
  isOutsideBothPanels,
  switchTabAnimation,
  type CloseTimers,
} from './workflow-add-elements-hook'
import { WorkflowAddElementsPanel } from './WorkflowAddElementsPanel'
import { WorkflowAddElementsNodesFlyout } from './WorkflowAddElementsNodesFlyout'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkflowAddElements() {
  const [state, setState] = useState(INITIAL)

  // DOM refs for positioning — accessed in event handlers (no useEffect needed)
  const shellRef     = useRef<HTMLDivElement | null>(null)
  const aeOuterRef   = useRef<HTMLDivElement | null>(null)
  const nodesOuterRef = useRef<HTMLDivElement | null>(null)
  // Map of category id → item DOM element (for nodes flyout positioning)
  const itemEls = useRef<Map<string, HTMLDivElement>>(new Map())
  // Item 1: last-hovered category row, mirrored outside state so the mount-time
  // placement callback (nodesOuterCallbackRef) can read it without a stale closure.
  const hoveredRowRef = useRef<HTMLDivElement | null>(null)
  // Timers (bundled for the hook.ts state-transition helpers below)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchPendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimers: CloseTimers = { hideTimer, searchLeaveTimer, searchPendingTimer, listLeaveTimer }
  // Step 4 (token-timer-consolidation): live node for the scoped
  // --panel-slide-exit-dur override read below, plain ref, attached on
  // mount, never re-derived in a lifecycle callback.
  const listWrapRef = useRef<HTMLDivElement>(null)
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
  const searchGroups = buildSearchGroups(filter)
  const activeNodes = !filter && state.hoveredId != null ? (NODES[state.hoveredId] ?? []) : []

  // ── Handlers ─────────────────────────────────────────────────────────────

  function closeAll() {
    closeAllMenus(closeTimers, hoveredRowRef, searchModeRef, state, setState)
  }
  // Kept in sync via useLayoutEffect (not a render-time write) so
  // react-doctor's render-purity check passes; closeAllRef is only read
  // from async listeners registered elsewhere, so the sync timing is
  // unchanged (runs synchronously after commit, before paint). closeAll is
  // intentionally rebuilt every render (it closes over fresh `state`), so
  // this effect deliberately runs every render too.
  useLayoutEffect(() => {
    closeAllRef.current = closeAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  /** Item 1+6: clear search input and play reverse morph before unmounting panel. */
  const handleSearchClear = useCallback(() => {
    if (searchLeaveTimer.current) clearTimeout(searchLeaveTimer.current)
    if (searchPendingTimer.current) clearTimeout(searchPendingTimer.current)
    searchModeRef.current = false
    setState((s) => ({ ...s, search: '', searchPanelLeaving: true, hoveredId: null, nodesVisible: false, searchPending: false }))
    // Unmount panel after the flyout's reverse-morph exit (--duration-280,
    // live read via tokenMs) plus a 20ms buffer.
    searchLeaveTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, searchPanelMounted: false, searchPanelLeaving: false }))
    }, tokenMs('--duration-280', 280) + 20)
  }, [])

  /** Item 1: search input change — mount panel and trigger enter morph when text is typed.
   *  Fix 5: a query change while the panel is ALREADY open never unmounts the results —
   *  it instead gets a brief pending window (blur + shimmer over the current layout). */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val) {
      if (searchLeaveTimer.current) clearTimeout(searchLeaveTimer.current)
      if (searchPendingTimer.current) clearTimeout(searchPendingTimer.current)
      hoveredRowRef.current = null
      searchModeRef.current = true
      setState((s) => ({
        ...s,
        search: val,
        hoveredId: null,
        nodesVisible: false,
        searchPanelMounted: true,
        searchPanelLeaving: false,
        searchPending: s.searchPanelMounted,
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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    openContextMenu(e, shellRef.current, aeOuterRef, closeTimers, hoveredRowRef, searchModeRef, setState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDocMouseDown = useCallback((e: React.MouseEvent) => {
    if (isOutsideBothPanels(e.target as Node, aeOuterRef.current, nodesOuterRef.current)) {
      closeAllRef.current()
    }
  }, [])

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
      setState((s) => ({ ...s, nodesVisible: true, hoveredId: cat.id, nodesLeft: 0, nodesTop: 0 }))
      return
    }

    const pos = clampNodesPositionForRow(row, aeOuter, nodesOuter, shellRef.current)
    setState((s) => ({ ...s, nodesVisible: true, hoveredId: cat.id, nodesLeft: pos.left, nodesTop: pos.top }))
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

  const nodesOuterCallbackRef = useCallback((el: HTMLDivElement | null) => {
    nodesOuterRef.current = el
    if (!el) return
    const aeOuter = aeOuterRef.current
    if (!aeOuter) return
    placeNodesFlyout(el, aeOuter, shellRef.current, hoveredRowRef, searchModeRef, (left) => {
      setState((s) => ({ ...s, aeLeft: left }))
    })
  }, [])

  function switchTab(tab: Tab) {
    switchTabAnimation(tab, state, setState, listLeaveTimer, measurePill, listWrapRef.current)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Outer shell: full viewport canvas with dot grid
    <div
      ref={(el) => { shellRef.current = el; proximityRef(el) }}
      className="wae-shell"
      role="presentation"
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

      <WorkflowAddElementsPanel
        aeOuterRef={aeOuterRef}
        aeVisible={state.aeVisible}
        aeLeft={state.aeLeft}
        aeTop={state.aeTop}
        search={state.search}
        activeTab={state.activeTab}
        segSpringCallbackRef={segSpringCallbackRef}
        segPillRef={segPillRef}
        onSwitchTab={switchTab}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        listWrapRef={listWrapRef}
        listLeavingTab={state.listLeavingTab}
        listPanelState={listPanelState}
        tabOrder={TAB_ORDER}
        visibleCats={visibleCats}
        filter={filter}
        hoveredId={state.hoveredId}
        itemEls={itemEls}
        onCatMouseEnter={handleCatMouseEnter}
      />

      {/* Show on hover (nodesVisible) OR when search panel is mounted (includes leaving animation).
          Item 1: searchPanelMounted = mounted-through-exit so reverse morph plays before unmount. */}
      {(state.nodesVisible || state.searchPanelMounted) && (
        <WorkflowAddElementsNodesFlyout
          nodesOuterCallbackRef={nodesOuterCallbackRef}
          nodesVisible={state.nodesVisible}
          searchPanelMounted={state.searchPanelMounted}
          searchPanelLeaving={state.searchPanelLeaving}
          searchPending={state.searchPending}
          nodesLeft={state.nodesLeft}
          nodesTop={state.nodesTop}
          onMouseEnter={handleNodesMouseEnter}
          onMouseLeave={handleNodesMouseLeave}
          filter={filter}
          searchGroups={searchGroups}
          activeNodes={activeNodes}
        />
      )}
    </div>
  )
}
