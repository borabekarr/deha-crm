// Blind A/B preview builder (5-arm).
// Precompiles each arm's render-safe TSX -> JS in Node (ts.transpileModule),
// shuffles arms a..e -> submission1..5, and emits five isolated iframes in a row
// with NO labels/model names. Each arm assigns window.PieChart, so each lives in
// its own iframe (isolation + no global collision + no CSS bleed). A BLIND stats
// table (sub1..sub5, no model identity) is appended below when stats/arm-*.json exist.
import ts from 'typescript';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const DIR = new URL('.', import.meta.url).pathname;
const KEYS = ['a', 'b', 'c'];
const arms = Object.fromEntries(
  KEYS.map((k) => [k, readFileSync(DIR + `arm-${k}/DateTimePicker.tsx`, 'utf8')]),
);

function transpile(src) {
  const out = ts.transpileModule(src, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,        // TSX -> React.createElement
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
    },
  });
  return out.outputText;
}

// Preserve an existing blind mapping across rebuilds; only shuffle on first build.
let mapping;
try {
  mapping = JSON.parse(readFileSync(DIR + 'MAPPING.json', 'utf8'));
  if (!mapping.order || mapping.order.length !== KEYS.length) throw new Error('stale');
} catch {
  const order = [...KEYS];
  for (let i = order.length - 1; i > 0; i--) {   // Fisher-Yates
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  mapping = { order };
  order.forEach((k, i) => { mapping[`submission${i + 1}`] = k; });
  writeFileSync(DIR + 'MAPPING.json', JSON.stringify(mapping, null, 2));
}
const order = mapping.order;

const page = (js) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="vendor/react.js"></script>
<script src="vendor/react-dom.js"></script>
<script>
/* Harness watchdog: abort a runaway render before it OOM-crashes the tab.
   Caps React.createElement; a well-behaved component uses a few hundred. */
(function(){var n=0,orig=React.createElement;React.createElement=function(){if(++n>20000){throw new Error('render-watchdog: aborted after '+n+' createElement calls');}return orig.apply(React,arguments);};})();
</script>
<style>html,body{margin:0;padding:24px;background:#fff;font-family:system-ui,sans-serif}
@media (prefers-color-scheme:dark){html,body{background:#0b0b0c}}</style>
</head><body><div id="root"></div>
<script>${js}</script>
<script>
function note(msg){document.getElementById('root').innerHTML='<div style="font:13px/1.5 system-ui,sans-serif;color:#9aa0a6;padding:16px">'+msg+'</div>';}
try{
  var C = window.DateTimePicker;
  if(!C){note('did not render');}
  else{
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(C));
    /* watchdog abort escapes React's async render, so backstop with a post-check */
    setTimeout(function(){var r=document.getElementById('root');if(r&&r.childElementCount===0)note('did not render');},1600);
  }
}catch(e){note('did not render');}
</script>
</body></html>`;

const V = 5; // cache-buster bump
for (const [i, key] of order.entries()) {
  writeFileSync(DIR + `submission${i + 1}.html`, page(transpile(arms[key])));
}

// Blind stats: join per-arm stats by the private mapping, DISPLAY by submission number.
function statRows() {
  const fmtN = (n) => (n == null ? '?' : Number(n).toLocaleString('en-US'));
  const fmtCost = (n) => (n == null ? '?' : '$' + Number(n).toFixed(4));
  const fmtDur = (ms) => (ms == null ? '?' : (ms / 1000).toFixed(1) + 's');
  let rows = '';
  let any = false;
  order.forEach((key, i) => {
    const p = DIR + `stats/arm-${key}.json`;
    if (!existsSync(p)) { rows += `<tr><td>sub${i + 1}</td><td colspan="7" class="muted">no stats</td></tr>`; return; }
    any = true;
    const s = JSON.parse(readFileSync(p, 'utf8'));
    rows += `<tr><td>sub${i + 1}</td><td>${fmtN(s.input_tokens)}</td><td>${fmtN(s.output_tokens)}</td>`
      + `<td>${fmtN(s.cache_read_input_tokens)}</td><td>${fmtDur(s.duration_ms)}</td>`
      + `<td>${fmtCost(s.total_cost_usd)}</td><td>${fmtN(s.num_turns)}</td>`
      + `<td>${s.is_error ? '<span class="err">yes</span>' : 'no'}</td></tr>`;
  });
  if (!any) return '';
  return `<table class="stats"><thead><tr><th>arm</th><th>input tok</th><th>output tok</th>`
    + `<th>cache tok</th><th>duration</th><th>cost</th><th>turns</th><th>errored</th></tr></thead>`
    + `<tbody>${rows}</tbody></table>`;
}

// Index: five iframes in a row, NO labels, NO model names, NO scores.
const cells = order.map((_, i) =>
  `<div class="col"><iframe src="submission${i + 1}.html?v=${V}" title="${i + 1}"></iframe></div>`).join('');
const index = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>&nbsp;</title>
<style>html,body{margin:0;background:#f4f4f5;font-family:system-ui,sans-serif}
@media (prefers-color-scheme:dark){html,body{background:#0b0b0c;color:#e7e7ea}}
.wrap{display:grid;grid-template-columns:repeat(3,minmax(340px,1fr));gap:0;height:82vh;min-height:520px}
iframe{border:0;width:100%;height:100%;background:transparent}
.col+.col{border-left:1px solid rgba(128,128,128,.25)}
.stats{border-collapse:collapse;width:100%;font-size:13px;margin:0}
.stats th,.stats td{padding:8px 12px;border-bottom:1px solid rgba(128,128,128,.2);text-align:right}
.stats th:first-child,.stats td:first-child{text-align:left;font-weight:700}
.stats thead th{background:rgba(128,128,128,.08);position:sticky;top:0}
.stats .muted{color:#9aa0a6;text-align:left}
.stats .err{color:#EF4444;font-weight:700}
.statwrap{overflow:auto;max-height:18vh}</style>
</head><body><div class="wrap">${cells}</div>
<div class="statwrap">${statRows()}</div>
</body></html>`;
writeFileSync(DIR + 'index.html', index);

console.log(`built: ${order.map((_, i) => `submission${i + 1}.html`).join(' ')} index.html; MAPPING.json kept private`);
