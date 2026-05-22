import { CORE_VERSION } from '@deha/core';
import { duration, easing } from '@deha/motion-tokens';
import type { MotionAwareProps } from '@deha/ui-contracts';
// API import — adjust based on what you exported:
import { createSupabaseClient } from '@deha/api'; // OR API_VERSION if no client
export const __ti = { CORE_VERSION, duration, easing, createSupabaseClient } as const;
export type __MA = MotionAwareProps;
