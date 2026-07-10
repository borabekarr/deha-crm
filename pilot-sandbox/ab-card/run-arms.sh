#!/usr/bin/env bash
# Launch 5 blind A/B arms in parallel. Each = dept-frontend agent on a pinned model,
# effort high, writing ONE render-safe file to its arm dir. Captures per-arm stats.
set -u
HARNESS="/home/bora/deha-crm/pilot-sandbox/ab-card"
cd "$HARNESS" || exit 1

declare -A MODEL=(
  [a]="claude-sonnet-4-6"
  [b]="claude-opus-4-7"
  [c]="claude-opus-4-8"
)

run_arm() {
  local k="$1" model="$2"
  local out="$HARNESS/arm-$k/DateTimePicker.tsx"
  local brief; brief="$(sed "s|{{OUTPUT_PATH}}|$out|g" "$HARNESS/brief.md")"
  local t0 t1
  t0=$(date +%s%3N)
  timeout 1800 claude -p "$brief" \
    --model "$model" \
    --agent dept-frontend \
    --effort medium \
    --permission-mode acceptEdits \
    --output-format json \
    >"$HARNESS/stats/sub-raw-$k.json" 2>"$HARNESS/stats/sub-err-$k.log"
  local rc=$?
  t1=$(date +%s%3N)
  python3 - "$k" "$model" "$rc" "$((t1 - t0))" <<'PY'
import sys, json, os
k, model, rc, wall = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
H = "/home/bora/deha-crm/pilot-sandbox/ab-card"
raw = os.path.join(H, f"stats/sub-raw-{k}.json")
d = {}
try:
    with open(raw) as f:
        d = json.load(f)
except Exception as e:
    d = {"_parse_error": str(e)}
u = d.get("usage", {}) or {}
out = {
    "arm": k, "model": model, "exit_code": rc, "wall_ms": wall,
    "input_tokens": u.get("input_tokens"),
    "output_tokens": u.get("output_tokens"),
    "cache_read_input_tokens": u.get("cache_read_input_tokens"),
    "cache_creation_input_tokens": u.get("cache_creation_input_tokens"),
    "total_cost_usd": d.get("total_cost_usd"),
    "duration_ms": d.get("duration_ms", wall),
    "duration_api_ms": d.get("duration_api_ms"),
    "num_turns": d.get("num_turns"),
    "is_error": bool(d.get("is_error")) or rc != 0,
    "result_tail": (d.get("result") or "")[-300:],
}
comp = os.path.join(H, f"arm-{k}/DateTimePicker.tsx")
out["file_exists"] = os.path.exists(comp)
out["file_bytes"] = os.path.getsize(comp) if out["file_exists"] else 0
with open(os.path.join(H, f"stats/arm-{k}.json"), "w") as f:
    json.dump(out, f, indent=2)
print(f"[{k}] {model} rc={rc} wall={wall}ms bytes={out['file_bytes']} err={out['is_error']}")
PY
}

pids=()
for k in a b c; do
  run_arm "$k" "${MODEL[$k]}" &
  pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done
echo "ALL_ARMS_DONE"
