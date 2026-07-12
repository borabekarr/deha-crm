// callback-ref wrapper around a module-singleton squircle engine: one shared
// ResizeObserver drives clip-path + ring custom properties on every registered
// element, mirroring use-proximity-group.ts's register-on-attach/cleanup-on-
// detach structure. No lifecycle effect needed for either concern.
import { useCallback, useRef } from 'react';
import { squirclePath, squircleRingPath } from '../squircle';

const DEFAULT_SMOOTHING = 0.6;
const BORDER_WIDTH = 1;

interface ElementState {
  el: HTMLElement;
}

const elements = new Map<HTMLElement, ElementState>();
let observer: ResizeObserver | null = null;
let capabilityChecked = false;
let capable = false;

function supportsSquircle(): boolean {
  if (capabilityChecked) return capable;
  capabilityChecked = true;
  capable =
    typeof ResizeObserver !== 'undefined' &&
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('clip-path', 'path("M0 0 L1 0 Z")');
  return capable;
}

function readRadius(computed: CSSStyleDeclaration): number {
  const custom = computed.getPropertyValue('--corner-radius').trim();
  const parsed = custom ? parseFloat(custom) : NaN;
  if (!Number.isNaN(parsed)) return parsed;
  const fallback = parseFloat(computed.borderTopLeftRadius);
  return Number.isNaN(fallback) ? 0 : fallback;
}

function readSmoothing(computed: CSSStyleDeclaration): number {
  const custom = computed.getPropertyValue('--corner-smoothing').trim();
  const parsed = custom ? parseFloat(custom) : NaN;
  return Number.isNaN(parsed) ? DEFAULT_SMOOTHING : parsed;
}

function applySquircle(el: HTMLElement, width: number, height: number): void {
  if (width <= 0 || height <= 0) return;
  const computed = window.getComputedStyle(el);
  const radius = readRadius(computed);
  const smoothing = readSmoothing(computed);

  el.style.clipPath = `path("${squirclePath(width, height, radius, smoothing)}")`;
  el.style.setProperty(
    '--squircle-border-path',
    `path("${squircleRingPath(width, height, radius, BORDER_WIDTH, smoothing)}")`
  );
  const hairlineInnerW = width - BORDER_WIDTH * 2;
  const hairlineInnerH = height - BORDER_WIDTH * 2;
  const hairlineRadius = Math.max(radius - BORDER_WIDTH, 0);
  el.style.setProperty(
    '--squircle-hairline-path',
    `path("${squircleRingPath(hairlineInnerW, hairlineInnerH, hairlineRadius, BORDER_WIDTH, smoothing, [
      BORDER_WIDTH,
      BORDER_WIDTH,
    ])}")`
  );
  el.dataset.squircle = 'on';
}

function measureAndApply(el: HTMLElement): void {
  applySquircle(el, el.offsetWidth, el.offsetHeight);
}

function ensureObserver(): ResizeObserver | null {
  if (typeof ResizeObserver === 'undefined') return null;
  if (!observer) {
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (!elements.has(el)) continue;
        const box = entry.borderBoxSize?.[0];
        if (box) {
          applySquircle(el, box.inlineSize, box.blockSize);
        } else {
          measureAndApply(el);
        }
      }
    });
  }
  return observer;
}

function registerSquircle(el: HTMLElement): () => void {
  if (!supportsSquircle()) {
    return () => {};
  }

  elements.set(el, { el });
  // synchronous first paint avoids a one-frame square flash while the
  // ResizeObserver's initial (async) callback hasn't fired yet
  measureAndApply(el);
  ensureObserver()?.observe(el);

  return function unregisterSquircle(): void {
    if (!elements.has(el)) return;
    elements.delete(el);
    observer?.unobserve(el);
    el.style.removeProperty('clip-path');
    el.style.removeProperty('--squircle-border-path');
    el.style.removeProperty('--squircle-hairline-path');
    delete el.dataset.squircle;
  };
}

interface SquircleRefState {
  cleanup: (() => void) | null;
}

export function useSquircle<T extends HTMLElement>(): (el: T | null) => void {
  const stateRef = useRef<SquircleRefState>({ cleanup: null });

  return useCallback((el: T | null) => {
    stateRef.current.cleanup?.();
    stateRef.current.cleanup = null;
    if (el != null) {
      stateRef.current.cleanup = registerSquircle(el);
    }
  }, []);
}
