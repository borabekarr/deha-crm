# Department Layer Efficiency Measurement

Quantifies what the department agent layer costs and saves against a general-purpose baseline. Four runs of one identical blind brief (`pilot-sandbox/benchmark/brief.md`, a day-picker-with-slots component) were executed by the orchestrator: 2 runs on the `dept-frontend` agent, 2 runs on the `general-purpose` agent. All four used model `claude-opus-4-8`, single session, same brief file modulo the output path. n=2 per arm; variance is reported, not averaged away.

## 1. Run table

| run | agent | subagent_tokens | wall_clock_ms | tool_uses | render gate | createElement | color violations | oklch | real useEffect | file bytes |
|---|---|---|---|---|---|---|---|---|---|---|
| dept-1 | dept-frontend | 55354 | 385242 | 19 | PASS | 75 | 0 | 67 | 0 | 19052 |
| dept-2 | dept-frontend | 37485 | 200440 | 6 | PASS | 64 | 0 | 52 | 0 | 16798 |
| gp-1 | general-purpose | 64268 | 258018 | 9 | PASS | 113 | 5 | 49 | 0 | 20928 |
| gp-2 | general-purpose | 59585 | 211235 | 8 | PASS | 68 | 0 | 60 | 0 | 16972 |

Output files:
- dept-1: `pilot-sandbox/benchmark/arm-dept/DayPickerSlot.tsx`
- dept-2: `pilot-sandbox/benchmark/efficiency/dept-2/DayPickerSlot.tsx`
- gp-1: `pilot-sandbox/benchmark/efficiency/base-gp-1/DayPickerSlot.tsx`
- gp-2: `pilot-sandbox/benchmark/efficiency/base-gp-2/DayPickerSlot.tsx`

The `color violations`, `oklch`, `real useEffect`, and `file bytes` columns were re-verified by this report (commands in Section 2). All four matched the orchestrator-supplied figures. Notably, every file has 0 real `useEffect(` calls, and only gp-1 carries color violations (5).

## 2. Measurement method

A third party can repeat every column as follows.

- **Token counts (`subagent_tokens`):** taken from the Claude Code Agent tool usage report emitted per subagent spawn, `subagent_tokens` field. Executors cannot read this value; only the spawning orchestrator sees it. One figure per run, captured at spawn completion.
- **Wall-clock (`wall_clock_ms`):** the `duration_ms` field of the same Agent tool usage report, per spawn.
- **Tool uses:** the tool-use count from the same report, per spawn.
- **Render gate:** `node pilot-sandbox/benchmark/render-gate-browser.mjs <file>`; exit code 0 = PASS. The `createElement` column is the call count that gate reports.
- **Structural color discipline** (run from `pilot-sandbox/benchmark/`, per file):
  - color violations: `grep -cE '#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(' <file>`
  - oklch tokens: `grep -c oklch <file>`
- **Real useEffect calls:** `grep -cE 'useEffect\s*\(' <file>` (the `\s*\(` guard excludes bare `useEffect` mentions in comments/strings).
- **File bytes:** `wc -c < <file>`.

Conditions: single session, model `claude-opus-4-8` for all four runs, identical brief file except output path, 2 runs per arm.

## 3. Interpretation

**Passing-quality artifact** is defined as: render gate PASS AND 0 color violations AND 0 real useEffect calls.

Per-run verdict:
- dept-1: PASS, 0 viol, 0 useEffect -> passing
- dept-2: PASS, 0 viol, 0 useEffect -> passing
- gp-1: PASS, but 5 color violations -> FAILS quality
- gp-2: PASS, 0 viol, 0 useEffect -> passing

Passing counts: **dept-frontend 2 of 2**, **general-purpose 1 of 2** (gp-1's 5 hardcoded color escapes disqualify it).

**Tokens per passing-quality artifact** (total arm tokens / passing count):
- dept-frontend: (55354 + 37485) / 2 = 92839 / 2 = **46420 tokens per passing artifact**
- general-purpose: (64268 + 59585) / 1 = 123853 / 1 = **123853 tokens per passing artifact**

On this metric the department arm is roughly **2.7x cheaper per passing-quality artifact**, because it spent fewer tokens in aggregate (92839 vs 123853) and converted all of them into passing output, while the general-purpose arm wasted one of its two runs on a color-discipline failure. Both raw-token totals also favor the department arm, so the gap is not solely a denominator artifact; the quality denominator amplifies an already-present token advantage.

**Wall-clock.** The department arm was slower on average: mean 292841 ms (dept-1 385242, dept-2 200440) vs general-purpose mean 234626 ms (gp-1 258018, gp-2 211235). The entire deficit comes from dept-1, which was the single slowest run and used 19 tool_uses (catalog reading plus self-verification passes) against dept-2's 6. dept-2, once warmed, was the fastest run of all four (200440 ms). Within-arm spread is large (dept range 184802 ms; gp range 46783 ms), so with n=2 the wall-clock comparison is not statistically meaningful. The honest read: the department layer can add front-loaded latency when it reads its catalog and self-verifies, but that cost is not fixed and does not reliably make it slower. Token efficiency and quality yield are the stable signals here; wall-clock is noisy at this sample size.

## 4. Scope note

All verdicts are scoped strictly to the four produced files listed in Section 1. Concurrent sessions may dirty the wider repo, so no claim is made about repo-global state (per the scoped-build-gate lesson: verify only the files you produced, not the neighborhood). Re-running the greps in Section 2 against these four paths reproduces the structural columns exactly.
