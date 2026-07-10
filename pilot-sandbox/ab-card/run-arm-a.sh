#!/usr/bin/env bash
set -u
H="/home/bora/deha-crm/pilot-sandbox/ab-card"; cd "$H" || exit 1
out="$H/arm-a/DateTimePicker.tsx"; model="claude-sonnet-4-6"
brief="$(sed "s|{{OUTPUT_PATH}}|$out|g" "$H/brief.md")"
t0=$(date +%s%3N)
timeout 2100 claude -p "$brief" --model "$model" --agent dept-frontend --effort medium \
  --permission-mode acceptEdits --output-format json \
  >"$H/stats/sub-raw-a.json" 2>"$H/stats/sub-err-a.log"
rc=$?; t1=$(date +%s%3N)
python3 - "$rc" "$((t1-t0))" <<'PY'
import sys,json,os
rc=int(sys.argv[1]); wall=int(sys.argv[2]); H="/home/bora/deha-crm/pilot-sandbox/ab-card"
try: d=json.load(open(f"{H}/stats/sub-raw-a.json"))
except Exception as e: d={"_parse_error":str(e)}
u=d.get("usage",{}) or {}
comp=f"{H}/arm-a/DateTimePicker.tsx"; fe=os.path.exists(comp)
out={"arm":"a","model":"claude-sonnet-4-6","exit_code":rc,"wall_ms":wall,
 "input_tokens":u.get("input_tokens"),"output_tokens":u.get("output_tokens"),
 "cache_read_input_tokens":u.get("cache_read_input_tokens"),
 "cache_creation_input_tokens":u.get("cache_creation_input_tokens"),
 "total_cost_usd":d.get("total_cost_usd"),"duration_ms":d.get("duration_ms",wall),
 "duration_api_ms":d.get("duration_api_ms"),"num_turns":d.get("num_turns"),
 "is_error":bool(d.get("is_error")) or rc!=0,"result_tail":(d.get("result") or "")[-300:],
 "file_exists":fe,"file_bytes":os.path.getsize(comp) if fe else 0}
json.dump(out,open(f"{H}/stats/arm-a.json","w"),indent=2)
print(f"[a] retry rc={rc} wall={wall}ms bytes={out['file_bytes']} err={out['is_error']}")
PY
echo "ARM_A_DONE"
