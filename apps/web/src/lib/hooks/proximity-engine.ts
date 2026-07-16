// framework-agnostic proximity engine: one document-level pointermove listener,
// RAF-coalesced, drives the --prox custom property consumed by hover-tokens.css.
// Module singleton so multiple groups share a single listener; zero-cost when unused.

export interface ProximityOptions {
  radius?: number;
  selector?: string;
}

interface GroupState {
  container: HTMLElement;
  radius: number;
  selector: string;
  children: HTMLElement[];
  rects: DOMRect[];
  prev: number[];
  containerBox: { left: number; top: number; right: number; bottom: number } | null;
  resizeObserver: ResizeObserver | null;
  dirty: boolean;
  remeasureTimer: number | null;
  onTransformSettle: (() => void) | null;
}

const DEFAULT_RADIUS = 80;
const DEFAULT_SELECTOR = '[data-proximity]';
const EPSILON = 0.005;
// Debounces a group re-measure after transitionend/animationend so bursts of
// child animations (staggered entrances, spam hover) coalesce into one
// remeasure instead of thrashing getBoundingClientRect per event.
const GROUP_REMEASURE_DEBOUNCE_MS = 50;

const groups = new Map<HTMLElement, GroupState>();

let pointerX = 0;
let pointerY = 0;
let rafId: number | null = null;
let attached = false;
let modalityOk = false;
let pointerFineQuery: MediaQueryList | null = null;
let reducedMotionQuery: MediaQueryList | null = null;

function computeModalityOk(): boolean {
  if (typeof window === 'undefined') return false;
  const pointerFine = window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return pointerFine && !reducedMotion;
}

function zeroGroup(state: GroupState): void {
  state.children.forEach((el, i) => {
    if (state.prev[i] > 0) {
      el.style.removeProperty('--prox');
      state.prev[i] = 0;
    }
  });
}

function measureGroup(state: GroupState): void {
  const els = Array.from(state.container.querySelectorAll<HTMLElement>(state.selector));
  const prevByEl = new Map(state.children.map((el, i) => [el, state.prev[i] ?? 0]));
  state.children = els;
  state.rects = els.map((el) => el.getBoundingClientRect());
  state.prev = els.map((el) => prevByEl.get(el) ?? 0);
  state.dirty = false;

  if (state.rects.length === 0) {
    state.containerBox = null;
    return;
  }
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const rect of state.rects) {
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  state.containerBox = {
    left: left - state.radius,
    top: top - state.radius,
    right: right + state.radius,
    bottom: bottom + state.radius,
  };
}

function processGroup(state: GroupState): void {
  if (state.dirty) measureGroup(state);
  const box = state.containerBox;
  if (!box || state.rects.length === 0) return;

  if (pointerX < box.left || pointerX > box.right || pointerY < box.top || pointerY > box.bottom) {
    zeroGroup(state);
    return;
  }

  const radius = state.radius;
  state.children.forEach((el, i) => {
    const rect = state.rects[i];
    const dx = Math.max(0, rect.left - pointerX, pointerX - rect.right);
    const dy = Math.max(0, rect.top - pointerY, pointerY - rect.bottom);
    const dist = Math.hypot(dx, dy * 3);
    const raw = Math.max(0, 1 - dist / radius);
    const t = raw * raw * (3 - 2 * raw);
    const prev = state.prev[i];
    if (Math.abs(t - prev) > EPSILON) {
      if (t <= 0) {
        el.style.removeProperty('--prox');
      } else {
        el.style.setProperty('--prox', t.toFixed(4));
      }
      state.prev[i] = t;
    }
  });
}

function runFrame(): void {
  rafId = null;
  groups.forEach(processGroup);
}

function scheduleFrame(): void {
  if (rafId !== null || !attached) return;
  rafId = requestAnimationFrame(runFrame);
}

function onPointerMove(e: PointerEvent): void {
  pointerX = e.clientX;
  pointerY = e.clientY;
  scheduleFrame();
}

function onPointerLeaveDoc(): void {
  groups.forEach(zeroGroup);
}

function invalidateAll(): void {
  groups.forEach((state) => {
    state.dirty = true;
  });
  scheduleFrame();
}

function onScroll(): void {
  invalidateAll();
}

function onResize(): void {
  invalidateAll();
}

function attachEngine(): void {
  if (attached || typeof document === 'undefined') return;
  attached = true;
  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.documentElement.addEventListener('pointerleave', onPointerLeaveDoc, { passive: true });
}

function detachEngine(): void {
  if (!attached) return;
  attached = false;
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('scroll', onScroll, true);
  window.removeEventListener('resize', onResize);
  document.documentElement.removeEventListener('pointerleave', onPointerLeaveDoc);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  groups.forEach(zeroGroup);
}

function updateModality(): void {
  modalityOk = computeModalityOk();
  if (modalityOk && groups.size > 0) {
    attachEngine();
  } else {
    detachEngine();
  }
}

function ensureModalityListeners(): void {
  if (typeof window === 'undefined') return;
  if (!pointerFineQuery) {
    pointerFineQuery = window.matchMedia('(pointer: fine)');
    pointerFineQuery.addEventListener('change', updateModality);
  }
  if (!reducedMotionQuery) {
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', updateModality);
  }
}

export function registerProximityGroup(container: HTMLElement, opts: ProximityOptions = {}): () => void {
  ensureModalityListeners();
  modalityOk = computeModalityOk();

  const state: GroupState = {
    container,
    radius: opts.radius ?? DEFAULT_RADIUS,
    selector: opts.selector ?? DEFAULT_SELECTOR,
    children: [],
    rects: [],
    prev: [],
    containerBox: null,
    resizeObserver: null,
    dirty: true,
    remeasureTimer: null,
    onTransformSettle: null,
  };

  if (typeof ResizeObserver !== 'undefined') {
    state.resizeObserver = new ResizeObserver(() => {
      state.dirty = true;
      scheduleFrame();
    });
    state.resizeObserver.observe(container);
  }

  // Transform-only movement (entrance keyframes, translate morphs, fixed-position
  // containing-block resolution) never triggers ResizeObserver, so rects captured
  // mid-animation stay stale at rest. Delegated transitionend/animationend on the
  // group container catches settle points for any descendant; debounced so a burst
  // of child animations coalesces into a single re-measure.
  const onTransformSettle = () => {
    if (state.remeasureTimer !== null) return;
    state.remeasureTimer = window.setTimeout(() => {
      state.remeasureTimer = null;
      state.dirty = true;
      scheduleFrame();
    }, GROUP_REMEASURE_DEBOUNCE_MS);
  };
  state.onTransformSettle = onTransformSettle;
  container.addEventListener('transitionend', onTransformSettle, { passive: true });
  container.addEventListener('animationend', onTransformSettle, { passive: true });

  groups.set(container, state);

  if (modalityOk) {
    attachEngine();
    scheduleFrame();
  }

  return function unregisterProximityGroup(): void {
    const existing = groups.get(container);
    if (!existing) return;
    existing.resizeObserver?.disconnect();
    if (existing.remeasureTimer !== null) {
      window.clearTimeout(existing.remeasureTimer);
    }
    if (existing.onTransformSettle) {
      container.removeEventListener('transitionend', existing.onTransformSettle);
      container.removeEventListener('animationend', existing.onTransformSettle);
    }
    zeroGroup(existing);
    groups.delete(container);
    if (groups.size === 0) {
      detachEngine();
    }
  };
}
