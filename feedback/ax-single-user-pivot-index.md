# Master index: ax-single-user-pivot part-plans

Feedback file: feedback/2026-08-31-ax-single-user-pivot.md (F1-F18)
Consolidated source: feedback/2026-08-31-web-review-passes.md (R1-R20 + C/H/M/L, R13 amended by Bora)

| Part | Plan file | Slice | Targets |
|---|---|---|---|
| p1 | plans/jeru-consolidated-p1.md | F3, F4, F9, F12, F13, F14 | plans/jeru/02-supabase-schema.md |
| p2 | plans/jeru-consolidated-p2.md | F2, F5, F6, F7, F8, F15 | plans/jeru/04, plans/ax-vision.md, plans/jeru/08 |
| p3 | plans/jeru-consolidated-p3.md | F10, F11, F16, F17, F18 | plans/jeru/01, 03, 05, 06, 07 |

Not covered by any part: F1 (dropped, stack kept as is).
Execution order: p1 → p2 → p3 (p2/p3 docs reference the schema doc p1 rewrites).
Implementation of consolidated phases 2-6 (dispatcher/UI/engine code) is deferred to the backend build; these parts are doc-only.
