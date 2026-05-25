/**
 * NATIVE STUB — expo-ios-popover
 *
 * Source: https://github.com/rit3zh/expo-ios-popover
 * Author: rit3zh
 * Classification: native-stub (has expo-module.config.json + ios/ native code)
 * Published on npm as expo-ios-popover@0.1.5 — but native linking required.
 *
 * This stub satisfies TypeScript imports. Runtime behavior requires an
 * EAS dev-client build with native modules linked (Step 11a).
 */
import React from 'react';

export interface PopoverProps {
  children?: React.ReactNode;
  visible?: boolean;
  onDismiss?: () => void;
  anchor?: React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = () => {
  throw new Error(
    'expo-ios-popover: vendored from rit3zh; native build pending — install via local path in EAS dev-client build (Step 11a).',
  );
};

export default Popover;
