import '../../../../design-system/preview/_base.css'
import './AiMessageBox.css'

import { useRef, useCallback } from 'react'
import { mbStartGenerating, mbCleanup } from './ai-message-box-hook'

// ── Component ─────────────────────────────────────────────────────────────────

export default function AiMessageBox() {
  const mbRef = useRef<HTMLDivElement | null>(null)

  // Callback ref: keeps mbRef in sync; cleanup on unmount
  const mbCallbackRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      mbCleanup(mbRef.current)
    }
    mbRef.current = el
  }, [])

  function handleAiBtnClick() {
    mbStartGenerating(mbRef.current)
  }

  return (
    <div className="card">
      <div className="mb-shell">
      <div className="mb" ref={mbCallbackRef}>
        <div className="mb-stack">
          <div
            className="mb-input"
            id="mbInput"
            contentEditable="true"
            suppressContentEditableWarning
          >
            What messaging resonates most with Gen Z users
          </div>
          <div className="mb-skel">
            <div className="skel-bar w1"></div>
            <div className="skel-bar w2"></div>
            <div className="skel-bar w3"></div>
          </div>
        </div>
        <div className="mb-toolbar">
          <div className="mb-tools-left">
            <button type="button" className="mb-btn">
              <span className="material-icons">file_upload</span>
              Upload Instructions
            </button>
          </div>
          <div className="mb-tools-right">
            <div className="mb-ai-slot">
              <button
                type="button"
                className="mb-ai-btn"
                id="mbAiBtn"
                onClick={handleAiBtnClick}
              >
                <span className="material-symbols-outlined mb-gradient-icon">neurology</span>
                <span className="mb-gradient-text">Extend with AI</span>
              </button>
              <span className="mb-gen-label">
                <span className="material-symbols-outlined mb-gradient-icon">neurology</span>
                <span className="mb-gradient-text">Generating…</span>
              </span>
              <span className="mb-done-badge" aria-hidden="true">
                <svg
                  className="mb-done-check"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Done
              </span>
            </div>
            <button type="button" className="mb-send">
              <span className="material-icons">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
      </div>
      <div className="hint">
        Click <kbd>Extend with AI</kbd> to see the generating state
      </div>
    </div>
  )
}
