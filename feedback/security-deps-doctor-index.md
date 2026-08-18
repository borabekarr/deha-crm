# Coverage index: security-deps-doctor  (5 items)

Source feedback file: `feedback/2026-08-18-security-deps-doctor.md` (sealed 2026-08-18, denominator 5).

Split into two part-plans on 2026-08-18 after the user directed that every React Doctor finding be fixed, including the non-defect ones ("include all. even if they're not bugs"). That scope does not fit alongside the dependency and security work inside a single eight-step plan, so F1 was given its own part.

| F | Part plan | Status |
|---|---|---|
| F1 | security-deps-doctor-p2 | PENDING |
| F2 | security-deps-doctor-p1 | PENDING |
| F3 | security-deps-doctor-p1 | PENDING |
| F4 | security-deps-doctor-p1 | PENDING |
| F5 | security-deps-doctor-p1 | PENDING |

## Run order

Part 1 first, then part 2, each as its own separate `/execute` session.

Part 1 must land first because it bumps twenty package versions including react, vite and playwright. Running the React Doctor sweep before that bump would mean fixing findings against a dependency set that is about to change, and the newer react-doctor and eslint versions in the bump may themselves alter what gets reported.

Part 1 deliberately does not require React Doctor to be clean in its closeout step, because part 2 has not run at that point.
