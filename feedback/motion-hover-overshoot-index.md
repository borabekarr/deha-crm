# Coverage index: motion-hover-overshoot  (7 items)

Source file: `feedback/2026-08-23-motion-hover-overshoot.md` (denominator sealed 2026-08-23).
Split into two part-plans per Bora's scope call: all eight curves, two runs.

| F | Part plan | Status |
|---|---|---|
| F1 | overshoot-curve-retire-p1 | DONE 2026-08-23 |
| F2 | overshoot-curve-retire-p1 | DONE 2026-08-23 |
| F3 | overshoot-curve-retire-p1 | DONE 2026-08-23 |
| F4 | overshoot-curve-retire-p1 | DONE 2026-08-23 |
| F5 | overshoot-curve-retire-p2 | PENDING |
| F6 | overshoot-curve-retire-p2 | PENDING |
| F7 | overshoot-curve-retire-p2 | PENDING |

Note: the 2026-08-23 close of part 1 found 13 curves in `motion-tokens.css` above the 1.32
ceiling, not the 9 this intake counted. Part two (F5-F7) should re-check its scope against the
larger set before it starts.

Part 2 is planned only after part 1 lands, so that the guard shipped in F4 is already running when
the remaining three curves are retired. Part 1 owns the guard deliberately: it is the mechanism that
prevents part 2's work from being re-introduced later.
