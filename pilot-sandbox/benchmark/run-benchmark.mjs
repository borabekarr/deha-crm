#!/usr/bin/env node
// run-benchmark.mjs — two-arm design benchmark harness.
//
// Takes two component paths (render-safe TSX: no import/export, React global,
// component assigned to a window global). Blind-assigns them to arm-A / arm-B,
// then for each arm runs:
//   (a) structural gates  — oklch-only, Montserrat, explicit button type, zero useEffect
//   (b) browser render gate — node .claude/scripts/render-gate-browser.mjs (exit 0/1)
//   (c) high-DPI screenshots in LIGHT and DARK (html.dark convention), each verified
//       nonblank by an in-browser pixel-sample assertion, and light != dark by hash.
// Emits: results/MAPPING.json (private, scorer never reads it),
//        results/REPORT.md (structural + gate + rubric table with SCORES: pending),
//        results/scorer-input/ (renamed screenshots + rubric + scorer prompt, NO mapping).
//
// USAGE
//   node pilot-sandbox/benchmark/run-benchmark.mjs <compA.tsx> <compB.tsx>
//   (cwd = /home/bora/deha-crm so playwright + typescript resolve)
//
// Lessons honored: design-no-blackfish (a blank/uniform screenshot must FAIL the run;
// dark identical to light must FAIL), grep-verifies-structure-not-render (gate verdicts
// and screenshots come from a live browser, never source inspection).

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, isAbsolute, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const REPO = '/home/bora/deha-crm';
const HERE = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const RESULTS = resolve(HERE, 'results');
const SCORER_IN = resolve(RESULTS, 'scorer-input');
const RUBRIC_SRC = resolve(REPO, '.claude-ext/references/frontend/design-benchmark-rubric.md');
const SCORER_PROMPT_SRC = resolve(HERE, 'scorer-prompt.md');
const RENDER_GATE = resolve(REPO, '.claude/scripts/render-gate-browser.mjs');
const TOKEN_GATE = resolve(REPO, 'apps/web/design-system/tools/token-fidelity-gate.sh');
const VENDOR = resolve(REPO, 'pilot-sandbox/render-gate/vendor');
const DPR = Number(process.env.BENCH_DPR || 2);
const SETTLE_MS = Number(process.env.BENCH_SETTLE_MS || 1800);

// ---- dep resolution (deps live in the deha-crm workspace) -------------------
const MODULE_PATHS = [REPO, resolve(REPO, 'node_modules'), resolve(REPO, 'apps/web/node_modules')];
const req = createRequire(import.meta.url);
function resolveDep(name) {
  for (const base of MODULE_PATHS) {
    try { return req.resolve(name, { paths: [base] }); } catch { /* next */ }
  }
  return null;
}

// ---- rubric item index (titles + short cited source) — mirrors design-benchmark-rubric.md
const RUBRIC = [
  ['Spacing rhythm', 'DS §3 spacing grid L87-90'],
  ['Visual hierarchy', 'DS §2 typography L52-64'],
  ['Optical alignment', 'MIFB P2 L31-33 / L123'],
  ['Concentric border radii', 'MIFB P1 L27-29 + DS §12 L242-254'],
  ['Shadow quality', 'MIFB P3 L35-37 / L124'],
  ['Color discipline', 'DS §1 L17-48 + anti 4/16'],
  ['Numeric typography', 'MIFB P6 L47-49 + DS §2 L74'],
  ['Hit areas', 'DS §3 L92 + MIFB P13 L75-77'],
  ['Anti-slop: gradient restraint', 'DS anti 1-2 L122-123'],
  ['Anti-slop: shadow restraint', 'DS anti 3 L124'],
  ['Anti-slop: icon discipline', 'DS §8 L178 + anti 22 L143'],
  ['Anti-slop: no hollow placeholders', 'DS anti 5 L126'],
  ['Interactive states', 'DS anti 18 L139 + MIFB P9 L59-61'],
  ['Dark mode fidelity', 'DS §13 L259-274'],
  ['Text finishing', 'MIFB P5/P7 L43-53'],
];

// ---- (a) structural gates (source inspection — allowed only for STRUCTURE) --
function structuralGates(src) {
  // strip line comments so example hex/hsl in comments do not count against code
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const hex = (code.match(/#[0-9a-fA-F]{3,8}\b/g) || []);
  const hsl = (code.match(/\bhsla?\s*\(/gi) || []);
  const rgb = (code.match(/\brgba?\s*\(/gi) || []);
  const oklch = (code.match(/\boklch\s*\(/gi) || []);
  const colorViolations = hex.length + hsl.length + rgb.length;

  const buttons = code.match(/<button\b[^>]*>/g) || [];
  const untypedButtons = buttons.filter((b) => !/\btype\s*=/.test(b));

  const useEffect = (code.match(/\buseEffect\b/g) || []);

  return {
    oklchOnly: {
      pass: colorViolations === 0,
      detail: `hex=${hex.length} hsl=${hsl.length} rgb=${rgb.length} | oklch()=${oklch.length}`,
    },
    montserrat: {
      pass: /Montserrat/.test(code),
      detail: /Montserrat/.test(code) ? 'Montserrat referenced' : 'no Montserrat font',
    },
    buttonType: {
      pass: untypedButtons.length === 0,
      detail: buttons.length === 0 ? 'no <button> elements' : `${buttons.length} button(s), ${untypedButtons.length} missing type=`,
    },
    zeroUseEffect: {
      pass: useEffect.length === 0,
      detail: `useEffect occurrences=${useEffect.length}`,
    },
  };
}

// ---- (b) render gate (live browser, spawned) --------------------------------
function renderGate(compPath) {
  if (!existsSync(RENDER_GATE)) return { verdict: 'GATE-MISSING', line: RENDER_GATE, exit: 2 };
  const r = spawnSync('node', [RENDER_GATE, compPath], { cwd: REPO, encoding: 'utf8', timeout: 120000 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const line = out.split('\n').filter(Boolean).pop() || '(no output)';
  const verdict = r.status === 0 ? 'PASS' : r.status === 1 ? 'FAIL' : 'GATE-ERROR';
  return { verdict, line, exit: r.status };
}

// ---- (b2) token-fidelity gate (live browser via shell, spawned) -------------
function tokenFidelityGate(compPath) {
  if (!existsSync(TOKEN_GATE)) return { verdict: 'GATE-MISSING', line: TOKEN_GATE, offenders: null, exit: 2 };
  const r = spawnSync('bash', [TOKEN_GATE, compPath], { cwd: REPO, encoding: 'utf8', timeout: 120000 });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const lines = out.split('\n').filter(Boolean);
  const line = lines.pop() || '(no output)';
  // Count offender lines heuristically (deltaEok fail rows), else fall back to last line.
  const offenders = lines.filter((l) => /deltaeok|offend|fail/i.test(l)).length;
  const verdict = r.status === 0 ? 'PASS' : r.status === 1 ? 'FAIL' : 'GATE-ERROR';
  return { verdict, line, offenders, exit: r.status };
}

// ---- (c) screenshots + pixel-sample nonblank + light!=dark ------------------
const ts = (() => { const p = resolveDep('typescript'); return p ? req(p) : null; })();

function transpile(src) {
  return ts.transpileModule(src, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText;
}

const INSTRUMENT = `
(function(){ var n=0,orig=React.createElement;
  React.createElement=function(){ if(++n>20000){throw new Error('render-watchdog');} return orig.apply(React,arguments); };
  window.__BASE_KEYS__=Object.keys(window);
})();`;

const MOUNT = `
(function(){
  var base = window.__BASE_KEYS__ || [];
  var C = window.TaskCard || window.DateTimePicker;
  if(!C){ var added = Object.keys(window).filter(function(k){return base.indexOf(k)===-1 && typeof window[k]==='function';});
          if(added.length) C = window[added[added.length-1]]; }
  if(!C){ document.getElementById('root').setAttribute('data-mount','no-global'); return; }
  try { ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(C));
        document.getElementById('root').setAttribute('data-mount','ok'); }
  catch(e){ document.getElementById('root').setAttribute('data-mount','err:'+String(e).slice(0,80)); }
})();`;

async function capture(browser, compiledJs, mode) {
  // mode: 'light' | 'dark'. Wire BOTH signals: colorScheme (prefers-color-scheme)
  // and an html.dark class (house convention), so either dark strategy renders.
  const ctx = await browser.newContext({
    viewport: { width: 480, height: 680 },
    deviceScaleFactor: DPR,
    colorScheme: mode === 'dark' ? 'dark' : 'light',
  });
  const page = await ctx.newPage();
  const bg = mode === 'dark' ? '#0b0b0c' : '#ffffff';
  await page.setContent(
    `<!doctype html><html class="${mode === 'dark' ? 'dark' : ''}"><head><meta charset="utf-8">` +
    `<style>html,body{margin:0;padding:24px;background:${bg}}` +
    `.dark body{background:${bg}}</style></head><body><div id="root"></div></body></html>`
  );
  await page.addScriptTag({ path: resolve(VENDOR, 'react.js') });
  await page.addScriptTag({ path: resolve(VENDOR, 'react-dom.js') });
  await page.addScriptTag({ content: INSTRUMENT });
  await page.addScriptTag({ content: compiledJs });
  await page.addScriptTag({ content: MOUNT });
  await page.waitForTimeout(SETTLE_MS);
  const mountState = await page.evaluate(() => document.getElementById('root').getAttribute('data-mount'));
  const buf = await page.screenshot({ type: 'png' });

  // Pixel-sample nonblank assertion: draw the screenshot into a canvas in a fresh
  // blank page and sample a grid; a uniform sample = blank/blackfish -> fail.
  const dataUri = 'data:image/png;base64,' + buf.toString('base64');
  const sample = await page.evaluate(async (uri) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = uri; });
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const g = cv.getContext('2d');
    g.drawImage(img, 0, 0);
    const pts = [];
    const N = 8; // 8x8 grid = 64 samples
    for (let y = 1; y <= N; y++) for (let x = 1; x <= N; x++) {
      const px = Math.floor((cv.width * x) / (N + 1));
      const py = Math.floor((cv.height * y) / (N + 1));
      const d = g.getImageData(px, py, 1, 1).data;
      pts.push(d[0] + ',' + d[1] + ',' + d[2]);
    }
    return { unique: new Set(pts).size, total: pts.length, width: cv.width, height: cv.height };
  }, dataUri);

  await ctx.close();
  return { buf, mountState, sample, hash: createHash('md5').update(buf).digest('hex') };
}

async function screenshots(compiledJs, armDir, armLabel) {
  const pwPath = resolveDep('playwright') || resolveDep('playwright-core');
  const pwMod = await import(pwPath);
  const { chromium } = pwMod.default || pwMod;
  const browser = await chromium.launch();
  const rec = { light: null, dark: null, checks: {} };
  try {
    const light = await capture(browser, compiledJs, 'light');
    const dark = await capture(browser, compiledJs, 'dark');
    const lightPath = resolve(armDir, `${armLabel}-light.png`);
    const darkPath = resolve(armDir, `${armLabel}-dark.png`);
    writeFileSync(lightPath, light.buf);
    writeFileSync(darkPath, dark.buf);
    rec.light = { path: lightPath, ...light, buf: undefined };
    rec.dark = { path: darkPath, ...dark, buf: undefined };
    // Assertions (design-no-blackfish failure guards):
    const nonblankLight = light.sample.unique > 1;
    const nonblankDark = dark.sample.unique > 1;
    const darkDiffers = light.hash !== dark.hash;
    rec.checks = {
      mountedLight: light.mountState,
      mountedDark: dark.mountState,
      nonblankLight, nonblankDark, darkDiffers,
      uniqueLight: light.sample.unique, uniqueDark: dark.sample.unique,
      pass: nonblankLight && nonblankDark && darkDiffers &&
            light.mountState === 'ok' && dark.mountState === 'ok',
    };
  } finally {
    await browser.close();
  }
  return rec;
}

// ---- report writer ----------------------------------------------------------
function ynp(v) { return v ? 'PASS' : 'FAIL'; }

function structuralBlock(label, s) {
  return [
    `**${label} — structural gates**`,
    '',
    '| Gate | Verdict | Detail |',
    '|------|---------|--------|',
    `| oklch-only (no hex/hsl/rgb) | ${ynp(s.oklchOnly.pass)} | ${s.oklchOnly.detail} |`,
    `| Montserrat font | ${ynp(s.montserrat.pass)} | ${s.montserrat.detail} |`,
    `| explicit button type | ${ynp(s.buttonType.pass)} | ${s.buttonType.detail} |`,
    `| zero useEffect | ${ynp(s.zeroUseEffect.pass)} | ${s.zeroUseEffect.detail} |`,
    '',
  ].join('\n');
}

function screenshotBlock(label, sc) {
  const c = sc.checks;
  return [
    `**${label} — screenshots (high-DPI ${DPR}x, light + dark)**`,
    '',
    '| Check | Result |',
    '|-------|--------|',
    `| light mount | ${c.mountedLight} |`,
    `| dark mount | ${c.mountedDark} |`,
    `| light nonblank (unique sample colors) | ${ynp(c.nonblankLight)} (${c.uniqueLight}/64) |`,
    `| dark nonblank (unique sample colors) | ${ynp(c.nonblankDark)} (${c.uniqueDark}/64) |`,
    `| dark differs from light (hash) | ${ynp(c.darkDiffers)} |`,
    `| overall screenshot gate | ${ynp(c.pass)} |`,
    `| light png | \`${sc.light.path}\` |`,
    `| dark png | \`${sc.dark.path}\` |`,
    '',
  ].join('\n');
}

function rubricTable() {
  const rows = RUBRIC.map((r, i) =>
    `| ${i + 1} | ${r[0]} | SCORES: pending | SCORES: pending | ${r[1]} |`).join('\n');
  return [
    '## Rubric scores (blind — filled by scorer in step 8)',
    '',
    'Scored 0-2 per item against `design-benchmark-rubric.md`. Left as `SCORES: pending`',
    'until the blind scorer runs on the `scorer-input/` package.',
    '',
    '| # | Item | arm-A | arm-B | Cited source |',
    '|---|------|-------|-------|--------------|',
    rows,
    '| — | **TOTAL (/30)** | **pending** | **pending** | |',
    '',
  ].join('\n');
}

// ---- main -------------------------------------------------------------------
function abs(p) { return isAbsolute(p) ? p : resolve(process.cwd(), p); }

async function main() {
  const [a, b] = process.argv.slice(2);
  if (!a || !b) { console.error('usage: run-benchmark.mjs <compA.tsx> <compB.tsx>'); process.exit(2); }
  const inA = abs(a), inB = abs(b);
  for (const p of [inA, inB]) if (!existsSync(p)) { console.error(`not found: ${p}`); process.exit(2); }
  if (!ts) { console.error('typescript not resolvable from deha-crm node_modules'); process.exit(2); }

  mkdirSync(RESULTS, { recursive: true });
  mkdirSync(SCORER_IN, { recursive: true });

  // Blind assignment: coin-flip which input is arm-A. Private mapping only.
  const flip = Math.random() < 0.5;
  const mapping = {
    'arm-A': flip ? inA : inB,
    'arm-B': flip ? inB : inA,
    note: 'PRIVATE. Scorer must NOT read this file. De-blind REPORT.md only after scoring.',
  };
  writeFileSync(resolve(RESULTS, 'MAPPING.json'), JSON.stringify(mapping, null, 2));

  const arms = [
    { label: 'arm-A', path: mapping['arm-A'] },
    { label: 'arm-B', path: mapping['arm-B'] },
  ];

  const report = {};
  for (const arm of arms) {
    const dir = resolve(RESULTS, arm.label);
    mkdirSync(dir, { recursive: true });
    const src = readFileSync(arm.path, 'utf8');
    console.log(`[${arm.label}] structural gates…`);
    const structural = structuralGates(src);
    console.log(`[${arm.label}] render gate (live browser)…`);
    const gate = renderGate(arm.path);
    console.log(`[${arm.label}] token-fidelity gate (live browser)…`);
    const tokenGate = tokenFidelityGate(arm.path);
    console.log(`[${arm.label}] screenshots light+dark…`);
    let shots;
    try {
      shots = await screenshots(transpile(src), dir, arm.label);
    } catch (e) {
      shots = { light: null, dark: null, checks: { pass: false, error: String(e).slice(0, 160) } };
      console.error(`[${arm.label}] screenshot error: ${shots.checks.error}`);
    }
    report[arm.label] = { structural, gate, tokenGate, shots };
    console.log(`[${arm.label}] gate=${gate.verdict} token-fidelity=${tokenGate.verdict} screenshots=${shots.checks.pass ? 'OK' : 'CHECK'}`);
  }

  // Assemble scorer-input package: renamed screenshots + rubric + prompt. NO mapping.
  for (const arm of arms) {
    for (const mode of ['light', 'dark']) {
      const src = resolve(RESULTS, arm.label, `${arm.label}-${mode}.png`);
      if (existsSync(src)) copyFileSync(src, resolve(SCORER_IN, `${arm.label}-${mode}.png`));
    }
  }
  if (existsSync(RUBRIC_SRC)) copyFileSync(RUBRIC_SRC, resolve(SCORER_IN, 'design-benchmark-rubric.md'));
  if (existsSync(SCORER_PROMPT_SRC)) copyFileSync(SCORER_PROMPT_SRC, resolve(SCORER_IN, 'scorer-prompt.md'));

  // Write REPORT.md
  const now = new Date().toISOString();
  const md = [
    '# Design Benchmark REPORT',
    '',
    `Generated: ${now}`,
    '',
    'Two anonymous arms (**arm-A**, **arm-B**). Which input maps to which arm is held in',
    '`results/MAPPING.json` (private — the scorer never reads it). De-blind this report',
    'only after the rubric scores are filled in.',
    '',
    '- Structural gates = source inspection (structure only).',
    '- Render gate + screenshots = live headless-browser runs (lesson',
    '  `grep-verifies-structure-not-render`: verdicts and pixels come from a real paint).',
    '',
    '---',
    '',
    '## Structural + gate results',
    '',
  ];
  for (const arm of arms) {
    const r = report[arm.label];
    md.push(`### ${arm.label}`, '');
    md.push(structuralBlock(arm.label, r.structural));
    md.push(`**${arm.label} — render gate:** \`${r.gate.verdict}\` (exit ${r.gate.exit}) — ${r.gate.line}`, '');
    const tg = r.tokenGate;
    const tgOff = tg.offenders == null ? '' : ` — offenders=${tg.offenders}`;
    md.push(`**${arm.label} — token-fidelity gate:** \`${tg.verdict}\` (exit ${tg.exit})${tgOff} — ${tg.line}`, '');
    if (r.shots.checks && r.shots.light) md.push(screenshotBlock(arm.label, r.shots));
    else md.push(`**${arm.label} — screenshots:** FAILED — ${r.shots.checks.error || 'no output'}`, '');
    md.push('---', '');
  }
  md.push(rubricTable());
  md.push('## Scorer package', '');
  md.push('`results/scorer-input/` holds the blind package handed to the scorer:', '');
  md.push('- `arm-A-light.png`, `arm-A-dark.png`, `arm-B-light.png`, `arm-B-dark.png`');
  md.push('- `design-benchmark-rubric.md`, `scorer-prompt.md`');
  md.push('- (MAPPING.json is deliberately excluded — the scorer is blind.)', '');
  md.push('---', '');
  md.push('USER VERDICT: (pending)', '');

  writeFileSync(resolve(RESULTS, 'REPORT.md'), md.join('\n'));
  console.log(`\nREPORT.md written -> ${resolve(RESULTS, 'REPORT.md')}`);
  console.log(`scorer-input package -> ${SCORER_IN} (MAPPING.json withheld)`);
}

main().catch((e) => { console.error('harness error:', e); process.exit(1); });
