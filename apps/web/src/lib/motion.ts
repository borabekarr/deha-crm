import { duration, easing } from '@deha/motion-tokens';

export const motionTransition = (token: keyof typeof duration = 'base') => ({
  duration: duration[token] / 1000,
  ease: easing.standard,
});
