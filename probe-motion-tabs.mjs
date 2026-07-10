import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:5173/components/motion-tabs', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

// Criterion 1: .mt-toolbar vertical center within ~2px of .mt-dock vertical center
const centerCheck = await page.evaluate(() => {
  const toolbar = document.querySelector('.mt-toolbar');
  const dock = document.querySelector('.mt-dock');
  if (!toolbar || !dock) return { error: 'missing elements', toolbar: !!toolbar, dock: !!dock };
  const tr = toolbar.getBoundingClientRect();
  const dr = dock.getBoundingClientRect();
  const toolbarCenter = tr.top + tr.height / 2;
  const dockCenter = dr.top + dr.height / 2;
  const diff = Math.abs(toolbarCenter - dockCenter);
  return { toolbarCenter: Math.round(toolbarCenter*10)/10, dockCenter: Math.round(dockCenter*10)/10, diff: Math.round(diff*10)/10, pass: diff <= 2 };
});
console.log('CENTER_CHECK:', JSON.stringify(centerCheck));

// Criterion: active tab gap ~8px
const gapCheck = await page.evaluate(() => {
  const activeTab = document.querySelector('.mt-tab.active');
  if (!activeTab) return { error: 'no active tab found' };
  const gap = getComputedStyle(activeTab).gap;
  const rowGap = getComputedStyle(activeTab).rowGap;
  const colGap = getComputedStyle(activeTab).columnGap;
  return { gap, rowGap, colGap, pass: colGap === '8px' || gap === '8px' };
});
console.log('GAP_CHECK:', JSON.stringify(gapCheck));

// Get all elements to understand structure
const structure = await page.evaluate(() => {
  const elems = ['mt-dock', 'mt-toolbar', 'mt-tab', 'mt-tab active', 'mt-row', 'mt-row-ic', 'mt-row-ic--black'];
  return elems.reduce((acc, cls) => {
    const sel = cls.includes(' ') ? '.' + cls.replace(' ', '.') : '.' + cls;
    acc[cls] = document.querySelectorAll(sel).length;
    return acc;
  }, {});
});
console.log('STRUCTURE:', JSON.stringify(structure));

// Try clicking a tab to open panel
const tabs = await page.$$('.mt-tab');
if (tabs.length > 0) {
  // Click tab that might show rows
  await tabs[0].click();
  await page.waitForTimeout(600);
}

// Check for rows/badges after clicking
const afterClick = await page.evaluate(() => {
  const rows = document.querySelectorAll('.mt-row');
  const icons = document.querySelectorAll('.mt-row-ic');
  const blackIcons = document.querySelectorAll('.mt-row-ic--black');
  return { rows: rows.length, icons: icons.length, blackIcons: blackIcons.length };
});
console.log('AFTER_CLICK:', JSON.stringify(afterClick));

// Try clicking rows to expand
const rows = await page.$$('.mt-row');
for (const row of rows.slice(0, 5)) {
  await row.click().catch(() => {});
  await page.waitForTimeout(200);
}

// Light mode badge color check
const colorLight = await page.evaluate(() => {
  document.documentElement.classList.remove('dark');
  const nonBlack = Array.from(document.querySelectorAll('.mt-row-ic')).filter(b => !b.classList.contains('mt-row-ic--black'));
  if (nonBlack.length === 0) return { error: 'no non-black badges', total: document.querySelectorAll('.mt-row-ic').length };
  const bg = getComputedStyle(nonBlack[0]).backgroundColor;
  return { bg, count: nonBlack.length };
});
console.log('COLOR_LIGHT:', JSON.stringify(colorLight));

// Dark mode badge color check
await page.evaluate(() => { document.documentElement.classList.add('dark'); });
await page.waitForTimeout(300);

const colorDark = await page.evaluate(() => {
  const nonBlack = Array.from(document.querySelectorAll('.mt-row-ic')).filter(b => !b.classList.contains('mt-row-ic--black'));
  if (nonBlack.length === 0) return { error: 'no non-black badges', total: document.querySelectorAll('.mt-row-ic').length };
  const bg = getComputedStyle(nonBlack[0]).backgroundColor;
  return { bg, count: nonBlack.length };
});
console.log('COLOR_DARK:', JSON.stringify(colorDark));

// Black badge in dark
const blackBadgeDark = await page.evaluate(() => {
  const blacks = document.querySelectorAll('.mt-row-ic--black');
  if (blacks.length === 0) return { error: 'no black badges found', totalIcons: document.querySelectorAll('.mt-row-ic').length };
  const bg = getComputedStyle(blacks[0]).backgroundColor;
  return { bg, count: blacks.length };
});
console.log('BLACK_BADGE_DARK:', JSON.stringify(blackBadgeDark));

await browser.close();
