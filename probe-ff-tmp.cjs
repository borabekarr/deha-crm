const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5180/components/file-folder', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  // Open the popover — try clicking any button until ff-pop-outer.show appears
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(300);
    const po = await page.$('.ff-pop-outer.show');
    if (po) break;
  }
  // If still not shown, try clicking any ff-* element
  if (!(await page.$('.ff-pop-outer.show'))) {
    await page.click('[class^="ff-"]').catch(() => {});
    await page.waitForTimeout(400);
  }

  const isOpen = !!(await page.$('.ff-pop-outer.show'));
  console.log('Popover open:', isOpen);

  // --- LIGHT MODE ---
  const lightPadding = await page.evaluate(() => {
    const el = document.querySelector('.ff-pop-outer');
    if (!el) return null;
    return getComputedStyle(el).paddingTop;
  });
  const lightFileShadow = await page.evaluate(() => {
    const el = document.querySelector('.ff-file');
    if (!el) return null;
    return getComputedStyle(el).boxShadow;
  });
  const lightPaddingPx = lightPadding ? parseInt(lightPadding) : 0;
  console.log('\n=== LIGHT MODE ===');
  console.log('paddingTop:', lightPadding);
  console.log('ff-file boxShadow:', lightFileShadow);
  console.log('PADDING >= 8px:', lightPaddingPx >= 8 ? 'PASS' : `FAIL (${lightPaddingPx}px)`);
  console.log('ff-file has inset shadow:', lightFileShadow && lightFileShadow.includes('inset') ? 'PASS' : 'FAIL');

  // --- DARK MODE ---
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(700);

  const darkPadding = await page.evaluate(() => {
    const el = document.querySelector('.ff-pop-outer');
    if (!el) return null;
    return getComputedStyle(el).paddingTop;
  });
  const darkBorder = await page.evaluate(() => {
    const el = document.querySelector('.ff-pop-outer');
    if (!el) return null;
    const s = getComputedStyle(el);
    return { borderWidth: s.borderWidth, borderColor: s.borderColor, borderStyle: s.borderStyle };
  });
  const darkFileShadow = await page.evaluate(() => {
    const el = document.querySelector('.ff-file');
    if (!el) return null;
    return getComputedStyle(el).boxShadow;
  });

  const darkPaddingPx = darkPadding ? parseInt(darkPadding) : 0;
  const hasDarkBorder = darkBorder && darkBorder.borderWidth !== '0px' && darkBorder.borderStyle !== 'none';
  console.log('\n=== DARK MODE ===');
  console.log('paddingTop:', darkPadding);
  console.log('border:', darkBorder);
  console.log('ff-file boxShadow:', darkFileShadow);
  console.log('DARK PADDING >= 8px:', darkPaddingPx >= 8 ? 'PASS' : `FAIL (${darkPaddingPx}px)`);
  console.log('DARK has visible border:', hasDarkBorder ? 'PASS' : `FAIL (w=${darkBorder?.borderWidth}, s=${darkBorder?.borderStyle})`);
  console.log('DARK ff-file has inset shadow:', darkFileShadow && darkFileShadow.includes('inset') ? 'PASS' : 'FAIL');

  await browser.close();
})();
