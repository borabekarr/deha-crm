# Claude Design redesign prompts (2026-09)

One block per component. Each block has the broader context (what the component is for inside Jeru, what it must contain) followed by the ready-to-paste Claude Design prompt with the placeholders filled in.

**Product context shared by every prompt.** Jeru is a chat-first Growth Manager AI for one business owner. There are no classic CRM forms or dashboards. The three jobs of every screen are: what happened, what do I need to do, approve / reject / correct. Hidden sub-agents (ads, copy, content, funnel, lead, ops, analyst) do the work; the UI only surfaces their output and a "who did this / why" trail. Every component below is either part of the Daily Brief, part of the chat thread, or a supervision surface next to the chat.

**Prompt template (Bora's).**

```
let's build our new component, [NAME]
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.
```

---

## 1. Pipeline Card

**Purpose.** A compact status card that shows one funnel or campaign as a horizontal stage strip (e.g. Leads → Qualified → Proposal → Won). The default collapsed view stays as it is. The popover is re-purposed: instead of a generic detail panel it becomes the Daily Brief "what moved" panel. When the user opens it they should see what changed since yesterday in that pipeline, which sub-agent caused the change, and the one action Jeru recommends now.

**Must contain.** Collapsed: pipeline name, stage strip with counts, delta chip vs yesterday, health pill (on track / watch / stalled). Popover: 3 to 5 "moved" rows (entity, from-stage → to-stage, who did it, when), a "why" line per row, a ranked next action with Approve / Details / Skip buttons, and a footer link "Open in chat" that jumps to the thread.

**Variants.** Sales pipeline, ad campaign pipeline (impressions → clicks → leads → booked), content pipeline (drafted → reviewed → published), empty pipeline (no movement since yesterday), stalled pipeline (warning tint).

```
let's build our new component, Pipeline Card
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Keep the existing collapsed Pipeline Card look (name, stage strip with counts, delta chip vs yesterday, health pill). Re-purpose the popover as the Daily Brief "what moved" panel. On open, show 3 to 5 movement rows: entity name, from-stage → to-stage with a small animated arrow, the sub-agent avatar that made the move, relative time, and a one-line "why". Below the rows, one ranked next action with Approve / Details / Skip buttons, and an "Open in chat" footer link. States: collapsed, hover (stage strip highlights the stage under the cursor with a count tooltip), popover open, popover loading (skeleton rows), empty ("nothing moved since yesterday"), stalled (warning tint on the health pill and card border). Transitions: popover scales from the card anchor with our overlay curve, rows stagger in, approve turns the action row into a green "done" beat then collapses it. Variants via pills: Sales, Ads, Content, Empty, Stalled.
```

---

## 2. Dynamic Calendar → Active AI Sessions

**Purpose.** Fully re-purposed. This is the always-visible "what is Jeru doing right now" indicator. The user has several chats where a sub-agent is running; this widget shows them at a glance without leaving the current thread. It replaces the calendar entirely.

**Must contain.** Default: a compact pill-shaped surface with an AI shimmer icon (animated sweep) and the word "thinking" (or "N agents working" when more than one). Hover: expands to show up to 4 active chats as rows (chat title, sub-agent name, live status text such as "drafting 3 ad variants", elapsed time, tiny progress indicator). If more than 4 are active, a 5th row sits at the bottom under a progressive blur with "Click to see more". Click: opens the full list as a preview panel. Each row is clickable and routes to that chat. Each row carries quick actions: Pause, Stop, Approve pending, Open. Suggested extras: a "needs you" badge on rows waiting for approval, sort by "needs attention first", a done-state row that fades out after completion with a small check, keyboard navigation between rows, idle state when nothing is running ("Jeru is idle. Ask for something."), reduced-motion fallback for the shimmer.

**Variants.** Idle (0), single (1 chat), multi (2 to 4), overflow (5+ with blur row), attention (one row waiting for approval), expanded list panel.

```
let's build our new component, Active AI Sessions (re-purposed Dynamic Calendar)
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Re-purpose the Dynamic Calendar shell into an "active AI sessions" widget. Default view: a compact surface with an AI shimmer icon (continuous soft sweep, reduced-motion fallback = static icon) and the text "thinking" when one agent runs, "3 agents working" when more. Hover: the surface expands and shows active chats as rows, max 4 visible. Row = chat title, sub-agent name chip, live status line ("drafting 3 ad variants"), elapsed time, tiny progress ring. If there are more than 4, a 5th row sits at the bottom under a progressive blur with a "Click to see more" label. Click: opens a preview panel listing all active chats; each row is clickable and routes to that chat; each row has quick-action buttons: Pause, Stop, Approve, Open. Add a "needs you" badge on rows waiting for approval and sort those first. Completed rows show a check and fade out after 2 s. Idle state: "Jeru is idle. Ask for something." States: idle, thinking, hover-expanded, overflow, panel open, row hover, row needs-approval, row completing. Transitions: expand uses our sliding curve with height auto animation; rows stagger; the blur row unblurs into the panel on click. Variants via pills: Idle, Single, Multi, Overflow, Needs You, Panel.
```

---

## 3. Stacked List

**Purpose.** A list where items are collapsed into a stack (cards overlapping) and fan out on open. In Jeru it groups related items from one sub-agent, for example the five ad variants the copy agent drafted, or the three leads the lead agent qualified today. The stacked form keeps the Daily Brief short; the open form lets the user review and act on each item.

**Must contain.** Stack header (source agent, count, timestamp), fanned rows with a compact preview each, per-row Approve / Reject, bulk "Approve all", search/filter dock when the list is long. Known bugs to remove: overlap misalignment on open, jitter on rapid toggle, search dock clipping.

**Variants.** Ad variants stack, qualified leads stack, content drafts stack, team members directory (existing demo), empty stack.

```
let's build our new component, Stacked List
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Rebuild the Stacked List with a cleaner look and fix the known bugs: rows must align perfectly when fanned open, rapid open/close must not jitter (interruptible transition, no layout thrash), and the search dock must not clip. Collapsed: 3 overlapping cards with a header showing the source sub-agent, item count and time. Open: cards fan into a vertical list with a compact preview per row, Approve / Reject per row, an "Approve all" button in the header, and a search dock that slides in when the list has more than 6 items. States: collapsed, hover (stack peeks apart 4 px), open, row hover, row approved (green beat then row collapses), row rejected (red beat then row collapses), empty. Transitions: fan-out uses our accordion curve with per-row stagger, reverse on close. Variants via pills: Ad variants, Qualified leads, Content drafts, Team directory, Empty.
```

---

## 4. Pinned List

**Purpose.** A list where the user pins items to the top. In Jeru it holds the things the user wants Jeru to keep watching: a campaign, a lead, a metric, a competitor. Pinned rows stay at the top; unpinned rows sit below. Only the moved item animates. The existing animation is right; the visual polish is what changes.

**Must contain.** Pinned section, unpinned section, per-row pin toggle, per-row type icon, subtle divider between sections, pinned count in the header, optional "Jeru watches these" caption.

**Variants.** Watchlist (mixed types), leads only, metrics only, all unpinned, all pinned.

```
let's build our new component, Pinned List
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Keep the current pin/unpin animation model exactly (only the moved row animates, everything else static) and beautify the visual layer. Two sections: Pinned on top, Others below, separated by a soft divider with a "Pinned · 3" label. Row = type icon (campaign, lead, metric, competitor), title, one-line status, pin toggle on the right. Pinned rows get a faint accent tint. States: row default, row hover (pin toggle appears), pinning (row scales in at the top of the pinned section), unpinning (row scales in at the top of Others), all unpinned (Pinned section shows an empty hint "Pin what Jeru should keep watching"), all pinned. Transitions: entrance scale with our overlay curve. Variants via pills: Watchlist, Leads, Metrics, All unpinned, All pinned.
```

---

## 5. Model Selector

**Purpose.** The picker for which AI model runs a chat. It will live inside the AI Message Box composer. The top "selected model" area has layout issues and the outer shell needs fixing. Keep the popover list; fix the shell so it can sit inline in the composer toolbar.

**Must contain.** Trigger: model icon, model name, a small caret. Popover: model rows (name, one-line strength, cost/speed pills), selected row check, keyboard navigation. The shell must stay a static grey card that does not animate, per the existing DOM note.

**Variants.** Inline in composer, standalone trigger, compact icon-only trigger, disabled (plan does not allow model switching).

```
let's build our new component, Model Selector
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Fix the Model Selector so it can sit inline inside the AI Message Box toolbar. Fix the top selected-model area: icon, name and caret on one baseline, no clipping, stable width when the name changes. Fix the outer shell: a static grey card that never animates; only the popover animates. Popover: model rows with name, one-line strength, speed and cost pills, a check on the selected row, arrow-key navigation. States: closed, hover, open, row hover, row selected, disabled (plan does not allow switching, show a lock pill and tooltip). Transitions: popover uses our popover curve from the trigger anchor. Variants via pills: Inline in composer, Standalone, Icon-only, Disabled.
```

---

## 6. Delete Modal

**Purpose.** The destructive confirm dialog. Used when the user deletes a campaign, a lead, a workflow, or a chat. The arm-then-confirm flow stays; bugs get fixed. It also needs to appear on the Buttons page as the reference destructive flow.

**Must contain.** Warning badge with shake-on-arm, item name in the body, consequence line ("This stops the running ad set"), Cancel and Delete buttons, loading beat, deleted success beat, optional "type to confirm" for high-impact deletes.

**Variants.** Simple delete, delete with consequence, type-to-confirm, bulk delete (N items), triggered from Buttons page.

```
let's build our new component, Delete Modal
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Fix the Delete Modal bugs (focus trap, backdrop click closing during the loading beat, shake replaying on re-open, success beat not resetting) and add it to the Buttons page as the reference destructive flow. Body: warning badge that shakes when the Delete button is armed, item name, consequence line ("This stops the running ad set and its 2 scheduled posts"), Cancel and Delete. Optional type-to-confirm input for high-impact deletes. Flow: open → arm → loading → deleted (green check beat) → auto-close. States: open, armed, loading, deleted, error (inline message, Delete re-enabled). Transitions: dialog scales in with our overlay curve, backdrop fades, success beat morphs the button. Variants via pills: Simple, With consequence, Type to confirm, Bulk (5 items), From Buttons page.
```

---

## 7. Pie Chart

**Purpose.** A donut/pie for share-of-total metrics in the Daily Brief: spend by channel, leads by source, revenue by product. Remove the black outer line and make it feel like the rest of the system (soft, tokenized colors, quiet legend).

**Must contain.** Animated slices, hover slice lift with tooltip, center label (total or selected slice), legend with values and percent, optional delta chip vs last period.

**Variants.** Spend by channel, leads by source, revenue by product, single dominant slice, empty (no data).

```
let's build our new component, Pie Chart
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Pie Chart. Remove the black outer stroke entirely; slices are separated by a thin gap in the card background color. Use our semantic palette for slices. Donut by default with a center label (total, or the hovered slice's value and name). Legend on the right: color dot, label, value, percent, and a small delta chip vs last period. States: loading (slices draw in clockwise), default, slice hover (slice lifts 4 px outward, others dim slightly, tooltip), slice selected (sticks), empty ("No data yet"). Transitions: draw-in with our standard curve, hover lift with our hover-standard rule. Variants via pills: Spend by channel, Leads by source, Revenue by product, Dominant slice, Empty.
```

---

## 8. Expandable Screen

**Purpose.** A trigger (button or card) that expands into a full overlay screen with shared-element motion. In Jeru it opens a full detail view from the chat without navigating away: a campaign detail, a lead profile, a draft preview.

**Must contain.** Trigger, overlay with header (title, close), scrollable body, sticky action footer (Approve / Reject / Edit), backdrop, escape and outside-click close.

**Variants.** From button, from card, campaign detail, lead profile, draft preview with form.

```
let's build our new component, Expandable Screen
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Rebuild the Expandable Screen. A trigger (button or card) morphs into a full overlay screen with shared-element motion: the trigger's bounds grow into the overlay, the trigger's content cross-fades into the header. Overlay: header with title and close, scrollable body, sticky footer with Approve / Reject / Edit. Close via X, Escape, or backdrop click, reversing the morph back to the trigger. States: trigger default, trigger hover, expanding, open, scrolled (header gains a hairline), closing, reduced-motion (simple fade). Variants via pills: From button, From card, Campaign detail, Lead profile, Draft preview.
```

---

## 9. Expandable Card

**Purpose.** A card that grows in place to reveal more, without an overlay. In Jeru it is the unit of the Daily Brief: each brief item (a metric, a task, a pending approval) is a card that opens inline to show the reasoning and actions.

**Must contain.** Collapsed row with title, one-line summary and a chevron; expanded body with detail, "why Jeru thinks this", action buttons; only one card open at a time within a group (optional).

**Variants.** Meeting, Task, Weather (existing), Brief metric, Pending approval, Anomaly alert.

```
let's build our new component, Expandable Card
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Expandable Card as the Daily Brief item unit. Collapsed: icon, title, one-line summary, right-side value or status pill, chevron. Expanded in place: detail block, a "why" line attributed to a sub-agent, and action buttons (Approve / Details / Skip). Height animates with auto-height using our accordion curve; the chevron rotates; expanded content fades in slightly after the height. Interruptible on rapid toggle. Optional accordion mode where opening one closes the others in the group. States: collapsed, hover, expanding, expanded, collapsing, approved (green beat, card compacts to a done row), skipped. Variants via pills: Meeting, Task, Weather, Brief metric, Pending approval, Anomaly alert.
```

---

## 10. Toasts

**Purpose.** Transient feedback. In Jeru toasts confirm approvals, report a sub-agent finishing a job, and warn about anomalies. Stacked, swipe-to-dismiss, expandable for detail. This is the shared ToastStage already used by the board.

**Must contain.** Icon, title, optional description, optional action button, close, progress bar for auto-dismiss, stack of up to 3 with collapse-behind effect, expand on hover.

**Variants.** Success, Info, Warning, Error, With action ("Undo"), Agent finished (with avatar), Stacked ×3.

```
let's build our new component, Toasts
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Toast system. Bottom-right stack, max 3 visible, older ones scale back and peek behind. Card = icon or sub-agent avatar, title, optional description, optional action ("Undo", "Open chat"), close, and a thin auto-dismiss progress bar that pauses on hover. Hover expands the stack into a list. Swipe right to dismiss. States: entering, resting, hover-expanded, paused, exiting (dismiss), exiting (timeout), stacked-behind. Transitions: enter slides up with our toast curve, exit uses the toast exit duration, stack reflow is smooth. Variants via pills: Success, Info, Warning, Error, With action, Agent finished, Stacked.
```

---

## 11. Calendar

**Purpose.** The real calendar, kept as a calendar. In Jeru it shows scheduled posts, ad flights, meetings Jeru booked, and follow-ups. Month grid plus a day panel with events and a quick "Add event" popover.

**Must contain.** Header with month nav and today button, month grid with event dots per day, selected-day events panel, empty-day state, new-event popover, events tagged by sub-agent.

**Variants.** Month, Week, Day panel populated, Day panel empty, New event popover open.

```
let's build our new component, Calendar
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Calendar. Header: month name, prev/next, Today button. Month grid with event dots colored by type (post, ad flight, meeting, follow-up). Selecting a day slides in the events panel: time, title, sub-agent chip that scheduled it, and an "Add event" row. Empty day shows "Nothing scheduled. Ask Jeru to plan something." New event popover anchored to the Add row with title, date, time, type pills. States: default, day hover, day selected, month switching (grid slides horizontally), panel populated, panel empty, popover open. Variants via pills: Month, Week, Day populated, Day empty, New event.
```

---

## 12. Task Card

**Purpose.** A single task on the board or in the brief, with a schema-driven details popover. In Jeru tasks are the "what do I need to do" items: some created by the user, most proposed by Jeru with a reason.

**Must contain.** Title, assignee avatar (user or sub-agent), due chip, priority pill, tag pills, progress if subtasks, popover with description, subtasks checklist, activity trail ("Ads agent proposed this because…"), Approve / Snooze / Done actions.

**Variants.** User task, Jeru-proposed task (needs approval), In progress with subtasks, Overdue, Done.

```
let's build our new component, Task Card
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Task Card and its details popover. Card: title, assignee avatar (user or sub-agent), due chip, priority pill, up to 2 tag pills, subtask progress bar when applicable. Jeru-proposed tasks show a "proposed" pill and a faint accent border. Popover: description, subtasks checklist with check animation, activity trail ("Ads agent proposed this because CPA rose 22%"), and actions Approve / Snooze / Done. States: default, hover (lift with hover-standard), dragging (tilt and shadow), popover open, overdue (red due chip), done (strike-through and fade). Variants via pills: User task, Proposed, In progress, Overdue, Done.
```

---

## 13. Connect Modal

**Purpose.** The integrations dialog. The user connects Meta Ads, Google Ads, Stripe, the CRM, email, and so on, so the sub-agents can act. Method list with an expanding API-key panel.

**Must contain.** Provider logo and name, method rows (OAuth, API key), expanding key panel with input and "Where do I find this?" link, connecting spinner, connected success beat, error state, permissions summary ("Jeru will be able to: read campaigns, create ads").

**Variants.** OAuth provider, API-key provider, Connecting, Connected, Error, Already connected (manage / disconnect).

```
let's build our new component, Connect Modal
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Connect Modal for integrations. Header: provider logo, name, short line on what Jeru will do with it. Method rows: OAuth (one button) and API key (row expands into a panel with a masked input, paste button, "Where do I find this?" link). Permissions summary as a pill list ("read campaigns", "create ads"). Flow: idle → connecting (spinner on the row) → connected (green beat, modal switches to a manage view) or error (inline message). States: open, method hover, key panel expanding, connecting, connected, error, already connected (Manage / Disconnect). Transitions: panel expand with accordion curve, success beat morphs the button. Variants via pills: OAuth, API key, Connecting, Connected, Error, Manage.
```

---

## 14. Workflow: Template Cards

**Purpose.** The gallery the user picks an automation from: "New lead → qualify → book call", "Weekly content batch", "Ad fatigue check". Each card previews the node chain and lets the user start it with Jeru.

**Must contain.** Card grid, template icon, title, one-line outcome, mini node-chain preview, tags (channel, sub-agents involved), "Use template" button, hover preview of the steps, featured/recommended badge.

**Variants.** Grid default, Featured row, Hover preview, Category filter active, Empty search.

```
let's build our new component, Workflow Template Cards
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Workflow Template Cards gallery. Card: icon, title, one-line outcome ("Books a call within 10 minutes of a new lead"), a mini node-chain preview (3 to 5 dots connected by a line), tag pills for channel and sub-agents involved, and a "Use template" button. Hover: the node chain animates left to right and step labels appear. Category pills filter the grid with an animated reflow. A "Recommended" badge on templates Jeru picks for this business. States: default, hover, pressed, using (button turns into a loading then "Added" beat), filtered, empty search. Variants via pills: Grid, Featured, Hover preview, Filtered, Empty.
```

---

## 15. Taskboard

**Purpose.** The Kanban view of tasks by week or by status. In Jeru it is the "what do I need to do" surface for people who prefer a board over the chat list. Sub-agents move cards; the user approves.

**Must contain.** Columns (To do / Doing / Waiting on you / Done, or week rows), Task Cards, drag and drop with placeholder, column counts, add-task input, "moved by Ads agent" hint on cards that a sub-agent moved, shared toast on actions.

**Variants.** Status columns, Week rows, Drag in progress, Waiting-on-you highlighted, Empty board.

```
let's build our new component, Taskboard
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Taskboard. Two layouts: status columns (To do / Doing / Waiting on you / Done) and week rows. Uses the redesigned Task Card. Drag and drop with a placeholder that animates open, card tilt while dragging, drop settles with a spring. Column header: name, count pill, add button that reveals an inline input. Cards moved by a sub-agent get a small "moved by Ads agent" hint that fades after a few seconds. The "Waiting on you" column has an accent tint and a count badge. Actions raise the shared toast. States: default, card hover, dragging, drop target, column empty, board empty ("Nothing to do. Jeru will add tasks as work comes in."). Variants via pills: Columns, Weeks, Dragging, Waiting on you, Empty.
```

---

## 16. To-do List

**Purpose.** The lightweight personal list inside Jeru: the user's own quick items plus the ones Jeru proposes. Week header, stats, filters, task editor and detail popovers.

**Must contain.** Week strip header, stats row (done / left / proposed), filter pills, task rows with check, inline add, task editor popover, task detail popover, bulk "Approve proposed".

**Variants.** Default day, With proposed items, Filter active, Editor open, Detail open, All done.

```
let's build our new component, To-do List
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the To-do List. Header: week strip with the selected day, stats row (done, left, proposed by Jeru). Filter pills: All, Mine, Proposed, Done. Rows: check control with a satisfying check animation, title, due chip, and for proposed items a small sub-agent avatar and an Approve button. Inline add at the bottom. Task editor popover (title, due, priority, notes) and task detail popover (description, activity trail). "Approve all proposed" button appears when proposed items exist. States: default, row hover, checking (row strikes through and slides to Done), proposed, approved, editor open, detail open, all done (celebratory line "All clear for today", no confetti). Variants via pills: Default, Proposed, Filtered, Editor, Detail, All done.
```

---

## 17. Theme Editor

**Purpose.** The appearance panel. The user picks the primary palette (5 palettes exist), light/dark, brightness and radius, and sees a live preview. In Jeru this lives in settings and also seeds the brand colors sub-agents use in creatives.

**Must contain.** Palette swatches, light/dark toggle, brightness and radius ranges, live preview card, "Use as brand colors for creatives" toggle, reset.

**Variants.** Light, Dark, Palette switching, Range adjusting, Brand-for-creatives enabled.

```
let's build our new component, Theme Editor
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Theme Editor. Left: palette swatches for our 5 primaries with a selected ring, light/dark segmented control, brightness and radius ranges with live value labels, and a toggle "Use as brand colors in creatives". Right: a live preview card (a small Daily Brief item with pills, a button, a toast) that updates instantly; the palette change cross-fades colors. Reset link at the bottom. Changes apply to the preview subtree only. States: default, swatch hover, swatch selected, dragging a range, dark, brand toggle on, reset confirm. Variants via pills: Light, Dark, Palette switch, Ranges, Brand colors.
```

---

## 18. Onboarding Completion

**Purpose.** The end screen of first-run setup. After the user connects accounts and answers a few questions, this screen confirms what Jeru now knows and what it will do first, then hands off to the first Daily Brief.

**Must contain.** Progress ring completing, checklist of completed steps with check beats, "What Jeru will do first" list (3 items with sub-agent chips), primary CTA "Open my first brief", secondary "Adjust setup", subtle celebration.

**Variants.** All complete, Partial (one step skipped with a "finish later" chip), Loading first brief, Reduced motion.

```
let's build our new component, Onboarding Completion
use our design system components directly. the inner card, pills, tags, buttons, animations...
check the prompt given below. build one for us
don't forget the states, transitions, animations…
also, create that component with it's variants that shows their all possible usage areas. make these variants redirectable through pills.

Prompt:
Redesign the Onboarding Completion screen. Top: a progress ring animating to 100% with a check morph. Middle: checklist of completed setup steps (accounts connected, goals set, brand voice captured) with staggered check beats; a skipped step shows a "finish later" chip instead. Then "What Jeru will do first": 3 rows with a sub-agent chip and a one-line plan. Bottom: primary "Open my first brief" and secondary "Adjust setup". Subtle celebration (soft glow pulse, no confetti). States: entering (sequence plays), complete, partial, loading first brief (CTA spinner), reduced motion (everything static). Variants via pills: Complete, Partial, Loading, Reduced motion.
```
