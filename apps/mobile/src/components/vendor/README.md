# Vendored rit3zh Components

All repositories authored by [rit3zh](https://github.com/rit3zh). Vendored here because they are not published to npm (or their npm release requires native linking unavailable at typecheck time). Published packages (expo-ios-popover, toastiva) are installed via pnpm add in apps/mobile/package.json.

Commit SHA for all vendored repos: `0174be64096cff772cbf38f3624f8fb0cbab2f7c` (snapshot in plans/archive/rit3zh-refs/)

---

## Vendor Map

| Slug | Classification | Source | Dest |
|---|---|---|---|
| expo-apple-maps-sheet | **native-stub** | https://github.com/rit3zh/expo-apple-maps-sheet | `vendor/expo-apple-maps-sheet/index.tsx` |
| expo-fab | **pure-JS** | https://github.com/rit3zh/expo-fab | `vendor/expo-fab/` |
| expo-ios-like-date-picker | **pure-JS** (needs @shopify/react-native-skia) | https://github.com/rit3zh/expo-ios-like-date-picker | `vendor/expo-ios-like-date-picker/` |
| expo-ios-like-swipe-actions | **pure-JS** | https://github.com/rit3zh/expo-ios-like-swipe-actions | `vendor/expo-ios-like-swipe-actions/` |
| expo-linear-like-bottom-tabs | **pure-JS** | https://github.com/rit3zh/expo-linear-like-bottom-tabs | `vendor/expo-linear-like-bottom-tabs/` |
| expo-motion-tabs | **pure-JS** | https://github.com/rit3zh/expo-motion-tabs | `vendor/expo-motion-tabs/` |
| expo-progressive-blur | **native-stub** (example-app only; no reusable export) | https://github.com/rit3zh/expo-progressive-blur | `vendor/expo-progressive-blur/index.tsx` |

Note: `expo-ios-popover` (native module) is installed as `expo-ios-popover@0.1.5` via pnpm — a stub lives at `vendor/expo-ios-popover/` for type-level import fallback.

---

## Classification Notes

### pure-JS
Pure React Native / Reanimated code with no `expo-module.config.json` or `ios/` directory. Source copied directly into vendor dir. All runtime dependencies (`react-native-reanimated`, `react-native-gesture-handler`, `expo-blur`, `expo-haptics`, `expo-symbols`) are installed in apps/mobile/package.json.

### native-stub
Either has a native Expo module (`expo-ios-popover`) or depends on other native packages that require linking (`react-native-maps`, `expo-glass-effect`, `@react-native-masked-view/masked-view`, `expo-linear-gradient`). The stub file exports a TS-typed placeholder that throws at runtime with a clear error message. Resolution is deferred to Step 11a (EAS dev-client build on macOS CI runner).

---

## Published packages (pnpm add, not vendored)

- `expo-ios-popover@0.1.5` — released 2026-03-05, >24h old (policy: minimum-release-age=1440)
- `toastiva@0.1.13` — released 2026-05-05, >24h old
