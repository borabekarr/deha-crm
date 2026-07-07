(function () {
  const { useState, useRef, useCallback } = React;

  // ---------------------------------------------------------------------------
  // Inlined from fab-hook.ts — Escape-key listener for the expanding FAB.
  // ---------------------------------------------------------------------------

  function fabScreenRef(el, toggle) {
    if (!el) return;

    function onKeyDown(e) {
      if (e.key === 'Escape') toggle(false);
    }

    document.addEventListener('keydown', onKeyDown);

    el.__fabCleanup = () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }

  function cleanupFabScreen(el) {
    if (!el) return;
    el.__fabCleanup?.();
    delete el.__fabCleanup;
  }

  function Fab() {
    const [open, setOpen] = useState(false);

    function toggle(value) {
      setOpen(value);
    }

    function onFabClick() {
      if (!open) toggle(true);
    }

    function onPickItem(e) {
      e.stopPropagation();
      toggle(false);
    }

    // React 18 (this harness) calls callback refs with `null` on unmount instead
    // of invoking a returned cleanup function (React-19-only). Cleanup is
    // stashed on the element and run in the null branch, with a plain ref
    // tracking the previously mounted element.
    const screenElRef = useRef(null);
    const screenCb = useCallback((el) => {
      if (el) {
        screenElRef.current = el;
        fabScreenRef(el, toggle);
      } else {
        cleanupFabScreen(screenElRef.current);
        screenElRef.current = null;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="card" style={{ padding: 0, background: '#F8FAFC' }}>
        <div className="frame">
          <div>
            <div className="shell">
              <div
                className={`fab-screen${open ? ' open' : ''}`}
                ref={screenCb}
              >

                {/* Backdrop content */}
                <div className="sc-content">
                  <div className="sc-top">
                    <div>
                      <div className="sc-greet">Good afternoon</div>
                      <div className="sc-name">Riley Chen</div>
                    </div>
                    <div className="sc-avatar">RC</div>
                  </div>
                  <div className="sc-hero">
                    <div className="sc-hero-label">Pipeline value</div>
                    <div className="sc-hero-row">
                      <div className="sc-hero-num">$1.24M</div>
                      <span className="sc-hero-pill">
                        <span className="material-icons">trending_up</span>12%
                      </span>
                    </div>
                  </div>
                  <div className="sc-sec">Recent activity</div>
                  <div className="sc-list">
                    <div className="sc-item">
                      <div className="sc-ic">AM</div>
                      <div>
                        <div className="sc-it-name">Acme Manufacturing</div>
                        <div className="sc-it-meta">Proposal sent · 2h ago</div>
                      </div>
                      <div className="sc-it-amt">$84K</div>
                    </div>
                    <div className="sc-item">
                      <div className="sc-ic">NW</div>
                      <div>
                        <div className="sc-it-name">Northwind Co.</div>
                        <div className="sc-it-meta">Call logged · 5h ago</div>
                      </div>
                      <div className="sc-it-amt">$32K</div>
                    </div>
                    <div className="sc-item">
                      <div className="sc-ic">VL</div>
                      <div>
                        <div className="sc-it-name">Vertex Labs</div>
                        <div className="sc-it-meta">New lead · Yesterday</div>
                      </div>
                      <div className="sc-it-amt">$19K</div>
                    </div>
                  </div>
                </div>

                {/* Blur veil (click to close) */}
                <div className="fab-veil" onClick={() => toggle(false)} />

                {/* Morphing FAB */}
                <div className="fab" onClick={onFabClick}>
                  <span className="fab-plus">
                    <span className="material-icons">add</span>
                  </span>

                  <div className="fab-menu">

                    <div className="fab-menu-hd">
                      <div className="fab-head">
                        <div className="fab-head-title">
                          <span className="material-symbols-outlined fab-head-icon">add_circle</span>
                          Quick create
                        </div>
                        <div className="fab-head-sub">Add something to your workspace</div>
                      </div>
                      <button
                        type="button"
                        className="fab-close"
                        onClick={(e) => { e.stopPropagation(); toggle(false); }}
                        aria-label="Close"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>

                    <div className="fab-menu-sep" />

                    {/* New lead — emerald */}
                    <div
                      className="fab-item"
                      style={{ '--ic-bg': '#10B981' }}
                      onClick={(e) => onPickItem(e)}
                    >
                      <div className="fab-item-ic">
                        <span className="material-symbols-outlined">person_add</span>
                      </div>
                      <div className="fab-item-tx">
                        <div className="fab-item-title">New lead</div>
                        <div className="fab-item-sub">Capture a contact and start a pipeline.</div>
                      </div>
                      <span className="material-symbols-outlined chev">chevron_right</span>
                    </div>

                    {/* Log activity — blue */}
                    <div
                      className="fab-item"
                      style={{ '--ic-bg': '#3B82F6' }}
                      onClick={(e) => onPickItem(e)}
                    >
                      <div className="fab-item-ic">
                        <span className="material-symbols-outlined">bolt</span>
                      </div>
                      <div className="fab-item-tx">
                        <div className="fab-item-title">Log activity</div>
                        <div className="fab-item-sub">Record a call, email, or meeting note.</div>
                      </div>
                      <span className="material-symbols-outlined chev">chevron_right</span>
                    </div>

                    {/* Create task — violet */}
                    <div
                      className="fab-item"
                      style={{ '--ic-bg': '#8B5CF6' }}
                      onClick={(e) => onPickItem(e)}
                    >
                      <div className="fab-item-ic">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      <div className="fab-item-tx">
                        <div className="fab-item-title">Create task</div>
                        <div className="fab-item-sub">Add a follow-up with an owner and due date.</div>
                      </div>
                      <span className="material-symbols-outlined chev">chevron_right</span>
                    </div>

                    {/* New deal — orange */}
                    <div
                      className="fab-item"
                      style={{ '--ic-bg': '#F97316' }}
                      onClick={(e) => onPickItem(e)}
                    >
                      <div className="fab-item-ic">
                        <span className="material-symbols-outlined">handshake</span>
                      </div>
                      <div className="fab-item-tx">
                        <div className="fab-item-title">New deal</div>
                        <div className="fab-item-sub">Open an opportunity in your pipeline.</div>
                      </div>
                      <span className="material-symbols-outlined chev">chevron_right</span>
                    </div>

                  </div>{/* /.fab-menu */}
                </div>{/* /.fab */}

              </div>{/* /.fab-screen */}
            </div>{/* /.shell */}
            <div className="hint">Tap the <b>+</b> button · Esc to close</div>
          </div>
        </div>
      </div>
    );
  }

  window.Fab = Fab;
})();
