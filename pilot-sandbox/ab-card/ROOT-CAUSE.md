# arm-b runaway render — root cause

**Subject:** `pilot-sandbox/ab-card/arm-b/DateTimePicker.tsx` (iOS-style date/time wheel
picker; verbatim copy at `pilot-sandbox/render-gate/fixtures/arm-b-original.tsx`).
**Symptom (2026-07-01):** in the dept-frontend A/B pilot's live-render QA gate,
`React.createElement` fired 375k+ times, the main thread pegged, and screenshot /
`evaluate` / CDP calls all timed out. arm-a rendered fine in the identical harness.
The pilot's `renderToString` (SSR) acceptance gate accepted it.

---

## 1. Outcome summary

Two results, both load-bearing:

1. **The ORIGINAL arm-b source did not reproduce the storm in any harness tested** —
   this replicates and extends step-3's finding. See §3 for the full suspect matrix
   (pilot-exact transpile + vendor React 18.3.1 + nocache HTTP server + real 3-iframe
   grid + narrow widths + device-scale-factor 1/1.25/1.33/1.5/2 + dark + wheel scroll
   + cross-wheel + scroll-during-entrance). Every configuration converges at
   ~467–961 `createElement` calls.

2. **The mechanism is identified, and a minimal fragment reproduces it deterministically
   in the Step-3 gate** (§4). The storm is a *self-re-arming settle loop*. arm-b avoids
   it by a single line; the environment can defeat that line. The fragment fails the
   gate; the one-line fix makes it pass (§5).

This is therefore a **partial reproduction**: the failure *class* is reproduced and
root-caused with falsifiable evidence; the exact environmental perturbation that tipped
the ORIGINAL over the edge on 2026-07-01 (real-hardware sub-pixel scroll-snap physics +
rAF starvation under 3 concurrent iframes) is characterised but was not reproducible in
headless Chromium, whose integer scroll geometry snaps cleanly. That non-reproduction is
itself the evidence for the mechanism (see §2, §6).

---

## 2. Mechanism

arm-b's wheel drives React state from a **callback-ref + rAF + scroll-settle-timer**
loop (no `useEffect`). The convergence of that loop rests on one invariant in
`commit()` (arm-b `DateTimePicker.tsx:183-186`):

```js
if (clamped !== state.lastIndex) {
  state.lastIndex = clamped;   // <-- reconcile FIRST
  onIndexChange(clamped);      // <-- then emit
}
```

Setting `state.lastIndex = clamped` **before** emitting is what stops a wheel from
re-snapping off its *own* committed value: after the parent feeds the value back as the
`index` prop, the render-phase guard (`DateTimePicker.tsx:62`,
`if (s.initialized && s.lastIndex !== index)`) sees `lastIndex === index` and schedules
**no** programmatic snap. The loop terminates.

The storm is what happens when that reconciliation is defeated, so every re-render keeps
`lastIndex !== index` and re-arms the loop:

```
commit() -> onIndexChange(raw) -> setState -> re-render
        -> (render-phase) lastIndex !== index -> requestAnimationFrame(snap)
        -> snap() writes scrollTop  -> scroll event -> onScroll -> settle timer
        -> commit() -> onIndexChange(raw) -> ...            (never quiesces)
```

The loop's *engine* is `programmaticSnap()` (`DateTimePicker.tsx:139-149`): it emits
**two** scroll events per call — the `scrollTop` write, then the
`scroll-snap-type: 'none' -> 'y mandatory'` restore, which makes the browser **re-snap**
and fire a second scroll. Two environmental facts turn those two events into two separate
commits that escape the `aligning` latch (the latch is cleared after only the first
settle, `DateTimePicker.tsx:179-182`):

- **(a) sub-pixel re-snap.** On real hardware the mandatory re-snap lands a fraction of a
  pixel off the row boundary and *rings* around the target, so `Math.round(scrollTop/ROW_H)`
  can read an adjacent index. Headless Chromium's integer geometry re-snaps exactly onto
  the boundary, so `round()` always returns the target — which is precisely why every
  headless harness converges.
- **(b) rAF starvation.** The restore is scheduled 1 rAF (~16 ms) after the write. Under
  the dept gate's 3 concurrent iframes / pegged main thread, that rAF slips **past** the
  120 ms settle window, so the re-snap scroll forms its own commit instead of folding
  into the first — and that second commit runs with `aligning` already cleared.

arm-b's specific exposure is its **Day wheel round-trip**: `index={safeDay - 1}` with
`onIndexChange={(i) => setDay(i + 1)}` (`DateTimePicker.tsx:243-249`) round-trips through
`safeDay = min(day, maxDay)` (`:215`). When `safeDay`'s clamp bites (or a sibling
month/year commit shifts `maxDay`), the value the parent feeds back is **not** the value
the wheel reconciled `lastIndex` to — the same `lastIndex !== index` re-arm as removing
the reconciliation outright.

**Why arm-a was immune:** arm-a is a clean wheel with no self-driving settle-to-state
loop (see `pilot-sandbox/render-gate/fixtures/arm-a-clean.tsx`); it mounts, paints, and
goes idle in a few hundred `createElement` calls with no rAF/scroll feedback into state.

---

## 3. Suspect matrix (all NON-reproducing on the ORIGINAL source)

Every row is a live browser run, not source inspection (lesson
`grep-verifies-structure-not-render`). `createElement` counts are the observed ceiling;
`stillClimbing` was 0 in every case.

| # | Suspect / config | Result |
|---|---|---|
| S1 | Step-3 gate, pilot vendor 18.3.1, classic runtime | PASS, 467 |
| S1 | Pilot-exact: `ts.transpileModule(jsx:React)` + `page()` HTML + vendor + **nocache HTTP server** + **real 3-iframe index.html grid**, DSF 2 | PASS, all 3 frames mount |
| S1 | submission3 (=arm-b) alone over server + **wheel scroll** | PASS, day 14->24, converged |
| S1 | narrow iframe width 340/347, DSF 1.25 / 1.33 / 1.5 / 2 + scroll | PASS, 933 |
| S1 | dark mode, DSF 2 | PASS, 467 |
| S1 | scroll **during** the `dt-pop` entrance animation (EARLY=30 ms) | PASS, 933 |
| S2 | **Automatic JSX runtime** (`jsx`/`jsxs`) | **Falsified as the pilot's path**, not run: `ab-card/build.mjs` compiles with `jsx: ts.JsxEmit.React` (**classic** `React.createElement`). The pilot never used the automatic runtime. It also cannot introduce a *new* render loop — the storm is `setState`-driven and independent of the element factory (jsx() and createElement() both mint one element per call, so the watchdog count is identical). |
| S3 | scroll-snap convergence: scroll, cross-wheel, fractional DSF | PASS (converges); §2(a) explains why headless can't ring |
| H1 | rAF/timer starvation via 3 simultaneous iframes | PASS (headless scheduler kept up) |
| H2 | sub-pixel via fractional deviceScaleFactor (1.25/1.33/1.5) | PASS (round() tolerant; snap re-corrects) |

Suspect + own-hypothesis budget (3 + 2) exhausted on the original source without a storm,
consistent with step-3 and with the distillation doc's own note that the original was
"environment-flaky … never root-caused."

---

## 4. Minimal reproduction fragment

Isolates the settle-loop's single fragile invariant: `commit()` fires `onIndexChange`
**without** reconciling `lastIndex` to the emitted value, so every re-render re-snaps and
the programmatic snap's own (delayed, off-boundary) scroll produces the next commit. The
two environmental facts of §2 are modeled deterministically (`RESTORE_MS > SETTLE_MS`
splits the events; the `+0.6*ROW_H` offset persists as the ring). No `useEffect`; React
global; no import/export — the pilot's no-bundler shape.

```tsx
const { useState, useRef } = React;

const ROW_H = 38;
const N = 400;           // long list: the re-arming loop climbs many indices
const SETTLE_MS = 15;    // arm-b uses 120ms; scaled
const RESTORE_MS = 45;   // re-snap slips PAST the settle window (rAF starvation)

function snap(s, idx) {
  const el = s.el;
  if (!el) return;
  el.scrollTop = idx * ROW_H;                    // scroll event 1 (folds into `aligning`)
  setTimeout(() => {
    // re-snap rings ~0.6 row past target and PERSISTS (real sub-pixel snap physics);
    // fires after the settle window, so it forms its own commit.
    el.scrollTop = idx * ROW_H + 0.6 * ROW_H;    // scroll event 2 (read as a user pick)
  }, RESTORE_MS);
}

function commit(s, cb) {
  const el = s.el;
  if (!el) return;
  const raw = Math.max(0, Math.min(N - 1, Math.round(el.scrollTop / ROW_H)));
  if (s.aligning) { s.aligning = false; return; }
  // BUG: emit WITHOUT reconciling lastIndex to what the parent feeds back.
  if (raw !== s.lastIndex) { cb(raw); }
}

function Wheel(props) {
  const { index, onIndexChange } = props;
  const s = useRef({ el: null, lastIndex: index, aligning: true, init: false, t: null }).current;

  if (s.init && s.lastIndex !== index) {
    s.aligning = true;
    const tgt = index;
    requestAnimationFrame(() => snap(s, tgt));
  }
  const ref = (el) => {
    if (!el || s.el === el) return;
    s.el = el;
    requestAnimationFrame(() => {
      snap(s, s.lastIndex);
      requestAnimationFrame(() => { s.aligning = false; s.init = true; });
    });
  };
  const onScroll = () => {
    if (s.t) clearTimeout(s.t);
    s.t = setTimeout(() => commit(s, onIndexChange), SETTLE_MS);
  };
  const rows = [];
  for (let i = 0; i < N; i++) rows.push(React.createElement('div', { key: i, style: { height: ROW_H } }, String(i)));
  return React.createElement('div', { ref, onScroll, style: { height: 3 * ROW_H, overflowY: 'scroll' } }, rows);
}

function Root() {
  const [sel, setSel] = useState(2);
  return React.createElement(Wheel, { index: sel, onIndexChange: setSel });
}

(window as any).DateTimePicker = Root;
```

**The fix is one line** — restore arm-b's reconciliation before emitting:

```diff
-  if (raw !== s.lastIndex) { cb(raw); }
+  if (raw !== s.lastIndex) { s.lastIndex = raw; cb(raw); }
```

With `s.lastIndex = raw` the re-render sees `lastIndex === index` and schedules no further
snap; the loop terminates. Flipping this single line flips the storm on and off — the
falsifiable evidence for the named mechanism.

---

## 5. Gate runs (exact commands + outputs)

Run from `/home/bora/deha-crm`. Fragments were written to the session scratchpad
(throwaway); recreate them from §4 to reproduce. `frag-bug.tsx` = §4 verbatim;
`frag-fixed.tsx` = §4 with the one-line diff applied.

```
$ node .claude/scripts/render-gate-browser.mjs <scratch>/frag-bug.tsx
FAIL(render-count) React.createElement exceeded threshold 10000 (runaway signaled at 10000 calls)

$ node .claude/scripts/render-gate-browser.mjs <scratch>/frag-fixed.tsx
PASS mounted clean, 805 createElement calls (threshold 10000), 1 root children, 0 page errors

$ node .claude/scripts/render-gate-browser.mjs pilot-sandbox/ab-card/arm-b/DateTimePicker.tsx
PASS mounted clean, 467 createElement calls (threshold 10000), 1 root children, 0 page errors
```

- Minimal fragment (bug) **FAILS** the Step-3 gate (runaway).
- Same fragment with the one-line fix **PASSES** (805, converges).
- ORIGINAL arm-b **PASSES** headless (467) — see §1/§3: the environmental ring is absent
  in headless Chromium, so arm-b's reconciliation is never defeated there.

---

## 6. Why SSR missed it

`renderToString` does one synchronous pass with **no** commit phase, callback refs, rAF,
`setTimeout`, scroll events, or client scheduler. arm-b's entire failure surface —
callback-ref mount, `programmaticSnap`, the scroll-settle timer, and the re-render feedback
— exists only on the client after mount. SSR renders the initial tree once and stops, so it
structurally cannot observe a post-mount settle loop. (Same root reason the step-3 note's
SSR-stream + `hydrateRoot` probe passed: hydration replays the same single tree; the loop
needs a *commit-driven* re-render the settle timer triggers.) This is the exact gap the
`render-gate-browser.mjs` browser-mount gate was built to close.

---

## 7. Generalizable never-break rule

**YES — a rule follows, and it is already enforceable by the existing gate.**

> **Rule.** A component that drives React state from a callback-ref + rAF/`setTimeout`
> settle or measurement loop (the no-`useEffect` DOM-wiring pattern) MUST reconcile its
> internal "last-committed" cursor to the exact value it emits **before** emitting, and
> MUST treat every programmatically-induced scroll/layout event as non-committal until the
> whole programmatic sequence (including any `scroll-snap-type` restore) has settled.
> Equivalently: **a component's own state emission must never be able to re-trigger the
> effect that produced it.** Convergence must not depend on the environment measuring
> integer/clean layout — assume sub-pixel ring and rAF starvation.
>
> **Rationale.** arm-b converged on the reconciliation of one line and on the settle
> commit never mis-reading a programmatic scroll. Both guarantees are environmental, not
> structural, so they held in headless/SSR and broke under real scroll-snap physics +
> main-thread load. A settle loop whose fixed point depends on the environment is a latent
> runaway.
>
> **Enforcement.** Source review cannot prove this (`grep-verifies-structure-not-render`);
> a live browser-mount + `createElement`-cap gate can. `render-gate-browser.mjs` is that
> gate and MUST be a required check for any no-bundler / no-`useEffect` component that
> wires the DOM via refs, rAF, or scroll — SSR/`renderToString` acceptance is insufficient
> and must not gate such components alone.

---

*Investigation: pilot harness replicated exactly (transpile config, vendor 18.3.1, nocache
server, 3-iframe grid) plus viewport / DSF / dark / scroll / timing sweeps; mechanism
distilled to a one-line-toggle minimal fragment verified against the Step-3 gate in both
directions. All probes were throwaway (session scratchpad); only this file was added to
the repo.*
