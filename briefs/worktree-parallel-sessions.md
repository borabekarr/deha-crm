# Brief — Manual parallel-worktree workflow (discussion, 2026-08-06)

**Status:** brainstorm only. No plan, no implementation. Feeds a future `/planning` run.

## Bora's intent
- Worktrees are needed not only at execute time but during **chat and planning phases** too.
- **Manual trigger only** — Bora says "proceed with worktree" (later maybe a `/worktree` command); never auto.
- A session's changes park in the worktree until Bora initiates a merge; nothing reaches GitHub until then.
- Queue may accumulate **7–8 parked worktrees**.
- Unmentioned (normal) sessions keep saving where they save today; worktree sessions save to the parallel location.
- Final step: Bora-initiated merge, then a single GitHub commit/push.

## Agreed design (corrected/optimized)
1. **Commit ≠ push.** The "parallel save location" is the worktree's own branch with **local commits**. Rule: worktree sessions commit locally, never push; only the integration session pushes. No custom parking mechanism.
2. **Ledger, not scanning.** Maintain a small manifest (e.g. `briefs/worktrees-ledger.md` or JSON): branch, topic/plan, Touches globs, status (active/parked/merged). Pre-commit / pre-`/clear` cross-check = read this one file + `git worktree list`. Never diff 7 checkouts.
3. **Rolling merge queue.** Merge finished trees into a local `integration` branch one at a time (oldest-first), `test-lite.sh` after each merge, push once at the end. Avoid one big 8-way merge.
4. **Disjointness first.** Before parallelizing, run `parallel-scout` / eyeball Touches overlap. Same-file overlap → sequence instead, or accept a conflict-resolution pass in the integration session (resolver must know both plans' intent).
5. **Naming:** `git worktree add ../deha-crm-wt/<slug> -b wt/<slug>` (or the built-in EnterWorktree tool). Cleanup: `git worktree remove` after merge; branch deleted after push.

## Known costs / caveats
- Each worktree needs its own `node_modules` (pnpm shared store softens this) — disk + install time per tree.
- Vite previews per worktree: port collisions + orphan-reaper allowlist (see reap-stray-vite-probes.sh memory).
- Cap concurrent **running** sessions at ~2–3 even with 8 trees parked (RAM, spawn gate).
- Global `execution-result.json` clobber between concurrent `/execute` sessions is NOT fixed by worktrees (outside the checkout); per-plan `EXECUTION_MARKER_SUFFIX` mitigates, collision window remains.
- `/clear` safety: before clearing a worktree session, ensure its work is locally committed and the ledger row updated — the local commit is the durable state, the session isn't.

## Approved design additions (Bora, 2026-08-06)

### A. Change-only commits + deferred deletions
- Git commits already record only the delta; rule: worktree sessions `git add` only their own touched files (never `add -A`), commit locally, never push.
- **Never hard-delete inside a worktree.** Move the file to `archive/` (existing archive-first habit; git records a rename, history survives) AND append a row to a per-worktree `DELETIONS.md`: path, reason, date, requesting plan/step.
- At merge time the integration session runs `premerge-reference-sweep` across ALL worktrees + main (a file safe in worktree A may be referenced by worktree B). Only after the sweep passes does the integration commit delete for real. `DELETIONS.md` = human intent ledger; sweep = safety gate.

### B. Per-worktree session brief (`WORKTREE-BRIEF.md` at worktree root)
- `## Timeline` at top: one line per session/stop event with `YYYY-MM-DD HH:MM`.
- **One `## <file-path>` section per touched file**, created on first touch with `First: <timestamp>`. Later changes to the same file UPDATE the section in place: bump `Last: <timestamp>`, revise the 1-3 line net-effect summary. Never append repeated entries for the same file.
- Writers: executors append/update at step close (briefing-contract line). Safety net: a **Stop hook** — if `git rev-parse --git-common-dir` shows a linked worktree, diff since last brief update and reconcile missing sections. Hook detects gaps + blocks/reminds (mechanical part: file list, timestamps); prose summaries stay model-written. Token-efficient split.

### C. Sticky intent-triggered worktree mode (no slash command)
- A `worktree-mode` skill triggered by Bora saying "worktree"/"work tree"/"proceed with worktree" in a query. On activation: create worktree + branch `wt/<slug>` (`git worktree add ../deha-crm-wt/<slug> -b wt/<slug>`), ledger row, `WORKTREE-BRIEF.md` scaffold, and a **session marker file** ("this session = wt/<slug>").
- Stickiness: a UserPromptSubmit hook echoes `[WORKTREE] active: wt/<slug>` on every prompt while the marker exists, so all later queries (chat, planning, execution) stay worktree-scoped without repeating. `/clear` / `/exit` → marker cleaned via existing cleanup-hook path; next session starts normal.
- Ambiguity guard: merely *discussing* worktrees must not flip the mode — the skill asks one short confirmation question when intent is ambiguous, zero questions on explicit "proceed with worktree".

## Status
Design approved 2026-08-06; ready for `/planning worktree-workflow`. Deliverables of that plan: the `worktree-mode` skill, ledger format + writer, Stop hook (brief gap check), UserPromptSubmit marker echo, integration-session checklist (merge order oldest-first, test-lite gate per merge, single push, `git worktree remove` + branch cleanup).
