// Direction-aware panel-switch state, shared by any tabbed/paged surface that
// slides panels left/right based on index travel direction. Tracks the
// previous and next active panel index across renders using React's
// "storing information from previous renders" state pattern (react.dev/
// reference/react/useState#storing-information-from-previous-renders) --
// plain useState, not a ref, so dir/prevIndex stay in sync with the index
// change on the SAME render with no one-frame flash of stale direction, and
// no ref-during-render access. Returns a lookup mapping any panel index to
// its enter/exit/active/idle state. Pass `null` for `activeIndex` when
// nothing is open/visible (forces dir back to 0, no directional exit).
// Pairs with the global [data-panel-state] keyframes in
// styles/motion-tokens.css. Port of the inlined Math.sign logic from
// MotionTabs (proof-of-use).
import { useState } from 'react';

export type PanelDirectionState =
  | 'idle'
  | 'active'
  | 'entering-right'
  | 'entering-left'
  | 'exiting-left'
  | 'exiting-right';

export function usePanelDirection(
  activeIndex: number | null
): (index: number) => PanelDirectionState {
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [dir, setDir] = useState(0);

  if (lastIndex !== activeIndex) {
    const fromIdx = lastIndex;
    const nextDir =
      fromIdx === null || activeIndex === null
        ? 0
        : Math.sign(activeIndex - fromIdx);
    setPrevIndex(fromIdx);
    setDir(nextDir);
    setLastIndex(activeIndex);
  }

  return function panelState(index: number): PanelDirectionState {
    if (activeIndex === index) {
      if (dir === 0) return 'active';
      return dir > 0 ? 'entering-right' : 'entering-left';
    }
    if (prevIndex === index && dir !== 0) {
      return dir > 0 ? 'exiting-left' : 'exiting-right';
    }
    return 'idle';
  };
}
