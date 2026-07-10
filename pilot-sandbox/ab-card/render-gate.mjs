// Render-safety gate: load each submission through the live 8770 server in a real
// browser, assert it mounts (#root non-empty), capture console/page errors, screenshot.
// Usage: node render-gate.mjs [count]   (default 5)
import pw from '/home/bora/deha-crm/node_modules/playwright/index.js';
const { chromium } = pw;

const N = Number(process.argv[2] || 5);
const BASE = 'http://127.0.0.1:8770';
const bust = Date.now();

const browser = await chromium.launch();
const results = [];
for (let i = 1; i <= N; i++) {
  const ctx = await browser.newContext({ viewport: { width: 460, height: 620 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));
  let mounted = false, childCount = 0, note = null;
  try {
    await page.goto(`${BASE}/submission${i}.html?g=${bust}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2200); // let mount + entrance animation settle
    const info = await page.evaluate(() => {
      const r = document.getElementById('root');
      const txt = r ? (r.innerText || '').slice(0, 40) : '';
      return { count: r ? r.childElementCount : -1, text: txt };
    });
    childCount = info.count;
    mounted = info.count > 0 && !/did not render/i.test(info.text);
    if (!mounted) note = info.text || 'empty root';
    await page.screenshot({ path: `/home/bora/deha-crm/pilot-sandbox/ab-card/stats/shot-sub${i}.png` });
  } catch (e) {
    note = 'goto/eval failed: ' + String(e).slice(0, 160);
  }
  results.push({ sub: i, mounted, childCount, errorCount: errors.length, note, errors: errors.slice(0, 5) });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
const bad = results.filter((r) => !r.mounted || r.errorCount > 0);
console.log(bad.length ? `\nGATE: ${bad.length}/${N} need attention -> subs [${bad.map((b) => b.sub).join(',')}]` : `\nGATE: all ${N} mounted clean`);
