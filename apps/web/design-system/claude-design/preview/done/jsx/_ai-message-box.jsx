(function () {
  const { useRef, useCallback } = React;

  // ── Inlined from ai-message-box-hook.ts ─────────────────────────────────────

  function mbStartGenerating(el) {
    if (!el) return;
    const mb = el;

    if (mb.classList.contains('generating')) return; // guard: not clickable while generating

    clearTimeout(mb.revertT);
    clearTimeout(mb.clearT);
    clearTimeout(mb.doneT);
    clearTimeout(mb.doneOutT);

    mb.classList.remove('exiting', 'done', 'done-out');
    mb.classList.add('generating');

    // Auto-revert after 5s, playing the exit morph, then a Done badge
    mb.revertT = setTimeout(() => {
      mb.classList.remove('generating');
      mb.classList.add('exiting', 'done');

      mb.clearT = setTimeout(() => {
        mb.classList.remove('exiting');

        mb.doneT = setTimeout(() => {
          mb.classList.remove('done');
          mb.classList.add('done-out');

          mb.doneOutT = setTimeout(() => {
            mb.classList.remove('done-out');
          }, 720);
        }, 1300);
      }, 660);
    }, 5000);
  }

  function mbCleanup(el) {
    if (!el) return;
    const mb = el;
    clearTimeout(mb.revertT);
    clearTimeout(mb.clearT);
    clearTimeout(mb.doneT);
    clearTimeout(mb.doneOutT);
  }

  // ── Component ─────────────────────────────────────────────────────────────

  function AiMessageBox() {
    const mbRef = useRef(null);

    // Callback ref: keeps mbRef in sync; cleanup on unmount
    const mbCallbackRef = useCallback((el) => {
      if (!el) {
        mbCleanup(mbRef.current);
      }
      mbRef.current = el;
    }, []);

    function handleAiBtnClick() {
      mbStartGenerating(mbRef.current);
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
    );
  }

  window.AiMessageBox = AiMessageBox;
})();
