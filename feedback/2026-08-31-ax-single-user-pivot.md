# Feedback: AX single-user pivot + Grok schema/dispatcher review (2026-08-31)

Sources: Fable 5 ToS conversation (Q1-Q11) + Grok second-opinion review of AX plan files.
Targets: plans/ax-vision.md, plans/jeru/01-08.

## Interview verdicts (2026-08-31, sealed)

- F1: DROPPED. Keep the stack exactly as designed (multi-tenant tables stay; they sit unused). No schema removals.
- F2+F8 (merged): doc-only. Add "all users are Bora / single-user" notes in the relevant plan docs (incl. 08-feedback section B framing). Zero stack changes.
- F3: ACCEPTED. Sticky lanes, pre-defined account IDs, no rotation ever.
- F4: ACCEPTED. Both `composing` + `backpressure` into responses.status constraint.
- F5: ACCEPTED as two items: per-chat in-process lock AND new similarity-based answer-reuse cache (Redis) with light personalization.
- F6: ACCEPTED. Retry ×5 exponential backoff, idempotency on queries.id.
- F7: ACCEPTED (skip checksum). updated_at + state deadlines instead.
- F9-F16 (Grok review): routed through the evals workflow — plan steps declare Evals; items evaluated, not auto-applied.

## Round 2 verdicts (artifact comments + follow-up, 2026-08-31)

- F3 lanes: Option A — separate `llm_lanes` table. `max_parallel: 3` for now; subscription details filled with placeholder "smoke" values; real config deferred to backend build.
- F5 lock: keep both locks (global process lock + per-chat in-process lock); add one clarifying sentence in 04 about their relationship. No user decision needed.
- F17 (NEW): retry ×5 state must be reflected in the UI ("trying again, attempt N/5"), not silent.
- Verification: Claude owns it — post-edit contradiction grep (rotation leftovers, closed-decision violations, constraint mismatches) + re-read pass.
- F9-F16: full evaluation cycle via the evals workflow, confirmed.
- SEQUENCING: WAIT ENTIRELY. No plan file is written until Bora pastes the "ultimate feedback" review from Claude web (prompt already given). Then one combined /planning pass folds that feedback + these verdicts into the plan files.

## Items (original intake)

**F1 — Single-user pivot: remove multi-tenant machinery.** Delete/rewrite `llm_accounts`, `usage_ledger`, per-customer economics ($59 ceiling, capacity:10, max_customers, buy-another-account), account rotation on ban, multi-member chat scopes, per-customer rate limits from the plan docs. Optionally keep a single `usage_events` table for personal window tracking.

**F2 — Single-user framing note in dispatcher doc.** Add a note at the top of the dispatcher runtime plan: "single-user only; opening to others requires `runtime.mode: api`" so future sessions don't drift back toward multi-tenant.

**F3 — Sticky lane design replaces rotation.** New `llm_lanes` table (label, provider, config_dir, max_parallel, status active/throttled/paused, throttled_until) + `chats.lane_id` FK + assign-once trigger. Dispatcher spawns with per-lane `CLAUDE_CONFIG_DIR`; on rate limit: throttle lane + requeue, NEVER reroute to another lane. Section 13 cooling/route-to-next-account logic is removed.

**F4 — responses.status check constraint gains `composing` + `backpressure`.** Section 15 already mentions composing; both must land in the constraint so runtime and schema agree.

**F5 — Per-chat mutex.** In-process lock per chat_id (no Redis needed, single dispatcher), consistent with "wait for next window if run in progress."

**F6 — Retry ×5 with exponential backoff.** Keep idempotency on `queries.id` as-is.

**F7 — Checksum reconciler dropped/simplified.** Replace with `updated_at` + existing state deadlines (section 4a.7); never NULL-out an answer already shown to the user.

**F8 — Reopen section B of 08-feedback-2026-08-29.md.** Rewrite in corrected direction: single-user CLI use is compliant; `runtime.mode: api` is the path IF ever multi-user. "Terms topic closed" framing removed.

**F9 — CRM core companion schema.** Add contacts, companies, deals, activities, campaigns, metrics tables (needed by money points, DealCard, PipelineSummary, lead memory).

**F10 — sessions + session_memory tables.** Rolling summary + last N turns for long-conversation context management (per Vision doc).

**F11 — Experiments/initiatives table note.** Future table for ICE/RICE, MDE, Bayesian results, holdout; for now note it as planned, don't embed in approvals.action_payload.

**F12 — RLS helper functions.** Explicit policies/helpers on critical tables (approvals, memory, audit) instead of raw permissions-JSONB checks; single-owner simplification allowed under F1.

**F13 — Approvals index note.** Future index (account_id, status, risk_level).

**F14 — responses↔components FK ownership.** Clarify ownership direction (response created first, component linked after); document cascade behavior; remove circular-reference risk.

**F15 — MCP tools param validation.** jeru-crm-mcp tools must pass account_id + chat_id on every call and dispatcher validates them (isolation guard; still relevant single-user for lane/chat integrity).

**F16 — Opus worker latency + HTML reuse.** Surface latency expectations in the UI for component jobs; reuse previously generated HTML with minor personalization for token efficiency.
