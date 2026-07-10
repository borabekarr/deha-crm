# Design Benchmark REPORT

Generated: 2026-07-03T14:19:39.544Z

Two anonymous arms (**arm-A**, **arm-B**). Which input maps to which arm is held in
`results/MAPPING.json` (private — the scorer never reads it). De-blind this report
only after the rubric scores are filled in.

- Structural gates = source inspection (structure only).
- Render gate + screenshots = live headless-browser runs (lesson
  `grep-verifies-structure-not-render`: verdicts and pixels come from a real paint).

---

## Structural + gate results

### arm-A

**arm-A — structural gates**

| Gate | Verdict | Detail |
|------|---------|--------|
| oklch-only (no hex/hsl/rgb) | FAIL | hex=48 hsl=0 rgb=35 | oklch()=0 |
| Montserrat font | PASS | Montserrat referenced |
| explicit button type | PASS | 1 button(s), 0 missing type= |
| zero useEffect | PASS | useEffect occurrences=0 |

**arm-A — render gate:** `PASS` (exit 0) — PASS mounted clean, 467 createElement calls (threshold 10000), 1 root children, 0 page errors

**arm-A — screenshots (high-DPI 2x, light + dark)**

| Check | Result |
|-------|--------|
| light mount | ok |
| dark mount | ok |
| light nonblank (unique sample colors) | PASS (19/64) |
| dark nonblank (unique sample colors) | PASS (20/64) |
| dark differs from light (hash) | PASS |
| overall screenshot gate | PASS |
| light png | `/home/bora/deha-crm/pilot-sandbox/benchmark/results/arm-A/arm-A-light.png` |
| dark png | `/home/bora/deha-crm/pilot-sandbox/benchmark/results/arm-A/arm-A-dark.png` |

---

### arm-B

**arm-B — structural gates**

| Gate | Verdict | Detail |
|------|---------|--------|
| oklch-only (no hex/hsl/rgb) | FAIL | hex=26 hsl=0 rgb=16 | oklch()=0 |
| Montserrat font | PASS | Montserrat referenced |
| explicit button type | PASS | 1 button(s), 0 missing type= |
| zero useEffect | PASS | useEffect occurrences=0 |

**arm-B — render gate:** `PASS` (exit 0) — PASS mounted clean, 251 createElement calls (threshold 10000), 1 root children, 0 page errors

**arm-B — screenshots (high-DPI 2x, light + dark)**

| Check | Result |
|-------|--------|
| light mount | ok |
| dark mount | ok |
| light nonblank (unique sample colors) | PASS (4/64) |
| dark nonblank (unique sample colors) | PASS (4/64) |
| dark differs from light (hash) | PASS |
| overall screenshot gate | PASS |
| light png | `/home/bora/deha-crm/pilot-sandbox/benchmark/results/arm-B/arm-B-light.png` |
| dark png | `/home/bora/deha-crm/pilot-sandbox/benchmark/results/arm-B/arm-B-dark.png` |

---

## Rubric scores (blind — filled by scorer in step 8)

Scored 0-2 per item against `design-benchmark-rubric.md`. Left as `SCORES: pending`
until the blind scorer runs on the `scorer-input/` package.

| # | Item | arm-A | arm-B | Cited source |
|---|------|-------|-------|--------------|
| 1 | Spacing rhythm | SCORES: pending | SCORES: pending | DS §3 spacing grid L87-90 |
| 2 | Visual hierarchy | SCORES: pending | SCORES: pending | DS §2 typography L52-64 |
| 3 | Optical alignment | SCORES: pending | SCORES: pending | MIFB P2 L31-33 / L123 |
| 4 | Concentric border radii | SCORES: pending | SCORES: pending | MIFB P1 L27-29 + DS §12 L242-254 |
| 5 | Shadow quality | SCORES: pending | SCORES: pending | MIFB P3 L35-37 / L124 |
| 6 | Color discipline | SCORES: pending | SCORES: pending | DS §1 L17-48 + anti 4/16 |
| 7 | Numeric typography | SCORES: pending | SCORES: pending | MIFB P6 L47-49 + DS §2 L74 |
| 8 | Hit areas | SCORES: pending | SCORES: pending | DS §3 L92 + MIFB P13 L75-77 |
| 9 | Anti-slop: gradient restraint | SCORES: pending | SCORES: pending | DS anti 1-2 L122-123 |
| 10 | Anti-slop: shadow restraint | SCORES: pending | SCORES: pending | DS anti 3 L124 |
| 11 | Anti-slop: icon discipline | SCORES: pending | SCORES: pending | DS §8 L178 + anti 22 L143 |
| 12 | Anti-slop: no hollow placeholders | SCORES: pending | SCORES: pending | DS anti 5 L126 |
| 13 | Interactive states | SCORES: pending | SCORES: pending | DS anti 18 L139 + MIFB P9 L59-61 |
| 14 | Dark mode fidelity | SCORES: pending | SCORES: pending | DS §13 L259-274 |
| 15 | Text finishing | SCORES: pending | SCORES: pending | MIFB P5/P7 L43-53 |
| — | **TOTAL (/30)** | **pending** | **pending** | |

## Scorer package

`results/scorer-input/` holds the blind package handed to the scorer:

- `arm-A-light.png`, `arm-A-dark.png`, `arm-B-light.png`, `arm-B-dark.png`
- `design-benchmark-rubric.md`, `scorer-prompt.md`
- (MAPPING.json is deliberately excluded — the scorer is blind.)

---

USER VERDICT: (pending)
