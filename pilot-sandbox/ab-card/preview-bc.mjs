// Temporary LABELED 2-up preview: arm-b (opus-4.7) vs arm-c (opus-4.8).
// Does NOT touch MAPPING.json or the blind 3-way build. Emits preview.html.
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = new URL('.', import.meta.url).pathname;
const ARMS = [
  { key: 'b', label: 'Opus 4.7', file: 'submission-b.html' },
  { key: 'c', label: 'Opus 4.8', file: 'submission-c.html' },
];

function transpile(src) {
  return ts.transpileModule(src, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText;
}

const page = (js) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script src="vendor/react.js"></script>
<script src="vendor/react-dom.js"></script>
<script>
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
    setTimeout(function(){var r=document.getElementById('root');if(r&&r.childElementCount===0)note('did not render');},1600);
  }
}catch(e){note('did not render');}
</script>
</body></html>`;

const V = Date.now ? 'p1' : 'p1'; // static cache-buster token (no clock)
for (const a of ARMS) {
  const src = readFileSync(DIR + `arm-${a.key}/DateTimePicker.tsx`, 'utf8');
  writeFileSync(DIR + a.file, page(transpile(src)));
}

const cells = ARMS.map((a) =>
  `<div class="col"><div class="lbl">${a.label}</div><iframe src="${a.file}?v=${V}" title="${a.label}"></iframe></div>`).join('');
const index = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>opus 4.7 vs 4.8</title>
<style>html,body{margin:0;background:#f4f4f5;font-family:system-ui,sans-serif}
@media (prefers-color-scheme:dark){html,body{background:#0b0b0c;color:#e7e7ea}}
.wrap{display:grid;grid-template-columns:repeat(2,minmax(380px,1fr));gap:0;height:92vh;min-height:600px}
.col{display:flex;flex-direction:column}
.col+.col{border-left:1px solid rgba(128,128,128,.25)}
.lbl{font:600 13px/1 system-ui,sans-serif;padding:10px 14px;background:rgba(128,128,128,.08);border-bottom:1px solid rgba(128,128,128,.2)}
iframe{border:0;width:100%;flex:1;background:transparent}</style>
</head><body><div class="wrap">${cells}</div></body></html>`;
writeFileSync(DIR + 'preview.html', index);
console.log('built preview.html + ' + ARMS.map((a) => a.file).join(' '));
