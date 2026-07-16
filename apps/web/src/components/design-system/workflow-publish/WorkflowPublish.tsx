/**
 * WorkflowPublish.tsx
 *
 * Publish button + popover for the AI workflow editor.
 * Faithful port of apps/web/design-system/preview/components-workflow-publish.html.
 *
 * Interaction model (mirrors the source prototype):
 *  - A dark "Publish" button with a chevron icon.
 *  - Clicking it toggles a popover that slides down with a spring-style
 *    CSS animation (popIn keyframe).
 *  - Popover contains: workflow title + version badge, "Update Workflow"
 *    primary button, last-edited attribution row, and three action rows
 *    (Run Workflow, View Execution Log, Generate API Endpoint).
 *
 * NO raw useEffect in this file.
 * The toggle is pure React state — no imperative DOM required.
 * Close animation driven by onAnimationEnd on the bezel wrapper.
 */

import { useState } from 'react'
import { iconClass } from '../../../lib/iconClass'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import './WorkflowPublish.css'

// ---------------------------------------------------------------------------
// Action rows data (verbatim from source prototype)
// ---------------------------------------------------------------------------

interface ActionItem {
  icon: string
  label: string
  color: string
}

const ACTIONS: ActionItem[] = [
  { icon: 'play_arrow',  label: 'Run Workflow',          color: 'var(--brand-primary-500)' },
  { icon: 'history',     label: 'View Execution Log',    color: '#EAB308' },
  { icon: 'api',         label: 'Generate API Endpoint', color: '#F97316' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkflowPublish(): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const bezelSquircleRef = useSquircle<HTMLDivElement>()
  const popoverSquircleRef = useSquircle<HTMLDialogElement>()
  // One group covers the trigger + popover buttons below (both are DOM
  // descendants of .wp-btn-anchor regardless of the popover's absolute position).
  const proximityRef = useProximityGroup<HTMLDivElement>()

  function handleToggle(): void {
    if (open && !closing) {
      // Start close animation; onAnimationEnd will finish the state reset
      setClosing(true)
    } else if (!open) {
      setOpen(true)
    }
  }

  function handleAnimationEnd(e: React.AnimationEvent<HTMLDivElement>): void {
    if (e.animationName === 'wp-popOut') {
      setOpen(false)
      setClosing(false)
    }
  }

  const bezelClass = [
    'wp-bezel',
    closing ? 'closing' : '',
  ].filter(Boolean).join(' ')

  return (
    /* wp-btn-anchor is the positioning context for the absolutely-placed bezel */
    <div className="wp-btn-anchor" ref={proximityRef}>
      {/* Publish trigger button */}
      <button
        type="button"
        className={`wp-btn${open ? ' open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={handleToggle}
        data-proximity
      >
        <span className="material-icons">rocket_launch</span>
        Publish
        <span className="material-icons wp-chevron">expand_more</span>
      </button>

      {/* Grey bezel (outer shell) + white popover card animate as one rigid unit */}
      {open && (
        <div ref={bezelSquircleRef} className={bezelClass} onAnimationEnd={handleAnimationEnd}>
          {/* Dropdown popover — animated via wp-popIn / wp-popOut on the bezel */}
          <dialog
            ref={popoverSquircleRef}
            className="wp-popover"
            aria-label="Publish workflow options"
            style={{ margin: 0, maxWidth: 'none', maxHeight: 'none' }}
          >
            {/* Header: workflow name + version badge */}
            <div className="wp-pop-head">
              <span className="wp-pop-title">
                <span className={iconClass('publish')} aria-hidden>publish</span>
                Customer Support Agent
              </span>
              <span className="wp-version">V1.2</span>
            </div>

            {/* Primary CTA: Update Workflow */}
            <button type="button" className="wp-update-btn" data-proximity>
              <span className="material-icons">sync</span>
              Update Workflow
            </button>

            {/* Last-edited attribution row */}
            <button type="button" className="wp-edited" data-proximity style={{ width: '100%', textAlign: 'left', font: 'inherit', color: 'inherit', border: 0, cursor: 'pointer' }}>
              <div className="wp-edited-left">
                <span className="material-icons">schedule</span>
                12m ago by Ethan Walker
              </div>
              <span className="material-icons wp-arrow">chevron_right</span>
            </button>

            {/* Divider */}
            <hr className="wp-div" style={{ margin: '4px 0', border: 0 }} />

            {/* Action rows */}
            {ACTIONS.map((action) => (
              <button key={action.label} type="button" className="wp-action" data-proximity style={{ width: '100%', textAlign: 'left', font: 'inherit', color: 'inherit', border: 0, cursor: 'pointer' }}>
                <div className="wp-action-left">
                  {/* Colored semantic-pill icon square with Deha gloss treatment */}
                  <div
                    className="wp-icon"
                    style={{ backgroundColor: action.color }}
                    aria-hidden="true"
                  >
                    <span className="material-icons">{action.icon}</span>
                  </div>
                  <span className="wp-action-label">{action.label}</span>
                </div>
                <span className="material-icons wp-arrow">chevron_right</span>
              </button>
            ))}
          </dialog>
        </div>
      )}
    </div>
  )
}
