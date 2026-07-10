# Two-arm design benchmark

A repeatable, blind A/B benchmark for one CRM component (`brief.md` — a CRM Task Card).

- **Arm 1 (`arm-dept/`)** — the dept-frontend agent's build (arrives in step 7).
- **Arm 2 (`arm-design/`)** — a real Claude Design export the user supplies later.

Until the real arms exist, the harness is validated with two stand-in components
(see "Validation" below).

## Layout

```
benchmark/
  brief.md              # the component brief (CRM Task Card), adapted from ab-card
  run-benchmark.mjs     # single entry script — the whole harness
  scorer-prompt.md      # blind scorer prompt template (NO arm identity)
  README.md             # this file
  arm-dept/             # (reserved) dept-frontend agent output
  arm-design/           # (reserved) real Claude Design export
  results/
    MAPPING.json        # PRIVATE arm-A/arm-B -> input path. Scorer never reads it.
    REPORT.md           # structural + gate + rubric table (+ USER VERDICT: pending)
    arm-A/ arm-B/       # per-arm screenshots (light + dark png)
    scorer-input/       # blind package handed to the scorer (no MAPPING.json)
```

The rubric lives at
`/home/bora/deha-crm/.claude-ext/references/frontend/design-benchmark-rubric.md`
(15 items, 0-2 each, 30 max; every item cites a design-system.md section/line or a
make-interfaces-feel-better principle).

## Run

```bash
cd /home/bora/deha-crm
node pilot-sandbox/benchmark/run-benchmark.mjs <compA.tsx> <compB.tsx>
```

For each arm the harness runs:

1. **Structural gates** (source inspection): oklch-only (no hex/hsl/rgb in new code),
   Montserrat font, explicit `type=` on every `<button>`, zero `useEffect`.
2. **Render gate** (live browser): `.claude/scripts/render-gate-browser.mjs` — exit 0
   PASS / 1 FAIL, prints the createElement count.
3. **Screenshots** (high-DPI, light + dark via the `html.dark` class + `colorScheme`):
   each verified **nonblank** by an in-browser pixel-sample assertion (64-point grid;
   uniform sample = blank = FAIL) and **dark != light** by PNG hash. These guards
   implement lesson `design-no-blackfish`: a blank or dark-not-wired screenshot fails
   the run instead of passing silently.

Output: `results/REPORT.md` with structural results, gate verdicts, screenshot checks,
and the rubric table pre-seeded with `SCORES: pending` per item plus a trailing
`USER VERDICT: (pending)`.

## Scoring (step 8 — run by the orchestrator)

The harness does **not** score. It emits a blind package at `results/scorer-input/`:
four screenshots renamed to `arm-A-*.png` / `arm-B-*.png`, the rubric, and
`scorer-prompt.md`. `MAPPING.json` is deliberately excluded.

To score, the orchestrator spawns a scorer subagent (e.g. `visual-verify` or a
`claude`/`Explore` reader) whose entire prompt is `scorer-input/scorer-prompt.md`,
pointed at the `scorer-input/` folder. Example:

```bash
cd /home/bora/deha-crm/pilot-sandbox/benchmark/results/scorer-input
# hand the scorer ONLY this folder; it reads the rubric + 4 screenshots, returns a
# 15-row 0-2 table + per-arm /30 totals, ending with `USER VERDICT: (pending)`.
```

Then:

1. Paste the scorer's per-item 0-2 scores into `results/REPORT.md`, replacing each
   `SCORES: pending` and the TOTAL row.
2. De-blind using `results/MAPPING.json` (which input won).
3. A human confirms the winner and replaces `USER VERDICT: (pending)` with the verdict.

The scorer must never see `MAPPING.json` and its prompt contains no arm identity, so
scoring stays blind.

## Validation (stand-in arms)

Before the real arms exist, the harness is validated end-to-end with two existing pilot
components:

```bash
cd /home/bora/deha-crm
node pilot-sandbox/benchmark/run-benchmark.mjs \
  pilot-sandbox/render-gate/fixtures/arm-a-clean.tsx \
  pilot-sandbox/ab-card/arm-b/DateTimePicker.tsx
```

These stand-ins are wheel date-pickers (not Task Cards) and use hex colors, so their
`oklch-only` structural gate reports FAIL by design — that exercises the harness's
failure reporting. What the validation proves: a complete `REPORT.md`, render-gate
verdicts, nonblank light+dark screenshots on disk for both arms, and a rubric table
ready for the scorer.
