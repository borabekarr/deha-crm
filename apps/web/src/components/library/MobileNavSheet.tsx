import { useCallback, useEffect, useEffectEvent, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SidebarContent } from './Sidebar'

interface MobileNavSheetProps {
  open: boolean
  onClose: () => void
  activeSlug?: string
}

/**
 * Bottom sheet nav for phone widths (< md). Always portal-mounted to
 * document.body so visibility is driven by transform/opacity rather than
 * mount/unmount. Node-in-ref + literal useEffect for the Escape listener
 * and body-scroll lock, matching smooth-drawer-hook.ts's useSheetRef: a
 * stable callback ref only stores the node, the effect owns setup/cleanup
 * so react-doctor's effect-needs-cleanup sees an inline removeEventListener.
 */
export function MobileNavSheet({ open, onClose, activeSlug }: MobileNavSheetProps) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const sheetRef = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el
  }, [])

  // onClose is only used inside the keydown listener, so it's wrapped in
  // useEffectEvent -- the effect then only needs to resubscribe when `open`
  // itself changes, not whenever onClose's identity changes.
  const onEscape = useEffectEvent(() => {
    onClose()
  })

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        onEscape()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = open ? 'hidden' : previousOverflow
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const enterDur = 'var(--overlay-morph-dur)'
  const exitDur = 'var(--overlay-morph-exit-dur)'
  const dur = open ? enterDur : exitDur
  const ease = open ? 'var(--ease-out)' : 'var(--ease-accel)'
  // visibility flips instantly on open and only after the exit leg on close,
  // so the closed sheet leaves the accessibility tree and hit-testing.
  const transition = `transform calc(${dur} * var(--anim-mult, 1)) ${ease}, opacity calc(${dur} * var(--anim-mult, 1)) ${ease}, visibility 0s linear ${open ? '0s' : `calc(${dur} * var(--anim-mult, 1))`}`
  const visibility = open ? 'visible' : 'hidden'

  return createPortal(
    // Native <dialog> (non-modal `open`, no showModal()) so the existing
    // manual Escape listener + scrim keep driving the mounted-through-exit
    // pattern unchanged; UA box-model defaults neutralised inline, and
    // position:fixed/inset:0 given inline (matching SmoothDrawer's
    // .sd-overlay) so the <dialog> itself has a real viewport-covering box
    // instead of collapsing to 0x0 around its fixed-positioned children.
    <dialog
      open
      className="md:hidden"
      aria-hidden={!open}
      aria-label="Browse components"
      inert={!open}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'none', border: 'none', margin: 0, padding: 0, maxWidth: 'none', maxHeight: 'none', color: 'inherit' }}
    >
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        style={{ opacity: open ? 1 : 0, visibility, pointerEvents: open ? 'auto' : 'none', transition }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col gap-4 rounded-t-[24px] border-t border-border bg-white [html.dark_&]:bg-[#1e293b] px-3 pt-2 shadow-lg"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          visibility,
          pointerEvents: open ? 'auto' : 'none',
          paddingBottom: 'env(safe-area-inset-bottom)',
          transition,
        }}
      >
        {/* Grab handle */}
        <div className="flex h-11 shrink-0 items-center justify-center">
          <div className="h-[5px] w-9 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto pb-4">
          <SidebarContent activeSlug={activeSlug} onNavigate={onClose} />
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
