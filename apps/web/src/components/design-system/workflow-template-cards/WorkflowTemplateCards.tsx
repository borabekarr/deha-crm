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

import React, { useState } from 'react'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { useSquircle } from '../../../lib/hooks/use-squircle'
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
      { color: 'var(--brand-primary-600)', icon: 'chat_bubble_outline', size: 'sm' },
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
      { color: 'var(--brand-primary-600)', icon: 'description', size: 'sm' },
    ],
    title: 'InfoSec Query Assistant',
    description: 'Automatically analyze vulnerabilities and generate detailed threat reports.',
  },
  {
    id: 3,
    nodes: [
      { color: '#DC2626', icon: 'storage',           size: 'sm' },
      { color: '#29B5E8', icon: 'ac_unit',           size: 'lg' },
      { color: 'var(--brand-primary-600)', icon: 'chat_bubble_outline', size: 'sm' },
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
      { color: 'var(--brand-primary-600)', icon: 'summarize',       size: 'sm' },
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

// ---------------------------------------------------------------------------
// Expand detail data (inline, no external dep)
// ---------------------------------------------------------------------------

const COMMUNITY_LINES = [
  'Total number of users across the web',
  'Number of upvotes',
  '1,284 people are active users this week',
]

const EFFICIENCY_LINES = [
  'Saves ~4 hours per week',
  'Eliminates 14 manual steps',
  'Trigger type: Webhook / Schedule / Manual',
  'Avg. run time: ~2.3 seconds per execution',
  'Success rate: 98.7% uptime',
]

const TECH_LINES = [
  'Complexity level (Beginner / Intermediate / Advanced)',
  'Number of credentials required per execution & Estimated cost per execution',
  'Estimated cost savings ($/month)',
  'Setup time (~10 min setup)',
]

/** Expand detail panel rendered inside the card when expanded. */
function ExpandDetail(): React.ReactElement {
  return (
    <div className="wtc-expand-wrap">
      <div className="wtc-expand-inner">
        <div className="wtc-expand-body">
          <div className="wtc-expand-sep" />

          <div className="wtc-expand-section">
            <p className="wtc-expand-section-title">Community</p>
            <ul className="wtc-expand-list">
              {COMMUNITY_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="wtc-expand-section">
            <p className="wtc-expand-section-title">Efficiency Metrics</p>
            <ul className="wtc-expand-list">
              {EFFICIENCY_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="wtc-expand-section">
            <p className="wtc-expand-section-title">Technical Specs</p>
            <ul className="wtc-expand-list">
              {TECH_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/** One template card. */
function TemplateCard({
  card,
  expanded,
  onToggle,
}: {
  card: TemplateCard
  expanded: boolean
  onToggle: () => void
}): React.ReactElement {
  // Per-item refs: the outer shell's box-shadow migrated to filter:drop-shadow
  // (squircle.ts note -- clip-path would otherwise clip the real box-shadow).
  const outerSquircleRef = useSquircle<HTMLDivElement>()
  const innerSquircleRef = useSquircle<HTMLDivElement>()
  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- wraps a nested <button> (Use template); a native <button> cannot contain interactive children
    <div
      className={`wtc-outer${expanded ? ' wtc-expanded' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      ref={outerSquircleRef}
    >
      <div className="wtc-card" ref={innerSquircleRef}>
        {/* Preview area with flow diagram */}
        <div className="wtc-preview">
          <div className="wtc-flow" aria-label={`${card.title} workflow preview`}>
            {card.nodes.map((node, i) => (
              <React.Fragment key={`${node.icon}-${node.color}`}>
                {i > 0 && <Connector />}
                <FlowNode node={node} />
              </React.Fragment>
            ))}
          </div>
          {/* "Use template" button — revealed on hover via CSS; visible when expanded */}
          <button
            type="button"
            className="wtc-use"
            aria-label={`Use template: ${card.title}`}
            onClick={(e) => { e.stopPropagation(); /* no-op: use template */ }}
            data-proximity
          >
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

        {/* Inline expand-down detail panel */}
        <ExpandDetail />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

export default function WorkflowTemplateCards(): React.ReactElement {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  // This root used to be `display:contents`, relying on an ancestor page
  // grid to lay its .wtc-outer children out in 2 columns -- no such ancestor
  // exists in the live route (the route wrapper carries no grid class), so
  // the cards rendered as full-width stacked blocks. `.wtc-grid` now owns the
  // grid itself (see WorkflowTemplateCards.css).

  // Proximity group: only the per-card "Use template" CTAs carry
  // data-proximity (wf-connect pattern) -- the card shells scale on their
  // own hover transition and would stale the cached hitbox mid-reveal.
  const proximityRef = useProximityGroup<HTMLDivElement>()

  return (
    <div className="wtc-grid" ref={proximityRef}>
      {TEMPLATES.map((card) => (
        <TemplateCard
          key={card.id}
          card={card}
          expanded={expandedId === card.id}
          onToggle={() => setExpandedId((prev) => (prev === card.id ? null : card.id))}
        />
      ))}
    </div>
  )
}
