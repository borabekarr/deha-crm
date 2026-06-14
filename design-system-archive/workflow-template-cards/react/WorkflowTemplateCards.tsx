/**
 * WorkflowTemplateCards.tsx
 *
 * AI workflow template cards grid.
 * Faithful port of apps/web/design-system/preview/components-workflow-template-cards.html.
 *
 * Interaction model (mirrors the source prototype):
 *  - 2-column grid of four template cards.
 *  - Each card shows a flow diagram preview (node circles + dashed connectors).
 *  - A "Use template →" button appears on hover via pure CSS opacity/transform
 *    transition — no imperative logic required.
 *  - Badges: PRO (slate) and NEW (emerald) pill variants.
 *
 * NO raw useEffect in this file.
 * No JS interaction — hover is pure CSS; no callback refs needed.
 */

import './WorkflowTemplateCards.css'

// ---------------------------------------------------------------------------
// Data (verbatim from source)
// ---------------------------------------------------------------------------

interface TemplateNode {
  /** Inline background-color for the circle */
  color: string
  /** Material Icons ligature, or 'svg' for inline SVG */
  icon: string | 'svg'
  size: 'sm' | 'lg'
}

interface TemplateCard {
  id: number
  nodes: TemplateNode[]
  title: string
  badge?: 'PRO' | 'NEW'
  description: string
}

const TEMPLATES: TemplateCard[] = [
  {
    id: 1,
    nodes: [
      { color: '#4F46E5', icon: 'edit',              size: 'sm' },
      { color: '#34A853', icon: 'svg',               size: 'lg' }, // Google Drive SVG
      { color: '#059669', icon: 'chat_bubble_outline', size: 'sm' },
    ],
    title: 'Google Drive AI Agent',
    badge: 'PRO',
    description: 'Interact with a Google Drive database using natural language queries.',
  },
  {
    id: 2,
    nodes: [
      { color: '#4F46E5', icon: 'edit',        size: 'sm' },
      { color: '#7C3AED', icon: 'security',    size: 'lg' },
      { color: '#059669', icon: 'description', size: 'sm' },
    ],
    title: 'InfoSec Query Assistant',
    description: 'Automatically analyze vulnerabilities and generate detailed threat reports.',
  },
  {
    id: 3,
    nodes: [
      { color: '#DC2626', icon: 'storage',           size: 'sm' },
      { color: '#29B5E8', icon: 'ac_unit',           size: 'lg' },
      { color: '#059669', icon: 'chat_bubble_outline', size: 'sm' },
    ],
    title: 'Snowflake AI Agent',
    badge: 'NEW',
    description: 'Chat with a Snowflake data warehouse using plain English queries.',
  },
  {
    id: 4,
    nodes: [
      { color: '#4F46E5', icon: 'travel_explore', size: 'sm' },
      { color: '#8B5CF6', icon: 'psychology',     size: 'lg' },
      { color: '#059669', icon: 'summarize',       size: 'sm' },
    ],
    title: 'Website Researcher',
    description: 'Research any website and generate a comprehensive AI-powered summary.',
  },
]

// ---------------------------------------------------------------------------
// Sub-components (pure presentation, no hooks)
// ---------------------------------------------------------------------------

/** Google Drive logo — three triangular path segments, white on green. */
function GoogleDriveSvg(): React.ReactElement {
  return (
    // White Google Drive triangle shape — exact paths from source
    <svg viewBox="0 0 24 21" width="26" height="23" aria-hidden="true">
      <path d="M12,0 L0,21 L12,14 Z" fill="rgba(255,255,255,0.72)" />
      <path d="M12,0 L12,14 L24,21 Z" fill="rgba(255,255,255,0.88)" />
      <path d="M12,14 L0,21 L24,21 Z" fill="rgba(255,255,255,1)" />
    </svg>
  )
}

/** A single flow node circle. */
function FlowNode({ node }: { node: TemplateNode }): React.ReactElement {
  const sizeClass = node.size === 'lg' ? 'wtc-node-lg' : 'wtc-node-sm'
  return (
    <div
      className={`wtc-node ${sizeClass}`}
      style={{ backgroundColor: node.color }}
    >
      {node.icon === 'svg' ? (
        <GoogleDriveSvg />
      ) : (
        <span className="material-icons">{node.icon}</span>
      )}
    </div>
  )
}

/** Dashed connector between two nodes. */
function Connector(): React.ReactElement {
  return <div className="wtc-conn" aria-hidden="true" />
}

/** One template card. */
function TemplateCard({ card }: { card: TemplateCard }): React.ReactElement {
  return (
    <div className="wtc-outer">
      <div className="wtc-card">
        {/* Preview area with flow diagram */}
        <div className="wtc-preview">
          <div className="wtc-flow" aria-label={`${card.title} workflow preview`}>
            {card.nodes.map((node, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Connector />}
                <FlowNode node={node} />
              </React.Fragment>
            ))}
          </div>
          {/* "Use template" button — revealed on hover via CSS */}
          <button className="wtc-use" aria-label={`Use template: ${card.title}`}>
            Use template →
          </button>
        </div>

        {/* Info section: title row + description */}
        <div className="wtc-info">
          <div className="wtc-title-row">
            <span className="wtc-title">{card.title}</span>
            {card.badge && (
              <span
                className={`wtc-badge ${card.badge === 'PRO' ? 'wtc-badge-pro' : 'wtc-badge-new'}`}
              >
                {card.badge}
              </span>
            )}
          </div>
          <p className="wtc-desc">{card.description}</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function WorkflowTemplateCards(): React.ReactElement {
  return (
    // Single-component shell; .zoom for 1:1 viewport preview
    <div className="wtc-shell shell zoom">
      <div className="wtc-grid">
        {TEMPLATES.map((card) => (
          <TemplateCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}
