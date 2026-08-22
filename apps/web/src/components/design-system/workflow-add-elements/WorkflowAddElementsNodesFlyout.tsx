// Render-only split of WorkflowAddElements' nodes flyout popover
// (react-doctor no-giant-component). Class names, DOM order and markup are
// unchanged from the parent; the mount/update placement logic
// (nodesOuterCallbackRef) lives in workflow-add-elements-hook.ts and is
// passed down already-composed as a callback ref.
import { iconClass } from '../../../lib/iconClass'
import { DARK_BADGE_IDS, isInkColor, type SearchGroups, type NodeItem } from './workflow-add-elements-shared'

interface WorkflowAddElementsNodesFlyoutProps {
  nodesOuterCallbackRef: (el: HTMLDivElement | null) => void
  nodesVisible: boolean
  searchPanelMounted: boolean
  searchPanelLeaving: boolean
  searchPending: boolean
  nodesLeft: number
  nodesTop: number
  onMouseEnter: () => void
  onMouseLeave: (e: React.MouseEvent) => void
  filter: string
  searchGroups: SearchGroups
  activeNodes: NodeItem[]
}

function NodeRow({ node, i }: { node: NodeItem; i: number }) {
  return (
    <div className="wae-node-item" style={{ animationDelay: `${Math.min(i, 6) * 24}ms` }}>
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
  )
}

export function WorkflowAddElementsNodesFlyout({
  nodesOuterCallbackRef,
  nodesVisible,
  searchPanelMounted,
  searchPanelLeaving,
  searchPending,
  nodesLeft,
  nodesTop,
  onMouseEnter,
  onMouseLeave,
  filter,
  searchGroups,
  activeNodes,
}: WorkflowAddElementsNodesFlyoutProps) {
  return (
    <div
      ref={nodesOuterCallbackRef}
      className={[
        'wae-pop-outer',
        (nodesVisible || (searchPanelMounted && !searchPanelLeaving)) ? 'visible' : '',
        filter && !searchPanelLeaving ? 'wae-search-entering' : '',
        searchPanelLeaving ? 'wae-search-leaving' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: nodesLeft, top: nodesTop }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`wae-pop-inner wae-nodes-inner${(filter || searchPanelMounted) ? ' wae-search-mode' : ''}`}
        data-pending={searchPending ? 'true' : undefined}
      >
        <div className="wae-nodes-header">
          <span className="material-icons">widgets</span>
          {filter ? 'Search Results' : 'Nodes'}
        </div>

        {/* Fix 5: pending window — blur+dim the stale result set behind a
            shimmer placeholder instead of snapping the layout on each keystroke. */}
        {searchPending && (
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
                    {nodes.map((node, i) => <NodeRow key={node.name} node={node} i={i} />)}
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
                    {nodes.map((node, i) => <NodeRow key={node.name} node={node} i={i} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Single-column hover-preview view (unchanged) */
          <div className="wae-nodes-list">
            {activeNodes.map((node, i) => <NodeRow key={node.name} node={node} i={i} />)}
          </div>
        )}
      </div>
    </div>
  )
}
