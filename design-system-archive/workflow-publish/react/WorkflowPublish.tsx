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
 */

import { useState } from 'react'
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
  { icon: 'play_arrow',  label: 'Run Workflow',          color: '#10B981' },
  { icon: 'history',     label: 'View Execution Log',    color: '#EAB308' },
  { icon: 'api',         label: 'Generate API Endpoint', color: '#F97316' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkflowPublish(): React.ReactElement {
  const [open, setOpen] = useState(false)

  function handleToggle(): void {
    setOpen((prev) => !prev)
  }

  return (
    <div className="wp-shell shell zoom">
      {/* Publish trigger button */}
      <button
        className={`wp-btn${open ? ' open' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <span className="material-icons">rocket_launch</span>
        Publish
        <span className="material-icons wp-chevron">expand_more</span>
      </button>

      {/* Dropdown popover — toggled by .open class */}
      <div
        className={`wp-popover${open ? ' open' : ''}`}
        role="dialog"
        aria-label="Publish workflow options"
      >
        {/* Header: workflow name + version badge */}
        <div className="wp-pop-head">
          <span className="wp-pop-title">Customer Support Agent</span>
          <span className="wp-version">V1.2</span>
        </div>

        {/* Primary CTA: Update Workflow */}
        <button className="wp-update-btn">
          <span className="material-icons">sync</span>
          Update Workflow
        </button>

        {/* Last-edited attribution row */}
        <div className="wp-edited" role="button" tabIndex={0}>
          <div className="wp-edited-left">
            <span className="material-icons">schedule</span>
            12m ago by Ethan Walker
          </div>
          <span className="material-icons wp-arrow">chevron_right</span>
        </div>

        {/* Divider */}
        <div className="wp-div" role="separator" />

        {/* Action rows */}
        {ACTIONS.map((action) => (
          <div key={action.label} className="wp-action" role="button" tabIndex={0}>
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
          </div>
        ))}
      </div>
    </div>
  )
}
