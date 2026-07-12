// canonical app-hooks barrel; single import site for browser-API hooks + future custom hooks
export {
  useLocalStorage,
  useMediaQuery,
  useEventListener,
  useOnClickOutside,
  useDebounceValue,
  useCopyToClipboard,
  useResizeObserver,
  useTimeout,
  useIsMounted,
} from 'usehooks-ts';

export { useAutoHeight } from './use-auto-height';
export type { UseAutoHeightOptions, UseAutoHeightResult } from './use-auto-height';

export { useProximityGroup, registerProximityGroup } from './use-proximity-group';
export type { ProximityOptions } from './use-proximity-group';

export { useSquircle } from './use-squircle';
