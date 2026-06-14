/* =========================================================================
   brain-hook.ts -- Controller for the Qualification-tab interactive brain UI.

   Conventions:
   - NO raw useEffect. Timers are held in refs; cleanup runs on unmount via
     callback-ref pattern or ref.current cleanup functions.
   - Typewriter is imported from popover-hook.ts (not reimplemented).
   ========================================================================= */

import { useState, useCallback } from 'react'
import { useTypewriter, type TypewriterState } from './popover-hook'
import type { BrainSection } from './leadMetrics'

// ── Public surface ────────────────────────────────────────────────────────────
export interface BrainStageController {
  // Hover
  hoveredId: string | null
  setHovered: (id: string | null) => void

  // Selection
  activeId: string | null
  panelOpen: boolean
  compact: boolean
  selectSection: (id: string, section?: BrainSection) => void
  clearSelection: () => void

  // Typewriter (forwarded from popover-hook so DetailPanel can type blurbs)
  typewriter: TypewriterState<string>
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useBrainStage(): BrainStageController {
  // --- hover state ---
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // --- selection / panel state ---
  const [activeId, setActiveId]   = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [compact, setCompact]     = useState(false)

  // --- typewriter (re-used from popover-hook) ---
  const typewriter = useTypewriter<string>()

  // ── setHovered ───────────────────────────────────────────────────────────────
  // Stable setter — consumers attach to onPointerEnter / onPointerLeave.

  const setHovered = useCallback((id: string | null) => {
    setHoveredId(id)
  }, [])

  // ── selectSection ────────────────────────────────────────────────────────────
  // Called by FilterColumn row click or InteractiveBrain region click.
  // Sets activeId, opens the detail panel, and kicks off the typewriter for
  // the section blurb.

  const selectSection = useCallback(
    (id: string, section?: BrainSection) => {
      setActiveId(id)
      setCompact(true)
      setPanelOpen(true)
      // Type the blurb if the caller passes the section (optional convenience).
      // DetailPanel can also call typewriter.openTool directly with the blurb.
      if (section?.blurb) {
        typewriter.openTool(id, section.blurb)
      }
    },
    // typewriter.openTool is a stable function returned by the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typewriter.openTool],
  )

  // ── clearSelection ───────────────────────────────────────────────────────────

  const clearSelection = useCallback(() => {
    setActiveId(null)
    setPanelOpen(false)
    setCompact(false)
    typewriter.closeChat()
  }, [typewriter.closeChat])

  return {
    hoveredId,
    setHovered,
    activeId,
    panelOpen,
    compact,
    selectSection,
    clearSelection,
    typewriter,
  }
}
