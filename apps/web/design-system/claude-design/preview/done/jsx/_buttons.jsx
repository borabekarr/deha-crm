/* _buttons.jsx — browser-JSX port of
 * apps/web/src/components/design-system/buttons/Buttons.tsx
 * (+ inlined buttons-hook.ts, delete-button/DeleteButton.tsx, delete-button-hook.ts).
 * Point-in-time port 2026-07-07; the repo .tsx is canonical.
 */
(() => {
  const { useState, useRef, useCallback } = React;

  /* ================= buttons-hook.ts (inlined) ================= */

  function btnRootRef(el) {
    if (!el) return;
    if (!el.__btnCleanup) el.__btnCleanup = () => {};
  }

  function cleanupBtnRoot(el) {
    if (!el) return;
    el.__btnCleanup?.();
    delete el.__btnCleanup;
  }

  function registerBtnTimer(el, onExpire, ms) {
    el?.__btnCleanup?.();
    const id = setTimeout(onExpire, ms);
    if (el) el.__btnCleanup = () => clearTimeout(id);
    return id;
  }

  function runApplyBtn(btn, setPhase) {
    if (!btn) return;
    if (btn.classList.contains('is-loading') || btn.classList.contains('is-done')) return;
    setPhase('loading');
    registerBtnTimer(btn, () => {
      setPhase('done');
      registerBtnTimer(btn, () => { setPhase('default'); }, 3000);
    }, 3000);
  }

  /* ================= delete-button-hook.ts (inlined) ================= */

  function dbInnerRef(el, setWidth) {
    if (!el) { setWidth(null); return; }
    setWidth(el.scrollWidth);
  }

  function dbRootRef(el, state, count, setCount, setState) {
    if (!el) return;
    cleanupDbRoot(el);
    if (state === 'confirming') {
      if (count <= 0) { setState('done'); return; }
      const id = setTimeout(() => { setCount((c) => c - 1); }, 1000);
      el.__dbCountdown = id;
      el.__dbCleanup = () => { clearTimeout(id); delete el.__dbCountdown; delete el.__dbCleanup; };
    } else if (state === 'done') {
      const id = setTimeout(() => { setState('idle'); }, 2100);
      el.__dbReset = id;
      el.__dbCleanup = () => { clearTimeout(id); delete el.__dbReset; delete el.__dbCleanup; };
    }
  }

  function cleanupDbRoot(el) {
    if (!el) return;
    el.__dbCleanup?.();
    delete el.__dbCleanup;
  }

  /* ================= DeleteButton (inlined) ================= */

  function IcoTrash() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7h16" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M9.5 7V5.6A1.6 1.6 0 0 1 11.1 4h1.8A1.6 1.6 0 0 1 14.5 5.6V7" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M6.6 7l.9 12A1.7 1.7 0 0 0 9.2 20.6h5.6A1.7 1.7 0 0 0 16.5 19l.9-12" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M10 11v5.5M14 11v5.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }

  function IcoUndo() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9.5C4 9.5 6 5 12 5c5 0 8 4 8 7s-3 7-8 7a9 9 0 0 1-6-2.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M4 4v5.5h5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  function IcoCheck() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  function MorphSlot({ isExiting, children }) {
    return (
      <span className={`db-morph-slot ${isExiting ? 'db-slide-out' : 'db-slide-in'}`}>
        {children}
      </span>
    );
  }

  function DeleteButton({ seconds = 5, label = 'Delete account', onDelete }) {
    const [dbState, setDbState] = useState('idle');
    const [prevState, setPrevState] = useState(null);
    const [nextPendingState, setNextPendingState] = useState(null);
    const [count, setCount] = useState(seconds);
    const [prevCount, setPrevCount] = useState(null);
    const [width, setWidth] = useState(null);
    const [exitPhase, setExitPhase] = useState(false);

    const rootElRef = useRef(null);
    const stateRef = useRef('idle');
    const countRef = useRef(seconds);

    stateRef.current = dbState;
    countRef.current = count;

    const innerCbRef = useCallback(
      (el) => { dbInnerRef(el, setWidth); },
      [dbState, count, label, exitPhase],
    );

    const transitionToRef = useRef(null);

    // Harness runs React 18.3.1: a callback ref returning a cleanup fn is a
    // React-19-only pattern. Stash-cleanup-on-element instead — the null call
    // on unmount clears timers via the stashed rootElRef.
    const rootCbRef = useCallback(
      (el) => {
        if (el) {
          rootElRef.current = el;
          dbRootRef(el, dbState, count, setCount, (nextState) => {
            transitionToRef.current?.(nextState);
            if (nextState === 'done') onDelete?.();
          });
        } else {
          cleanupDbRoot(rootElRef.current);
          rootElRef.current = null;
        }
      },
      [dbState, count],
    );

    const EXIT_MS = 200;

    function transitionTo(nextState, opts) {
      setPrevState(stateRef.current);
      setPrevCount(countRef.current);
      setNextPendingState(nextState);
      setExitPhase(true);
      const t = window.setTimeout(() => {
        setExitPhase(false);
        setPrevState(null);
        setPrevCount(null);
        setNextPendingState(null);
        setDbState(nextState);
        if (opts?.resetCount !== undefined) setCount(opts.resetCount);
      }, EXIT_MS);
      if (rootElRef.current) rootElRef.current.__dbTransition = t;
    }

    transitionToRef.current = transitionTo;

    function onClick() {
      if (dbState === 'idle' && !exitPhase) {
        transitionTo('confirming', { resetCount: seconds });
      } else if (dbState === 'confirming' && !exitPhase) {
        cleanupDbRoot(rootElRef.current);
        transitionTo('idle', { resetCount: seconds });
      }
    }

    const ariaLabel =
      dbState === 'idle'
        ? label
        : dbState === 'confirming'
          ? `Cancel deletion. ${count} seconds remaining.`
          : 'Account deleted';

    const dataState = exitPhase && nextPendingState ? nextPendingState : dbState;
    const renderExiting = exitPhase && prevState !== null;
    const currentStateToRender = exitPhase && nextPendingState ? nextPendingState : dbState;

    function renderPhaseSlot(state, cnt, isExiting) {
      if (state === 'idle') {
        return (
          <MorphSlot isExiting={isExiting}>
            <span className="db-ic"><IcoTrash /></span>
            <span className="db-text">{label}</span>
          </MorphSlot>
        );
      }
      if (state === 'confirming') {
        return (
          <MorphSlot isExiting={isExiting}>
            <span className="db-undo"><IcoUndo /></span>
            <span className="db-text">Cancel deletion</span>
            <span className="db-badge">
              <span key={cnt} className="db-num">{cnt}</span>
            </span>
          </MorphSlot>
        );
      }
      return (
        <MorphSlot isExiting={isExiting}>
          <span className="db-ic"><IcoCheck /></span>
          <span className="db-text">Account deleted</span>
        </MorphSlot>
      );
    }

    return (
      <button
        type="button"
        ref={rootCbRef}
        className="db"
        data-state={dataState}
        onClick={onClick}
        aria-label={ariaLabel}
        disabled={dbState === 'done'}
        style={{ width: width !== null ? `${width}px` : undefined }}
      >
        <span className="db-inner" ref={innerCbRef}>
          {renderExiting && renderPhaseSlot(prevState, prevCount ?? count, true)}
          {renderPhaseSlot(currentStateToRender, count, false)}
        </span>
      </button>
    );
  }

  /* ================= ApplyButton ================= */

  function ApplyButton() {
    const [phase, setPhase] = useState('default');
    const phaseClass = phase === 'loading' ? ' is-loading' : phase === 'done' ? ' is-done' : '';

    return (
      <button
        type="button"
        className={`btn-green btn-apply${phaseClass}`}
        ref={(el) => {
          btnRootRef(el);
          if (!el) cleanupBtnRoot(el);
        }}
        onClick={(e) => runApplyBtn(e.currentTarget, setPhase)}
      >
        <span className="btn-apply-label">
          <span className="material-symbols-outlined btn-apply-icon">check</span>
          Apply
        </span>
        <span className="btn-apply-spinner" aria-hidden="true">
          <svg className="btn-apply-spin-svg" viewBox="0 0 32 32" fill="none">
            <circle className="btn-apply-spin-track" cx="16" cy="16" r="11" />
            <circle className="btn-apply-spin-arc" cx="16" cy="16" r="11" />
          </svg>
        </span>
        <span className="btn-apply-check" aria-hidden="true">
          <span className="material-symbols-outlined btn-apply-check-ic">check</span>
        </span>
      </button>
    );
  }

  /* ================= Buttons page ================= */

  function Buttons() {
    return (
      <div className="btn-page-root card">
        <span className="btn-label">Buttons</span>
        <div className="btn-row">
          <button type="button" className="btn-primary">View Your Leads <span className="material-icons btn-mi">arrow_forward</span></button>
          <button type="button" className="btn-inverse">View Your Leads <span className="material-icons btn-mi">arrow_forward</span></button>
          <button type="button" className="btn-glass">Son 30 Gün <span className="material-icons btn-mi">expand_more</span></button>
          <button type="button" className="btn-text">Tüm Görevleri Gör <span className="material-icons btn-mi">arrow_forward</span></button>
        </div>

        <span className="btn-label" style={{ marginTop: 20 }}>Apply &amp; Discuss (pipeline-card variants)</span>
        <div className="btn-row">
          <ApplyButton />
          <button type="button" className="btn-green btn-apply">
            <span className="material-symbols-outlined btn-apply-icon">neurology</span>
            Ask Jeru
          </button>
          <button type="button" className="btn-discuss">
            <span className="material-icons" style={{ fontSize: 16 }}>chat</span>
            Discuss
          </button>
        </div>

        <span className="btn-label" style={{ marginTop: 20 }}>Colorful pill variants (green / yellow / red)</span>
        <div className="btn-row">
          <button type="button" className="btn-green">
            <span className="material-icons" style={{ fontSize: 16 }}>check_circle</span>
            Confirm
          </button>
          <button type="button" className="btn-yellow">
            <span className="material-icons" style={{ fontSize: 16 }}>schedule</span>
            Pending
          </button>
          <button type="button" className="btn-red">
            <span className="material-icons" style={{ fontSize: 16 }}>cancel</span>
            Reject
          </button>
        </div>

        <span className="btn-label" style={{ marginTop: 20 }}>Delete (morphing three-state)</span>
        <div className="btn-row">
          <DeleteButton onDelete={() => undefined} />
        </div>

        <span className="btn-label" style={{ marginTop: 20 }}>Task footer (--fbtn color token)</span>
        <div className="btn-row">
          <button type="button" className="btn-task" style={{ '--fbtn': '#10B981' }}>
            <span className="material-icons btn-task-icon">task_alt</span>
            Mark Done
          </button>
          <button type="button" className="btn-task" style={{ '--fbtn': '#3B82F6' }}>
            <span className="material-icons">edit</span>
            Edit Task
          </button>
          <button type="button" className="btn-task" style={{ '--fbtn': '#F59E0B' }}>
            <span className="material-icons">schedule</span>
            Reschedule
          </button>
          <button type="button" className="btn-discuss"><span className="material-icons" style={{ fontSize: 16 }}>more_horiz</span>More</button>
        </div>
        <span className="btn-label" style={{ marginTop: 20 }}>CTA (optimization report)</span>
        <div className="btn-row">
          <button type="button" className="btn-cta" style={{ '--accent': '#10B981', '--ctaglow': 'rgba(16,185,129,0.5)' }}>
            <span className="material-symbols-outlined">insights</span>
            Get Optimization
          </button>
          <button type="button" className="btn-cta" style={{ '--accent': '#EF4444', '--ctaglow': 'rgba(239,68,68,0.5)' }}>
            <span className="material-symbols-outlined">insights</span>
            Get Optimization
          </button>
          <button type="button" className="btn-cta" style={{ '--accent': '#F97316', '--ctaglow': 'rgba(249,115,22,0.5)' }}>
            <span className="material-symbols-outlined">insights</span>
            Get Optimization
          </button>
          <button type="button" className="btn-cta" style={{ '--accent': '#3B82F6', '--ctaglow': 'rgba(59,130,246,0.5)' }}>
            <span className="material-symbols-outlined">insights</span>
            Get Optimization
          </button>
          <button type="button" className="btn-cta" style={{ '--accent': '#EAB308', '--ctaglow': 'rgba(234,179,8,0.5)' }}>
            <span className="material-symbols-outlined">insights</span>
            Get Optimization
          </button>
        </div>
      </div>
    );
  }

  window.Buttons = Buttons;
})();
