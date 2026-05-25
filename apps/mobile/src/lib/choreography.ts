import {
  tabMorph as _tabMorph,
  windowMorph as _windowMorph,
  swipeReveal as _swipeReveal,
  wheelSnap as _wheelSnap,
  tabPillSlide as _tabPillSlide,
  sheetDetent as _sheetDetent,
  progressiveBlur as _progressiveBlur,
  popoverScaleFromAnchor as _popoverScaleFromAnchor,
  fabStaggerOpen as _fabStaggerOpen,
} from '@deha/motion-tokens';
import { Easing } from 'react-native-reanimated';

type Opts = { reducedMotion?: boolean };

export type ReanimatedTween = {
  duration: number;
  easing: ReturnType<typeof Easing.bezier>;
};

export type ReanimatedSpring = {
  type: 'spring';
  stiffness: number;
  damping: number;
};

export type ReanimatedInstant = {
  type: 'tween';
  duration: 0;
};

const toTween = (c: { duration: number; ease: readonly [number, number, number, number] }): ReanimatedTween => ({
  duration: c.duration,
  easing: Easing.bezier(...c.ease),
});

export const tabMorph = (opts: Opts = {}): ReanimatedTween => toTween(_tabMorph(opts));

export const windowMorph = (opts: Opts = {}): ReanimatedTween => toTween(_windowMorph(opts));

export const wheelSnap = (opts: Opts = {}): ReanimatedTween => toTween(_wheelSnap(opts));

export const tabPillSlide = (opts: Opts = {}): ReanimatedTween => toTween(_tabPillSlide(opts));

export const sheetDetent = (opts: Opts = {}): ReanimatedTween => toTween(_sheetDetent(opts));

export const popoverScaleFromAnchor = (opts: Opts = {}): ReanimatedTween => toTween(_popoverScaleFromAnchor(opts));

export const swipeReveal = (opts: Opts = {}): ReanimatedSpring | ReanimatedInstant => {
  const c = _swipeReveal(opts);
  if (c.type === 'spring') return { type: 'spring', stiffness: c.stiffness, damping: c.damping };
  return { type: 'tween', duration: 0 };
};

export const progressiveBlur = _progressiveBlur;

export type FabStagger = ReanimatedTween & { staggerChildren: number };

export const fabStaggerOpen = (opts: Opts = {}): FabStagger => {
  const c = _fabStaggerOpen(opts);
  return {
    duration: c.duration,
    easing: Easing.bezier(...c.ease),
    staggerChildren: c.staggerChildren,
  };
};
