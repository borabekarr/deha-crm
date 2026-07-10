import { chromium } from 'playwright';

const BASE = 'http://localhost:5173/components/pinned-list';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // === SETUP: unpin all pinned items first to get to 0-pinned state ===
  // Then pin one to measure open height, unpin to measure closed height.
  const pinnedSection = page.locator('.pl-sec.pinned');
  const header = page.locator('.pl-sec.pinned .pl-head');

  // Unpin all currently pinned items
  const pinnedItems = page.locator('.pl-sec.pinned .pl-item');
  const pinnedCount = await pinnedItems.count();
  console.log('initial_pinned_count:', pinnedCount);

  for (let i = 0; i < pinnedCount; i++) {
    // always click the first item in pinned section (since list shifts up)
    const pinBtn = page.locator('.pl-sec.pinned .pl-item .pl-pin').first();
    await pinBtn.click();
    await page.waitForTimeout(450);
  }

  // Verify 0 pinned
  const afterUnpinAll = await page.locator('.pl-sec.pinned .pl-item').count();
  console.log('after_unpin_all_count:', afterUnpinAll);

  // === Criterion 2a: pin one item, record open height ===
  // Click the first pin button in the "All" section
  const firstAllPin = page.locator('.pl-sec.all .pl-item .pl-pin').first();
  await firstAllPin.click();
  await page.waitForTimeout(700);

  const openHeight = await header.evaluate(el => el.getBoundingClientRect().height);
  console.log('open_height:', openHeight);

  // Unpin that item (it moved to pinned section, click the first in pinned)
  const firstPinnedPin = page.locator('.pl-sec.pinned .pl-item .pl-pin').first();
  await firstPinnedPin.click();
  await page.waitForTimeout(700);

  const closedHeight = await header.evaluate(el => el.getBoundingClientRect().height);
  console.log('closed_height:', closedHeight);

  // === Criterion 3: Motion-gate — mid-animation check ===
  // Pin one item to start opening animation, then quickly check transition
  const allPinBtn = page.locator('.pl-sec.all .pl-item .pl-pin').first();
  await allPinBtn.click();
  // Check transition property mid-animation (~80ms after click)
  await page.waitForTimeout(80);
  const midTransition = await header.evaluate(el => {
    const cs = window.getComputedStyle(el);
    return { transition: el.style.transition, computedTransition: cs.transition };
  });
  console.log('mid_transition_inline:', midTransition.transition);
  console.log('mid_transition_computed:', midTransition.computedTransition);
  const hasHeightTransition = midTransition.transition.includes('height') || midTransition.computedTransition.includes('height');
  console.log('has_height_transition:', hasHeightTransition);
  // Let it settle
  await page.waitForTimeout(700);

  // === Criterion 2b-e: Reload, then rapid spam ===
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // After reload: 2 items pinned (inbox + analytics). Header is open.
  const pinnedAfterReload = await page.locator('.pl-sec.pinned .pl-item').count();
  console.log('after_reload_pinned_count:', pinnedAfterReload);

  // Target: first pinned item's pin button (inbox, which is pinned)
  // 8 even clicks = net zero (back to pinned). Parity-correct = open
  const targetBtn = page.locator('.pl-sec.pinned .pl-item .pl-pin').first();

  // (c) rapid 8 clicks at 50ms gaps
  for (let i = 0; i < 8; i++) {
    // After each unpin, the item moves to "all" section; after re-pin, back to pinned.
    // We need to track where the button is. Let's use a broader selector.
    // Actually, we need to click the same item's pin button regardless of section.
    // Use the item's .pl-pin button — the item moves between sections.
    // Let's click .pl-item:first-of-type .pl-pin in whichever section it's in.
    // Better: find the "Inbox" item specifically.
    const inboxPin = page.locator('.pl-item').filter({ hasText: 'Inbox' }).locator('.pl-pin');
    await inboxPin.click({ force: true });
    if (i < 7) await page.waitForTimeout(50);
  }

  // (d) mid-flight reversal: click, wait 190ms, click
  const inboxPinD = page.locator('.pl-item').filter({ hasText: 'Inbox' }).locator('.pl-pin');
  await inboxPinD.click({ force: true });
  await page.waitForTimeout(190);
  const inboxPinD2 = page.locator('.pl-item').filter({ hasText: 'Inbox' }).locator('.pl-pin');
  await inboxPinD2.click({ force: true });

  // (e) wait 900ms
  await page.waitForTimeout(900);

  // Assert: parity = 10 clicks total on inbox (started pinned) = even = pinned = open
  // Final header height should match open_height within 1px
  const finalHeader = page.locator('.pl-sec.pinned .pl-head');
  const finalHeight = await finalHeader.evaluate(el => el.getBoundingClientRect().height);
  console.log('final_height:', finalHeight);
  console.log('open_height_ref:', openHeight);
  const diff = Math.abs(finalHeight - openHeight);
  console.log('height_diff:', diff);
  console.log('within_1px:', diff <= 1);

  console.log('console_errors:', JSON.stringify(errors));
  console.log('errors_count:', errors.length);

  await browser.close();
}

main().catch(e => { console.error('PROBE_FAIL:', e.message); process.exit(1); });
