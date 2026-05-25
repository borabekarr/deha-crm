import { Easing } from 'react-native-reanimated';
import { duration as _duration, easing as _easing } from '@deha/motion-tokens';

export const duration = _duration;

export const easing = {
  standard: Easing.bezier(..._easing.standard),
  emphasized: Easing.bezier(..._easing.emphasized),
  emphasizedDecelerate: Easing.bezier(..._easing.emphasizedDecelerate),
  emphasizedAccelerate: Easing.bezier(..._easing.emphasizedAccelerate),
  standardDecelerate: Easing.bezier(..._easing.standardDecelerate),
  standardAccelerate: Easing.bezier(..._easing.standardAccelerate),
};

export type EasingFn = (typeof easing)[keyof typeof easing];
