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
  { id: 'output',    name: 'Output',          icon: 'logout',        color: '#10B981' },
  { id: 'llm',       name: 'LLM',             icon: 'psychology',    color: '#8B5CF6' },
  { id: 'action',    name: 'Action',          icon: 'bolt',          color: '#F59E0B' },
  { id: 'kb',        name: 'Knowledge Base',  icon: 'folder_open',   color: '#334155' },
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
  output:    [{ name: 'Text Output',     icon: 'text_fields',     color: '#059669' }, { name: 'Audio Output',    icon: 'graphic_eq',      color: '#059669' }, { name: 'Image Output',    icon: 'image',           color: '#059669' }, { name: 'Email Send',      icon: 'send',            color: '#059669' }, { name: 'Slack Message',   icon: 'chat',            color: '#059669' }, { name: 'Webhook Push',    icon: 'webhook',         color: '#059669' }],
  llm:       [{ name: 'Claude',          icon: 'smart_toy',       color: '#7C3AED' }, { name: 'GPT-4o',          icon: 'smart_toy',       color: '#7C3AED' }, { name: 'Gemini 2.0',      icon: 'auto_awesome',    color: '#7C3AED' }, { name: 'Mistral',         icon: 'psychology',      color: '#7C3AED' }, { name: 'Llama 3',         icon: 'memory',          color: '#7C3AED' }],
  action:    [{ name: 'Write to Notion', icon: 'edit',            color: '#D97706' }, { name: 'Send Email',      icon: 'email',           color: '#D97706' }, { name: 'HTTP Request',    icon: 'http',            color: '#D97706' }, { name: 'Create Record',   icon: 'add_circle',      color: '#D97706' }, { name: 'Slack Post',      icon: 'chat_bubble',     color: '#D97706' }],
  kb:        [{ name: 'Vector Search',   icon: 'manage_search',   color: '#334155' }, { name: 'Embed Document',  icon: 'upload_file',     color: '#334155' }, { name: 'Semantic Search', icon: 'travel_explore',  color: '#334155' }, { name: 'Hybrid Search',   icon: 'search',          color: '#334155' }],
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkflowAddElements() {
  const [state, setState] = useState<MenuState>(INITIAL)

  // DOM refs for positioning — accessed in event handlers (no useEffect needed)
  const aeOuterRef   = useRef<HTMLDivElement | null>(null)
  const nodesOuterRef = useRef<HTMLDivElement | null>(null)
  // Map of category id → item DOM element (for nodes flyout positioning)
  const itemEls = useRef<Map<string, HTMLDivElement>>(new Map())
  // Timer for nodes hide delay
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Derived data ──────────────────────────────────────────────────────────
  const allCats = state.activeTab === 'general' ? GENERAL_CATS : INTEGRATION_CATS
  const filter = state.search.toLowerCase()
  const visibleCats = filter
    ? allCats.filter((c) => c.name.toLowerCase().includes(filter))
    : allCats

  const activeNodes =
    state.hoveredId != null ? (NODES[state.hoveredId] ?? []) : []

  // ── Handlers ─────────────────────────────────────────────────────────────

  function closeAll() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setState(INITIAL)
  }

  function hideNodes() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setState((s) => ({ ...s, nodesVisible: false, hoveredId: null }))
  }

  /** Open the Add Elements panel clamped to the right-click position. */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const x = e.clientX
    const y = e.clientY

    // Show the panel at the raw coordinates first so the element gets layout.
    // Then clamp in a rAF once the panel has real dimensions.
    setState((s) => ({
      ...s,
      aeVisible: true,
      aeLeft: x,
      aeTop: y,
      nodesVisible: false,
      hoveredId: null,
      search: '',
      activeTab: s.activeTab,
    }))

    // Clamp after layout is computed
    requestAnimationFrame(() => {
      const outer = aeOuterRef.current
      if (!outer) return
      const pos = clampAEPosition(x, y, outer)
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
    const pos = clampNodesPosition(aeOuter, itemEl, nodesOuter)
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
    if (!el || !state.nodesVisible) return
    const aeOuter = aeOuterRef.current
    const hovId = state.hoveredId
    if (!aeOuter || !hovId) return
    const itemEl = itemEls.current.get(hovId)
    if (!itemEl) return
    const pos = clampNodesPosition(aeOuter, itemEl, el)
    // Apply directly to DOM to avoid a second setState render cycle
    el.style.left = `${pos.left}px`
    el.style.top = `${pos.top}px`
  }, [state.nodesVisible, state.hoveredId])

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
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
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
            <div className="wae-ae-title">Add Elements</div>

            {/* Segmented control — shared .seg from _controls.css */}
            <div
              ref={state.aeVisible ? segCallbackRef : segRerenderRef}
              className="seg fill wae-seg-wrap"
              data-seg-managed
            >
              <span className="seg-pill" />
              <button
                className={state.activeTab === 'general' ? 'active' : ''}
                onClick={() => {
                  setState((s) => ({ ...s, activeTab: 'general', hoveredId: null, nodesVisible: false }))
                }}
              >
                General
              </button>
              <button
                className={state.activeTab === 'integrations' ? 'active' : ''}
                onClick={() => {
                  setState((s) => ({ ...s, activeTab: 'integrations', hoveredId: null, nodesVisible: false }))
                }}
              >
                Integrations
              </button>
            </div>

            {/* Search */}
            <div className="wae-ae-search">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Search..."
                autoComplete="off"
                value={state.search}
                onChange={(e) =>
                  setState((s) => ({ ...s, search: e.target.value, hoveredId: null, nodesVisible: false }))
                }
              />
            </div>
          </div>

          {/* Category list */}
          <div className="wae-ae-list">
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
                  className="wae-badge-icon wae-badge-lg"
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
            <button className="wae-ae-ai-btn">✦ AI Recommendations</button>
          </div>
        </div>
      </div>

      {/* ── Nodes flyout panel ────────────────────────────────────────────── */}
      {state.nodesVisible && (
        <div
          ref={nodesOuterCallbackRef}
          className="wae-pop-outer visible"
          style={{ left: state.nodesLeft, top: state.nodesTop }}
          onMouseEnter={handleNodesMouseEnter}
          onMouseLeave={handleNodesMouseLeave}
        >
          <div className="wae-pop-inner wae-nodes-inner">
            <div className="wae-nodes-header">Nodes</div>
            <div className="wae-nodes-list">
              {activeNodes.map((node, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={`${node.name}-${i}`} className="wae-node-item">
                  <div
                    className="wae-badge-icon wae-badge-sm"
                    style={{ backgroundColor: node.color }}
                  >
                    <span className="material-icons">{node.icon}</span>
                  </div>
                  <span className="wae-node-name">{node.name}</span>
                  <div className="wae-node-add-btn">
                    <span className="material-icons">add</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
