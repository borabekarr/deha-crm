// prototype/lib/overlay.js
// Shared overlay primitives: focus trap, scroll lock, Esc + outside-click,
// delegated [data-opens] trigger pattern.

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let scrollLockCount = 0;

export function lockScroll() {
  if (scrollLockCount === 0) {
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
  }
  scrollLockCount++;
}

export function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

// Focus trap. Returns a release function.
export function trapFocus(root, opener) {
  const focusables = () => Array.from(root.querySelectorAll(FOCUSABLE));
  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const list = focusables();
    if (list.length === 0) {
      e.preventDefault();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  root.addEventListener('keydown', onKey);
  // Focus first focusable (or root itself).
  const first = focusables()[0];
  (first || root).focus({ preventScroll: true });
  return () => {
    root.removeEventListener('keydown', onKey);
    if (opener && typeof opener.focus === 'function') {
      opener.focus({ preventScroll: true });
    }
  };
}

// Overlay open stack — Esc closes only the topmost.
const openStack = [];

export function registerOpen(el, { onClose, opener } = {}) {
  const release = trapFocus(el, opener);
  openStack.push({ el, onClose, release });
}

export function registerClose(el) {
  const idx = openStack.findIndex((e) => e.el === el);
  if (idx === -1) return;
  const entry = openStack.splice(idx, 1)[0];
  entry.release?.();
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || openStack.length === 0) return;
  const top = openStack[openStack.length - 1];
  e.stopPropagation();
  top.onClose?.();
});

// Delegated [data-opens="#id"] click → set `open` attribute on target.
document.addEventListener('click', (e) => {
  const trigger = e.target.closest?.('[data-opens]');
  if (!trigger) return;
  const sel = trigger.getAttribute('data-opens');
  const target = document.querySelector(sel);
  if (!target) return;
  e.preventDefault();
  target.setAttribute('open', '');
  target.__opener = trigger;
});

// Helper: outside-click dismiss. Returns teardown.
export function onOutsideClick(el, handler) {
  const listener = (e) => {
    if (!el.contains(e.target)) handler(e);
  };
  // queueMicrotask delays binding past the current click so the opening click
  // doesn't immediately re-close.
  queueMicrotask(() => document.addEventListener('mousedown', listener));
  return () => document.removeEventListener('mousedown', listener);
}

export { openStack };
