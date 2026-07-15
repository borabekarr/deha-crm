// shared measure-then-spring height hook: replaces animated max-height caps and
// hand-rolled scrollHeight measurers. Spam-proof: interruption mid-animation
// re-measures the live rendered height instead of restarting from a stale value.
import { useEffect, useRef, type RefObject } from 'react';

export interface UseAutoHeightOptions {
  open: boolean;
  duration?: number;
  easing?: string;
  collapsedHeight?: number;
  onSettled?: (open: boolean) => void;
}

export interface UseAutoHeightResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function getAnimMult(): number {
  if (typeof document === 'undefined') return 1;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--anim-mult');
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 1;
}

export function useAutoHeight<T extends HTMLElement>({
  open,
  duration = 380,
  easing = 'cubic-bezier(.22,1,.36,1)',
  collapsedHeight = 0,
  onSettled,
}: UseAutoHeightOptions): UseAutoHeightResult<T> {
  const ref = useRef<T | null>(null);
  const cancelPendingRef = useRef<(() => void) | null>(null);
  const animatingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // every new toggle cancels pending settle handlers first
    cancelPendingRef.current?.();
    cancelPendingRef.current = null;

    const finalHeight = open ? 'auto' : `${collapsedHeight}px`;

    // skip animation on first mount, snap straight to the resting state
    if (!mountedRef.current) {
      mountedRef.current = true;
      el.style.transition = 'none';
      el.style.height = finalHeight;
      el.style.overflow = open ? '' : 'hidden';
      animatingRef.current = false;
      onSettled?.(open);
      return;
    }

    const settle = () => {
      animatingRef.current = false;
      el.style.transition = 'none';
      el.style.height = finalHeight;
      el.style.overflow = open ? '' : 'hidden';
      onSettled?.(open);
    };

    if (prefersReducedMotion()) {
      el.style.transition = 'none';
      el.style.height = finalHeight;
      el.style.overflow = open ? '' : 'hidden';
      animatingRef.current = false;
      onSettled?.(open);
      return;
    }

    let startHeight: number;
    if (open) {
      // interrupted mid-collapse: start from the live measured height, not 0
      startHeight = animatingRef.current
        ? el.getBoundingClientRect().height
        : collapsedHeight;
    } else if (el.style.height === 'auto' || el.style.height === '') {
      startHeight = el.scrollHeight;
    } else {
      // interrupted mid-expand: start from the live measured height
      startHeight = el.getBoundingClientRect().height;
    }

    el.style.transition = 'none';
    el.style.overflow = 'hidden';
    el.style.height = `${startHeight}px`;
    void el.offsetHeight; // force reflow so the transition below actually animates

    const effectiveDuration = duration * getAnimMult();
    el.style.transition = `height ${effectiveDuration}ms ${easing}`;
    el.style.height = open ? `${el.scrollHeight}px` : `${collapsedHeight}px`;
    animatingRef.current = true;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeoutId);
      el.removeEventListener('transitionend', onTransitionEnd);
      settle();
    };
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === 'height') finish();
    };
    el.addEventListener('transitionend', onTransitionEnd);
    // transitionend can be swallowed (display:none, detached, backgrounded);
    // this fallback must always be armed and race the listener above
    const timeoutId = window.setTimeout(finish, effectiveDuration + 80);

    cancelPendingRef.current = () => {
      window.clearTimeout(timeoutId);
      el.removeEventListener('transitionend', onTransitionEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, duration, easing, collapsedHeight]);

  useEffect(() => {
    return () => {
      cancelPendingRef.current?.();
      cancelPendingRef.current = null;
    };
  }, []);

  // Content growth while `open` stays true never reruns the toggle effect
  // above (its deps are [open, duration, easing, collapsedHeight]), so a
  // ResizeObserver closes that gap by re-measuring the resting height. It
  // no-ops while a toggle animation is in flight (that path already owns
  // the height) and while `open` is false (element stays collapsed).
  //
  // The re-measure resolves back to 'auto' rather than a pinned pixel
  // value. Pinning to a fixed px freezes the element's own border box; this
  // div's overflow stays visible while open (settle() only sets `hidden`
  // when closed), so any further child appended past that pinned height
  // just overflows without changing the element's OWN rendered size --
  // which means ResizeObserver, which fires only on the observed element's
  // own box-size changes, would never notify again after the first write.
  // 'auto' keeps the box permanently self-tracking every future append.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const el = ref.current;
    if (!el || !open) return;

    const ro = new ResizeObserver(() => {
      if (animatingRef.current) return;
      if (el.style.height === 'auto') return;
      el.style.transition = 'none';
      el.style.height = 'auto';
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, [open]);

  return { ref };
}
