# Hooks toolkit

Barrel-exported (`import { X } from '@/lib/hooks'`):

- **useLocalStorage** (usehooks-ts) — persist state to localStorage; reach for when a value needs to survive a reload.
- **useProximityGroup** (`use-proximity-group.ts`) — registers a DOM group for the edge-distance hover engine; reach for when adding proximity-hover to a new component cluster.
- **useSquircle** (`use-squircle.ts`) — applies concentric-corner squircle geometry to an element; reach for card/shell corner rounding.

Direct-file import only (not re-exported from the barrel — import from the file directly):

- **useAutoHeight** (`use-auto-height.ts`) — animates height transitions respecting `--anim-mult`; reach for expand/collapse panels.
- **registerProximityGroup** (`proximity-engine.ts`): imperative registration helper; import directly from `proximity-engine.ts` for non-hook call sites.
- **usePanelDirection** (`use-panel-direction.ts`) — derives panel open/close direction; reach for directional slide/reveal transitions.

`usehooks-ts`'s `useMediaQuery`, `useEventListener`, `useOnClickOutside`, `useDebounceValue`, `useCopyToClipboard`, `useResizeObserver`, `useTimeout`, `useIsMounted` were previously re-exported here unused; import them straight from `usehooks-ts` if a future component needs one.
