import { easing } from './easing';

export interface TweenConfig {
  type?: 'tween';
  duration: number;
  ease: readonly [number, number, number, number];
}

export interface SpringConfig {
  type: 'spring';
  stiffness: number;
  damping: number;
}

export interface TweenInstant {
  type: 'tween';
  duration: number;
}

export interface StaggerConfig extends TweenConfig {
  staggerChildren: number;
}

/** Tab indicator morph between active tabs. */
export function tabMorph({ reducedMotion }: { reducedMotion?: boolean } = {}): TweenConfig {
  if (reducedMotion) return { duration: 0, ease: easing.emphasized };
  return { duration: 240, ease: easing.emphasized };
}

/** Full-window enter/exit transition. */
export function windowMorph({ reducedMotion }: { reducedMotion?: boolean } = {}): TweenConfig {
  if (reducedMotion) return { duration: 0, ease: easing.emphasizedDecelerate };
  return { duration: 220, ease: easing.emphasizedDecelerate };
}

/** Swipe gesture reveal (spring physics). */
export function swipeReveal({ reducedMotion }: { reducedMotion?: boolean } = {}): SpringConfig | TweenInstant {
  if (reducedMotion) return { type: 'tween' as const, duration: 0 };
  return { type: 'spring' as const, stiffness: 380, damping: 32 };
}

/** Scroll-wheel snap settle. */
export function wheelSnap({ reducedMotion }: { reducedMotion?: boolean } = {}): TweenConfig {
  if (reducedMotion) return { duration: 0, ease: easing.standardDecelerate };
  return { duration: 320, ease: easing.standardDecelerate };
}

/** Tab pill indicator slide. */
export function tabPillSlide({ reducedMotion }: { reducedMotion?: boolean } = {}): TweenConfig {
  if (reducedMotion) return { duration: 0, ease: easing.standard };
  return { duration: 180, ease: easing.standard };
}

/** Bottom sheet detent settle. */
export function sheetDetent({ reducedMotion }: { reducedMotion?: boolean } = {}): TweenConfig {
  if (reducedMotion) return { duration: 0, ease: easing.emphasizedDecelerate };
  return { duration: 280, ease: easing.emphasizedDecelerate };
}

/**
 * Progressive blur mapped from scroll progress.
 * Returns a function (scrollProgress: 0..1) => blur px (0..16).
 * When reducedMotion, returns a function that always returns 16.
 */
export function progressiveBlur({ reducedMotion }: { reducedMotion?: boolean } = {}): (scrollProgress: number) => number {
  if (reducedMotion) return (_scrollProgress: number) => 16;
  return (scrollProgress: number) => scrollProgress * 16;
}

/** Popover scale-from-anchor entrance. */
export function popoverScaleFromAnchor({ reducedMotion }: { reducedMotion?: boolean } = {}): TweenConfig {
  if (reducedMotion) return { duration: 0, ease: easing.emphasized };
  return { duration: 200, ease: easing.emphasized };
}

/** FAB staggered open sequence. */
export function fabStaggerOpen({ reducedMotion }: { reducedMotion?: boolean } = {}): StaggerConfig {
  if (reducedMotion) return { duration: 0, ease: easing.emphasizedDecelerate, staggerChildren: 0 };
  return { duration: 160, ease: easing.emphasizedDecelerate, staggerChildren: 0.04 };
}
