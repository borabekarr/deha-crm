// prototype/lib/motion.js
// prefers-reduced-motion aware transition helper.

const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Run an entrance/exit transition. Returns a Promise that resolves when done.
// `keyframes` follow the Web Animations API shape.
export function transition(el, keyframes, options = {}) {
  const duration = reduceMotion() ? 0 : (options.duration ?? 220);
  const easing = options.easing ?? 'cubic-bezier(.32,.72,0,1)';
  if (duration === 0) {
    // Apply final frame instantly.
    const final = keyframes[keyframes.length - 1] || {};
    for (const [k, v] of Object.entries(final)) el.style[k] = v;
    return Promise.resolve();
  }
  const anim = el.animate(keyframes, { duration, easing, fill: 'forwards' });
  return anim.finished.catch(() => {}); // swallow cancel
}

export const animate = {
  overlayIn: (el) =>
    transition(
      el,
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 220 },
    ),
  overlayOut: (el) =>
    transition(
      el,
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(8px)' },
      ],
      { duration: 160 },
    ),
  sheetIn: (el) =>
    transition(
      el,
      [
        { opacity: 0, transform: 'translateX(calc(100% + 1rem))' },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      { duration: 280 },
    ),
  sheetOut: (el) =>
    transition(
      el,
      [
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: 'translateX(calc(100% + 1rem))' },
      ],
      { duration: 200 },
    ),
  tooltipIn: (el) =>
    transition(
      el,
      [
        { opacity: 0, transform: 'scale(.96)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: 120, easing: 'ease-out' },
    ),
  toastIn: (el) =>
    transition(
      el,
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 280 },
    ),
  toastOut: (el) =>
    transition(
      el,
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(8px)' },
      ],
      { duration: 200, easing: 'ease-in' },
    ),
  fadeOut: (el) =>
    transition(el, [{ opacity: 1 }, { opacity: 0 }], {
      duration: 160,
      easing: 'ease-in',
    }),
};

export { reduceMotion };
