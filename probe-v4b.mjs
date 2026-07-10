/**
 * probe-v4b.mjs — V4 criterion2: motion-tabs active-tab icon→text gap + vertical alignment
 * For each of the 4 tabs: click to activate, measure iconbox.right→label.left gap,
 * and icon center-y vs label center-y delta.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const ROUTE = '/components/motion-tabs';
const SETTLE_MS = 500;

async function measureActiveTab(page, tabIndex) {
  const tabs = page.locator('.mt-tab');
  await tabs.nth(tabIndex).click();
  await page.waitForTimeout(SETTLE_MS);

  return await page.evaluate((idx) => {
    const tabs = document.querySelectorAll('.mt-tab');
    const tab = tabs[idx];
    if (!tab) return { error: `tab ${idx} not found` };

    const iconbox = tab.querySelector('.mt-iconbox');
    const label = tab.querySelector('.mt-label');
    if (!iconbox || !label) return { error: 'iconbox or label not found' };

    const iconR = iconbox.getBoundingClientRect();
    const labelR = label.getBoundingClientRect();
    const tabR = tab.getBoundingClientRect();

    const gap = labelR.left - iconR.right;
    const iconCenterY = iconR.top + iconR.height / 2;
    const labelCenterY = labelR.top + labelR.height / 2;
    const deltaY = Math.abs(iconCenterY - labelCenterY);

    const isActive = tab.classList.contains('active');
    const labelText = label.textContent || '';

    return {
      tabIndex: idx,
      labelText,
      isActive,
      iconWidth: Math.round(iconR.width * 10) / 10,
      labelWidth: Math.round(labelR.width * 10) / 10,
      tabWidth: Math.round(tabR.width * 10) / 10,
      gap: Math.round(gap * 10) / 10,
      deltaY: Math.round(deltaY * 10) / 10,
    };
  }, tabIndex);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}${ROUTE}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForSelector('.mt-tab', { timeout: 10000 });
    await page.waitForTimeout(300);

    const results = [];
    for (let i = 0; i < 4; i++) {
      const m = await measureActiveTab(page, i);
      results.push(m);
      console.log(`Tab ${i} (${m.labelText || '?'}): gap=${m.gap}px deltaY=${m.deltaY}px isActive=${m.isActive} tabW=${m.tabWidth}px iconW=${m.iconWidth}px labelW=${m.labelWidth}px`);
    }

    const gaps = results.map(r => r.gap);
    const deltaYs = results.map(r => r.deltaY);
    const minGap = Math.min(...gaps);
    const maxGap = Math.max(...gaps);
    const gapRange = maxGap - minGap;
    const maxDeltaY = Math.max(...deltaYs);

    console.log('\n--- SUMMARY ---');
    console.log(`Gap range: ${minGap}–${maxGap}px (spread=${gapRange}px)`);
    console.log(`Max vertical delta: ${maxDeltaY}px`);

    const consistent = gapRange <= 2;
    const reasonable = gaps.every(g => g >= 4 && g <= 16);
    const aligned = deltaYs.every(d => d <= 2);

    console.log(`\nConsistent gaps (spread<=2px): ${consistent}`);
    console.log(`Reasonable gap range (4-16px): ${reasonable}`);
    console.log(`Vertically aligned (all deltaY<=2px): ${aligned}`);
    console.log(`\nOVERALL: ${(consistent && reasonable && aligned) ? 'PASS' : 'FAIL'}`);

    results.forEach(r => {
      const tabPass = r.gap >= 4 && r.gap <= 16 && r.deltaY <= 2;
      console.log(`  Tab ${r.tabIndex} (${r.labelText}): gap=${r.gap}px deltaY=${r.deltaY}px -> ${tabPass ? 'PASS' : 'FAIL'}`);
    });

  } finally {
    await browser.close();
  }
})();
