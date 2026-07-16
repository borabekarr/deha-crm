/**
 * WorkflowNodes.tsx
 *
 * Trigger / Action / Output node cards for the workflow canvas.
 * Faithful port of apps/web/design-system/preview/components-workflow-nodes.html.
 *
 * Interaction model (mirrors the source prototype):
 *  - Eight node cards in a 2-column dot-grid canvas.
 *  - The toolbar (connect · add · edit · delete) lives INSIDE the grey
 *    `.wf-outer` shell as a collapsed right-side rail. Hovering a stationary
 *    hit-strip pinned to the card's fixed right edge (`.wf-hover-strip`)
 *    extends the shell's real width with a spring bounce, revealing the
 *    rail — CSS-only, no escaping elements.
 *  - Pressing the hollow "connect" circle starts a rubber-band SVG dashed line
 *    that follows the pointer across the canvas (released on pointer-up).
 *
 * NO raw useEffect in this file. The rubber-band drag is wired via a callback
 * ref on the canvas div, delegating to workflow-nodes-hook.ts.
 */

import { useCallback, useRef } from 'react'
import './WorkflowNodes.css'
import { useProximityGroup } from '../../../lib/hooks/use-proximity-group'
import { useSquircle } from '../../../lib/hooks/use-squircle'
import { mountCanvas } from './workflow-nodes-hook'

// ---------------------------------------------------------------------------
// Node data (verbatim from source)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Small shared sub-components (no hooks — pure presentation)
// ---------------------------------------------------------------------------

/** Invisible hit-strip pinned to the fixed right edge of `.wf-body` (which
 *  never resizes), overlapping the card's rightmost ~36px. Because it sits
 *  inside the non-animating card box rather than on the growing shell edge,
 *  it never slides out from under the pointer mid-expansion (hover-transform
 *  -needs-stationary-anchor). `.wf-outer:has(.wf-hover-strip:hover)` drives
 *  both the shell's width extension and the `.wf-tools` reveal. */
function HoverStrip(): React.ReactElement {
  return <div className="wf-hover-strip" aria-hidden="true" />
}

/** Hover toolbar rail collapsed inside the shell's right side at rest. */
function NodeTools(): React.ReactElement {
  return (
    <div className="wf-tools">
      <button type="button" className="wf-tool connect" data-tip="Connect to next" aria-label="Connect to next node" />
      <button type="button" className="wf-tool add" data-tip="Add next" aria-label="Add next node">
        <span className="material-icons">add</span>
      </button>
      <button type="button" className="wf-tool edit" data-tip="Rename" aria-label="Rename node">
        <span className="material-icons">edit</span>
      </button>
      <button type="button" className="wf-tool del tip-bottom" data-tip="Delete" aria-label="Delete node">
        <span className="material-icons">delete</span>
      </button>
    </div>
  )
}

/** Brand letter badge (Notion N, Stripe S, Postmark P, Anthropic A, OpenAI O). */
function BrandLetter({
  letter,
  className,
  style,
}: {
  letter: string
  className: string
  style?: React.CSSProperties
}): React.ReactElement {
  return (
    <span className={`brand-letter ${className}`} style={style}>
      {letter}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Individual node card contents
// ---------------------------------------------------------------------------

/** 1. Webhook trigger */
function WebhookNode(): React.ReactElement {
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <>
      <div className="wf-tag trigger">
        <span className="material-icons">bolt</span>Trigger
      </div>
      <div className="wf-card" ref={cardSquircleRef}>
        <div className="wf-head">
          <div className="wf-title">
            <span className="material-icons ic">webhook</span>Incoming Webhook
          </div>
        </div>
        <div className="wf-row">
          <span className="wf-chip method">POST</span>
          <span className="wf-chip wf-url">https://api.deha.io/hooks/7f8a9…</span>
        </div>
        <div className="wf-foot">
          <span className="wf-meta"><span className="material-icons ic">schedule</span>0.0 sec</span>
        </div>
      </div>
    </>
  )
}

/** 2. Input URL trigger */
function InputUrlNode(): React.ReactElement {
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <>
      <div className="wf-tag trigger">
        <span className="material-icons">bolt</span>Trigger
      </div>
      <div className="wf-card" ref={cardSquircleRef}>
        <div className="wf-head">
          <div className="wf-title">
            <span className="material-icons ic">link</span>Input URL
          </div>
        </div>
        <div className="wf-row">
          <span className="wf-chip">
            <span className="material-icons ic yt">play_circle</span>
          </span>
          <span className="wf-chip wf-url">https://youtube.com/watch?v=…</span>
        </div>
        <div className="wf-foot">
          <span className="wf-meta"><span className="material-icons ic">schedule</span>0.0 sec</span>
        </div>
      </div>
    </>
  )
}

/** 3. Notion action (not connected) */
function NotionNode(): React.ReactElement {
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <>
      <div className="wf-tag action">
        <span className="material-icons">play_circle</span>Action
      </div>
      <div className="wf-card" ref={cardSquircleRef}>
        <div className="wf-head">
          <div className="wf-title">
            <BrandLetter letter="N" className="bl-notion" />Write to Notion
          </div>
        </div>
        <button type="button" className="wf-connect" data-proximity>
          <span className="material-icons ic">link</span>Connect Notion Account
        </button>
        <div className="wf-foot">
          <span className="wf-meta"><span className="material-icons ic">schedule</span>0.0 sec</span>
          <span className="wf-warn"><span className="material-icons ic">error_outline</span>Account not connected</span>
        </div>
      </div>
    </>
  )
}

/** 4. Stripe action (not connected) */
function StripeNode(): React.ReactElement {
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <>
      <div className="wf-tag action">
        <span className="material-icons">play_circle</span>Action
      </div>
      <div className="wf-card" ref={cardSquircleRef}>
        <div className="wf-head">
          <div className="wf-title">
            <BrandLetter letter="S" className="bl-stripe" />Create Customer
          </div>
        </div>
        <button type="button" className="wf-connect" data-proximity>
          <span className="material-icons ic">link</span>Connect Stripe Account
        </button>
        <div className="wf-foot">
          <span className="wf-meta"><span className="material-icons ic">schedule</span>0.0 sec</span>
          <span className="wf-warn"><span className="material-icons ic">error_outline</span>Account not connected</span>
        </div>
      </div>
    </>
  )
}

/** 5. Audio output */
function AudioOutputNode(): React.ReactElement {
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <>
      <div className="wf-tag output">
        <span className="material-icons">check_circle</span>Output
      </div>
      <div className="wf-card" ref={cardSquircleRef}>
        <div className="wf-head">
          <div className="wf-title">
            <span className="material-icons ic">graphic_eq</span>Audio Output
          </div>
        </div>
        <div className="wf-row">
          <span className="wf-chip"><span className="material-icons ic">pause</span>Eleven v3 (alpha)</span>
          <span className="wf-chip"><span className="material-icons ic">graphic_eq</span>Sarah</span>
        </div>
        <div className="wf-foot">
          <span className="wf-meta-group">
            <span className="wf-meta"><span className="material-icons ic">schedule</span>0.0 sec</span>
            <span className="wf-meta">382 Tokens</span>
          </span>
        </div>
      </div>
    </>
  )
}

/** 6. Image output */
function ImageOutputNode(): React.ReactElement {
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <>
      <div className="wf-tag output">
        <span className="material-icons">check_circle</span>Output
      </div>
      <div className="wf-card" ref={cardSquircleRef}>
        <div className="wf-head">
          <div className="wf-title">
            <span className="material-icons ic">image</span>Image Output
          </div>
        </div>
        <div className="wf-row">
          <span className="wf-chip">
            <BrandLetter letter="O" className="bl-openai" style={{ width: 14, height: 14, fontSize: 9 }} />
            4o Image Generation
          </span>
          <span className="wf-chip">
            <span className="material-icons ic">photo_size_select_large</span>1024 × 1024
          </span>
        </div>
        <div className="wf-foot">
          <span className="wf-meta-group">
            <span className="wf-meta"><span className="material-icons ic">schedule</span>0.0 sec</span>
            <span className="wf-meta">382 Tokens</span>
          </span>
        </div>
      </div>
    </>
  )
}

/** 7. Send Email action */
function SendEmailNode(): React.ReactElement {
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <>
      <div className="wf-tag action">
        <span className="material-icons">play_circle</span>Action
      </div>
      <div className="wf-card" ref={cardSquircleRef}>
        <div className="wf-head">
          <div className="wf-title">
            <span className="material-icons ic">send</span>Send Email
          </div>
        </div>
        <div className="wf-desc">Uses Postmark to send a quick, personalized reminder email.</div>
        <div className="wf-prompt">
          Hello <span className="var">{'{First Name}'}</span>, I just wanted to follow up on our
          recent conversation and send you a quick reminder. If you have a…
        </div>
        <div className="wf-row">
          <span className="wf-chip">
            <BrandLetter letter="P" className="bl-postmark" />Postmark
          </span>
        </div>
        <div className="wf-foot">
          <span className="wf-meta"><span className="material-icons ic">schedule</span>0.0 sec</span>
        </div>
      </div>
    </>
  )
}

/** 8. Anthropic AI action */
function AnthropicNode(): React.ReactElement {
  const cardSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <>
      <div className="wf-tag action">
        <span className="material-icons">play_circle</span>Action
      </div>
      <div className="wf-card" ref={cardSquircleRef}>
        <div className="wf-head">
          <div className="wf-title">
            <BrandLetter letter="A" className="bl-anthropic" />Anthropic
          </div>
        </div>
        <div className="wf-desc">Summarizes the conversation text received from the incoming webhook.</div>
        <div className="wf-prompt">
          Summarize this conversation from the webhook:{' '}
          <span className="var">{'{Incoming Webhook}'}</span> Output 3–5 bullet points with main
          topic…
        </div>
        <div className="wf-row">
          <span className="wf-chip">
            <BrandLetter letter="A" className="bl-anthropic" />Claude-Opus-4
          </span>
        </div>
        <div className="wf-foot">
          <span className="wf-meta-group">
            <span className="wf-meta"><span className="material-icons ic">schedule</span>0.0 sec</span>
            <span className="wf-meta">1,382 Tokens</span>
          </span>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Node card wrapper
// ---------------------------------------------------------------------------

function NodeCard({ children }: { children: React.ReactNode }): React.ReactElement {
  const outerSquircleRef = useSquircle<HTMLDivElement>()
  return (
    <div className="wf-outer" ref={outerSquircleRef}>
      {/* wf-body's width is fixed, so the strip inside it never moves even
          while wf-tools grows the shell — see HoverStrip doc comment. */}
      <div className="wf-body">
        {children}
        <HoverStrip />
      </div>
      <NodeTools />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WorkflowNodes(): React.ReactElement {
  // SVG overlay ref — needed by the canvas mount hook for rubber-band lines
  const svgRef = useRef<SVGSVGElement | null>(null)
  // Cleanup function stored from mountCanvas
  const cleanupRef = useRef<(() => void) | null>(null)

  // Callback ref on the canvas div — wires drag-to-connect on mount, cleans up on unmount
  const canvasCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (el && svgRef.current) {
      const cleanup = mountCanvas(el, svgRef.current)
      cleanupRef.current = cleanup
    } else {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  // The SVG ref must be stable before the canvas ref fires, so wire it first
  const svgCallbackRef = useCallback((el: SVGSVGElement | null) => {
    svgRef.current = el
  }, [])

  // Proximity group: only the two static "Connect Account" buttons carry
  // data-proximity — the in-shell toolbar (.wf-tools) grows/reflows on
  // hover (max-width + margin-left), which would stale the cached hitbox
  // mid-reveal, so it is intentionally NOT wired.
  const proximityRef = useProximityGroup<HTMLDivElement>()

  return (
    // Outer dot-grid surface acts as the canvas (no shell.zoom — 8 nodes share one surface)
    <div
      className="wn-shell"
      ref={(el) => { canvasCallbackRef(el); proximityRef(el) }}
    >
      {/* SVG overlay for rubber-band connection preview lines */}
      <svg
        ref={svgCallbackRef}
        className="wn-conn-svg"
        aria-hidden="true"
      />

      {/* 2-column node grid */}
      <div className="wn-grid">
        <NodeCard><WebhookNode /></NodeCard>
        <NodeCard><InputUrlNode /></NodeCard>
        <NodeCard><NotionNode /></NodeCard>
        <NodeCard><StripeNode /></NodeCard>
        <NodeCard><AudioOutputNode /></NodeCard>
        <NodeCard><ImageOutputNode /></NodeCard>
        <NodeCard><SendEmailNode /></NodeCard>
        <NodeCard><AnthropicNode /></NodeCard>
      </div>
    </div>
  )
}
