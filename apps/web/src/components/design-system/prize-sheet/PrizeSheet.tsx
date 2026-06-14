import '../../../../design-system/preview/_base.css'
import './PrizeSheet.css'

// ---------------------------------------------------------------------------
// PrizeSheet — Mobile bottom sheet + desktop centered dialog
// Faithful port of apps/web/design-system/preview/components-prize-sheet.html
//
// DOM mirrors the source exactly:
//   Mobile:  .ps-device > .ps-screen > (.ps-app, .ps-fab, .ps-overlay, .sheet.panel)
//   Desktop: .ps-desktop > (.ps-dbar, .ps-dscreen > (.ps-dapp, .ps-fab, .ps-doverlay, .ps-modal-shell > .modal.panel))
//
// NO raw useEffect — all imperative logic lives in prize-sheet-hook.ts,
// wired via callback refs.
// ---------------------------------------------------------------------------

import { useCallback, useRef } from 'react'
import { setupPanelScope } from './prize-sheet-hook'

// ── Shared prize content ────────────────────────────────────────────────────

function PrizeContent() {
  return (
    <>
      <div className="prize">
        <div className="amount"><span className="cur">$</span>100</div>
        <div className="wontag">YOU WON</div>
        <div className="prize-title">Claim your prize!</div>
        <div className="prize-desc">Your first reward is here: $100 just for joining. Claim your prize and dive into crypto!</div>
      </div>
      <button type="button" className="claim-btn" data-claim>
        <span className="material-symbols-outlined">redeem</span>Claim prize
      </button>
      <div className="success">
        <div className="check"><span className="material-icons">check</span></div>
        <div className="success-title">Prize claimed</div>
        <div className="success-desc">$100 has landed in your wallet. Welcome aboard.</div>
        <div className="wallet">
          <div className="wallet-l">
            <div className="wallet-ic"><span className="material-symbols-outlined">account_balance_wallet</span></div>
            <div style={{ textAlign: 'left' }}>
              <div className="wallet-lbl">Wallet balance</div>
              <div className="wallet-bal">$100.00<span className="gain">+$100</span></div>
            </div>
          </div>
          <span className="material-symbols-outlined" style={{ color: '#10B981', fontSize: '22px' }}>trending_up</span>
        </div>
      </div>
    </>
  )
}

// ── Mobile scope ─────────────────────────────────────────────────────────────

function MobileScope() {
  const deviceRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Callback ref for the sheet panel — wires confetti + drag + open/close
  const handleSheetRef = useCallback((el: HTMLDivElement | null) => {
    sheetRef.current = el
    if (!el) return

    const cleanup = setupPanelScope(el, {
      getFrame: () => deviceRef.current,
      openClass: 'sheet-open',
      isMobile: true,
      setIsOpen: (open) => {
        if (open) el.classList.add('is-open')
        else el.classList.remove('is-open')
      },
      setClaimed: (claimed) => {
        if (claimed) el.classList.add('claimed')
        else el.classList.remove('claimed')
      },
    })

    // Wire fab and overlay after panel scope is ready
    // Use rAF to ensure DOM refs are settled
    const fabEl = fabRef.current
    const overlayEl = overlayRef.current
    const openFn = (el as HTMLDivElement & { __psOpen?: () => void }).__psOpen
    const dismissFn = (el as HTMLDivElement & { __psDismiss?: () => void }).__psDismiss
    if (fabEl && openFn) fabEl.addEventListener('click', openFn)
    if (overlayEl && dismissFn) overlayEl.addEventListener('click', dismissFn)

    return () => {
      if (fabEl && openFn) fabEl.removeEventListener('click', openFn)
      if (overlayEl && dismissFn) overlayEl.removeEventListener('click', dismissFn)
      cleanup()
    }
  }, [])

  return (
    <div className="demo">
      <div className="demo-cap">
        <span className="material-symbols-outlined">smartphone</span>Mobile · bottom sheet
      </div>
      <div className="ps-device" ref={deviceRef}>
        <div className="ps-notch"></div>
        <div className="ps-screen">
          <div className="ps-app">
            <div className="ps-app-title"></div>
            <div className="ps-app-sub"></div>
            <div className="ps-app-tile"></div>
            <div className="ps-app-row"><div></div><div></div></div>
            <div className="ps-app-tile" style={{ height: '64px' }}></div>
          </div>
          <button type="button" className="ps-fab" ref={fabRef}>
            <span className="material-symbols-outlined">redeem</span>Claim
          </button>
          <div className="ps-overlay" ref={overlayRef}></div>
          <div className="sheet panel" ref={handleSheetRef}>
            <div className="grip" data-grip></div>
            <canvas className="confetti" aria-hidden="true"></canvas>
            <PrizeContent />
          </div>
          <div className="ps-home-ind"></div>
        </div>
      </div>
      <div className="demo-hint">tap &quot;Claim&quot; · drag the grip or tap the dim to dismiss</div>
    </div>
  )
}

// ── Desktop scope ─────────────────────────────────────────────────────────────

function DesktopScope() {
  const desktopRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Escape key listener — stored as component-level ref so it's wired once
  const escCleanupRef = useRef<(() => void) | null>(null)

  const handleModalRef = useCallback((el: HTMLDivElement | null) => {
    modalRef.current = el
    if (!el) {
      escCleanupRef.current?.()
      escCleanupRef.current = null
      return
    }

    const cleanup = setupPanelScope(el, {
      getFrame: () => desktopRef.current,
      openClass: 'modal-open',
      isMobile: false,
      setIsOpen: (open) => {
        if (open) el.classList.add('is-open')
        else el.classList.remove('is-open')
      },
      setClaimed: (claimed) => {
        if (claimed) el.classList.add('claimed')
        else el.classList.remove('claimed')
      },
    })

    const fabEl = fabRef.current
    const overlayEl = overlayRef.current
    const openFn = (el as HTMLDivElement & { __psOpen?: () => void }).__psOpen
    const dismissFn = (el as HTMLDivElement & { __psDismiss?: () => void }).__psDismiss

    if (fabEl && openFn) fabEl.addEventListener('click', openFn)
    if (overlayEl && dismissFn) overlayEl.addEventListener('click', dismissFn)

    // x-button is inside modal, wire via delegation
    const xBtn = el.querySelector<HTMLButtonElement>('[data-x]')
    if (xBtn && dismissFn) xBtn.addEventListener('click', dismissFn)

    // Escape key
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') dismissFn?.()
    }
    document.addEventListener('keydown', onEscape)

    escCleanupRef.current = () => document.removeEventListener('keydown', onEscape)

    return () => {
      if (fabEl && openFn) fabEl.removeEventListener('click', openFn)
      if (overlayEl && dismissFn) overlayEl.removeEventListener('click', dismissFn)
      if (xBtn && dismissFn) xBtn.removeEventListener('click', dismissFn)
      document.removeEventListener('keydown', onEscape)
      cleanup()
    }
  }, [])

  return (
    <div className="demo">
      <div className="demo-cap">
        <span className="material-symbols-outlined">desktop_windows</span>Desktop · centered dialog
      </div>
      <div className="ps-desktop" ref={desktopRef}>
        <div className="ps-dbar">
          <span className="tl r"></span>
          <span className="tl y"></span>
          <span className="tl g"></span>
          <div className="ps-durl">
            <span className="material-symbols-outlined">lock</span>app.deha.io/rewards
          </div>
        </div>
        <div className="ps-dscreen">
          <div className="ps-dapp">
            <div className="ps-dapp-rail"></div>
            <div className="ps-dapp-main">
              <div className="ps-dapp-h"></div>
              <div className="ps-dapp-grid"><div></div><div></div><div></div></div>
              <div className="ps-dapp-wide"></div>
            </div>
          </div>
          <button type="button" className="ps-fab ps-fab-grid" ref={fabRef}>
            <span className="material-symbols-outlined">redeem</span>Claim prize
          </button>
          <div className="ps-doverlay" ref={overlayRef}></div>
          <div className="ps-modal-shell">
            <div className="modal panel" ref={handleModalRef}>
              <button type="button" className="panel-x" data-x aria-label="Close">
                <span className="material-icons">close</span>
              </button>
              <canvas className="confetti" aria-hidden="true"></canvas>
              <PrizeContent />
            </div>
          </div>
        </div>
      </div>
      <div className="demo-hint">click &quot;Claim reward&quot; · tap the dim or press Esc to dismiss</div>
    </div>
  )
}

// ── Root export ──────────────────────────────────────────────────────────────
// Both presentations always render and stack vertically inside the card frame,
// matching the prototype layout exactly. CSS handles responsive sizing.

export default function PrizeSheet() {
  return (
    <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
      <div className="frame">
        <MobileScope />
        <DesktopScope />
      </div>
    </div>
  )
}
