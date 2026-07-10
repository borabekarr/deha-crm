import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/components/buttons-proximity', { waitUntil: 'networkidle' });

  // Check media query match
  const mediaMatch = await page.evaluate(() => {
    return {
      hoverHover: window.matchMedia('(hover: hover)').matches,
      pointerFine: window.matchMedia('(pointer: fine)').matches,
    };
  });
  console.log('Media:', JSON.stringify(mediaMatch));

  // Force --prox=1 via JS and check filter  
  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-proximity]');
    el.style.setProperty('--prox', '1');
    // Check computed filter synchronously
    const cs = window.getComputedStyle(el);
    const f = cs.filter;
    
    // Also try direct filter string to see what Chromium computes
    const testEl = document.createElement('div');
    testEl.style.cssText = 'filter: brightness(1.05) drop-shadow(0 6px 16px rgba(15,23,42,0.16)); position:absolute';
    document.body.appendChild(testEl);
    const testFilter = window.getComputedStyle(testEl).filter;
    document.body.removeChild(testEl);
    
    return {
      btn_filter: f,
      direct_filter_test: testFilter,
    };
  });
  console.log(JSON.stringify(result, null, 2));
  
  await browser.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
