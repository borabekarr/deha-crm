import { duration, easing } from '@deha/motion-tokens';
import { Easing } from 'react-native';

export const motionTiming = (token: keyof typeof duration = 'base') => ({
  duration: duration[token],
  easing: Easing.bezier(...easing.standard),
});
