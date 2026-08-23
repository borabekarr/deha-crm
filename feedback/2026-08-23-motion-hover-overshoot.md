# Feedback: motion-hover-overshoot
Source: `debt/motion-hover-overshoot-and-drift.md` (end-of-run motion sweep for `plans/ui-library-debt-p2.md`), plus Bora's per-curve verdicts left as nine comments on the planning artifact, 2026-08-23

Denominator sealed 2026-08-23. Seven items: five bad easing curves to retire, one hover-vocabulary
resolution, one mechanical guard. Split across two runs per Bora's call ("all eight, split across
two runs"): `-p1` owns F1-F4, `-p2` owns F5-F7.

Bad/good verdicts are Bora's, given per curve. The split is clean at the overshoot control point:
everything at 1.40 and above is bad, everything at 1.32 and below is good. The four good curves
(`--ease-spring-soft` 1.32, `--ease-spring-pop` 1.20, `--ease-toast-pop` 1.16, `--ease-out` 1.00)
stay. Each bad curve is replaced by the good curve sharing its exact x-control points, so pacing is
unchanged and only the overshoot softens.

- **F1** [apps/web/src/styles/motion-tokens.css:56 + 7 call sites]: "`--ease-spring-soft-2` = `cubic-bezier(.34, 1.4, .5, 1)` at `motion-tokens.css:56`. The y-control-point of 1.4 exceeds 1. Used on the adjust timeframe selection handles at `apps/web/src/components/design-system/adjust-timeframe/AdjustTimeframe.css:465`, on the `.tf-handle::before` height channel, firing on both `:hover` and `:focus-visible`."
  - Bora's verdict on this curve: "bad"
  - Replacement: `--ease-spring-pop` `cubic-bezier(.34, 1.2, .5, 1)` (identical x points .34 / .50)
  - Call sites: AdjustTimeframe.css:123,124,465; InlineEdit.css:328,336; OnboardingCompletion.css:93; DynamicIslandReader.css:66

- **F2** [apps/web/src/styles/motion-tokens.css:103 + 14 call sites]: "`--ease-spring-snap` = `cubic-bezier(.34, 1.56, .64, 1)` at `motion-tokens.css:103`. The y-control-point of 1.56 exceeds 1."
  - Bora's verdict on this curve: "bad." Also named by name in the 2026-08-15 standing ban (`memory/frontend-motion-contract.md:70-71`).
  - Replacement: `--ease-toast-pop` `cubic-bezier(.34, 1.16, .64, 1)` (identical x points .34 / .64)
  - Call sites: TaskBoard.css:405,463,489,514; SprintPlannerCore.css:451; BuyerBrain.css:238,239,346,719; SmoothDrawer.css:513; OtpInput.css:166,235,304; NumberFlow.css:105; index-bar-hook.ts:189
  - Correction to the source debt file: it reports line 489 as a hover transform. `.tb-daybtn:hover` sets only `background` and `border-color`, both on non-overshoot curves. The overshoot leg governs the transform, which fires on press release.

- **F3** [apps/web/src/components/design-system/adjust-timeframe/AdjustTimeframe.css, apps/web/src/components/design-system/task-board/TaskBoard.css]: "Pointer hover on a small interactive chip resolves three different ways across the three components this run touched: `.tf-zoom-btn` hover: no transform at all, only `color 0.24s` on `--ease-fade`. `.tf-handle::before` hover: `0.18s` on `--ease-spring-soft-2`. `.tb-daybtn` hover: `transform 0.2s` on `--ease-spring-snap`."
  - Correction: the finding mostly dissolves. `.tf-zoom-btn` hover changes colour on `--ease-fade`; `.tb-daybtn` hover changes background on the house `--fp-hover` token plus border-colour on `--ease-fade`. Neither hovers on an overshoot curve. The single real outlier is `.tf-handle::before`, whose height channel runs on `--ease-spring-soft-2`.
  - Resolution: no eighth motion family. Fix the one outlier and record why no family was minted.

- **F4** [global: motion-tokens.css plus any future CSS minting a cubic-bezier]: "The overshoot ban is a written rule with no mechanical check behind it. Nothing rejects a `cubic-bezier` whose y-control-point exceeds 1, so tokens that violate the rule were minted and adopted without anything objecting."
  - Correction to the proposed check: rejecting any overshoot at all would flag four curves Bora approved, including `--ease-spring-pop`, already on the record as an approved Picker exception since August. The threshold is 1.32, not 1.0.
  - Must be committed to version control. The existing `motion-token-gate.sh` lives only in gitignored `.claude-ext/`, so a fresh clone silently loses it.

- **F5** [apps/web/src/styles/motion-tokens.css:43]: `--ease-spring` = `cubic-bezier(.34, 1.56, .64, 1)`, carrying the comment "overshoot curve retained only for legacy references; new work uses the no-bounce vocabulary".
  - Bora's verdict on this curve: "bad"
  - Replacement: `--ease-toast-pop` (identical x points .34 / .64)

- **F6** [apps/web/src/styles/motion-tokens.css:110 + MotionTabs.css:555]: `--ease-spring-snap-soft` = `cubic-bezier(.34, 1.56, .5, 1)`.
  - Bora's verdict on this curve: "bad"
  - Replacement: `--ease-spring-pop` (identical x points .34 / .50)

- **F7** [apps/web/src/styles/motion-tokens.css + FileFolder.css]: `--ease-spring-strong` = `cubic-bezier(.34, 1.5, .64, 1)`, used on the FileFolder pop/enter transform.
  - Bora's verdict on this curve: "bad"
  - Replacement: `--ease-toast-pop` (identical x points .34 / .64)
