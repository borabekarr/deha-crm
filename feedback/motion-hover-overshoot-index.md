# Coverage index: motion-hover-overshoot  (7 items)

Source file: `feedback/2026-08-23-motion-hover-overshoot.md` (denominator sealed 2026-08-23).
Split into two part-plans per Bora's scope call: all eight curves, two runs.

| F | Part plan | Status |
|---|---|---|
| F1 | overshoot-curve-retire-p1 | PENDING |
| F2 | overshoot-curve-retire-p1 | PENDING |
| F3 | overshoot-curve-retire-p1 | PENDING |
| F4 | overshoot-curve-retire-p1 | PENDING |
| F5 | overshoot-curve-retire-p2 | PENDING |
| F6 | overshoot-curve-retire-p2 | PENDING |
| F7 | overshoot-curve-retire-p2 | PENDING |

Part 2 is planned only after part 1 lands, so that the guard shipped in F4 is already running when
the remaining three curves are retired. Part 1 owns the guard deliberately: it is the mechanism that
prevents part 2's work from being re-introduced later.
