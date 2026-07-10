import { chromium } from 'playwright';

const BASE = 'http://localhost:5173/components/financial-health-card';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const tab = page.locator('.fhc-info-tab').first();
  const body = page.locator('.fhc-info-body').first();

  // === Part A: baseline heights (settled) ===
  // Open
  await tab.click();
  await page.waitForTimeout(900);
  const openHeight = await body.evaluate(el => el.getBoundingClientRect().height);
  console.log('open_height:', openHeight);

  // Close
  await tab.click();
  await page.waitForTimeout(900);
  const closedHeight = await body.evaluate(el => el.getBoundingClientRect().height);
  console.log('closed_height:', closedHeight);

  // === Part B: motion-gate check ===
  await tab.click();
  await page.waitForTimeout(80); // mid-flight
  const transStyle = await body.evaluate(el => window.getComputedStyle(el).transition);
  console.log('mid_anim_transition:', transStyle);
  await page.waitForTimeout(900);

  // === Reload ===
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const tab2 = page.locator('.fhc-info-tab').first();
  const body2 = page.locator('.fhc-info-body').first();

  // === Part C: 8 rapid clicks at 50ms gaps ===
  for (let i = 0; i < 8; i++) {
    await tab2.click({ force: true });
    await page.waitForTimeout(50);
  }

  // === Part D: mid-flight reversal ===
  await tab2.click({ force: true });
  await page.waitForTimeout(250);
  await tab2.click({ force: true });

  // === Part E: settle ===
  await page.waitForTimeout(1100);

  // After 8 rapid + reversal: 8 rapid (even, back to closed) + open then close = closed
  // 8 clicks: starts closed -> after 8 clicks = closed (even number)
  // then open click (now open), 250ms, close click (now closed)
  // final state: closed
  const finalHeight = await body2.evaluate(el => el.getBoundingClientRect().height);
  const diff = Math.abs(finalHeight - closedHeight);
  console.log('spam_final_height:', finalHeight);
  console.log('closed_ref:', closedHeight);
  console.log('height_diff:', diff);
  console.log('within_1px:', diff <= 1);

  // Check transition contains 500ms and bezier
  const has500 = transStyle.includes('500ms') || transStyle.includes('0.5s');
  const hasBezier = transStyle.includes('cubic-bezier');
  console.log('has_500ms:', has500);
  console.log('has_cubic_bezier:', hasBezier);
  console.log('errors:', JSON.stringify(errors));

  await browser.close();

  if (!has500 || !hasBezier) {
    console.error('MOTION_GATE_FAIL: transition missing 500ms or bezier');
    process.exit(1);
  }
  if (diff > 1) {
    console.error('SPAM_FAIL: final height not within 1px of closed ref');
    process.exit(1);
  }
  if (errors.length > 0) {
    console.error('CONSOLE_ERRORS:', errors);
    process.exit(1);
  }
}

main().catch(e => { console.error('PROBE_ERROR:', e.message); process.exit(1); });
