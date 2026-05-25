/**
 * NATIVE STUB — expo-fab
 *
 * Source: https://github.com/rit3zh/expo-fab
 * Classification: native-stub (awaiting EAS dev-client link).
 *
 * Runtime behaviour is provided by the JS fallback in
 * apps/mobile/src/components/fab.tsx; that wrapper try/catches this require
 * and uses the local Reanimated stagger when this throws. The upstream
 * implementation animated width/height/bottom on the layout thread, which
 * react-doctor (correctly) flagged as a perf bug. Replacing the live
 * implementation with a throwing stub removes the dead-code anti-patterns
 * without changing observable behaviour.
 */
import React from 'react';

export interface FabProps {
  onPress?: () => void;
}

const Fab: React.FC<FabProps> = () => {
  throw new Error(
    'expo-fab: vendored from rit3zh; native build pending. Consumers should try/catch and use the JS fallback.',
  );
};

export default Fab;
