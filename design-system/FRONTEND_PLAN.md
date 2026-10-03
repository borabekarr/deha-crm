# Deha Frontend — Workspace Plan

## 1. Layout (from sketch)
- **Shell**: full-viewport background image (user-supplied painterly art), app floats on top with ~16px margin.
- **Left sidebar** (collapsible): brand/new-task button top, task/history list middle, avatar + account bottom. Collapsed = icon rail. Uses `05-navigation-layout/side-panes` + `sidebar-toggle-icon`.
- **Stream panel** (top-right, large, scrollable): translucent off-white card, 28–32px radius, soft shadow. Holds the conversation feed.
- **Prompt bar** (bottom-right): separate floating card, same material. `06-ai-chat/prompt-bar` + `composer`. Row of status pills under input (Autopilot state, Resume, Stop, filters).

## 2. Stream anatomy
Feed = ordered list of **blocks**, divided by hairline separators.

**Step block** (core unit, per real example):
1. Round colorful badge (48px, avatar/logo/icon, elevated)
2. Header: title + muted meta (e.g. time)
3. Pill row (`pills-badges`): category, tags, counts
4. Body text (2–3 lines, clamp + expand)
5. Source row (`context-sources`): LinkedIn, Web Search…

**Other block types**
- `user-message` — right-aligned or full-width bubble (`messages`)
- `thinking` — collapsible reasoning trace (`thinking`, `shimmer-skeleton` while live)
- `plan` — checklist of steps (`plans-tasks`, `task-rows`)
- `interview` — inline question card awaiting answer (`human-in-the-loop`, `progressive-input-stack`)
- `metrics` — metric grid (`metrics`, `number-flow`)
- `table` / `list` / `pipeline-card` / `file-tree` — rich results
- `brief` — final summary card; ends a turn

## 3. Flow / state machine
```
idle → user sends → [user-message] → [thinking] → [step]×N (appended live) → [brief] → paused
paused → user replies → separator → [user-message] → … repeat
```
- Steps append one by one with slide-up/fade (`slide-up-text`, `page-transitions` tokens).
- Auto-scroll to bottom while streaming; stop if the user scrolls up; show a "jump to latest" pill.
- `interview` blocks pause the run until answered; the prompt bar shows "Waiting for your answer".
- Prompt-bar pills reflect run state: Running / Paused n/m / Resume / Stop.

## 4. Data model
```js
{ id, type: 'step'|'user'|'thinking'|'plan'|'interview'|'metrics'|'table'|'brief',
  status: 'pending'|'live'|'done', payload: {...} }
```
A renderer maps `type` to a component. A scripted "fake AI" timeline drives the prototype.

## 5. Gaps & how to fill them
- **App shell** (bg + floating panels): new layout; tokens from `styles.css`.
- **Step block**: compose from existing pills + context-sources + a new round badge (built from `cards`/elevation tokens).
- **Turn separator** with optional label/time: new, a hairline + caption.
- **Stream renderer + scripted timeline**: new logic.
- **Jump-to-latest pill**: reuse `floating-pill-nav` style.
- **Background**: `01-foundations/backgrounds` slot, replaced by user images.

## 6. Build order
1. Shell + sidebar collapse + backgrounds
2. Step block + separator
3. Prompt bar with run-state pills
4. Renderer + scripted timeline (one full turn)
5. Mid-stream components: interview, metrics, plan
6. Second turn (reply → think → output), scroll behaviors
