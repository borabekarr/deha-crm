# Claude web "ultimate feedback" — review passes (received 2026-08-31)

Source: Bora's Claude web session using the reviewer prompt from this session. Passes received so far: ax-vision (pass 2), 01-design-briefs (pass 1), 03-component-protocol (pass 3), 05-session-memory (pass 4), 06-experiment-engine (pass 5), 07-competitor-intel (pass 6), 08-feedback resolution (pass 7), 09-ax-ux-optimization (pass 8).
PENDING: 02-supabase-schema.md, 04-dispatcher-runtime.md, then the consolidated re-ranked file. DO NOT plan/execute from this file alone — wait for the consolidation (sealed sequencing decision in 2026-08-31-ax-single-user-pivot.md).
Superseded/amended actions so far: 21, 30 (→44), 89 (→102), 29 (→110). Running total: 136 actions.

---

## PASS 2 — AX VISION (ax-vision.md)

Second piece done: ax-vision.md. Same format. The doc is labeled "reference, not an execute plan," but it is the source of Briefs 1–5 and of the runtime shape, so a coding agent will read it — several findings are about stale sentences that contradict your fixed context and will get implemented by accident.

### A. Water leaks
A10 · CRITICAL · Two dispatch triggers = double dispatch (§7 runtime: "Database Webhook / Realtime"; §9: "Realtime channel (or DB webhook)") Trigger: both wired during dev, nobody removes one. Every queries insert spawns two CLI runs on the same lane; with the per-chat lock the second waits, then runs the same prompt again after the first completes — a duplicate response row and double tool side-effects. Fix: one trigger (webhook, since Realtime drops during VPS reboot and webhooks retry), and a claim step regardless: update queries set status='claimed', worker_id=$w, claimed_at=now() where id=$1 and status='queued' returning * — zero rows means someone else has it. This also closes webhook at-least-once double-fire.
A11 · CRITICAL · Crash after tool writes, before response write → duplicated side effects on retry (§7 escape hatch; accepted retry×5 + state deadlines) Trigger: CLI run calls the MCP write path twice (creates two suggestion rows), dispatcher dies before writing responses; deadline expires; retry re-runs the whole prompt → four suggestion rows, two approvals for the same action. Fix: every MCP write carries idempotency_key = query_id || ':' || tool_call_index, unique index, upsert. Cheap, and it makes retries safe by construction.
A12 · CRITICAL · §9 still says "account rotation if a window closes" (§9 guard rails, bullet 6) Trigger: agent implements §9 verbatim. Directly contradicts accepted sticky lanes. Fix: strike the sentence; replace with "throttle: llm_lanes.status='throttled', throttled_until; queries wait on not_before."
A13 · HIGH · Session key conflict: customer_id vs chat (§9: "session/new or resume session keyed by customer_id"; §12: "session per chat") Trigger: one session shared across your chats → cross-chat context bleed and the per-chat lock protects nothing. Fix: session key = chat_id, stated once in §9 and §12; strike customer_id.
A14 · HIGH · Throttle consumes retries and deadlines (accepted throttle+wait, retry×5, state deadlines) Trigger: lane throttled for 3h; a query claimed just before. Deadline on claimed expires → counted as failure → retry 1..5 all fail on the same throttle → query dead after ~30s, surfaced as "failed" while the lane simply needed to wait. Fix: throttle is a wait state, not an error: on rate-limit result, set query back to queued with not_before = throttled_until, attempt unchanged; deadline clock runs only in running.
A15 · HIGH · Retry holding the per-chat lock blocks the chat for the backoff sum (accepted per-chat lock + retry×5) Trigger: attempt 3 backing off 8s, you send a new message; it sits with no explanation. Fix: cap backoff at 1/2/4/8/16s (31s total), lock held throughout (ordering matters more than latency), and while attempt > 1 the next queued query in that chat shows "queued behind a retry (attempt 3/5)". Nothing else changes.
A16 · HIGH · CLI death mid-answer appends duplicated partial text (§9 "stream session/update chunks -> responses row updates live") Trigger: attempt 1 wrote 400 tokens to responses.text, process dies, attempt 2 streams from the start. If the writer appends, the answer repeats itself. Fix: responses.text is overwritten per attempt, with responses.attempt and stream_seq columns; UI discards chunks whose (attempt, seq) is not monotonic. Also --resume is not guaranteed to replay a partial turn — treat every retry as a fresh turn from the same prompt.
A17 · HIGH · Realtime drop mid-stream leaves a frozen partial answer (§7 "UI renders via Realtime") Trigger: reconnect after 20s. Fix: on reconnect, refetch every responses row in composing|backpressure for open chats and re-subscribe. With A16's stream_seq this is one query.
A18 · MEDIUM · Redis similarity cache goes stale on memory edit / data refresh (accepted cache; §12 memory with provenance) Trigger: you Forget "prefers WhatsApp"; a cached answer that used it is served tomorrow with "Jeru learned: you prefer WhatsApp." Fix: cache entries record memory_ids_used[] and data_version (per-connector monotonic counter bumped on sync); invalidate on memory write for those ids; bypass when data_version changed; never cache Analyze mode or any response with component/approval output (carries A7).
A19 · MEDIUM · Nightly Daily Brief cron vs throttled lane (§7 "Nightly cron -> Daily Brief per user, cached") Trigger: cron fires 03:00 on a lane throttled until 05:00; brief never generates; morning shows yesterday's. Fix: brief is an ordinary query with channel='cron' on a dedicated lane (llm_lanes.label='brief' or the least-loaded lane at insert time — the initial assignment, not a reroute), daily_briefs unique on (date), upsert. Stale brief shows "Brief from [date] · regenerate."
A20 · MEDIUM · Telegram/WhatsApp approvals bypass the approve transition (§12 open item) Trigger: you approve from a Telegram button and from the web within seconds. Fix: resolve the open item as yes — queries.channel — and route every channel's approve through the same where status='pending' transition (A2). Delivery adapter keyed on chats.channel.
A21 · LOW · Compaction at 60% inside a CLI session doubles context (§12 session memory) Trigger: dispatcher sends the rolling summary and resumes the Grok session that already contains those turns. Fix: resume → send only the new turn; fresh session (after reset or process death) → send summary + last N. One boolean decides.
Merge-window edge cases: not in this doc — waiting for jeru/04-dispatcher-runtime.md.

### B. Weak points
B8 · HIGH · "Router model (cheap)" has no implementation under the subscription runtime (§7 runtime; §9 "intent-based routing") Weak because there is no cheap API model in a CLI-only stack; a second CLI call per query doubles lane usage. Strengthened: no router. Route = (mode, product_scope) from the UI; Auto = Ask. The main session decides component vs plain by emitting a tag; component_jobs are created only when a tag appears. One CLI call per query.
B9 · HIGH · Opus worker is single-job and unbounded (§9 "Opus 5 worker builds HTML") Weak because one slow HTML build blocks every other component and there is no deadline. Strengthened: component_jobs(status queued|running|done|failed, attempt, deadline_at, lane_id) on its own Claude lane; max_parallel=2; deadline 120s; on failure the response renders the pre-built fallback card (Brief 2 error state) and Approve stays enabled (action 15 from pass 1).
B10 · HIGH · "Every agent write is a suggestion row until Approve" has no autonomy-dial exception path (§7 escape hatch; §12 autonomy dial) Weak because the two sentences contradict: either everything is gated or the dial can auto-run. Strengthened: action_types(type, autonomy in ('propose','auto_low','auto_all'), stakes_tier); propose → approval row; auto_low → executes if stakes_tier=0, else approval row; auto_all → executes and writes audit only. Dial promotion is itself a proposal (§12 "proposes raising autonomy, user approves").
B11 · MEDIUM · Trust-ladder metrics are specified as goals, not columns (§F28, §4 gates) Strengthened: no events table — a view: approvals.edited_before_approve boolean, approved_at, rejected_at, audit_log.reversed_at. v_trust_ladder = per action_type, last 30 days: accept rate, edit rate, undo rate. Autonomy promotion rule: accept ≥ 0.8, edit ≤ 0.2, undo ≤ 0.05, n ≥ 10.
B12 · MEDIUM · Backpressure copy "~1 min" is invented (§9 guard rails) Strengthened: backpressure status carries queue_position and lane_label; UI shows "Queued, 2 ahead on this lane." No time estimate.
B13 · MEDIUM · §12 session memory: sessions vs session_memory split is ambiguous (§12) Strengthened: one row per chat in session_memory(chat_id pk, summary text, last_turns jsonb, token_estimate int, compacted_at, provider_session_id text nullable). provider_session_id is the Grok/Claude session handle treated as cache (§12 already says so) — null means "start fresh, send summary."
B14 · LOW · Doc drift: §7–§10 economics and pool sizing contradict the fixed context (§7 price/ceiling, §8, §9 pool, §11 "Pool sizing: 10 users") Strengthened: add a two-line header to §7–§10: "Single operator since 2026-08-30. Pricing, pool sizing, per-customer limits, account rotation are historical; runtime per fixed context." Tables stay, text stops misleading the agent.

### C. Grok's review — verdicts
1. Generative vs pre-built dichotomy → ALREADY COVERED (pass 1, B3 / action 7; §7 "generative HTML… open in a side panel" already said this). Adopt Grok's exact phrasing as the header rule.
2. Narrow v1 to Daily Brief → money actions → approve → results → PARTIAL. Matches §5 months 1–3 and §11 MVP order 1–2. Modification: drop "While You Were Away" from the v1 list — it is a §1.B6 realtor-era card that §7 folded into the Daily Brief; shipping both duplicates the "what happened" job. v1 = Daily Brief + approvals + audit + basic memory (Memory tab).
3. Measure the trust ladder from day one → CORRECT, implemented as B11 (a view, not a new table).
Ten schema items: still pending 02-supabase-schema.md. One preview I can settle now from §12 "Opus receives JSON from the dispatcher, never reads Supabase": the responses↔components circular FK resolves as components.response_id only; responses carries no FK to components — the UI queries components where response_id=$1.

### D. Better ways
D4 · HIGH · Daily Brief as a normal query, not a separate cron path (§7, §9 "Nightly: dispatcher runs Daily Brief… batched, cached") Current: dedicated brief code path in the dispatcher. Proposed: cron inserts a queries row (channel='cron', chat = a pinned "Brief" chat, prompt = brief skill). Wins: one pipeline, brief gets retry/lock/lane/audit for free, A19 solved. Costs: one system chat visible in the list (hide with chats.kind='system').
D5 · HIGH · Drop the router model entirely — see B8. Wins: half the CLI calls. Costs: slightly longer main system prompt.
D6 · MEDIUM · Trust telemetry as a view over existing tables — see B11. Wins: zero write paths. Costs: none.
D7 · LOW · Merge tasks and approvals under one actions table (§10 tables; pass 1 D1) Current: tasks, approvals, audit_log as three tables. Proposed: actions(kind task|approval, status, stakes_tier, …) + audit_log for executed history. Wins: one row component, one transition, the trust view reads one table. Costs: a migration if 02-supabase-schema.md already has FKs into tasks — decide when that piece arrives; if the FK fan-out is large, keep separate.

### Action list (23–43)
23. Strike "account rotation if a window closes" from §9; replace with throttle wording (A12).
24. Add the "single operator / historical" header to §7–§10 (B14).
25. Pick webhook as the sole trigger; delete Realtime-as-trigger; add the claimed transition with worker_id (A10).
26. Session key = chat_id everywhere; strike customer_id in §9 (A13).
27. MCP write path: idempotency_key = query_id:tool_call_index, unique index, upsert (A11).
28. Query states: queued(not_before) → claimed → running(deadline_at) → done|failed|cancelled; throttle returns to queued without incrementing attempt (A14).
29. Retry backoff 1/2/4/8/16s, lock held; next-in-chat shows "queued behind a retry (n/5)" (A15). [amended by 110]
30. responses: add attempt, stream_seq; overwrite text per attempt; UI monotonic check (A16). [superseded by 44]
31. UI reconnect: refetch composing|backpressure rows and resubscribe (A17).
32. Redis entries store memory_ids_used[] + data_version; invalidate on memory write; bypass on data change, Analyze mode, component/approval outputs (A18).
33. Daily Brief = cron-inserted query on a chats.kind='system' chat; daily_briefs unique on date (A19, D4).
34. queries.channel column; all channels approve via the same where status='pending' transition (A20).
35. Session resume sends only the new turn; fresh session sends summary + last N (A21).
36. Remove the router model; route by (mode, product_scope); tags create component_jobs (B8, D5).
37. component_jobs state machine + own lane, max_parallel=2, 120s deadline, fallback card on failure (B9).
38. action_types table with autonomy + stakes_tier; promotion is itself a proposal (B10).
39. v_trust_ladder view + promotion thresholds (B11, D6).
40. Backpressure payload = queue_position + lane_label; drop time estimates (B12).
41. session_memory single-row-per-chat DDL with provider_session_id (B13).
42. Drop "While You Were Away" from v1 scope (C2).
43. Decide actions merge when 02-supabase-schema.md arrives (D7).

---

## PASS 1 — 01-DESIGN-BRIEFS

### A. Water leaks
A1 · CRITICAL · Undo on the Daily Brief has no reversibility contract (Brief 1, Daily Brief card; Brief 4, Audit Log) Trigger: brief says "Jeru sent 3 follow-ups… Undo any of these." You tap undo on a sent WhatsApp. What breaks: a sent message cannot be unsent; the UI promises something the backend can't do, and the audit row now shows "undone" for an action that happened. Data: audit log lies. Fix: undo icon renders only when audit_log.reversible = true and reversed_at is null; irreversible rows show "Sent · can't undo" with a "Send correction" action instead. Same rule on Brief 4's timeline.
A2 · CRITICAL · Approve from brief + approve from Approvals tab double-fire (Brief 1, money actions; Brief 4, Approvals tab) Trigger: brief open on desktop, Approvals tab open on phone; you approve the Kadikoy +8% on both within seconds. What breaks: two executions, +16% budget. Fix: Approve is a status transition pending → approved guarded by where status='pending'; second caller gets 0 rows and the row re-renders as "Already approved from [device]". Execution keyed on approval_id idempotently. [verify against jeru schema: approvals status check]
A3 · HIGH · Streaming partial component cards vs error row (Brief 1, States: Streaming + Error) Trigger: PipelineSummary starts fading in, its component_job fails at 60%. What breaks: brief specifies "partial cards fade in" and "error row in place of failed card" but nothing says what happens to the half-rendered card — you get a ghost card plus an error row. Fix: partial render is skeleton-only until component_job.status='done'; error replaces the skeleton, never a partial.
A4 · HIGH · Realtime disconnect on Audit Log animates stale rows (Brief 4, Streaming) Trigger: VPS reboots; Realtime drops 40s; reconnects. What breaks: "new rows animate in at the top" — on reconnect you get a burst of 20 rows animating, and rows executed during the gap may arrive out of order. Fix: on reconnect, refetch where executed_at > last_seen, insert sorted, single "N new actions" chip instead of per-row animation.
A5 · HIGH · Mode switch mid-stream has no cancel semantics (Brief 5, States: Streaming) Trigger: you confirm "Switching to Build will pause this." What breaks: the CLI child process is already running under the per-chat lock; "pause" doesn't exist for claude -p. Either the process keeps running (wasting the lane slot, answer lands in Ask mode later) or it's killed (retry×5 may respawn it). Fix: rename to "cancel this response"; on confirm, mark the query cancelled before killing the child so the retry loop sees a terminal state. [verify jeru retry spec]
A6 · MEDIUM · Undo for "learned" facts isn't Forget (Brief 1, What Jeru learned; Brief 4, Memory) Trigger: you tap Forget on "prefers WhatsApp" while a ranked action built on it is still pending. What breaks: the action's stated rationale now references a deleted fact; confidence chip is stale. Fix: Forget on a fact re-scores any pending approvals that cite it (approvals.source_memory_ids) and shows "rationale changed" on the row.
A7 · MEDIUM · Similarity cache vs Daily Brief personalization (Brief 1; accepted Redis cache) Trigger: "Good morning, Ahmet" copy example — but the cache serves a "light personalization" answer for a near-duplicate query from a different chat. In single-operator use this is fine for Q&A, but any cached answer that contains a money action would replay yesterday's recommendation. Fix: never cache responses that produced approval rows or component cards; cache only plain-text answers.
A8 · MEDIUM · Onboarding OAuth spinner with no timeout (Brief 3, Loading) Trigger: Meta OAuth popup closed by you. What breaks: card spins forever; "Skip for now" is a link but the card is mid-auth. Fix: 60s timeout → error state on that card; skip always enabled regardless of card state.
A9 · LOW · Empty-state shell height (Brief 5, Empty) "Nothing scheduled" placeholder keeps height, good — but Brief 1's empty state swaps the Daily Brief for a "Connect your data" card of a different height, violating the stable-frame rule the same doc asserts. Fix: pin the brief card's min-height across both states.

### B. Weak points
B1 · HIGH · Approval ranking rule is undefined (Brief 4, Approvals: "oldest or highest-stakes first per the ranking rule") Weak because "or" means the queue order is unspecified, and "clear them in order" presumes it. Strengthened: order by stakes_tier desc, created_at asc where stakes_tier = 2 (spend/outbound/price), 1 (CRM write), 0 (read-only/draft). Bulk approve applies to tier 0 only; tiers 1–2 confirm individually.
B2 · HIGH · Confidence chip has no scale (Brief 1 & 2, Confidence Cues) Weak because "confidence: high" without a definition becomes decoration. Strengthened: three values mapped to data sufficiency, not model vibe — high = ≥14 days of source data and ≥1 prior similar action outcome; medium = data present, no precedent; low = smoke data or <7 days. Chip tooltip shows which threshold was hit.
B3 · HIGH · Pre-built vs generated component naming collision (Brief 1 component list vs Brief 2 component list) Weak because MetricCard, DealCard, PipelineSummary appear in both, and Claude Design will build one thing. Strengthened: rename generated variants with a Gen prefix (GenMetricCard, GenFunnelChart) and state the rule in every brief header: right pane = generated HTML in iframe; all other surfaces = pre-built React.
B4 · MEDIUM · Skill version chip without a source (Brief 2, Thinking tab: "lead-scoring v0.4") Weak because nothing defines where the version comes from. Strengthened: thinking_steps.skill_name + skill_version populated from the skill's frontmatter at spawn time; chip links to the skill file in Customize › Skills.
B5 · MEDIUM · Anomaly banner has no severity or dismiss (Brief 1, Daily Brief) Strengthened: anomalies.severity in ('info','warn','critical'); only critical renders as a banner, others as a row in "Needs attention"; banner has Snooze 24h / Dismiss, dismissal written to anomalies.acknowledged_at.
B6 · MEDIUM · Interview "pushback tone" trigger undefined (Brief 3, AX rules) Strengthened: Jeru asks a sharper follow-up when the answer is (a) <3 words, (b) contains "everything/all/more", or (c) contradicts a prior answer; max one follow-up per question, then accept and flag the field as low_confidence on the recap card.
B7 · LOW · Mobile brief card stack loses the message box (Brief 1, Mobile) Swipeable sections + pinned input is fine, but the money-actions section has three buttons per row; on a swipe deck a horizontal swipe conflicts with any horizontal button reveal. Strengthened: vertical scroll within the card, section tabs as a pill row at the card top, no horizontal swipe.

### C. Grok's review — verdicts (UI points only)
1. Daily Brief density → PARTIAL. Keep metrics + Needs Attention above the fold; collapse "did/learned" as a second section on the same card. Do not move "learned" to the right panel (violates Brief 1's memory-in-motion rule).
2. All-chats overlap → CORRECT. Left pane only; delete the "secondary tab beside the Daily Brief" sentence in Brief 1.
3. Mode switcher/model selector → ALREADY COVERED for hover (Brief 5, top pane copy "Auto — routed to Sonnet"). PARTIAL on desktop crowding: add collapse order search → project selector; mode switcher never collapses.
4. Generative vs pre-built → CORRECT, implemented via B3.

### D. Better ways
D1 · HIGH · Approvals tab as a filtered view of the audit log, not a second surface (Brief 4, tabs 1–2) Current: separate ApprovalList and ActivityTimeline components with separate row shapes. Proposed: one actions timeline with status in (pending, approved, executed, failed, reversed); "Approvals" is status=pending, "Audit Log" is the rest. Wins: one row component, A2's idempotent transition falls out naturally, undo/reversibility lives in one place. Costs: pending rows need the approve buttons variant of the same row — one conditional.
D2 · MEDIUM · Right panel Files tab → link out to the artifact in chat (Brief 2, Files tab) Current: a third rendering surface for markdown. Proposed: drop the tab; research.md-style artifacts render as a file card in the message bubble with open/download. Wins: one fewer tab to keep stable-frame across mobile modal, fewer states. Costs: none real for a single operator.
D3 · LOW · Onboarding step-list wizard → single scrollable connector page (Brief 3, Connect wizard) Current: 4-step wizard with left step list and per-step skip. Proposed: one page, four grouped sections, one "Done for now" button. Wins: no wizard state machine, mobile collapses trivially. Costs: loses the sense of progress — acceptable since you're the only user and will reconnect from Customize anyway.

### Action list (1–22)
1. Brief 1: delete "secondary tab beside the Daily Brief"; all-chats lives in left pane only.
2. Brief 1: restructure Daily Brief into (a) metrics row, (b) Needs Attention, (c) collapsed Did/Learned section.
3. Brief 1/4: undo icon gated on audit_log.reversible && reversed_at is null; irreversible rows show "Send correction".
4. Approvals: update … set status='approved' where id=$1 and status='pending'; execution idempotent on approval_id.
5. Approvals ordering: stakes_tier desc, created_at asc; bulk approve only tier 0.
6. Define confidence chip thresholds (B2) in ax-vision and reference from Briefs 1, 2, 4.
7. Rename generated components Gen*; add the pre-built/generated rule line to every brief header.
8. Brief 1 Streaming: skeleton until component_job.status='done'; error replaces skeleton, never partial.
9. Brief 4 Realtime reconnect: refetch since last_seen, sorted insert, "N new actions" chip.
10. Brief 5: rename mid-stream "pause" to "cancel"; write queries.status='cancelled' before killing the child.
11. Redis cache: exclude any response that produced approvals or component cards.
12. Memory Forget: re-score pending approvals citing the fact; show "rationale changed".
13. Brief 3: OAuth 60s timeout → error state; skip enabled in all card states.
14. Brief 3: pushback trigger rules (B6), max one follow-up, low_confidence flag on recap.
15. Brief 2: on canvas render error, enable Approve/Skip with text-summary basis; gate only "Generate pack".
16. Brief 2: drop Files tab; artifacts render as file cards in the message bubble.
17. Brief 4: merge ApprovalList + ActivityTimeline into one actions row component with status filter.
18. Brief 5: desktop collapse order (search → project selector), mode switcher fixed.
19. Brief 1 mobile: vertical scroll + pill section tabs instead of swipe deck.
20. Anomalies: add severity and acknowledged_at; banner only for critical.
21. Thinking steps: populate skill_name/skill_version from skill frontmatter at spawn. [superseded]
22. Brief 1 empty state: pin Daily Brief card min-height.

---

## PASS 3 — COMPONENT PROTOCOL (03-component-protocol.md)

### A. Water leaks
A22 · CRITICAL · Event IDs collide across retry attempts (§a "client replaces in place" + accepted retry×5) Trigger: attempt 1 emits tc_1..tc_9, ts_1(running), CLI dies; attempt 2 emits tc_1.. again. Client ID-merge (which Grok correctly wants) now overwrites attempt-1 chunks with attempt-2 chunks one by one — the message visibly rewrites itself mid-read, and if attempt 2 emits fewer chunks, attempt-1 leftovers remain interleaved. Fix: every event carries attempt; the client keeps only events from the highest attempt seen for that response and drops the rest on first sight of a new attempt. (Supersedes pass-2 action 30, see D8.)
A23 · CRITICAL · Approval execution has no claim and no separate execution state (§e steps 2–4, 7) Trigger: webhook double-fires on the approved update, or you tap Approve twice. Two executions of action_payload (two published campaigns). Also: "Approve all" marks a row approved, downstream publish fails — the row still says approved forever. Fix: approvals.status: pending|approved|rejected|superseded|expired and approvals.execution: null|queued|running|done|failed|reversed; dispatcher claims with update approvals set execution='running', executor_id=$w where id=$1 and status='approved' and execution='queued' returning *; failed execution shows "Approved · execution failed · Retry" on the same row.
A24 · HIGH · Execution confirmation streams into a closed turn (§e step 4 "streams a confirmation text_chunk… back into the thread") Trigger: approval executes 40 minutes later while a new query in that chat is composing under the per-chat lock. The confirmation either appends to a finished response (breaks seq) or races the live stream. Fix: execution results never touch responses; they insert a messages row role='system_event' linked to approval_id, rendered as a compact TaskCard. No lock needed — it's not a turn.
A25 · HIGH · expires_at: null executes stale payloads (§a checkpoint; §e step 3 "executes exactly what was shown") Trigger: "raise Kadikoy budget 8%" proposed Monday, approved Friday after the campaign already changed. Fix: default expires_at = created_at + 72h → status='expired', row shows "Expired — ask Jeru to re-propose"; action_payload snapshots data_version; if changed at execution time and stakes='high', dispatcher sets execution='failed', reason='stale' and re-proposes instead of executing.
A26 · HIGH · confirm checkpoint has no return path (§a "confirm… no row in approvals") Trigger: Jeru asks "keep going?", the CLI one-shot turn has ended, lock released. Where does the yes go? Fix: the answer is a new queries row with reply_to_event_id (the checkpoint id) and prompt='confirm:yes'; dispatcher resumes the chat's session with that as the user turn. choice works the same with the option id.
A27 · HIGH · Client-side generative retry reuses job_id against dispatcher attempt tracking (§c "re-fires the same job_id") Trigger: client re-fires while the dispatcher's own trimmed-payload retry (§d) is still running → two Opus builds, last-writer-wins on components.html. Fix: manual retry is a guarded update: update component_jobs set status='queued', attempt=attempt+1 where id=$1 and status in ('failed','timeout'); zero rows = already retrying, button shows spinner.
A28 · MEDIUM · Two retry policies for component jobs (§d "retries once with trimmed payload"; accepted retry×5) Trigger: agent applies ×5 to component jobs → five Opus builds for one failing chart, each up to the deadline. Fix: state it: retry×5 with backoff applies to queries only; component_jobs get max 2 attempts (second trimmed), then terminal.
A29 · MEDIUM · Sandboxed iframe origin is null, so an origin check silently rejects everything (§d bridge; Grok's origin recommendation) Trigger: implement if (event.origin !== window.origin) return — every legitimate message is dropped. Fix: verify event.source === iframeRef.current.contentWindow and the fixed type field; origin will be the string "null" by design.
A30 · MEDIUM · allowApproveAll defaults true (§b ApprovalList) Trigger: model emits an ApprovalList mixing a spend action with two drafts; one tap approves the spend. Conflicts with the tier rule (pass 1, B1). Fix: .default(false); dispatcher sets true only when every item is stakes='low'.
A31 · LOW · error.retry_hint copy contradicts auto-retry (§a error) "Ask Jeru to try again in a minute" appears after the system has already retried 5×. Fix: recoverable:true → UI shows a Retry button (guarded requeue); copy "Jeru tried 5 times. Retry now?"

### B. Weak points
B15 · HIGH · Envelope storage is "responses table (or streamed over Realtime)" (§a intro) Weak because "or" leaves the write model undefined, and an NDJSON blob in one column means read-modify-write on every chunk — the exact crash-mid-write hazard. Strengthened: see D8 (events table).
B16 · HIGH · Build timeout 20s vs Claude Code headless cold start (§d size limits; pass-2 B9 said 120s) Weak because claude -p with a system prompt and tools routinely takes 5–15s before the first token; 20s fails healthy builds. Resolve the conflict: deadline = 90s hard, soft = 45s after which the placeholder copy changes to "Still building…". 120s dropped.
B17 · MEDIUM · stakes low/medium/high vs tier 0/1/2 (§a checkpoint, §b ApprovalList, pass-1 B1) Strengthened: one enum, stakes: low|medium|high, mapped at creation from action_types.stakes_tier (0/1/2). Tier is storage, stakes is display; never two sources.
B18 · MEDIUM · ThinkingSteps is both an event type and a component tag (§a thinking_step, §b ThinkingSteps) Weak because two render paths for the same data will diverge. Strengthened: drop the tag from the catalog; the panel derives from thinking_step events. Keep SkillBadge.
B19 · MEDIUM · sourceChip/confidence optional on the surfaces where they carry the AX rule (§b, principle 19) Strengthened at schema level, not prompt level: MetricCard.confidence and MetricCard.sourceChip required; BriefCard .refine(s => s.section !== 'money_actions' || (s.confidence && s.expectedValue)). Invalid → InvalidComponentFallback, which is the right pressure on the model.
B20 · LOW · Component cache TTL "shorter for anything with live metrics" is undefined (§d caching) Strengthened: TTL = 24h if data.period ≥ 7d, 1h if intraday, and the key already includes data, so a refreshed slice misses naturally. Redis similarity cache never touches component HTML (pass-2 action 32 already excludes component outputs).
B21 · LOW · ActivityTimeline.kind is realtor-era (§b) Add email, ad_change, budget_change, approval, undo; keep the old values.

### C. Grok's review — verdicts
1. ID-based merge → CORRECT, with A22's modification: merge key is (attempt, id), highest seq wins, new attempt discards prior events.
2. Who owns timeout/retry → PARTIAL. Dispatcher owns deadline_at and the one trimmed retry; client owns only the manual post-terminal retry via the guarded update in A27.
3. Visual distinction for checkpoint kinds → CORRECT (LOW). approval = card with amber left border + stakes chip; confirm = inline two-button row inside the bubble; choice = chip group, no primary styling.
4. Security additions → PARTIAL. srcdoc: correct — use srcdoc with the CSP as a <meta http-equiv> inside the document, never a URL. Asset CDN allowlist: correct. Origin check: wrong as stated (A29) — check event.source.
5. This file as single source of truth → CORRECT, plus: SCHEMA_BY_TAG and the model-facing catalog in the system prompt are both generated from the Zod exports (zod-to-json-schema), so drift is impossible rather than discouraged.
6. Make sourceChip/confidence "highly expected" in the prompt → PARTIAL: enforce in the schema (B19); prompt guidance alone is what gets ignored.

### D. Better ways
D8 · CRITICAL · response_events rows instead of an NDJSON blob (§a intro; pass-2 A16/A17, action 30) Current: events appended into responses (blob) and pushed via Realtime; retry overwrites text. Proposed: response_events(id bigserial, response_id, attempt smallint, seq int, event_id text, type text, payload jsonb, unique(response_id, attempt, seq)); dispatcher inserts one row per event; Realtime on inserts; reconnect refetch is where response_id=$1 and seq > $last; responses keeps only status, attempt, final_text (denormalized on done for search and the Redis cache). Wins: append-only = no crash-mid-write, exact replay, free reconnect, attempt isolation. Costs: one table, ~20 rows per turn; a nightly job can compact old turns' events into final_text only. This replaces pass-2 action 30.
D9 · HIGH · Approval execution as a dedicated executor loop, not a webhook consumer (§e step 3) Current: approved update → webhook → dispatcher executes. Proposed: dispatcher polls approvals where status='approved' and execution='queued' every 2s (single operator, trivial load) using the A23 claim. Wins: no webhook double-fire class at all on the execution side, works through VPS reboots without replay logic, no second trigger to keep in sync with the queries webhook. Costs: ≤2s execution latency, invisible for "within the hour" copy.
D10 · LOW · Drop ThinkingSteps tag — B18. Wins one code path. Costs nothing.

### Action list (44–59; 30 superseded)
44. Create response_events per D8; responses keeps status, attempt, final_text; delete action 30.
45. Client: keep only highest-attempt events per response; merge on (attempt, event_id), highest seq wins.
46. approvals: add execution enum, executor_id, expires_at default +72h, superseded_by; status gains superseded|expired.
47. Executor loop with where status='approved' and execution='queued' claim (A23, D9); remove the approve webhook.
48. Execution results → messages(role='system_event', approval_id), never responses (A24).
49. action_payload snapshots data_version; stale high-stakes payload → re-propose (A25).
50. confirm/choice answers → new queries row with reply_to_event_id (A26).
51. Generative manual retry = guarded component_jobs update; max 2 attempts, second trimmed; 90s deadline, 45s soft (A27, A28, B16).
52. Bridge: verify event.source, not origin; render via srcdoc with meta CSP (A29).
53. ApprovalList.allowApproveAll.default(false); true only if all items stakes='low' (A30).
54. error.recoverable → Retry button + "tried 5 times" copy (A31).
55. Single stakes enum derived from action_types.stakes_tier (B17).
56. Remove ThinkingSteps from the tag catalog; derive from events (B18).
57. Schema-level requireds: MetricCard.confidence/sourceChip, BriefCard money_actions refine (B19).
58. Generate SCHEMA_BY_TAG and the prompt catalog from the Zod exports (C5).
59. Extend ActivityTimeline.kind (B21); component cache TTL rule (B20).

---

## PASS 4 — SESSION MEMORY (05-session-memory.md)

### A. Water leaks
A32 · CRITICAL · Token counting sums per-turn usage, which overcounts by the number of turns (§3 "add it to the running total", §10 "UPDATE sessions.token_count") CLI-reported input_tokens on each turn is the entire context that turn (all prior turns are re-sent, cached or not). Summing turn 1 (2k) + turn 2 (4k) + turn 3 (6k) gives 12k for a session whose real size is 6k. Trigger: on a 256k window, reset_threshold_pct=0.80 fires after roughly 20 turns of normal chat instead of ~100; the 20% warning fires around turn 8. What breaks: every threshold in §3 is meaningless in the current direction (too early), the reset flow runs constantly, and long-term memory fills with near-duplicate summaries. Fix: token_count is set, not incremented: token_count = last_turn.input_tokens + last_turn.output_tokens. The chars/4 fallback estimates only the delta of the turn and adds it to the previous set value. token_source stays. One-line change, but it is the whole spec.
A33 · CRITICAL · Reset is five writes with no transaction and no idempotency (§3 step 3, §10 sequence) Trigger: dispatcher dies after "INSERT user_memory/account_memory entries" and before "UPDATE sessions SET status='closed'". On restart the reset re-runs → duplicate memory entries, or dies after closed and before the new sessions insert → the chat has no open session and the next query has nothing to assemble against. Fix: (1) claim: update sessions set status='summarizing' where id=$1 and status='open' returning *; (2) the summarizer CLI call runs outside the transaction; (3) one transaction for: append memory entries tagged source_session_id=$old (idempotent: skip if an entry with that source_session_id exists), close old row, insert new row with reset_from_session_id; (4) provider_session_id stays null — the dispatcher opens it lazily on the first prompt, which the spec already tolerates. Restart logic: any session in summarizing older than the deadline is retried from step 2.
A34 · HIGH · Sending rolling summary + last N every prompt into a resumed session doubles the context (§4 "sent with every prompt", §1 "sessions are a cache… rebuilt on loss") Trigger: session is alive and resumed; each prompt prepends ~2,000 tokens the session already contains. The window fills at ~2× the rate the user's own turns would produce, so even after A32 is fixed the thresholds fire early and the model sees the same facts twice. Fix (delta to Bora's requirement, flagged as such): the session tier is sent in full only when provider_session_id is null (fresh or rebuilt); on a resumed session only the new user turn plus the changed long-term slice goes in. Or take D11, which removes the question.
A35 · HIGH · Reset runs outside the per-chat lock and outside the lane queue (§3, §10; accepted per-chat lock + throttle-wait) Trigger 1: a query is queued in the chat while the reset's summarizer call is running; it assembles a prompt against a session that is summarizing and either fails or opens a second session. Trigger 2: lane throttled; the summarizer call can't run; the session sits in summarizing, chat frozen with no UI state. Fix: reset is a queries row (kind='reset') on the chat — it takes the per-chat lock, waits on not_before like any query, and shows "waiting for lane" through the same backpressure status. No new machinery.
A36 · HIGH · The 20/55/80 indicators can't reach the UI (§8 "Realtime: none of these tables need to be in the publication") Trigger: threshold crosses, warned_at is set, nothing is streamed; the "20% used" indicator only shows on page reload. Fix: no publication needed — the done event in response_events (pass-3 D8) carries {token_count, model_window_tokens, pct}; the UI reads it from the stream it already has.
A37 · HIGH · Reset proposal inserts a "responses/UI-visible prompt" that has no return path (§3 step 2; pass-3 A26) Same class as confirm checkpoints: the approve click needs a queries row with reply_to_event_id. Also unspecified: what happens on decline. Fix: proposal = checkpoint event kind='confirm'; approve → queries(kind='reset') per A35; decline → sessions.reset_declined_at, re-propose only after another 10% of window is consumed, never every turn.
A38 · MEDIUM · Summarizer every M turns is a second CLI call on the same lane (§4 "summarizer step… every M turns") Trigger: M=5 → +20% lane calls, each holding the per-chat lock, each subject to throttle and retry×5. Fix: D12 (summary delta emitted inside the main turn).
A39 · MEDIUM · Sessions are Grok-only in a system with sticky Claude lanes (§3 grok_session_id, model_window_tokens "from account/session config") Trigger: a chat pinned to a Claude lane has model_window_tokens set from the Grok constant; thresholds are wrong by whatever the window difference is. Fix: rename to provider_session_id (pass-2 B13 already said so); model_window_tokens comes from llm_lanes.model_window_tokens at session-open via chats.lane_id.
A40 · MEDIUM · "Last N = 20 messages in ~1,500 tokens" is 75 tokens per message (§9 step 5) Trigger: real Jeru answers are 300–800 tokens; the budget is exceeded on turn 3 and the truncation order silently drops session memory first, so the model loses the most recent turns while keeping the summary. Fix: N is a ceiling (20), the budget is the rule: walk back from the newest message until 1,500 tokens, always include the last user+assistant pair.
A41 · LOW · GIN jsonb_path_ops indexes do nothing for the §7 query (§8 indexes, §7 ->> + ilike) jsonb_path_ops accelerates @>, not ilike on extracted text. Harmless but misleading. Fix: drop the three GIN indexes; at single-operator scale a seq scan over one row is instant. The duplicate create unique index on user_memory (profile_id) also duplicates the table's unique (profile_id).

### B. Weak points
B22 · CRITICAL · "Header semantic match" needs an embedding model, and there is none in the stack (§7 "embedding similarity… if pgvector is not yet enabled"; accepted Redis similarity cache) Weak because the no-API rule removes every hosted embedding endpoint, and the fallback ("keyword/synonym table") is not similarity. This also blocks the accepted Redis similarity cache, which cannot compute "highly similar" without vectors. Strengthened: run bge-small-en (or multilingual-e5-small for Turkish) in-process in the dispatcher via @xenova/transformers ONNX — ~30 MB, CPU, ~10 ms per query, no extra service. Memory entries get embedding vector(384) in pgvector; Redis cache keys store the vector and the dispatcher does cosine over the cache in-process (single-operator cache is thousands of rows at most). Not optional: without it two accepted mechanisms are unimplementable.
B23 · HIGH · Handout is a threshold with no product (§3, §12 open item 4) Strengthened, minimal: Handout = a messages(role='system_event', kind='handout') row containing (a) finalized rolling_summary, (b) open tasks and approvals where chat_id=$chat and status='pending' as a list, (c) one "Next step:" line written by the summarizer; then the same close/open transaction as reset, with the new session seeded from that row. Clear = the same transaction but the new session is seeded with nothing except long-term retrieval. So: Handout = reset with continuation, Clear = reset without; both fold the summary into long-term memory. This also closes Grok's item 6 — pending approvals survive by construction, not by checklist.
B24 · HIGH · sessions.status lacks the states the flow actually has (§8 DDL: open|summarizing|closed) Strengthened: open | reset_proposed | summarizing | closed, plus reset_declined_at. reset_proposed is needed so restart logic knows a proposal is outstanding without re-issuing the checkpoint.
B25 · MEDIUM · Memory tab shows three tables but Brief 4 was written for one (§5 vs pass-1 Brief 4 Memory tab) Strengthened: the Memory tab groups by tier — Preferences (user_memory), Business (account_memory.entries), Metrics (account_memory.metrics), Entities (memory) — with Edit/Forget per entry id. Forget = locked array removal (§6) and Redis invalidation by entry id (pass-2 action 32), and re-score of pending approvals citing it (pass-2 action 12).
B26 · MEDIUM · Metrics in account_memory.metrics duplicate connector-derived numbers (§5 metrics array) Weak because a "revenue" metric entry written by the summarizer will drift from the connector's live number and the model will see two values. Strengthened: metrics holds only user-stated targets and manual numbers (source_msg_id not null); connector metrics never enter it — they come from the data slice (§9 step 6). One sentence in the spec.
B27 · LOW · Truncation order drops session turns before low-relevance long-term entries (§9 ceiling) Strengthened: order = lowest-relevance account/user entries → metrics → oldest session turns beyond the last 4. Recent turns are the highest-value tokens in the prompt.

### C. Grok's review — verdicts
1. Single read gateway for member_private → WRONG for this system (assumes multi-member operation). Cheap to keep the gateway anyway since §7's function is already it; no lint rule needed.
2. jsonb array bloat → PARTIAL. Contention is moot (one writer). Bloat is real over years: rule — when entries exceeds 500 items, the summarizer's reset step merges same-header entries older than 90 days into one, keeping the newest source_msg_id. Normalizing into rows is not needed.
3. Summarizer cost → CORRECT, solved more completely by D12 (zero extra calls, not "less frequent").
4. Handout undefined → CORRECT, defined in B23.
5. model_window_tokens must be validated → CORRECT, and per lane not per system (A39): Claude and Grok windows differ.
6. Open tasks and pending approvals must survive reset → CORRECT, guaranteed by B23's handout row rather than a checklist.
7. auto_reset=false default → CORRECT.

### D. Better ways
D11 · HIGH · Stateless turns: never resume a provider session (§1 ground rule taken literally; §4, §10) Current: long-lived provider sessions resumed per chat, rebuilt on loss, rolling summary + last N injected on top. Proposed: every turn is session/new (Grok) / fresh claude -p with the §9 assembled prompt; the provider session is discarded after the turn. Wins: A34 disappears (no double injection); A32's counting becomes trivial (token_count = this turn's prompt size, exact); "session lost" is no longer a failure mode; the thresholds re-anchor to something you control — the session tier's own size (rolling_summary + recent messages) against PROMPT_TOKEN_BUDGET, which is the quantity that actually degrades quality. Costs: each turn re-sends ~8.7k tokens instead of a cached resume, so rate-limit consumption per turn is somewhat higher (cached input is typically counted cheaper); first-token latency slightly higher; the 20/55/80 thresholds have to be restated against the session-tier budget instead of the model window. If you keep resumed sessions, A34's delta is mandatory instead.
D12 · HIGH · Summary delta emitted by the main turn, not a separate summarizer call (§4) Current: separate summarizer CLI call every M turns. Proposed: the system prompt asks the model to end every response with a fenced summary_delta block (≤80 tokens: what changed, new facts, open items); the dispatcher strips it from the visible text, appends it to rolling_summary, and extracts candidate long-term facts with confidence. Wins: zero extra calls, summary always current, fact extraction gets provenance for free (source_msg_id = that response). Costs: ~80 output tokens per turn; occasional missing block (fall back to a chars/4 note "turn N unsummarized").
D13 · MEDIUM · Local ONNX embeddings in the dispatcher process — see B22. Wins: makes §7 and the Redis cache real. Costs: ~30 MB RAM, one npm dependency.
Conflict resolution: D11 and A34 address the same problem — adopt D11 and A34 closes; otherwise A34 is required. D12 supersedes A38 and Grok item 3. A36 depends on pass-3 D8 (response_events), which is now load-bearing for two specs.

### Action list (60–75)
60. sessions.token_count is set from the last turn's total, never summed; fallback adds only the turn delta (A32).
61. Reset = claim (open→summarizing) → summarizer call → one transaction (memory entries with source_session_id, close, insert new) → lazy provider_session_id (A33).
62. Reset and Handout run as queries(kind='reset'|'handout') under the per-chat lock and lane queue (A35).
63. done event carries {token_count, model_window_tokens, pct}; no Realtime publication on sessions (A36).
64. Reset proposal = confirm checkpoint; decline sets reset_declined_at, re-propose after +10% (A37, B24).
65. Rename grok_session_id → provider_session_id; model_window_tokens from llm_lanes via chats.lane_id (A39).
66. Session tier: token-budget walk-back, N=20 ceiling, always the last pair (A40).
67. Drop the three GIN indexes and the duplicate unique index (A41).
68. Add @xenova/transformers + multilingual-e5-small; pgvector on memory entries; Redis cache stores vectors, cosine in-process (B22, D13).
69. Handout/Clear defined per B23; messages(kind='handout') row seeds the new session.
70. sessions.status gains reset_proposed; add reset_declined_at (B24).
71. Memory tab grouped by tier; Forget = locked removal + Redis invalidation + approval re-score (B25).
72. account_memory.metrics = user-stated only; connector metrics stay in the data slice (B26).
73. Truncation order: low-relevance long-term → metrics → session turns beyond the last 4 (B27).
74. Entry merge rule at 500 entries / 90 days (C2).
75. Decide D11 (stateless turns) vs A34 delta before writing the dispatcher's prompt-assembly code; D12 either way.

---

## PASS 5 — EXPERIMENT ENGINE (06-experiment-engine.md)

### A. Water leaks
A42 · CRITICAL · Nothing says who computes the statistics — and the only compute in the stack is an LLM (§d engine, §g results, §n experiment_results) Trigger: the dispatcher asks the CLI turn to "compute the posterior and expected loss." The model returns plausible numbers; experiment_results.probability_to_beat_control = 0.94 is a hallucination with a decimal point. What breaks: every Ship decision is fiction; the grounding eval (§e) can't catch it because the number "traces to" the model's own output. Fix: a deterministic stats module in the dispatcher (TypeScript, no service): beta-binomial closed form for proportion metrics, normal-approximation for mean metrics (revenue/contact, CAC), Monte-Carlo (10k draws) for P(beat) and expected loss, CUPED as a pre-adjustment. The LLM writes only recommendation_why and reads numbers it is handed. Supported metric kinds become a column: experiments.metric_kind in ('proportion','mean'). Sample size / MDE / min runtime are the same module, not model output.
A43 · CRITICAL · No assignment table, so "a single contact never sees two variants" and holdout persistence are unimplementable (§f messaging "assignment keyed off contact_id", §d holdout "excluded… even after a decision", §n DDL) Trigger: messaging test, contact X gets variant A on Monday; Thursday's send recomputes assignment (hash drift, allocation edit, retry) and sends B. Holdout after Ship: nothing records who was held out, so the rollout hits them. Fix: experiment_assignments(experiment_id, subject_kind in ('contact','session','geo'), subject_key text, variant_id, assigned_at, unique(experiment_id, subject_kind, subject_key)). Assignment is a guarded insert-or-read; the "leak check" for overlapping audiences (§e) becomes a SQL join on this table.
A44 · HIGH · initiatives.status and experiments.status drift (§a, §n) Trigger: anomaly → kill() sets the initiative archived; experiments.status stays running; the results cron keeps computing and the ad set keeps spending. Fix: drop experiments.status entirely (D16); the initiative is the only state machine; every transition is one function transition_initiative(id, from[], to) guarded where status = any($from).
A45 · HIGH · Sequential early-call vs the 7-day floor is unspecified (§d "can call the test early" + "never recommend below one full business cycle") Trigger: posterior tight on day 3, Ship recommended, Monday effect never sampled. Fix: floor wins — results_ready requires now() >= started_at + min_runtime_days and (expected loss < ε or horizon reached). ε = 0.5% of baseline metric (relative), stored as experiments.early_stop_epsilon default 0.005.
A46 · HIGH · "Read the posterior continuously" has no loop (§d, §a significance_or_horizon_reached()) Trigger: nobody calls the transition. Fix: hourly cron over initiatives where status in ('in_progress','needs_data') → stats module → append experiment_results snapshot → evaluate A45's condition and the needs_data rule (below) → transition. Cheap, deterministic, no lane usage.
A47 · HIGH · experiment_results unique-per-variant conflicts with continuous recomputation (§n indexes "unique per variant per experiment run") Trigger: second hourly snapshot violates the unique index or overwrites history. Fix: append-only; unique(experiment_id, variant_id, computed_at); a view v_experiment_latest picks the newest per variant. The card reads the view.
A48 · HIGH · Anomaly "pauses spend-bearing variants" is an external write with no approval path (§a anomaly, ax-vision §7 escape hatch) Trigger: Meta ad set pause is a connector write; per the escape hatch it would wait for approval while spend burns. Fix: action_types: experiment_pause = auto_all, stakes_tier 0 (stopping spend is protective); experiment_resume and experiment_start = propose, tier 2 if the payload carries spend. Pause writes an audit row with reversible=true → resume is the undo.
A49 · MEDIUM · Learning loop writes to the wrong table (§h "memory table… scoped by scope" vs session spec §5) Trigger: account learnings land in memory (entity memory); the retrieval function for account_memory never sees them; next scoring turn has no priors → Confidence stays low forever. Fix: account learnings → account_memory.entries with header='experiments:<channel>' and campaign:<channel>; entity-specific findings ("Ahmet responds to short copy") → memory. Each entry: source_msg_id = the results system_event, initiative_id in body metadata. This also fixes B for "prior experiments raise Confidence."
A50 · MEDIUM · experiment_metrics.contact_id references profiles (§n) — wrong table; should be contacts (CRM) which 02 must define (Grok's earlier "missing CRM core tables" flag becomes a hard dependency here).
A51 · MEDIUM · Backlog auto-re-evaluation has no trigger (§c "re-evaluated automatically whenever campaign memory logs a change") Fix: weekly cron inserts queries(kind='rescore', chat=system) over backlog_high_potential rows; plus manual Promote. Nothing "listens" to memory writes.
A52 · LOW · needs_data condition undefined (§a data_arriving_but_thin()) Fix: after ≥3 days, projected days-to-sample-size > 2 × min_runtime_days. Recovers when projection drops below 1.5×.

### B. Weak points
B28 · HIGH · Evals guard reads as LLM judgment; it must be code (§e) Strengthened, concrete assertions (this replaces Grok's "separate doc"):
- Grounding: every numeric field in scores/testDesign carries source_query_id (a row in a metric_queries log the dispatcher writes when it runs SQL/connector pulls); missing → fail ungrounded:<field>.
- Data sufficiency: baseline window ≥ 14 days and ≥ 100 primary-metric observations; else CUPED recommended if pre-period exists, else fail insufficient_baseline:<days>/<n>.
- Integrity leak: (i) any experiment_assignments overlap with a live experiment on the same subject_kind → fail audience_overlap:<experiment_id>; (ii) any pending/queued outbound to the holdout set → fail holdout_contact:<n>; (iii) started_at earlier than the announcement message timestamp if a campaign announcement exists → fail pre_announced.
B29 · HIGH · experiments duplicates initiative fields (§n: name, hypothesis on both) — see D16.
B30 · MEDIUM · Holdout is only feasible for some surfaces (§d, §f) Weak because ad-platform holdouts need audience exclusions (custom audiences, geo splits) the connectors may not support. Strengthened: holdoutSuggested only for messaging, pricing_page, feature types; for creative (ads) default holdout_percent = null with why "ad platform holdout needs audience exclusion — not wired yet". Honest beats greyed-out.
B31 · MEDIUM · Competitor-sourced proposals need a gate (§b competitor_move) Strengthened: source_ref.relevance >= 0.7 and max 3 per day; excess stays proposed with origin_suppressed=true, visible in the list, never in the brief. [amended by 102]
B32 · MEDIUM · "Recently Finished for one cycle" needs a timestamp (§i) Strengthened: initiatives.finished_at; brief includes finished_at > (previous brief's generated_at).
B33 · LOW · Two Zod schemas for scores (jsonb comment + card) (§j, §n) — generate the DB-side JSON schema from the card's Zod export (pass-3 action 58 already does this for tags).
B34 · LOW · Learning examples for the brief (Grok item 3): "Learned: WhatsApp follow-ups under 40 words convert 12% better (from test #14, 94% confidence). Edit / Forget." — MemoryDelta with summary in that form; no new component.

### C. Grok's review — verdicts
1. experiment_metrics row explosion → PARTIAL. Connector metrics arrive as daily aggregates anyway: experiment_metrics becomes per-variant/metric/period rollups (period_start, n, sum, sum_sq); event-level rows only for contact-keyed messaging tests, in the same table with period_start = observed_at. No partitioning at single-operator scale.
2. contact_id → profiles → CORRECT (A50).
3. Learning terminology/examples → PARTIAL (B34; the naming fix is A49).
4. Evals checklist as a separate doc → CORRECT in substance, but it fits in this spec as B28; no new document.
5. Competitor threshold + rate limit → CORRECT (B31).
6. Execution idempotency → ALREADY COVERED by pass-3 A23/actions 46–47, provided approve_and_start goes through approvals (D15). If it stays a direct transition, the guard is where status='needs_decision'.
7. Frequentist "not ready" message → PARTIAL. Toggle stays a dormant column for one operator; if ever enabled: ExperimentResultsCard renders "Locked until n=<sample>/<needed>, day <d>/<min>" with no recommendation field.
8. Learning → memory naming → CORRECT (A49).

### D. Better ways
D14 · CRITICAL · Statistics as a deterministic module, LLM writes prose only — A42. Wins: correctness, the grounding eval becomes trivial, zero lane usage for results. Costs: ~300 lines of TS.
D15 · HIGH · needs_decision is an approvals row, not a separate button path (§a, §i, §j primaryAction) Current: Approve & Start on ExperimentProposalCard/InitiativeRow with its own transition. Proposed: entering needs_decision inserts approvals(action_type='experiment_start', action_payload={initiative_id, variants, holdout, spend}); the brief renders it in the same queue; approval execution calls transition_initiative(needs_decision→in_progress) and wires execution. Wins: one approval path, idempotency, expiry (72h), stakes tiers, trust-ladder telemetry all free; InitiativeRow.status loses needs_decision. Costs: none.
D16 · HIGH · Drop experiments.status, name, hypothesis (§n) Keep experiments for design parameters and as the parent of variants/metrics/results. Wins: one state machine, A44 gone. Costs: a join to show the name — trivial.
D17 · MEDIUM · Results cron and rescore cron as queries(kind=…) only where an LLM is needed — results (A46) needs no LLM → plain cron; rescore (A51) does → query. Keeps the "one pipeline" rule from pass 2 without forcing deterministic jobs through a lane.
Conflicts resolved: D15 supersedes §j's primaryAction.disabled logic (the approvals row is simply not created until the gate passes); A48's auto_all pause is the only non-proposal write in this spec and is deliberately narrow.

### Action list (76–92)
76. Stats module: beta-binomial / normal-approx / Monte-Carlo, CUPED, sample size + MDE; experiments.metric_kind; LLM writes recommendation_why only (A42, D14).
77. experiment_assignments table with unique subject key; assignment = insert-or-read (A43).
78. Drop experiments.status/name/hypothesis; single transition_initiative() with from[] guard (A44, D16).
79. results_ready requires runtime floor AND (expected loss < early_stop_epsilon 0.005 OR horizon) (A45).
80. Hourly results cron → append experiment_results snapshot; v_experiment_latest view; unique on computed_at (A46, A47).
81. action_types: experiment_pause auto_all tier 0; experiment_start/resume propose, tier by spend (A48).
82. Learnings → account_memory.entries headers experiments:<channel> / campaign:<channel>; entity facts → memory (A49).
83. experiment_metrics.contact_id → contacts; rollup columns period_start, n, sum, sum_sq (A50, C1).
84. Weekly rescore cron as queries(kind='rescore'); manual Promote (A51).
85. needs_data rule: projection > 2× min runtime after 3 days; recover below 1.5× (A52).
86. Evals guard as code with the three assertion sets and failure codes (B28).
87. metric_queries log table for grounding provenance (B28).
88. Holdout only for messaging/pricing/feature; null with honest why for ads (B30).
89. Competitor intake: relevance ≥ 0.7, max 3/day, origin_suppressed (B31). [amended by 102: budgets weekly]
90. initiatives.finished_at; brief window rule (B32).
91. needs_decision → approvals(action_type='experiment_start'); remove the separate button path (D15).
92. MemoryDelta summary format for experiment learnings (B34).
Dependency hard: contacts (CRM core) must exist in 02 before 77, 83 can be written.

---

## PASS 6 — COMPETITOR INTELLIGENCE (07-competitor-intel.md)

### A. Water leaks
A53 · CRITICAL · Change detection on hashed page content fires on every fetch (§2 change detection, §5 content_hash) Trigger: Tier 1 pricing page fetched daily; the page carries a CSRF token, a "last updated" date, a cookie banner variant, an A/B-tested hero, currency by IP, or a rotating testimonial. Hash differs every day → classifier runs every day → competitor_changes fills with "message shift" rows → alert budget burned on noise, exactly the trust failure §3 warns about. Fix: hash the extracted fields, not the page — normalized_payload for pricing_page = {plans:[{name, price, currency, period, features_hash}]}, for ad_creative = {ad_id, headline, body, cta, first_seen}; content_hash = sha256(normalized_payload). Plus a debounce: a change must persist across two consecutive fetches before it becomes a competitor_changes row (competitor_sources.pending_hash, pending_seen_count). This kills A/B flicker and geo variants.
A54 · CRITICAL · The classifier is "an LLM call (small model, cheap)" — there is no such thing in this stack (§2 classifier, §7 cost) Trigger: every detected change becomes a claude -p / Grok turn on a lane, with per-chat lock, retry×5, throttle wait. With A53 unfixed, that is dozens of lane calls per day for classification alone. Fix: D18 — deterministic rules for the two highest-value types (price number changed → price_change; new ad_id on a Tier 1 → new_offer/new_channel), which need no model and fire instantly; everything else batched into one daily queries(kind='competitor_digest') that classifies, scores, and drafts suggested responses for all pending changes in one structured-JSON turn.
A55 · HIGH · "All four ad libraries have free public search APIs" is not true as written (§1 ad libraries, §1 compliance mode) As far as I know (verify before building the collector): Meta's Ad Library API covers social-issue/political ads and, under the DSA, EU-targeted ads — commercial ads outside that scope are web-UI only; Google's Ads Transparency Center has no public API; TikTok's Commercial Content Library API requires an access application; LinkedIn's ad library is web only. What breaks: the collector is built on API clients that return nothing for Turkish commercial competitors, and compliance_mode='official_apis_only' would leave essentially one source. Fix: treat all four as fetch_method='scrape' by default with api as the exception per source; competitor_sources.fetch_method in ('api','fetch','browser'); correct §1 and §7.
A56 · HIGH · Snapshot per fetch, changed or not (§2 collector "writes raw payloads to competitor_snapshots", §5) Trigger: 5 Tier 1 competitors × 6 sources × daily = 900 raw HTML snapshots/month even when nothing changed; §5 already worries about growth. Fix: competitor_sources.last_hash; insert a snapshot only when the (debounced) hash differs; raw payload retained 90 days (nightly prune), normalized_payload and competitor_changes kept indefinitely.
A57 · HIGH · Suggested response → ledger path double-spends lane calls and conflicts with the experiment spec (§4 "entered… as Proposed with an ICE score"; experiment spec §b "arrives pre-tagged… scoring runs after intake") Trigger: the digest turn writes an ICE score; the experiment engine's intake sees proposed and runs its 9-step scoring turn again. Fix: the digest turn writes only initiatives(status='proposed', origin='competitor_move', source_ref) with the one-line hypothesis; scoring stays with the experiment engine's weekly/when-asked scoring pass. One score, one owner.
A58 · MEDIUM · Instant alert has no idempotency and no delivery path (§4 instant alert, §5 competitor_alerts) Trigger: the alert job restarts after sent_at write fails → Telegram message sent twice. Fix: unique(competitor_change_id, alert_type); delivery via the existing notifications row + channel adapter (pass-2 A20), see D19.
A59 · MEDIUM · JS-rendered pricing pages return an empty shell to plain fetch (§2 collector — unstated) Trigger: React-rendered pricing page; the normalizer finds no plans; hash of empty → first real render later looks like "new offer." Fix: fetch_method='browser' uses Playwright (single Chromium on the VPS, ~300 MB, no service) only for sources flagged so after a failed extraction; default remains plain fetch.
A60 · LOW · Alert budget "2-3 per week per account" and my earlier proposal cap "3/day" disagree (§3; pass-5 B31) Resolved: instant alerts ≤ 3/week; digest ≤ 5 items/week; competitor-sourced initiatives ≤ 8/week total (the union). Pass-5 action 89 changes from 3/day to this.

### B. Weak points
B35 · HIGH · Relevance scoring has no formula (§2 relevance scoring) Strengthened, with Grok's shape and concrete weights: score = tier_w × type_w × focus_w × segment_w, where tier_w = 1.0/0.6/0.3 for tiers 1/2/3; type_w = price_change 1.0, new_offer 0.9, new_channel 0.8, funding_news 0.6, hiring_signal 0.5, review_spike 0.5, message_shift 0.3, other 0; focus_w = 1.0 if the change touches an AAARRR stage of any in_progress/needs_decision initiative or a North Star input metric, else 0.5; segment_w = 1.0 same segment else 0.3. Instant threshold 0.7, digest threshold 0.35, below = logged only. Classifier confidence < 0.6 → other regardless (Grok item 1).
B36 · HIGH · "Current focus" is undefined (§2) Strengthened: current focus = the set of AAARRR stages and North Star input metrics referenced by initiatives in needs_decision|in_progress|needs_data plus the Money Map's top-ranked leak. Read at digest time from those tables; not a stored field.
B37 · MEDIUM · Daily Brief placement collides with Needs Attention (§4 outputs; pass-1 Daily Brief restructure) Strengthened: instant alert → one BriefCard(section='risky') row in Needs Attention with primaryAction='review_proposal' linking to the proposed initiative; weekly digest → a separate compact block "Competitor moves this week" on Monday's brief only; nothing competitor-flavored inside Growth Initiatives except the origin tag on rows that came from it.
B38 · MEDIUM · ledger_item_id is untyped (§5) — references initiatives(id) on delete set null, rename initiative_id.
B39 · MEDIUM · Cadence lives in a comment (§5 tier) — competitors.scan_interval_hours (24 / 72 / 168) set by tier at insert, editable; scheduler uses competitor_sources.last_fetched_at + interval.
B40 · LOW · compliance_mode and compliant flag (§1, §5) — dormant for one operator; keep the columns, do not build the source-dropping branch in v1; §7 legal paragraph can shrink to three lines.
B41 · LOW · Tier 2/3 "ad libraries and pricing pages only" duplicates phase 1's source set — fine, but say it once: phase 1 = those two sources for all tiers.

### C. Grok's review — verdicts
1. Precision-first classifier, skip if unsure → CORRECT; confidence field + < 0.6 → other (B35), and deterministic rules for price/new-ad remove the LLM from the highest-stakes types entirely (D18).
2. ledger_item_id → initiatives.id → CORRECT (B38).
3. Retention + prune job → CORRECT; plus snapshot-only-on-change (A56), which cuts the volume the prune job exists for.
4. Relevance formula → CORRECT with concrete weights and thresholds (B35).
5. Normalizer focuses on price/offer blocks → CORRECT, and it is the fix for A53, not just a noise reducer.
6. Job postings / SEO in phase 2 → ALREADY COVERED (§6 phase 1 excludes them).
7. Brief placement → CORRECT (B37).
8. Keep compliance mode for jurisdiction/contracts → WRONG for this system (assumes customers); column stays, logic deferred (B40).

### D. Better ways
D18 · CRITICAL · Rules for the top two change types + one daily batched digest turn, instead of per-change LLM classification — A54. Wins: instant alerts with zero lane usage, ~30× fewer LLM calls, structured output for all changes at once. Costs: non-price changes wait up to 24h — acceptable, they go to the digest anyway.
D19 · MEDIUM · Drop competitor_alerts; use notifications (§5) Current: dedicated alerts table with its own sent_at/acknowledged_at. Proposed: notifications(kind='competitor_alert', ref_id=competitor_change_id, channel, sent_at, acknowledged_at) — the table ax-vision §7 already lists. Wins: one delivery path (in-app, Telegram, email), one idempotency rule, one badge counter (Brief 5 bell). Costs: none.
D20 · LOW · competitor_snapshots.normalized_payload as the diff base and the classifier input, raw HTML stored as compressed text (bytea, gzip), not jsonb — jsonb of HTML is the wrong type and inflates storage ~2×.

### Action list (93–107; 89 amended)
93. Normalizer extracts typed fields per source; content_hash over normalized_payload (A53).
94. Debounce: pending_hash, pending_seen_count ≥ 2 before a change row (A53).
95. Deterministic rules for price_change and new Tier 1 ad_id; fire instant alerts without a model (A54, D18).
96. Daily queries(kind='competitor_digest') classifies/scores/drafts all pending changes in one structured turn (A54, D18).
97. competitor_sources.fetch_method in ('api','fetch','browser'); default scrape; correct §1/§7 API claims after verification (A55).
98. Snapshot only on changed hash; last_hash on sources; nightly prune raw > 90d (A56).
99. Digest writes initiatives(proposed, origin='competitor_move') only; no ICE in this pipeline (A57).
100. Delivery via notifications, unique(ref_id, kind); drop competitor_alerts (A58, D19).
101. Playwright fallback for fetch_method='browser' sources only (A59).
102. Budgets: instant ≤ 3/week, digest ≤ 5/week, competitor initiatives ≤ 8/week; amend action 89 (A60).
103. Relevance formula, weights, thresholds, classifier confidence gate (B35).
104. "Current focus" derived from live initiatives + Money Map at digest time (B36).
105. Brief placement per B37; origin tag on Growth Initiative rows.
106. initiative_id FK, scan_interval_hours, raw payload as gzip bytea (B38, B39, D20).
107. compliance_mode branch not built in v1 (B40).

---

## PASS 7 — 08-FEEDBACK RESOLUTION (08-feedback-2026-08-29.md)

Seventh piece: the Atlas resolution. This is the doc the briefs should have been updated against, so section E's layout decisions get an explicit brief-edit list at the end. Several Atlas decisions collide with things accepted later (retry×5, dropped reconciler, no router) — resolved below with the later decision winning, and the sentence in this doc that needs changing named.

### A. Water leaks
A61 · CRITICAL · Outbound send has no idempotency; a DB write failure after a successful send resends to the customer (§G.6 loop shape; §D "once sent… cannot be undone") Trigger: WhatsApp Cloud API returns 200, dispatcher crashes before writing sent; retry resends. A customer gets the same message twice — the one failure the whole approval model exists to prevent. Fix: outbound row states queued → sending → sent | failed | unknown; claim sending before the HTTP call; store provider_message_id on success; on ambiguous failure (timeout after send) mark unknown, never auto-retry, notify you. Only failed (provider rejected before accepting) retries.
A62 · CRITICAL · Bot/human race on customer chats (§G.3 "bot answers only when the last message came from the customer"; "pauses automatically when a human replies") Trigger: customer message → 60 s window → dispatcher composing (30 s) → you reply by hand at second 70 → bot response finishes at second 90 and sends. Double reply, contradictory. Fix: the "last message is customer" rule is checked at send time, inside the outbound claim: update outbound set status='sending' where id=$1 and (select last_direction from chats where id=$c)='inbound' and coalesce(ai_paused_until, '-infinity') < now(). Zero rows → response saved as suppressed, visible in the hub as "Jeru drafted, you already replied," never sent.
A63 · HIGH · Retry ×3 (§A.5) vs accepted retry ×5 — later decision wins: ×5 with the pass-2 backoff; change §A.5. Also "next free worker" must read "next free slot on the chat's lane" (sticky lanes).
A64 · HIGH · The 90 s reconciler re-enqueues queries still inside a 60 s merge window (§A.2, §A.6) Trigger: WhatsApp query inserted at t=0, window closes t=60, dispatch at t=63; reconciler at t=92 sees "pending older than 90 s" if the status didn't flip in time → duplicate run. Fix: merged queries carry status='merging', window_closes_at; the sweep only touches queued past not_before + deadline. And name it: §A.6 is the accepted "updated_at + state deadlines" mechanism, not a separate reconciler — one sweep, one name (D23).
A65 · HIGH · Placeholder splice + "not published until all component jobs are done" vs streaming (§C.2, §M.4 vs Brief 1 streaming, Brief 2 "canvas can partially render", pass-3 generative placeholder) Bora's decision stands: the HTML arrives complete, Grok never re-reads it. Resolution: text streams live (Brief 1 keeps its streaming state); when text finishes with component jobs open, responses.status='composing' and the placeholder shows a skeleton; done flips only when every job is ready; right-pane HTML never partial-renders. Strike Brief 2's "chart axes first, data second" sentence. The splice is dispatcher code, so response_events (pass-3 D8) gets a final component event per job, not text mutation.
A66 · HIGH · Inbound webhook duplicates (§G.5 ManyChat/WhatsApp webhooks) — at-least-once delivery; fix: unique(channel, external_id) on the shadow-log row, insert-ignore, and the queries insert happens in the same transaction so a dropped duplicate never enqueues.
A67 · MEDIUM · Synthetic probe every 10 min is 144 subscription calls/day (§A.7) Fix: probe only when a lane has been idle > 60 min; real traffic is the heartbeat otherwise. worker_heartbeats and lane status cover liveness for free.
A68 · MEDIUM · Template slot refresh has no schema (§C.4 "dispatcher refreshes the data slots without calling Opus") Trigger: Opus builds a page with slots named ad hoc; the dispatcher can't find them next time; falls back to Opus every run — the cost win never materializes. Fix: component_templates(id, kind, html, slots jsonb) where slots is a declared list [{name, type: number|string|series, selector: 'data-slot="x"'}]; the Opus prompt requires data-slot attributes for every dynamic value; validation (M.7) rejects a build whose slots don't match the declared list. Pass-3's hash cache now applies only to non-template one-offs.
A69 · MEDIUM · Escalation "pre-approved safe action" is undefined (§F.2) Fix: escalation_policy(urgency, allowed_actions text[], sla_minutes); allowed set drawn only from action_types where stakes_tier=0: acknowledge_with_eta, hold_deal, pause_campaign, create_task. Never in the set: price, offer, refund, send-to-new-contact. Single operator: on-call = you, then the safe action after sla_minutes.
A70 · LOW · Input budget split into sequential turns changes meaning (§A.4) — keep the rule, but split at message boundaries only, never mid-message, and prefix turn 2 with "continued input, do not answer yet" until the last chunk.

### B. Weak points
B42 · HIGH · Section H reintroduces the router model (§H "intent classification by a small fast model") Conflicts with pass-2 B8. Resolve: no model; intent = (mode, product_scope, channel) plus deterministic rules (approval keywords, question mark, attachment present). Strike the sentence.
B43 · HIGH · Semantic cache rule in §H tightens the accepted Redis cache — adopt it as the spec (§H "cosine 0.95 bypass only for static or educational queries") This resolves A7/A18 cleanly: the cache serves only queries classified static/educational (no data slice, no memory slice used); everything personal bypasses. "Light personalization" = a name/tone wrapper only. Write it as the cache's single rule.
B44 · HIGH · Two message tables (§G.2 chat_messages vs 02 messages) — see D22.
B45 · MEDIUM · usage_ledger / llm_accounts (§B.2, §B.4) were replaced by llm_lanes + usage_events (pass-1 chat context). Per-user allotment ÷10 is dormant. Warnings at 60/75/90/95/99 apply per lane; the calibration week logs per lane.
B46 · MEDIUM · §K account/business naming vs 02 — keep 02's accounts (business) + profiles (member); treat K as wording. One naming, decided here.
B47 · MEDIUM · Handoff trigger "unanswered after N bot turns" (§G.4) — N=3; "sentiment drop" = two consecutive negative classifications; both are values, not adjectives.
B48 · LOW · Photon (iMessage) unverified (§G.5) — flag verify vendor, no build dependency until confirmed.

### C. Grok's review — verdicts
1. Analytics bloat → CORRECT. v1 = 8: response latency, last touch, stage + days in stage, sentiment trend, hot lead score, channel preference, best contact time, next best action. The rest are template slots filled when data exists.
2. Vertical slice early → PARTIAL. Bora's order (frontend first) stands, but one slice — app chat → queries → dispatcher → response_events → outbound log — is built before any channel guidebook, so the hub demos on app chat.
3. Lock the template set → CORRECT; the five in §C.4 are the lock, with the slot schema from A68.
4. Escalation checklist → CORRECT (A69).
5. Briefs must be updated → CORRECT — the edit list below is that update.

### D. Better ways
D21 · MEDIUM · Idle-only probe — A67. Wins ~140 calls/day. Costs nothing.
D22 · HIGH · One messages table for Jeru chats and customer threads (§G.2) Current: messages (Jeru) + chat_messages (shadow log). Proposed: chats.kind in ('jeru','customer','system'); messages gains direction in ('inbound','outbound','internal'), channel, external_id, provider_message_id, media_transcript. Wins: the shadow log is the same pipeline, one merge-window implementation, one Realtime publication, the hub's "Chat history" shortcut is a plain query. Costs: three nullable columns.
D23 · MEDIUM · Call §A.6 what it is — the deadline sweep, already accepted; drop the word "reconciler" so nobody builds two.

### Brief edits (Atlas §E, applied)
- Brief 5 top pane: remove mode switcher and model selector; add Products as a segmented strip (Growth OS … Content Engine) after the search bar.
- Brief 5 left pane: New chat, Search, Projects, Chats (all-chats, pass-1 fix), Scheduled, My Generations, Profile (bottom). Profile opens the Personalize popover: General, Account, Privacy, Billing, Usage, Capabilities, Memory, Skills, Connectors. Remove the separate Skills/Connectors/Customize rows.
- Brief 1 message box: add mode chip and model chip (Auto default, routed model on hover) — this is where Grok's "space constraints" comment resolves.
- Brief 2 right pane: sizing 4/6 ≥1440, 5/5 1200–1440, drawer <1024; draggable divider, snap points, remembered; strike partial-render sentence (A65); Files tab already dropped (pass-1).
- New Brief 6: Chats hub — left AI box, middle customer list (unread badge, new-to-top), right conversation; AI live toggle with 10-min auto-pause, custom pause, per-chat disable; instruction box; shortcuts Chat history / Customer analytics / Next steps (HTML, right pane).
- Brief 4: Team tab adds escalation policy editor (A69); Memory tab per pass-4 B25.

### Action list (108–125; 29 amended)
108. Outbound states with sending claim, provider_message_id, unknown never retried (A61).
109. Send-time atomic check of last_direction + ai_paused_until; suppressed state (A62).
110. §A.5 → retry ×5, same lane; amend action 29 wording (A63).
111. status='merging', window_closes_at; sweep ignores it; rename reconciler → deadline sweep (A64, D23).
112. Streaming text + composing until all jobs ready; no partial HTML; strike Brief 2 sentence (A65).
113. unique(channel, external_id); insert-ignore + queries in one transaction (A66).
114. Probe only after 60 min lane idle (A67, D21).
115. component_templates with declared slots; data-slot required; validation rejects mismatches (A68).
116. escalation_policy table; allowed actions ⊂ tier-0 action_types (A69).
117. Split merged input at message boundaries only (A70).
118. Strike §H router sentence; deterministic intent (B42).
119. Cache rule: static/educational only, cosine ≥ 0.95, name/tone wrapper (B43).
120. Merge chat_messages into messages; chats.kind; direction/channel/external_id columns (D22).
121. Replace usage_ledger/llm_accounts references with llm_lanes/usage_events; warnings per lane (B45).
122. Naming: accounts = business, profiles = member; §K is wording only (B46).
123. Handoff values: N=3 turns, sentiment = 2 consecutive negatives (B47).
124. Apply the brief edits above to Briefs 1, 2, 4, 5; write Brief 6 (C5).
125. v1 analytics = the 8 metrics; rest as template slots (C1).

---

## PASS 8 — AX-UX OPTIMIZATION (09-ax-ux-optimization.md)

Eighth piece: the vault-audit initiatives list. This is a prioritization doc, so most findings are about what an initiative would force the runtime to do, plus the measurement column. Scope note: the pricing/growth sections (pilot users, signup conversion, demo close rate) describe the business process around Jeru, not the system — under fixed context 1 they have n=1 inside the app; only initiatives touching a surface or the dispatcher are evaluated.

### A. Water leaks
A71 · HIGH · "Intent Handshake before every deep answer" doubles lane calls (§AX "Intent Handshake", vs pass-2 B8 single-call rule, pass-3 A26 confirm return path) Trigger: implemented as a pre-call ("what do you mean?") followed by the real call → two CLI turns per query, two lock acquisitions, twice the window consumption, plus a queries round-trip for the answer. Fix: the handshake is emitted inside the single turn as a checkpoint kind='choice' (goal restated + plan + 2–3 options) and the turn ends; the user's pick is the A26 reply query. Triggered only when the turn would propose a stakes ≥ 1 action, spawn a component job, or the deterministic ambiguity rule fires (no product scope + no mode + question under 6 words). Never for Ask-mode questions.
A72 · HIGH · "Reply-quality eval harness" as a gate on every reply is a second model call per turn (§Growth "Reply-quality eval harness", cards CE-006/CE-030) Trigger: eval agent runs before each reply ships → latency, window burn, and the eval itself needs the per-chat lock. Fix: two layers — deterministic checks in dispatcher code on every response at zero lane cost (banned phrases, "$200", length ceiling per channel, Flesch ≥ 60, no unresolved {slot} markers); LLM eval only for outbound customer drafts and the Daily Brief, and a 10% sample of app-chat replies logged, not gated.
A73 · HIGH · "Escape Hatch without losing state" for right-pane builds has no versioning to back it (§AX "Escape Hatch", 08.D Bolt-style history) Trigger: user backs out of an ad build after step 3; "state" exists only in the current HTML. Fix: component_versions(component_id, version, html, slots_data, created_by_event_id) append-only; undo/redo = pointer move on components.current_version; the build flow's checkpoints reference a version id. Without this the initiative is a button with nothing behind it.
A74 · MEDIUM · "Daily Brief as continuous status" fights the once-nightly brief query (§UI "Daily Brief speed and progress", pass-2 D4) Trigger: intraday "progress" implemented as regenerating the brief → several brief-sized turns per day on a lane. Fix: the LLM-written brief stays nightly; the "continuous" layer is data-only — a delta strip computed from audit_log, approvals, initiatives since the brief's generated_at (done/approved/finished counts, new anomalies), rendered by React with no model. "Regenerate" stays a manual action.
A75 · MEDIUM · "Churn signal → automated renewal workflows" bypasses the approval gate (§Pricing "Churn signal surfacing") Trigger: workflow fires an outbound renewal message on a usage-drop signal. Fix: the signal creates an initiatives(proposed) or an approvals row (action_type='renewal_outreach', tier 2); nothing sends automatically. Same rule as every outbound.
A76 · LOW · "Pushback… updates memory, not just the current reply" (§AX "Pushback handling") Trigger: a correction edits memory and stale cached answers/pending approvals citing it survive. Already handled by pass-2 action 12 and pass-4 action 71 — cite them; the initiative adds only the UI affordance ("Correct Jeru" on a bubble → memory entry with source_msg_id).

### B. Weak points
B49 · HIGH · The Measure column is mostly marketing metrics glued to product surfaces (every UI/UX entry; Grok item 2) Strengthened, direct metrics, all computable from existing tables:
- Top-bar products discoverability → % of first-day chats started from the correct product scope; time to first Product click.
- Approval gate clarity → edit-before-approve rate and undo rate on outbound action_types (already in v_trust_ladder).
- Escape Hatch → undo/redo uses per build session; abandoned-build rate.
- Chat reply comprehension → Flesch score distribution from A72's deterministic check; follow-up "what do you mean" rate.
- Daily Brief speed → opens per day, time from open to first Approve.
- Confidence Cues → "why" expansions per claim; approval rate split by confidence level.
- Intent Handshake → handshake-shown rate (should be low after taper) and pick-vs-dismiss ratio.
B50 · HIGH · Approval gate clarity needs a payload rule, not a copy rule (§UI "Approval gate clarity", 08.D) Strengthened: for any action_type with outbound=true, action_payload.preview is required: {recipient_name, recipient_handle, channel, rendered_text, attachments[], scheduled_for}; the approval row renders that verbatim; the executor sends preview.rendered_text, never a re-generated draft. Executed message ≡ approved message by construction.
B51 · MEDIUM · "Confidence Cues on every Jeru claim" is already specified — pass-1 B2 thresholds, pass-3 B19 schema-level requireds. The initiative reduces to: apply the chip to prose claims via a claim inline tag in text_chunk events ({claim_id, confidence, source_query_id}), rendered as a subtle underline with hover. Effort S, not M.
B52 · MEDIUM · Start-here list is 10 items with S/M mixed (Grok item 1) — see C1.
B53 · LOW · "Trust ladder across onboarding interview" vs Brief 3's one-question flow — compatible; strengthen with the order: sector → goal → tone → then connectors (read scopes only) → write scopes only after the first approved action. Scopes requested lazily, at the moment they're needed.

### C. Grok's review — verdicts
1. WIP limit → CORRECT. 3 build + 1 growth + pricing process. Build v1: Approval gate clarity (B50), Escape Hatch with versioning (A73), Confidence Cues inline (B51). Growth: lead magnet. Everything else queued.
2. Metrics weakly tied → CORRECT (B49).
3. Handshake taper → CORRECT, with the single-turn implementation (A71).
4. Lead magnet as sole v1 acquisition channel, SEO/AI-discoverability feeding it → CORRECT (marketing, outside the system; no further comment).
5. Narrow hub shortcuts to 3 + 5–8 metrics → ALREADY COVERED (pass-7 C1: 8 metrics, 3 shortcuts).
6. Eval harness: brief + outbound only, sample chat → PARTIAL — plus the zero-cost deterministic layer on everything (A72).
7. Wrapper test after a 4–6 week full-price cohort → CORRECT; note it can run as an initiatives row in the experiment engine once the cohort exists.
8. CS-038 / MS-017 / CS-007 deserve future spikes → CORRECT; MS-017 (evidence cadence in the brief) is the one that touches a surface and can ride on A74's delta strip later.

### D. Better ways
D24 · HIGH · Fold five AX initiatives into existing actions instead of running them as separate workstreams. Confidence Cues → B51; Escape Hatch → A73; Approval gate clarity → B50; Pushback → 12/71 + a "Correct Jeru" button; Intent Handshake → A71. Wins: no parallel track, each lands as a schema/protocol change already on the list. Costs: the initiative doc loses five headings.
D25 · MEDIUM · Comprehension pass as a dispatcher post-processor (§UI "Chat reply comprehension") Current: copy/font initiative. Proposed: A72's deterministic layer computes Flesch and flags; a system-prompt line ("plain language, short sentences, no jargon unless the user used it") does the rest. Font choice is a Brief 1 token change. Wins: measurable, automatic. Costs: none.
D26 · MEDIUM · Data-only intraday delta strip — A74. Wins: "continuous" feel with zero lane usage. Costs: one React strip.

### Action list (126–136)
126. Handshake = in-turn choice checkpoint; trigger rules per A71; never in Ask mode for simple questions.
127. Deterministic reply checks in dispatcher (bans, $200, length, Flesch ≥ 60, unresolved slots); LLM eval only on outbound drafts + brief; 10% chat sample logged (A72).
128. component_versions append-only; undo/redo = pointer move (A73).
129. Brief delta strip from audit_log/approvals/initiatives since generated_at; no regeneration (A74, D26).
130. Churn signals → initiatives(proposed) or tier-2 approval; never auto-send (A75).
131. "Correct Jeru" bubble action → memory entry with source_msg_id; reuses 12/71 (A76).
132. Replace the Measure column with B49's direct metrics.
133. action_payload.preview required for outbound action_types; executor sends preview.rendered_text (B50).
134. Inline claim tags in text_chunk with confidence + source_query_id (B51).
135. Onboarding scope order: read scopes after profile, write scopes after first approved action (B53).
136. WIP cap: 3 build + 1 growth + pricing; start-here = B50, A73, B51 (C1).
