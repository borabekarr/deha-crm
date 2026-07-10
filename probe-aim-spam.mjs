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

  // Find the first edit button in the first memory block
  const editBtn = page.locator('.mem-edit-btn').first();
  const editZone = page.locator('.mem-edit-zone').first();

  // === Criterion 2: single toggle open/closed reference heights ===
  // open
  await editBtn.click();
  await page.waitForTimeout(700);
  const openHeight = await editZone.evaluate(el => el.getBoundingClientRect().height);
  console.log('open_height:', openHeight);

  // close via block close button
  const closeBtn = page.locator('.mem-block-close-btn--visible').first();
  await closeBtn.click();
  await page.waitForTimeout(700);
  const closedHeight = await editZone.evaluate(el => el.getBoundingClientRect().height);
  console.log('closed_height:', closedHeight);

  // === Criterion 3: mid-animation transition check (expand) ===
  await editBtn.click();
  // sample transition during animation window (50ms after trigger)
  await page.waitForTimeout(50);
  const transitionStyle = await editZone.evaluate(el => {
    return window.getComputedStyle(el).transition;
  });
  console.log('mid_anim_transition:', transitionStyle);
  // wait for settle
  await page.waitForTimeout(700);

  // === Criterion 2 continued: reload + spam ===
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const editBtn2 = page.locator('.mem-edit-btn').first();
  const editZone2 = page.locator('.mem-edit-zone').first();

  // 8 rapid clicks at 50ms gaps
  for (let i = 0; i < 8; i++) {
    await editBtn2.click();
    await page.waitForTimeout(50);
  }
  // mid-flight reversal: click, wait 190ms, click
  await editBtn2.click();
  await page.waitForTimeout(190);
  // determine current editing state (8 clicks = even = closed state, so edit btn visible)
  await editBtn2.click();
  await page.waitForTimeout(900);

  // After 8+2=10 clicks total (even = should be closed state? or open?)
  // Actually: each click on .mem-edit-btn only opens (handleEdit). Close btn is separate.
  // So each click on editBtn ONLY fires handleEdit() -> setEditing(true)
  // The toggle would need alternating edit-btn / close-btn.
  // Let me re-examine: after clicking editBtn when already editing, does it do anything?
  // handleEdit: setDraft(committed); setEditing(true) -- can spam but always stays open
  // So after all clicks we should be in editing=true (open) state.
  // The "closed" reference is 0px, open reference is openHeight2.
  const finalHeight2 = await editZone2.evaluate(el => el.getBoundingClientRect().height);
  console.log('spam_final_height:', finalHeight2);

  // Re-do with alternating edit/close to get parity test
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const editBtn3 = page.locator('.mem-edit-btn').first();
  const editZone3 = page.locator('.mem-edit-zone').first();
  
  // Get open reference fresh
  await editBtn3.click();
  await page.waitForTimeout(700);
  const openRef = await editZone3.evaluate(el => el.getBoundingClientRect().height);

  // Close
  const closeBtn3 = page.locator('.mem-block-close-btn--visible').first();
  await closeBtn3.click();
  await page.waitForTimeout(500);

  // 4 rapid open/close pairs (8 clicks at 50ms)
  for (let i = 0; i < 4; i++) {
    await editBtn3.click();
    await page.waitForTimeout(50);
    const cb = page.locator('.mem-block-close-btn--visible').first();
    await cb.click();
    await page.waitForTimeout(50);
  }
  // mid-flight reversal: open, wait 190ms, close
  await editBtn3.click();
  await page.waitForTimeout(190);
  const cb3 = page.locator('.mem-block-close-btn--visible').first();
  await cb3.click();
  await page.waitForTimeout(900);

  const finalH = await editZone3.evaluate(el => el.getBoundingClientRect().height);
  console.log('alternating_spam_final_height:', finalH);
  console.log('closed_ref:', closedHeight);
  console.log('height_diff_from_closed:', Math.abs(finalH - closedHeight));
  console.log('errors:', JSON.stringify(errors));

  await browser.close();
}

main().catch(e => { console.error('PROBE_ERROR:', e.message); process.exit(1); });
