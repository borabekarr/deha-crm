// callback-ref wrapper around the proximity-engine singleton: register on mount,
// cleanup on ref swap/unmount, no lifecycle effect needed for either.
import { useCallback, useRef } from 'react';
import { registerProximityGroup, type ProximityOptions } from './proximity-engine';

export { registerProximityGroup } from './proximity-engine';
export type { ProximityOptions } from './proximity-engine';

interface ProximityGroupRefState {
  cleanup: (() => void) | null;
}

export function useProximityGroup<T extends HTMLElement>(
  opts?: ProximityOptions
): (el: T | null) => void {
  const stateRef = useRef<ProximityGroupRefState>({ cleanup: null });
  // opts captured at first mount only: mutating a ref during render trips
  // react-hooks/refs, and re-registering per options change isn't needed here.
  const optsRef = useRef<ProximityOptions | undefined>(opts);

  return useCallback((el: T | null) => {
    stateRef.current.cleanup?.();
    stateRef.current.cleanup = null;
    if (el != null) {
      stateRef.current.cleanup = registerProximityGroup(el, optsRef.current);
    }
  }, []);
}
