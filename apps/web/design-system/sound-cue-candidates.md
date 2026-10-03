# Sound-Cue Candidates

Strategy-only mapping of design-system components to sound-cue categories. No engine, dependency, or asset is chosen here; every category and its cooldown/volume rule comes from `~/claude-code-system/.claude/references/frontend/sound-cue-strategy.md` (the sweet-spot policy). Source library evaluated: cuelume (github.com/Danilaa1/cuelume), deferred.

Categories: ambient/micro, transient, outcome-success, outcome-error, notification, navigation.

| Component (`apps/web/src/components/design-system/`) | Category | Reason |
|---|---|---|
| `buttons` (primary/secondary) | transient | Press/release confirms input registration; naturally rate-limited by click speed, volume <= 0.3 master |
| `controls` (toggle/switch, segmented) | transient | Switch flip is a discrete gesture; same low-volume press rule, no cooldown |
| `toast` (ToastStage) | notification | Background/system event surfacing; cooldown 3-5s per source, must never stack |
| `dynamic-island-reader` | notification | Ambient-system status surface; same per-source cooldown as toast |
| `multisteps` (step advance / final submit) | outcome-success | Form-submit confirmation; category-wide cooldown 1.5-2s so rapid advances stay rare |
| `otp-input` (valid code accepted) | outcome-success | Single high-value confirmation per session; ideal operant-conditioning moment |
| `otp-input` / `inline-edit` (validation failure) | outcome-error | Must interrupt; session cap of 3 identical-cause errors then silent |
| `delete-button` / `delete-modal` (irreversible confirm) | outcome-error | Destructive-action confirm treated as the rare, must-land category; volume up to 1.0 |
| `motion-tabs` | navigation | Tab/route arrival is punctuation; cooldown 1s, only after first user interaction |
| `smooth-drawer` / `expandable-screen` (open) | navigation | Modal/sheet open is a wayfinding cue; same 1s cooldown |
| `pills` / `dropdown` (hover) | ambient/micro | Off by default; if enabled, 150ms cooldown + max 1 per target per 2s |
| `onboarding-completion` / `streak-card` (milestone) | outcome-success | Variable, meaningful milestone; highest conditioning value while rare |

## Exclusions

- `number-flow`, `shimmer`, `animated-list`, `blur-carousel`: continuous or auto-driven motion, would fire >5x/minute, so any cue is ambient/micro and off by default. Not candidates.
- Anything firing on keystroke or scroll: ambient/micro, off.

## Rules carried from the policy

- Never stack two categories on one gesture: a button press that yields success plays only the success cue.
- One global mute/volume control, using the existing settings store.
- Cue calls go through a `shouldPlay(category, sourceId)` gate, never directly to the player.

## Next step

Engine choice (cuelume vs. sample-based vs. hand-rolled AudioContext), the dependency add, the `shouldPlay` gate module, and per-component wiring are deferred to two generated plan files: `plans/sound-cue-wiring.md` (this design system) and `plans/jeru/specs/24-sound-cue-integration.md` (Jeru app-generation). Nothing in this doc adds code or assets.
