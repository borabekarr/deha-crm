import { chromium } from 'playwright';

const BASE = 'http://localhost:5173/components/ai-memory-card';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // === Part A: baseline heights ===
  const editBtn = page.locator('.mem-edit-btn').first();
  const editZone = page.locator('.mem-edit-zone').first();

  // open
  await editBtn.click();
  await page.waitForTimeout(700);
  const openHeight = await editZone.evaluate(el => el.getBoundingClientRect().height);
  console.log('open_height:', openHeight);

  // close via block close button
  // Use force: true is not needed; use JS click to avoid pointer-events issues on the close btn
  await page.locator('.mem-block-close-btn').first().click({ force: true });
  await page.waitForTimeout(700);
  const closedHeight = await editZone.evaluate(el => el.getBoundingClientRect().height);
  console.log('closed_height:', closedHeight);

  // === Part B: mid-animation transition check ===
  await editBtn.click();
  await page.waitForTimeout(50);
  const transitionStyle = await editZone.evaluate(el => {
    return window.getComputedStyle(el).transition;
  });
  console.log('mid_anim_transition:', transitionStyle);
  await page.waitForTimeout(700);

  // === Part C: spam test (reload first) ===
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  // Helper: click edit (opens), then close (closes) via JS to bypass pointer-events
  const openEdit = () => page.evaluate(() => {
    const btn = document.querySelectorAll('.mem-edit-btn')[0];
    if (btn) btn.click();
  });
  const closeEdit = () => page.evaluate(() => {
    const btn = document.querySelectorAll('.mem-block-close-btn')[0];
    if (btn) btn.click();
  });
  const zone = page.locator('.mem-edit-zone').first();

  // 8 rapid alternating open/close at 50ms each
  for (let i = 0; i < 4; i++) {
    await openEdit();
    await page.waitForTimeout(50);
    await closeEdit();
    await page.waitForTimeout(50);
  }

  // mid-flight reversal: open, wait 190ms, close (end state = closed)
  await openEdit();
  await page.waitForTimeout(190);
  await closeEdit();

  // wait for settle
  await page.waitForTimeout(900);

  const finalHeight = await zone.evaluate(el => el.getBoundingClientRect().height);
  const diff = Math.abs(finalHeight - closedHeight);
  console.log('spam_final_height:', finalHeight);
  console.log('height_diff_from_closed:', diff);
  console.log('within_1px:', diff <= 1);
  console.log('errors:', JSON.stringify(errors));

  await browser.close();
}

main().catch(e => { console.error('PROBE_ERROR:', e.message); process.exit(1); });
