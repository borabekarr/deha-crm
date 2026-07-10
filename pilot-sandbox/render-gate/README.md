# Browser-mount render gate

A standalone acceptance gate that mounts a single no-bundler React component in a
real headless browser and returns **PASS / FAIL**. It exists because the
2026-07-01 dept-frontend A/B pilot accepted a component using React
`renderToString` (SSR), which passed a component that then triggered a runaway
client render: `React.createElement` fired 375k+ times, the browser main thread
pegged, and screenshot / CDP calls timed out. SSR does one synchronous pass with
no effects, timers, or client scheduler, so it cannot see that class of bug.

Lesson `grep-verifies-structure-not-render`: a passing grep / build / SSR is not
a render. A PASS here comes only from a real browser paint plus live
instrumentation, never from source inspection.

## Gate script

`../../.claude/scripts/render-gate-browser.mjs`
(canonical source mirrored at `.claude-ext/scripts/render-gate-browser.mjs`;
`.claude/scripts` is a symlink into the shared `claude-code-system` repo.)

## What it checks

The gate transpiles the component (TSX → `React.createElement`, no import/export,
React expected as a global), injects the vendored React 18.3 UMD bundles, wraps
`React.createElement` with a cumulative counter + hard cap, mounts the component
with `ReactDOM.createRoot`, waits a bounded settle window, then asserts:

1. **Painted, idle mount** — the root has children and the createElement count
   is no longer climbing when the settle window closes.
2. **Render-count under threshold** — cumulative `createElement` calls stayed
   below `RENDER_COUNT_THRESHOLD`.
3. **No uncaught page errors** — genuine `pageerror`s fail the gate (the gate's
   own watchdog-cap throw is excluded).

Any timeout is a **FAIL(timeout)**, never a skip. If the main thread pegs, the
counter's out-of-band console signal and/or the hard wall-clock timeout still
produce a deterministic FAIL instead of hanging.

## Thresholds (and why)

| Name | Default | Env override | Rationale |
|---|---|---|---|
| `RENDER_COUNT_THRESHOLD` | `10000` createElement calls | `RENDER_GATE_MAX_ELEMENTS` | A healthy card renders a few hundred (arm-a: 251). The pilot runaway hit 375k+. 10000 sits ~30x above a healthy component and ~37x below the observed runaway — wide margin both ways, so neither false-passes a storm nor false-fails a rich component. |
| `SETTLE_MS` | `2500` ms | `RENDER_GATE_SETTLE_MS` | Time after mount for entrance animation / scroll-settle timers to run before the idle assertion. |
| `HARD_TIMEOUT_MS` | `60000` ms | `RENDER_GATE_HARD_TIMEOUT_MS` | Wall-clock ceiling. On expiry the gate kills the browser and returns FAIL(timeout). Keeps a pegged main thread from hanging the gate; a full run stays well under 90s. A backstop timer at `HARD_TIMEOUT_MS + 2000` force-exits even if every awaited promise is wedged behind a pegged thread. |
| `RENDER_GATE_VENDOR` | `pilot-sandbox/render-gate/vendor` | (env) | Directory holding `react.js` + `react-dom.js` UMD bundles. |

## Exit codes / verdict line

Single line to stdout, machine-readable exit code:

- `PASS …` → exit **0** (mounted clean, render count below threshold, no errors)
- `FAIL(<detector>) …` → exit **1**, where `<detector>` is `render-count`,
  `timeout`, `no-paint`, or `page-error`
- `GATE-ERROR …` → exit **2** (could not run the check: missing dep, bad path,
  transpile failure, component never mounted)

## Invoke

Run from the repo root (`/home/bora/deha-crm`) so Playwright + TypeScript resolve
from `node_modules` and the default vendor path is found:

```bash
node .claude/scripts/render-gate-browser.mjs <path/to/Component.tsx>
```

Examples (the verified pilot fixtures):

```bash
# Clean component → PASS, exit 0, ~250 createElement calls
node .claude/scripts/render-gate-browser.mjs pilot-sandbox/render-gate/fixtures/arm-a-clean.tsx

# Runaway component → FAIL(render-count), exit 1, ~1.3s
node .claude/scripts/render-gate-browser.mjs pilot-sandbox/render-gate/fixtures/arm-b-runaway.tsx
```

## How a department quality gate invokes it

A department (e.g. `dept-frontend`) wires this as the render-safety step of its
acceptance gate, replacing any `renderToString`-only check. Because the verdict
is a one-line prefix plus an exit code, the caller branches on exit status:

```bash
# Inside a department's accept/reject gate, per candidate component:
if node "$REPO/.claude/scripts/render-gate-browser.mjs" "$COMPONENT"; then
  echo "render-gate: PASS — accept"
else
  status=$?   # 1 = FAIL (render defect), 2 = GATE-ERROR (could not evaluate)
  echo "render-gate: reject (exit $status)"
  exit "$status"
fi
```

Notes for gate authors:
- Treat exit `2` (GATE-ERROR) as a hard reject too — an unevaluable component is
  not an accepted component.
- Keep `RENDER_COUNT_THRESHOLD` in sync with the component family under test; a
  data-grid legitimately renders more elements than a card. Raise via
  `RENDER_GATE_MAX_ELEMENTS` deliberately, with a note, rather than silencing a
  real storm.
- The gate mounts one component per run and is fully bounded (<90s), so it is
  safe to fan out across candidates in a loop or in parallel jobs.

## Fixtures

| File | Role |
|---|---|
| `fixtures/arm-a-clean.tsx` | Verbatim copy of the pilot's arm-a (general-purpose) wheel picker. Mounts clean: ~251 createElement calls, PASS. |
| `fixtures/arm-b-runaway.tsx` | Deterministic reproduction of arm-b's runaway. FAIL. |
| `fixtures/arm-b-original.tsx` | Verbatim copy of the pilot's arm-b (dept-frontend) component, preserved for reference. |

### Why `arm-b-runaway.tsx` is a distillation, not the verbatim arm-b

The original arm-b (`arm-b-original.tsx`) drove React state from a
self-rescheduling `requestAnimationFrame` scroll-settle loop
(`containerRef → rAF → programmaticSnap → scroll → commit → onIndexChange →
setState → re-render → rAF → …`). In the department's original gate that loop
failed to converge and pegged the main thread. That specific storm depended on
sub-pixel scroll-snap physics in the dept gate's viewport and was **never
root-caused** (it is an open follow-up in the pilot doc); a plain headless mount
of the verbatim source settles at a few hundred createElement calls and does not
reproduce it reliably.

`arm-b-runaway.tsx` keeps arm-b's exact shape — no `useEffect`, callback-ref +
rAF wiring, mutable ref state, wheel columns — but makes the settle loop
unconditionally non-converging: every animation frame commits a new index and
re-arms the next frame, so `setState` fires forever and `createElement` climbs
without bound. Each `setState` lands in its own rAF turn (not a nested
render-phase update), so React's "too many re-renders" guard never fires and the
main thread pegs — the same failure mode as the production runaway, made
deterministic so the gate has a stable regression target. `arm-b-original.tsx`
is retained verbatim so the real component is not lost.

## Vendor bundles

`vendor/react.js` and `vendor/react-dom.js` are the React 18.3 UMD builds copied
from `pilot-sandbox/ab-card/vendor/`. They expose `React` / `ReactDOM` as browser
globals, matching the no-bundler harness the pilot components were written for.
