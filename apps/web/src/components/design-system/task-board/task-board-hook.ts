/**
 * useTaskBoard — element-scoped controller with full teardown.
 *
 * Encapsulates every imperative side-effect from the prototype behind a clean
 * interface so the component itself contains NO raw render-phase effects:
 *  1. Toast auto-dismiss timer
 *  2. Sync-button color-flash timer
 *  3. Sync-sequence timer array + cleanup on detach
 *  4. FLIP measure/apply for card reordering (replaces the prototype's two
 *     layout-measure passes — captureFlip() is called before a move, scheduleFlip()
 *     after the commit via requestAnimationFrame)
 *
 * All state is stored on the element via a WeakMap so teardown is guaranteed
 * when the host element detaches (null branch of the callback ref).
 */

export type SyncPhase = 'idle' | 'connecting' | 'slack' | 'github' | 'notion' | 'done';

export interface TaskBoardTimers {
  /** Schedule the toast auto-dismiss (call whenever toast becomes visible). */
  scheduleToastDismiss: (closeFn: () => void) => void;
  /** Cancel any pending toast auto-dismiss. */
  cancelToastDismiss: () => void;
  /** React to phase change: set/clear sync-button color class. */
  handlePhaseChange: (
    phase: SyncPhase,
    setSyncBtnAnim: (cls: string | null) => void,
  ) => void;
  /** Register one or more sync-sequence setTimeout IDs for cleanup. */
  registerSyncTimer: (id: ReturnType<typeof setTimeout>) => void;
  /** Clear all registered sync-sequence timers. */
  clearSyncTimers: () => void;
  /** Snapshot current card positions BEFORE a state change that reorders them. */
  captureFlip: () => void;
  /** After the React commit, animate cards from their captured positions to new ones. */
  scheduleFlip: () => void;
  /** Teardown: clears every timer; call from the null-ref branch. */
  teardown: () => void;
}

interface HostState {
  toastTimer: ReturnType<typeof setTimeout> | null;
  phaseBtnTimer: ReturnType<typeof setTimeout> | null;
  syncTimers: Array<ReturnType<typeof setTimeout>>;
  flipBefore: Map<string, DOMRect>;
  flipRaf: number | null;
}

const hostMap = new WeakMap<Element, HostState>();

function getState(el: Element): HostState {
  if (!hostMap.has(el)) {
    hostMap.set(el, { toastTimer: null, phaseBtnTimer: null, syncTimers: [], flipBefore: new Map(), flipRaf: null });
  }
  return hostMap.get(el)!;
}

export function makeTaskBoardTimers(el: Element): TaskBoardTimers {
  const state = getState(el);

  const cancelToastDismiss = () => {
    if (state.toastTimer !== null) {
      clearTimeout(state.toastTimer);
      state.toastTimer = null;
    }
  };

  const scheduleToastDismiss = (closeFn: () => void) => {
    cancelToastDismiss();
    state.toastTimer = setTimeout(() => {
      state.toastTimer = null;
      closeFn();
    }, 4200);
  };

  const handlePhaseChange = (
    phase: SyncPhase,
    setSyncBtnAnim: (cls: string | null) => void,
  ) => {
    if (state.phaseBtnTimer !== null) {
      clearTimeout(state.phaseBtnTimer);
      state.phaseBtnTimer = null;
    }
    const cls =
      phase === 'slack'  ? 'btn-flash-progress' :
      phase === 'github' ? 'btn-flash-review'   :
      phase === 'notion' ? 'btn-flash-done'      :
      null;
    if (cls) {
      setSyncBtnAnim(cls);
      state.phaseBtnTimer = setTimeout(() => {
        setSyncBtnAnim(null);
        state.phaseBtnTimer = null;
      }, 1900);
    } else {
      setSyncBtnAnim(null);
    }
  };

  const registerSyncTimer = (id: ReturnType<typeof setTimeout>) => {
    state.syncTimers.push(id);
  };

  const clearSyncTimers = () => {
    state.syncTimers.forEach(clearTimeout);
    state.syncTimers = [];
  };

  // ---- FLIP ----
  const captureFlip = () => {
    const map = new Map<string, DOMRect>();
    el.querySelectorAll('[data-flip-id]').forEach((node) => {
      map.set(node.getAttribute('data-flip-id')!, node.getBoundingClientRect());
    });
    state.flipBefore = map;
  };

  const scheduleFlip = () => {
    if (state.flipRaf !== null) cancelAnimationFrame(state.flipRaf);
    // Run after the React commit so the new layout is in place, then invert + play.
    state.flipRaf = requestAnimationFrame(() => {
      state.flipRaf = null;
      const prev = state.flipBefore;
      el.querySelectorAll('[data-flip-id]').forEach((node) => {
        const id = node.getAttribute('data-flip-id')!;
        const oldRect = prev.get(id);
        if (!oldRect) {
          node.animate(
            [{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'scale(1)' }],
            { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' },
          );
          return;
        }
        const newRect = node.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        node.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)`, boxShadow: '0 12px 28px -8px rgba(15,23,42,0.18), 0 4px 8px -2px rgba(15,23,42,0.10)' },
            { transform: 'translate(0,0)', boxShadow: '0 0 0 transparent' },
          ],
          { duration: 500, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' },
        );
      });
    });
  };

  const teardown = () => {
    cancelToastDismiss();
    if (state.phaseBtnTimer !== null) {
      clearTimeout(state.phaseBtnTimer);
      state.phaseBtnTimer = null;
    }
    clearSyncTimers();
    if (state.flipRaf !== null) {
      cancelAnimationFrame(state.flipRaf);
      state.flipRaf = null;
    }
    hostMap.delete(el);
  };

  return {
    scheduleToastDismiss,
    cancelToastDismiss,
    handlePhaseChange,
    registerSyncTimer,
    clearSyncTimers,
    captureFlip,
    scheduleFlip,
    teardown,
  };
}
